/**
 * Simulation IPC Handlers
 *
 * Handlers for running and managing battle simulations.
 * State management is now delegated to SimulationController.
 *
 * Abort Signal Support (Task 05):
 * - Long-running operations check for cancellation signals
 * - Signals are checked at start and periodically during execution
 * - Renderer destruction automatically aborts in-flight operations
 */

import type { IpcMainInvokeEvent } from 'electron';
import type { ILogger, IConfigLoader, IDataLoader, IBattleSimulator } from '@coreto/core';
import {
  ILoggerToken,
  IConfigLoaderToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
  resolve,
  PartyConfig,
} from '@coreto/core';

import type { IPCResult } from '../protocol-types.js';
import type {
  SimulationResult,
  ReportData,
} from '@coreto/electron/domain/types';
import type { IReportBuilder } from '@coreto/electron/domain/ports';
import { SimulationRunPayloadSchema } from '../types.js';
import { wrapHandler } from '../ipc-response.js';
import { simulationController } from '../../services/index.js';
import { IReportBuilderToken } from '../../di/tokens.js';
import { saveSimulationToHistory, generateSimulationId } from './history-handlers.js';
import { checkAbortSignal } from '../abort-signal.js';

/**
 * Validates an IPC payload against its Zod schema.
 */
function validatePayload<T extends unknown>(
  channel: string,
  payload: unknown,
  schema: { safeParse: (data: unknown) => { success: boolean; error?: { errors: Array<{ path: string[]; message: string }> } } }
): asserts payload is T {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new Error(`Invalid payload for ${channel}: ${errorMessages}`);
  }
}

/**
 * Handler: simulation:run
 *
 * Executes a TTK battle simulation.
 * Runs a single battle or all trechos based on payload.
 * Supports cancellation via abort signal (checks at start and during execution).
 *
 * Task 09: Config loading now uses SQLite storage via IConfigLoader.
 * Config is loaded from database using projectPath key (no configPath needed).
 */
