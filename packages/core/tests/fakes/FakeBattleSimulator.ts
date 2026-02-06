import type { IBattleSimulator, BattleSetup } from '@coreto/core/core/ports/IBattleSimulator.js';
import { BattleResult } from '@coreto/core/core/domain/BattleResult.js';
import { TtkMetrics } from '@coreto/core/core/domain/TtkMetrics.js';
import type { RmmzDatabase } from '@coreto/core/core/ports/IDataLoader.js';

/**
 * In-memory fake implementation of IBattleSimulator for testing.
 *
 * Provides deterministic battle simulation with configurable results.
 * Tracks all calls for verification in tests.
 *
 * @example
 * ```typescript
 * const defaultResult = new BattleResultFakeBuilder().build();
 * const simulator = new FakeBattleSimulator(defaultResult);
 *
 * // Configure specific result for troop 1
 * const troop1Result = new BattleResultFakeBuilder().withTroopId(1).withVictory().build();
 * simulator.addResult(1, troop1Result);
 *
 * await simulator.initialize(database, projectPath);
 * const result = await simulator.executeBattle({ troopId: 1, party, seed: 12345 });
 *
 * // Verify calls
 * expect(simulator.executeBattleCalls).toHaveLength(1);
 * expect(simulator.executeBattleCalls[0]).toEqual({ troopId: 1, party, seed: 12345, maxTurns: undefined });
 * ```
 */
export class FakeBattleSimulator implements IBattleSimulator {
  private results = new Map<number, BattleResult>();
  private defaultResult: BattleResult;
  private lastMetrics: TtkMetrics | null = null;
  private errorToThrow: Error | null = null;

  /** Track all executeBattle calls for verification */
  public executeBattleCalls: BattleSetup[] = [];

  constructor(defaultResult: BattleResult) {
    this.defaultResult = defaultResult;
  }

  /**
   * Configure a specific result for a troop ID.
   * @param troopId - Troop ID to return this result for
   * @param result - Battle result to return
   */
  addResult(troopId: number, result: BattleResult): void {
    this.results.set(troopId, result);
  }

  /**
   * Make the next executeBattle call throw an error.
   * @param error - Error to throw
   */
  throwOnExecute(error: Error): void {
    this.errorToThrow = error;
  }

  async initialize(_database: RmmzDatabase, _projectPath: string): Promise<void> {
    // No-op for fake
  }

  async executeBattle(setup: BattleSetup): Promise<BattleResult> {
    this.executeBattleCalls.push(setup);

    if (this.errorToThrow) {
      const error = this.errorToThrow;
      this.errorToThrow = null; // Reset after throwing
      throw error;
    }

    const result = this.results.get(setup.troopId) ?? this.defaultResult;

    // Update lastMetrics from the result
    this.lastMetrics = new TtkMetrics(result.ttkTurns, result.ttkActions);

    return result;
  }

  getLastMetrics(): TtkMetrics {
    if (!this.lastMetrics) {
      throw new Error('No battle executed yet');
    }
    return this.lastMetrics;
  }

  async cleanup(): Promise<void> {
    this.results.clear();
    this.executeBattleCalls = [];
    this.lastMetrics = null;
  }
}
