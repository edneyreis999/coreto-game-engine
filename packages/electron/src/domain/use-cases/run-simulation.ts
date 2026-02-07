/**
 * Run Simulation Use Case
 *
 * Pure domain use case for running battle simulations.
 * Follows Clean Architecture - no direct filesystem dependencies.
 *
 * Process:
 * 1. Load RPG Maker MZ data
 * 2. Initialize simulator with loaded database
 * 3. Load config if provided
 * 4. Execute single troop or trecho-based simulation
 * 5. Return simulation result with tolerance check
 *
 * @see packages/electron/src/domain/types/simulation-types.ts
 */

import type { BattleResult, PartyConfig, Trecho } from '@coreto/core';
import type {
  BattleResultData,
  BattleOutcome,
  SimulationResult,
} from '../types/index.js';
import type { IBattleSimulator } from '@coreto/core';
import type { IDataLoader, IConfigLoader, ILogger } from '@coreto/core';

// ============================================================================
// Types
// ============================================================================

/**
 * Input for running a simulation.
 */
export interface RunSimulationInput {
  /**
   * Absolute path to the RPG Maker MZ project directory.
   */
  projectPath: string;

  /**
   * Optional path to the project configuration file.
   * If provided, trechos will be loaded from config.
   */
  configPath?: string;

  /**
   * ID of the trecho to simulate.
   * Required when troopId is not provided.
   */
  trechoId?: string;

  /**
   * ID of the troop to simulate.
   * If provided, runs single troop simulation.
   */
  troopId?: number;

  /**
   * Random seed for deterministic simulation.
   * @default 12345
   */
  seed?: number;

  /**
   * Maximum number of turns before timeout.
   * @default 100
   */
  maxTurns?: number;
}

/**
 * Output from running a simulation.
 */
export interface RunSimulationOutput {
  /**
   * Simulation result with battle data and pass/fail status.
   */
  result: SimulationResult;
}

/**
 * Dependencies required by the use case.
 * Injected via dependency injection to maintain purity.
 */
export interface RunSimulationDeps {
  /**
   * Data loader for reading RPG Maker MZ database.
   */
  dataLoader: IDataLoader;

  /**
   * Battle simulator for executing battles.
   */
  simulator: IBattleSimulator;

  /**
   * Config loader for loading trechos from config.
   */
  configLoader?: IConfigLoader;

  /**
   * Logger for simulation events.
   */
  logger: ILogger;
}

/**
 * Progress callback for simulation updates.
 */
export interface SimulationProgressCallbacks {
  /**
   * Called when simulation starts.
   */
  onStart?: () => void;

  /**
   * Called when progress updates.
   */
  onProgress?: (progress: { current: number; total: number; percentage: number }) => void;

  /**
   * Called when simulation completes or fails.
   */
  onEnd?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Converts BattleResult from core to BattleResultData format.
 */
function toBattleResultData(result: BattleResult): BattleResultData {
  return {
    troopId: result.troopId,
    troopName: result.troopName,
    outcome: result.outcome as BattleOutcome,
    ttkTurns: result.ttkTurns,
    ttkActions: result.ttkActions,
    durationMs: result.durationMs,
    seed: result.seed,
    expGained: result.expGained,
  };
}

// ============================================================================
// Use Case
// ============================================================================

/**
 * Runs a battle simulation with the given parameters.
 *
 * This use case handles:
 * - Single troop simulation (when troopId is provided)
 * - Trecho-based simulation (when trechoId is provided)
 * - Progress tracking via callbacks
 * - Tolerance checking for trecho simulations
 *
 * @param input - Simulation parameters
 * @param deps - Injected dependencies
 * @param callbacks - Optional progress callbacks
 * @returns Simulation result with battle data and pass/fail status
 * @throws {Error} If simulation fails or validation errors occur
 *
 * @example
 * ```typescript
 * const { result } = await runSimulation(
 *   {
 *     projectPath: '/path/to/project',
 *     trechoId: 'trecho-1',
 *     seed: 12345,
 *     maxTurns: 100
 *   },
 *   {
 *     dataLoader,
 *     simulator,
 *     configLoader,
 *     logger
 *   },
 *   {
 *     onStart: () => console.log('Starting simulation'),
 *     onProgress: (p) => console.log(`Progress: ${p.percentage}%`),
 *     onEnd: () => console.log('Simulation complete')
 *   }
 * );
 * ```
 */
export async function runSimulation(
  input: RunSimulationInput,
  deps: RunSimulationDeps,
  callbacks?: SimulationProgressCallbacks
): Promise<RunSimulationOutput> {
  const {
    projectPath,
    configPath,
    trechoId,
    troopId,
    seed = 12345,
    maxTurns = 100,
  } = input;

  const { dataLoader, simulator, configLoader, logger } = deps;

  logger.info(
    `[Use Case] Running simulation: project=${projectPath}, trecho=${trechoId}, troop=${troopId}`
  );

  callbacks?.onStart?.();

  try {
    // Load RPG Maker MZ data
    callbacks?.onProgress?.({ current: 0, total: 1, percentage: 0 });
    const database = await dataLoader.loadDatabase(projectPath);

    // Initialize simulator with loaded database
    await simulator.initialize(database, projectPath);
    logger.info('[Use Case] Simulator initialized successfully');

    // Load config if provided
    let configTrechos: Trecho[] = [];
    if (configPath && configLoader) {
      const config = await configLoader.loadConfig(configPath);
      configTrechos = await configLoader.loadTrechos(config);
    }

    // If specific troopId provided, run single battle
    if (troopId !== undefined) {
      callbacks?.onProgress?.({ current: 0, total: 1, percentage: 50 });

      // Default party for single troop simulation
      const party = new PartyConfig([{ classId: 1, level: 1 }]);

      const battleResult = await simulator.executeBattle({
        troopId,
        party,
        seed,
        maxTurns,
      });

      callbacks?.onProgress?.({ current: 1, total: 1, percentage: 100 });

      return {
        result: {
          trechoId: trechoId ?? 'single-troop',
          troopId,
          troopName: `Troop ${troopId}`,
          battleResult: toBattleResultData(battleResult),
          passed: battleResult.outcome === 'victory',
          warnings: [],
        },
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

    callbacks?.onProgress?.({
      current: 0,
      total: trecho.troopIds.length,
      percentage: 0,
    });

    // Run first troop in trecho (simplified for MVP)
    const firstTroopId = trecho.troopIds[0];
    if (firstTroopId === undefined) {
      throw new Error(`Trecho has no troops: ${trechoId}`);
    }

    const battleResult = await simulator.executeBattle({
      troopId: firstTroopId,
      party: trecho.party,
      seed,
      maxTurns,
    });

    callbacks?.onProgress?.({
      current: 1,
      total: trecho.troopIds.length,
      percentage: Math.round(100 / trecho.troopIds.length),
    });

    // Use Trecho instance to check tolerance
    const passed = trecho.isWithinTolerance(battleResult.ttkTurns, battleResult.ttkActions);

    return {
      result: {
        trechoId: trecho.id,
        troopId: firstTroopId,
        troopName: battleResult.troopName,
        battleResult: toBattleResultData(battleResult),
        passed,
        warnings: passed ? [] : ['TTK outside tolerance range'],
      },
    };
  } finally {
    callbacks?.onEnd?.();
  }
}