export async function handleSimulationRun(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<SimulationResult>> {
  return wrapHandler(async () => {
    validatePayload('simulation:run', payload, SimulationRunPayloadSchema);

    const { projectPath, trechoId, troopId, seed = 12345, maxTurns = 100 } = payload;

    const logger = resolve<ILogger>(ILoggerToken);
    const configLoader = resolve<IConfigLoader>(IConfigLoaderToken);
    const dataLoader = resolve<IDataLoader>(IDataLoaderToken);
    const simulator = resolve<IBattleSimulator>(IBattleSimulatorToken);
    const reportBuilder = resolve<IReportBuilder>(IReportBuilderToken);

    logger.info(
      `[IPC] Running simulation: project=${projectPath}, trecho=${trechoId}, troop=${troopId}`
    );

    // Check if simulation is already running via controller
    const currentProgress = simulationController.getProgress();
    if (currentProgress.isRunning) {
      throw new Error('Simulation is already running. Cancel or wait for completion.');
    }

    // Create abort controller for this simulation run
    const abortController = simulationController.createAbortController();
    const signal = abortController.signal;

    // Check for cancellation at start
    checkAbortSignal(signal, 'simulation initialization');

    // Load project data - update progress via controller
    simulationController.updateProgress({ isRunning: true, current: 0, total: 1 });

    try {
      // Load config from SQLite (Task 09: now uses IConfigLoader with projectPath)
      checkAbortSignal(signal, 'loading configuration from SQLite');
      const config = await configLoader.loadConfig(projectPath);
      const configTrechos = await configLoader.loadTrechos(config);

      // Load RPG Maker MZ data
      checkAbortSignal(signal, 'loading database');
      const database = await dataLoader.loadDatabase(projectPath);

      // Initialize simulator with loaded database
      checkAbortSignal(signal, 'initializing simulator');
      await simulator.initialize(database, projectPath);
      logger.info('[IPC] Simulator initialized successfully');

      // If specific troopId provided, run single battle
      if (troopId !== undefined) {
        simulationController.updateProgress({ current: 0, total: 1, currentTroop: troopId });

        // Default party for single troop simulation
        const party = new PartyConfig([{ classId: 1, level: 1 }]);

        checkAbortSignal(signal, 'executing battle');
        const result = await simulator.executeBattle({
          troopId,
          party,
          seed,
          maxTurns,
        });

        simulationController.updateProgress({ current: 1, total: 1, percentage: 100 });

        // Build SimulationResult
        const simulationResult: SimulationResult = {
          trechoId: trechoId ?? 'single-troop',
          troopId,
          troopName: result.troopName,
          battleResult: {
            troopId: result.troopId,
            troopName: result.troopName,
            outcome: result.outcome,
            ttkTurns: result.ttkTurns,
            ttkActions: result.ttkActions,
            durationMs: result.durationMs,
            seed: result.seed,
            expGained: result.expGained,
          },
          passed: result.outcome === 'victory',
          warnings: [],
        };

        // Persist results using injected report builder (convert SimulationResult to ReportData)
        const reportData = reportBuilder.buildReport({
          simulationResult,
          trechoName: trechoId ?? 'Single Troop',
        });
        simulationController.setLastResults(reportData);

        // Save to history (non-blocking - errors logged but don't throw)
        const simulationId = generateSimulationId();
        await saveSimulationToHistory(simulationId, reportData, projectPath);

        // Return SimulationResult for backward compatibility
        return simulationResult;
      }

      // If trechoId provided, run all troops in that trecho
      if (!trechoId) {
        throw new Error('trechoId is required when troopId is not provided');
      }

      const trecho = configTrechos.find((t) => t.id === trechoId);
      if (!trecho) {
        throw new Error(`Trecho not found: ${trechoId}`);
      }

      simulationController.updateProgress({
        current: 0,
        total: trecho.troopIds.length,
        currentTrecho: trechoId,
      });

      // Run first troop in trecho (simplified for MVP)
      const firstTroopId = trecho.troopIds[0];
      if (firstTroopId === undefined) {
        throw new Error(`Trecho has no troops: ${trechoId}`);
      }

      checkAbortSignal(signal, `executing battle for troop ${firstTroopId}`);
      const result = await simulator.executeBattle({
        troopId: firstTroopId,
        party: trecho.party,
        seed,
        maxTurns,
      });

      simulationController.updateProgress({ current: 1, total: trecho.troopIds.length });

      // Use Trecho instance to check tolerance
      // Trecho class has flat properties: targetTtkTurns, targetTtkActions, tolerancePercent
      const passed = trecho.isWithinTolerance(result.ttkTurns, result.ttkActions);

      // Build SimulationResult
      const simulationResult: SimulationResult = {
        trechoId: trecho.id,
        troopId: firstTroopId,
        troopName: result.troopName,
        battleResult: {
          troopId: result.troopId,
          troopName: result.troopName,
          outcome: result.outcome,
          ttkTurns: result.ttkTurns,
          ttkActions: result.ttkActions,
          durationMs: result.durationMs,
          seed: result.seed,
          expGained: result.expGained,
        },
        passed,
        warnings: passed ? [] : ['TTK outside tolerance range'],
      };

      // Persist results using injected report builder (convert SimulationResult to ReportData)
      checkAbortSignal(signal, 'building report');
      const reportData = reportBuilder.buildReport({
        simulationResult,
        trechoName: trecho.name,
      });
      simulationController.setLastResults(reportData);

      // Save to history (non-blocking - errors logged but don't throw)
      const simulationId = generateSimulationId();
      await saveSimulationToHistory(simulationId, reportData, projectPath);

      // Return SimulationResult for backward compatibility
      return simulationResult;
    } finally {
      simulationController.resetProgress();
    }
  });
}

/**
 * Handler: simulation:getProgress
 *
 * Returns the current simulation progress.
 */
export async function handleSimulationGetProgress(
  _event: IpcMainInvokeEvent,
  _payload: unknown
): Promise<IPCResult<number>> {
  return wrapHandler(async () => {
    const progress = simulationController.getProgress();
    return progress.percentage;
  });
}

/**
 * Handler: simulation:cancel
 *
 * Cancels the currently running simulation.
 */
export async function handleSimulationCancel(
  _event: IpcMainInvokeEvent,
  _payload: unknown
): Promise<IPCResult<void>> {
  return wrapHandler(async () => {
    const abortController = simulationController.getAbortController();
    if (abortController) {
      abortController.abort();
      simulationController.resetProgress();
    }
  });
}

/**
 * Sets the simulation results from a completed simulation.
 * Called by simulation:run handler when simulation completes.
 */
export function setSimulationResults(results: ReportData): void {
  simulationController.setLastResults(results);
}

/**
 * Clears the stored simulation results.
 */
export function clearSimulationResults(): void {
  simulationController.clearLastResults();
}

/**
 * Handler: simulation:getResults
 *
 * Returns the simulation results Report from the most recent simulation.
 */
export async function handleSimulationGetResults(
  _event: IpcMainInvokeEvent,
  _payload: unknown
): Promise<IPCResult<ReportData>> {
  return wrapHandler(async () => {
    const results = simulationController.getLastResults();
    if (!results) {
      throw new Error('No simulation results available. Run a simulation first.');
    }
    return results;
  });
}
