/**
 * FakeBuilder for BattleResult domain entities in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/core/src/core/domain/BattleResult.ts
 */

import { BattleResult } from '@coreto/core';

type PropOrFactory<T> = T | ((index: number) => T);
type BattleOutcome = 'victory' | 'defeat' | 'timeout';

/**
 * Builder for creating BattleResult entities in tests.
 *
 * @example
 * ```ts
 * const result = BattleResultFakeBuilder.anEntity()
 *   .withVictory()
 *   .withTroopId(42)
 *   .build();
 *
 * const results = BattleResultFakeBuilder.theEntities(5)
 *   .withVictory()
 *   .build();
 * ```
 */
export class BattleResultFakeBuilder {
  private chance: import('chance').Chance.Chance;
  private countObjs: number;
  private baseIndex: number;
  private static globalIndex = 0;

  private _troopId: PropOrFactory<number> = (index: number) => (this.baseIndex + index) % 100 + 1;
  private _troopName: PropOrFactory<string> = (index: number) => `Troop ${this.baseIndex + index}`;
  private _outcome: PropOrFactory<BattleOutcome> = () => 'victory' as const;
  private _ttkTurns: PropOrFactory<number> = (index: number) => this.chance.integer({ min: 3, max: 20 });
  private _ttkActions: PropOrFactory<number> = (index: number) => this.chance.integer({ min: 5, max: 30 });
  private _durationMs: PropOrFactory<number> = () => this.chance.integer({ min: 500, max: 3000 });
  private _seed: PropOrFactory<number> = () => this.chance.integer({ min: 10000, max: 99999 });
  private _expGained: PropOrFactory<number> = () => this.chance.integer({ min: 50, max: 200 });

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = require('chance').Chance();
    this.baseIndex = BattleResultFakeBuilder.globalIndex * 100;
    BattleResultFakeBuilder.globalIndex += 1;
  }

  static anEntity(): BattleResultFakeBuilder {
    return new BattleResultFakeBuilder(1);
  }

  static theEntities(countObjs: number): BattleResultFakeBuilder {
    return new BattleResultFakeBuilder(countObjs);
  }

  /**
   * Configure battle as a victory.
   */
  withVictory(): this {
    this._outcome = () => 'victory' as const;
    return this;
  }

  /**
   * Configure battle as a defeat.
   */
  withDefeat(): this {
    this._outcome = () => 'defeat' as const;
    this._expGained = () => 0;
    return this;
  }

  /**
   * Configure battle as a timeout.
   */
  withTimeout(): this {
    this._outcome = () => 'timeout' as const;
    this._expGained = () => 0;
    return this;
  }

  /**
   * Configure TTK metrics within typical tolerance range (5 turns, 12 actions ±20%).
   */
  withSuccessTtk(): this {
    this._ttkTurns = () => this.chance.integer({ min: 4, max: 6 });
    this._ttkActions = () => this.chance.integer({ min: 10, max: 14 });
    this._outcome = () => 'victory' as const;
    return this;
  }

  /**
   * Creates a minimal battle result with only essential properties set.
   * Use this for tests that don't need full configuration.
   */
  withMinimalVictory(): this {
    this._troopId = () => 1;
    this._troopName = () => 'Test Troop';
    this._outcome = () => 'victory' as const;
    this._ttkTurns = () => 5;
    this._ttkActions = () => 12;
    this._durationMs = () => 1000;
    this._seed = () => 12345;
    this._expGained = () => 100;
    return this;
  }

  /**
   * Configure TTK metrics outside typical tolerance range.
   */
  withFailureTtk(): this {
    this._ttkTurns = () => this.chance.integer({ min: 7, max: 15 });
    this._ttkActions = () => this.chance.integer({ min: 15, max: 30 });
    this._outcome = () => 'victory' as const;
    return this;
  }

  withTroopId(valueOrFactory: PropOrFactory<number>): this {
    this._troopId = valueOrFactory;
    return this;
  }

  withTroopName(valueOrFactory: PropOrFactory<string>): this {
    this._troopName = valueOrFactory;
    return this;
  }

  withTtk(turns: number, actions: number): this {
    this._ttkTurns = () => turns;
    this._ttkActions = () => actions;
    return this;
  }

  withDuration(valueOrFactory: PropOrFactory<number>): this {
    this._durationMs = valueOrFactory;
    return this;
  }

  withSeed(valueOrFactory: PropOrFactory<number>): this {
    this._seed = valueOrFactory;
    return this;
  }

  withExpGained(valueOrFactory: PropOrFactory<number>): this {
    this._expGained = valueOrFactory;
    return this;
  }

  /**
   * Create a battle result matching specific expected values.
   */
  withSpecificValues(
    troopId: number,
    troopName: string,
    outcome: BattleOutcome,
    ttkTurns: number,
    ttkActions: number,
    durationMs: number,
    seed: number,
    expGained: number = 100
  ): this {
    this._troopId = () => troopId;
    this._troopName = () => troopName;
    this._outcome = () => outcome;
    this._ttkTurns = () => ttkTurns;
    this._ttkActions = () => ttkActions;
    this._durationMs = () => durationMs;
    this._seed = () => seed;
    this._expGained = () => expGained;
    return this;
  }

  build(): BattleResult | BattleResult[] {
    const entities = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const troopId = this.callFactory(this._troopId, index);
        const troopName = this.callFactory(this._troopName, index);
        const outcome = this.callFactory(this._outcome, index);
        const ttkTurns = this.callFactory(this._ttkTurns, index);
        const ttkActions = this.callFactory(this._ttkActions, index);
        const durationMs = this.callFactory(this._durationMs, index);
        const seed = this.callFactory(this._seed, index);
        const expGained = this.callFactory(this._expGained, index);

        return new BattleResult({
          troopId,
          troopName,
          outcome,
          ttkTurns,
          ttkActions,
          durationMs,
          seed,
          expGained,
        });
      });

    return this.countObjs === 1 ? entities[0]! : entities;
  }

  private callFactory<T>(factoryOrValue: PropOrFactory<T>, index: number): T {
    return typeof factoryOrValue === 'function'
      ? (factoryOrValue as (index: number) => T)(index)
      : factoryOrValue;
  }
}
