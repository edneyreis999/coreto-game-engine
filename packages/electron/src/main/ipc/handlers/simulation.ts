/**
 * Simulation IPC Handlers
 *
 * Handlers for running and managing battle simulations.
 * State management is now delegated to SimulationController.
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
import type { Trecho } from '@coreto/core';

import type { IPCResult } from '../protocol-types.js';
import type {
  SimulationResult,
  ReportData,
} from '../types.js';
import { SimulationRunPayloadSchema } from '../types.js';
import { wrapHandler } from '../ipc-response.js';
import { simulationController } from '../../services/index.js';

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
 */
export async function handleSimulationRun(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<SimulationResult>> {
  return wrapHandler(async () => {
    validatePayload('simulation:run', payload, SimulationRunPayloadSchema);

    const { projectPath, configPath, trechoId, troopId, seed = 12345, maxTurns = 100 } = payload;

    const logger = resolve<ILogger>(ILoggerToken);
    const configLoader = resolve<IConfigLoader>(IConfigLoaderToken);
    const dataLoader = resolve<IDataLoader>(IDataLoaderToken);
    const simulator = resolve<IBattleSimulator>(IBattleSimulatorToken);

    logger.info(
      `[IPC] Running simulation: project=${projectPath}, trecho=${trechoId}, troop=${troopId}`
    );

    // Check if simulation is already running via controller
    const currentProgress = simulationController.getProgress();
    if (currentProgress.isRunning) {
      throw new Error('Simulation is already running. Cancel or wait for completion.');
    }

    // Load project data - update progress via controller
    simulationController.updateProgress({ isRunning: true, current: 0, total: 1 });

    try {
      // Load RPG Maker MZ data
      const database = await dataLoader.loadDatabase(projectPath);

      // Initialize simulator with loaded database
      await simulator.initialize(database, projectPath);
      logger.info('[IPC] Simulator initialized successfully');

      // Load config if provided
      let configTrechos: Trecho[] = [];
      if (configPath) {
        const config = await configLoader.loadConfig(configPath);
        configTrechos = await configLoader.loadTrechos(config);
      }

      // If specific troopId provided, run single battle
      if (troopId !== undefined) {
        simulationController.updateProgress({ current: 0, total: 1, currentTroop: troopId });

        // Default party for single troop simulation
        const party = new PartyConfig([{ classId: 1, level: 1 }]);

        const result = await simulator.executeBattle({
          troopId,
          party,
          seed,
          maxTurns,
        });

        simulationController.updateProgress({ current: 1, total: 1, percentage: 100 });

        return {
          trechoId: trechoId ?? 'single-troop',
          troopId,
          troopName: `Troop ${troopId}`,
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

      return {
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
