/**
 * FakeBuilder for Trecho domain entities in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/core/src/core/domain/Trecho.ts
 */

import { Trecho, PartyConfig } from '@coreto/core';

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * Builder for creating Trecho entities in tests.
 *
 * @example
 * ```ts
 * const trecho = TrechoFakeBuilder.anEntity()
 *   .withId('trecho-001')
 *   .withName('Forest Path')
 *   .build();
 *
 * const trechos = TrechoFakeBuilder.theEntities(3).build();
 * ```
 */
export class TrechoFakeBuilder {
  private chance: import('chance').Chance.Chance;
  private countObjs: number;
  private baseIndex: number;
  private static globalIndex = 0;

  private _id: PropOrFactory<string> = (index: number) => `trecho-${this.baseIndex + index}`;
  private _name: PropOrFactory<string> = (index: number) => `Trecho ${this.baseIndex + index}`;
  private _anchorLevelMin: PropOrFactory<number> = (index: number) => ((this.baseIndex + index) % 10) + 1;
  private _anchorLevelMax: PropOrFactory<number> = (index: number) => ((this.baseIndex + index) % 10) + 10;
  private _targetTtkTurns: PropOrFactory<number> = () => 5;
  private _targetTtkActions: PropOrFactory<number> = () => 12;
  private _tolerancePercent: PropOrFactory<number> = () => 20;
  private _troopIds: PropOrFactory<number[]> = () => [42, 43, 44];
  private _party: PropOrFactory<PartyConfig> = () => new PartyConfig([
    { classId: 1, level: 5 },
    { classId: 2, level: 5 },
  ]);

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = require('chance').Chance();
    this.baseIndex = TrechoFakeBuilder.globalIndex * 100;
    TrechoFakeBuilder.globalIndex += 1;
  }

  static anEntity(): TrechoFakeBuilder {
    return new TrechoFakeBuilder(1);
  }

  static theEntities(countObjs: number): TrechoFakeBuilder {
    return new TrechoFakeBuilder(countObjs);
  }

  withDefaultConfig(): this {
    this._targetTtkTurns = () => 5;
    this._targetTtkActions = () => 12;
    this._tolerancePercent = () => 20;
    this._anchorLevelMin = () => 1;
    this._anchorLevelMax = () => 10;
    return this;
  }

  /**
   * Creates a minimal trecho with only essential properties set.
   * Use this for tests that don't need full configuration.
   */
  withMinimalConfig(): this {
    this._targetTtkTurns = () => 5;
    this._targetTtkActions = () => 12;
    this._tolerancePercent = () => 20;
    this._anchorLevelMin = () => 1;
    this._anchorLevelMax = () => 1;
    this._troopIds = () => [1]; // Single troop
    this._party = () => new PartyConfig([{ classId: 1, level: 1 }]); // Single party member
    return this;
  }

  withId(valueOrFactory: PropOrFactory<string>): this {
    this._id = valueOrFactory;
    return this;
  }

  withName(valueOrFactory: PropOrFactory<string>): this {
    this._name = valueOrFactory;
    return this;
  }

  withLevelRange(min: number, max: number): this {
    this._anchorLevelMin = () => min;
    this._anchorLevelMax = () => max;
    return this;
  }

  withTargetTtk(turns: number, actions: number): this {
    this._targetTtkTurns = () => turns;
    this._targetTtkActions = () => actions;
    return this;
  }

  withTolerance(percent: number): this {
    this._tolerancePercent = () => percent;
    return this;
  }

  withCustomTroops(troopIds: number[]): this {
    this._troopIds = () => troopIds;
    return this;
  }

  withParty(party: PartyConfig): this {
    this._party = () => party;
    return this;
  }

  /**
   * Creates a Trecho that will pass tolerance checks with the given TTK values.
   */
  withSuccessTtk(ttkTurns: number, ttkActions: number): this {
    // Set TTK values within 20% tolerance of target (5 turns, 12 actions)
    this._targetTtkTurns = () => 5;
    this._targetTtkActions = () => 12;
    this._tolerancePercent = () => 20;
    return this;
  }

  /**
   * Creates a Trecho that will fail tolerance checks.
   */
  withFailureTtk(): this {
    // Set high target TTK so realistic values will be outside tolerance
    this._targetTtkTurns = () => 2;
    this._targetTtkActions = () => 5;
    this._tolerancePercent = () => 10;
    return this;
  }

  build(): Trecho | Trecho[] {
    const entities = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const id = this.callFactory(this._id, index);
        const name = this.callFactory(this._name, index);
        const anchorLevelMin = this.callFactory(this._anchorLevelMin, index);
        const anchorLevelMax = this.callFactory(this._anchorLevelMax, index);
        const targetTtkTurns = this.callFactory(this._targetTtkTurns, index);
        const targetTtkActions = this.callFactory(this._targetTtkActions, index);
        const tolerancePercent = this.callFactory(this._tolerancePercent, index);
        const troopIds = this.callFactory(this._troopIds, index);
        const party = this.callFactory(this._party, index);

        return new Trecho({
          id,
          name,
          anchorLevelMin,
          anchorLevelMax,
          targetTtkTurns,
          targetTtkActions,
          tolerancePercent,
          troopIds,
          party,
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
