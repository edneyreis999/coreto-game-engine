import Chance from 'chance';
import { BattleResult } from '../../../src/core/domain/BattleResult';
import type { BattleResultData } from '../../../src/core/domain/BattleResult';

/**
 * FakeBuilder for BattleResult domain entity.
 * Provides fluent interface for creating test battle results with realistic defaults.
 */
export class BattleResultFakeBuilder {
  private chance = new Chance();
  private data: BattleResultData = {
    troopId: 1,
    troopName: 'Goblin Pack',
    outcome: 'victory',
    ttkTurns: 3,
    ttkActions: 8,
    durationMs: 1250,
    seed: 12345,
    expGained: 0,
  };

  /**
   * Sets the troop ID.
   */
  withTroopId(troopId: number): this {
    this.data.troopId = troopId;
    return this;
  }

  /**
   * Sets the troop name.
   */
  withTroopName(troopName: string): this {
    this.data.troopName = troopName;
    return this;
  }

  /**
   * Sets the battle outcome.
   */
  withOutcome(outcome: 'victory' | 'defeat' | 'timeout'): this {
    this.data.outcome = outcome;
    return this;
  }

  /**
   * Sets both TTK metrics (turns and actions).
   */
  withTtkMetrics(ttkTurns: number, ttkActions: number): this {
    this.data.ttkTurns = ttkTurns;
    this.data.ttkActions = ttkActions;
    return this;
  }

  /**
   * Sets TTK turns only.
   */
  withTtkTurns(ttkTurns: number): this {
    this.data.ttkTurns = ttkTurns;
    return this;
  }

  /**
   * Sets TTK actions only.
   */
  withTtkActions(ttkActions: number): this {
    this.data.ttkActions = ttkActions;
    return this;
  }

  /**
   * Sets the battle duration in milliseconds.
   */
  withDuration(durationMs: number): this {
    this.data.durationMs = durationMs;
    return this;
  }

  /**
   * Sets the RNG seed.
   */
  withSeed(seed: number): this {
    this.data.seed = seed;
    return this;
  }

  /**
   * Sets the EXP gained.
   */
  withExpGained(expGained: number): this {
    this.data.expGained = expGained;
    return this;
  }

  /**
   * Sets a defeat outcome.
   */
  asDefeat(): this {
    this.data.outcome = 'defeat';
    return this;
  }

  /**
   * Sets a timeout outcome.
   */
  asTimeout(): this {
    this.data.outcome = 'timeout';
    return this;
  }

  /**
   * Sets a random valid battle result.
   */
  withRandomData(): this {
    this.data = {
      troopId: this.chance.integer({ min: 1, max: 100 }),
      troopName: this.chance.word({ syllables: 3 }),
      outcome: this.chance.pickone(['victory', 'defeat', 'timeout']),
      ttkTurns: this.chance.integer({ min: 1, max: 20 }),
      ttkActions: this.chance.integer({ min: 2, max: 50 }),
      durationMs: this.chance.integer({ min: 500, max: 5000 }),
      seed: this.chance.integer({ min: 1000, max: 99999 }),
      expGained: this.chance.integer({ min: 0, max: 1000 }),
    };
    return this;
  }

  /**
   * Builds the BattleResult instance.
   */
  build(): BattleResult {
    return new BattleResult(this.data);
  }
}
