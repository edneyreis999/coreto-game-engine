/**
 * Executes battle simulation with deterministic seed and configuration.
 * Accepts project path, seed, and CLI overrides.
 *
 * @trace FR-001
 */

import { IBattleSimulator, BattleSetup } from '../ports/IBattleSimulator.js';
import { BattleResult } from '../domain/BattleResult.js';
import { PartyConfig } from '../domain/PartyConfig.js';
import type { IClock } from '../ports/IClock.js';

/**
 * Input data for ExecuteBattleUseCase.
 * Contains all parameters needed to execute a single battle simulation.
 */
export interface ExecuteBattleInput {
  /** Troop ID from RPG Maker MZ Troops.json (1-based index) */
  readonly troopId: number;
  /** Human-readable troop name for reporting */
  readonly troopName: string;
  /** Party configuration with member classes and levels */
  readonly party: PartyConfig;
  /** RNG seed for deterministic execution (ADR-018) */
  readonly seed: number;
  /** Maximum number of turns before battle timeout (optional, default: 100) */
  readonly maxTurns?: number;
}

/**
 * Output data from ExecuteBattleUseCase.
 * Contains battle result and performance metrics.
 */
export interface ExecuteBattleOutput {
  /** Battle result with TTK metrics and victory status */
  readonly result: BattleResult;
  /** Execution duration in milliseconds */
  readonly durationMs: number;
}

/**
 * Use Case: Execute Battle Simulation
 *
 * Orchestrates execution of a single battle simulation using IBattleSimulator port.
 * Measures execution time and returns both battle result and performance metrics.
 *
 * This use case encapsulates the business logic for running a deterministic battle:
 * - Configures battle setup with troop, party, and seed
 * - Delegates actual battle execution to simulator (infrastructure)
 * - Measures execution duration for performance tracking
 *
 * Follows Clean Architecture principles:
 * - No infrastructure dependencies (uses port abstraction)
 * - Pure business logic (orchestration only)
 * - Testable with mocked simulator
 *
 * @example
 * ```typescript
 * const useCase = new ExecuteBattleUseCase(simulator, clock);
 * const output = await useCase.execute({
 *   troopId: 1,
 *   troopName: 'Goblin Pack',
 *   party: new PartyConfig([{ classId: 1, level: 5 }]),
 *   seed: 12345,
 *   maxTurns: 100
 * });
 * console.log(`Battle completed in ${output.durationMs}ms`);
 * console.log(`TTK: ${output.result.ttkTurns} turns`);
 * ```
 */
export class ExecuteBattleUseCase {
  constructor(
    private readonly simulator: IBattleSimulator,
    private readonly clock: IClock
  ) {}

  /**
   * Execute a single battle simulation.
   *
   * @param input - Battle configuration with troop, party, seed, and options
   * @returns Battle result and execution duration
   * @throws {BattleTimeoutError} If battle exceeds maxTurns (ADR-025)
   * @throws {BattleError} If battle execution fails
   */
  async execute(input: ExecuteBattleInput): Promise<ExecuteBattleOutput> {
    const startTime = this.clock.now();

    const setup: BattleSetup = {
      troopId: input.troopId,
      party: input.party,
      seed: input.seed,
      ...(input.maxTurns !== undefined && { maxTurns: input.maxTurns }),
    };

    const result = await this.simulator.executeBattle(setup);

    return {
      result,
      durationMs: this.clock.now() - startTime,
    };
  }
}
