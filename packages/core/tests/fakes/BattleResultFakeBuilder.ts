import { FakeBuilder } from './FakeBuilder.js';
import { BattleResult, BattleResultData, BattleOutcome } from '@coreto/core';

/**
 * Builder for creating BattleResult instances in tests.
 * Provides sensible defaults and fluent interface for customization.
 *
 * @example
 * ```typescript
 * const result = new BattleResultFakeBuilder()
 *   .withTroopId(1)
 *   .withOutcome('victory')
 *   .withTtkMetrics(3, 8)
 *   .build();
 *
 * const defeat = new BattleResultFakeBuilder()
 *   .withDefeat()
 *   .build();
 * ```
 */
export class BattleResultFakeBuilder extends FakeBuilder<BattleResult> {
  private troopId = 1;
  private troopName = 'Goblin Pack';
  private outcome: BattleOutcome = 'victory';
  private ttkTurns = 3;
  private ttkActions = 8;
  private durationMs = 1250;
  private seed = 12345;
  private expGained = 100;

  /**
   * Set the troop ID.
   *
   * @param troopId - Troop ID from RPG Maker MZ
   * @returns This builder for chaining
   */
  withTroopId(troopId: number): this {
    this.troopId = troopId;
    return this;
  }

  /**
   * Set the troop name.
   *
   * @param troopName - Human-readable troop name
   * @returns This builder for chaining
   */
  withTroopName(troopName: string): this {
    this.troopName = troopName;
    return this;
  }

  /**
   * Set the battle outcome.
   *
   * @param outcome - Battle outcome (victory, defeat, timeout)
   * @returns This builder for chaining
   */
  withOutcome(outcome: BattleOutcome): this {
    this.outcome = outcome;
    return this;
  }

  /**
   * Set outcome to victory.
   *
   * @returns This builder for chaining
   */
  withVictory(): this {
    return this.withOutcome('victory');
  }

  /**
   * Set outcome to defeat.
   * Resets TTK metrics to 0 and EXP to 0.
   *
   * @returns This builder for chaining
   */
  withDefeat(): this {
    this.outcome = 'defeat';
    this.ttkTurns = 0;
    this.ttkActions = 0;
    this.expGained = 0;
    return this;
  }

  /**
   * Set outcome to timeout.
   * Resets EXP to 0 but keeps TTK metrics.
   *
   * @returns This builder for chaining
   */
  withTimeout(): this {
    this.outcome = 'timeout';
    this.expGained = 0;
    return this;
  }

  /**
   * Set both TTK metrics.
   *
   * @param turns - TTK in turns
   * @param actions - TTK in actions
   * @returns This builder for chaining
   */
  withTtkMetrics(turns: number, actions: number): this {
    this.ttkTurns = turns;
    this.ttkActions = actions;
    return this;
  }

  /**
   * Set TTK turns.
   *
   * @param turns - TTK in turns
   * @returns This builder for chaining
   */
  withTtkTurns(turns: number): this {
    this.ttkTurns = turns;
    return this;
  }

  /**
   * Set TTK actions.
   *
   * @param actions - TTK in actions
   * @returns This builder for chaining
   */
  withTtkActions(actions: number): this {
    this.ttkActions = actions;
    return this;
  }

  /**
   * Set battle duration.
   *
   * @param durationMs - Duration in milliseconds
   * @returns This builder for chaining
   */
  withDuration(durationMs: number): this {
    this.durationMs = durationMs;
    return this;
  }

  /**
   * Set RNG seed.
   *
   * @param seed - RNG seed value
   * @returns This builder for chaining
   */
  withSeed(seed: number): this {
    this.seed = seed;
    return this;
  }

  /**
   * Set EXP gained.
   *
   * @param exp - EXP gained (0 for defeat/timeout)
   * @returns This builder for chaining
   */
  withExpGained(exp: number): this {
    this.expGained = exp;
    return this;
  }

  /**
   * Set EXP to 0 (for defeat/timeout).
   *
   * @returns This builder for chaining
   */
  withNoExp(): this {
    return this.withExpGained(0);
  }

  /**
   * Build the BattleResult instance.
   *
   * @returns BattleResult instance
   */
  build(): BattleResult {
    const data: BattleResultData = {
      troopId: this.troopId,
      troopName: this.troopName,
      outcome: this.outcome,
      ttkTurns: this.ttkTurns,
      ttkActions: this.ttkActions,
      durationMs: this.durationMs,
      seed: this.seed,
      expGained: this.expGained,
    };
    return new BattleResult(data);
  }

  /**
   * Create builder with invalid data.
   * Note: BattleResult doesn't validate, so this returns a timeout result
   * which represents a "failed" battle state.
   */
  withInvalidData(): this {
    return this.withTimeout().withNoExp();
  }
}
