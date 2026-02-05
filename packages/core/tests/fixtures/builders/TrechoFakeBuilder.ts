import Chance from 'chance';
import { Trecho } from '../../../src/core/domain/Trecho';
import type { TrechoData } from '../../../src/core/domain/Trecho';
import { PartyConfigFakeBuilder } from './PartyConfigFakeBuilder';

/**
 * FakeBuilder for Trecho domain entity.
 * Provides fluent interface for creating test trecho data with realistic defaults.
 */
export class TrechoFakeBuilder {
  private chance = new Chance();
  private data: TrechoData = {
    id: 'ato1-nivel1-10',
    name: 'Ato 1 - Níveis 1-10',
    anchorLevelMin: 1,
    anchorLevelMax: 10,
    targetTtkTurns: 3,
    targetTtkActions: 8,
    tolerancePercent: 15,
    troopIds: [1, 2, 3],
    party: new PartyConfigFakeBuilder().build(),
  };

  /**
   * Sets the trecho ID.
   */
  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  /**
   * Sets the trecho name.
   */
  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  /**
   * Sets the anchor level range.
   */
  withAnchorLevels(min: number, max: number): this {
    this.data.anchorLevelMin = min;
    this.data.anchorLevelMax = max;
    return this;
  }

  /**
   * Sets the target TTK (both turns and actions).
   */
  withTargetTtk(turns: number, actions: number): this {
    this.data.targetTtkTurns = turns;
    this.data.targetTtkActions = actions;
    return this;
  }

  /**
   * Sets the target TTK turns only.
   */
  withTargetTtkTurns(turns: number): this {
    this.data.targetTtkTurns = turns;
    return this;
  }

  /**
   * Sets the target TTK actions only.
   */
  withTargetTtkActions(actions: number): this {
    this.data.targetTtkActions = actions;
    return this;
  }

  /**
   * Sets the tolerance percentage.
   */
  withTolerance(tolerancePercent: number): this {
    this.data.tolerancePercent = tolerancePercent;
    return this;
  }

  /**
   * Sets the troop IDs to test.
   */
  withTroopIds(troopIds: number[]): this {
    this.data.troopIds = troopIds;
    return this;
  }

  /**
   * Adds a troop ID to the existing list.
   */
  withTroopId(troopId: number): this {
    this.data.troopIds = [...this.data.troopIds, troopId];
    return this;
  }

  /**
   * Sets the party configuration.
   */
  withParty(party: PartyConfigFakeBuilder | ReturnType<typeof PartyConfigFakeBuilder.prototype.build>): this {
    this.data.party = party instanceof PartyConfigFakeBuilder ? party.build() : party;
    return this;
  }

  /**
   * Sets a random valid trecho.
   */
  withRandomData(): this {
    const minLevel = this.chance.integer({ min: 1, max: 80 });
    const maxLevel = minLevel + this.chance.integer({ min: 0, max: 99 - minLevel });

    this.data = {
      id: this.chance.string({ length: 10, alpha: true, numeric: true }).toLowerCase(),
      name: `Ato ${this.chance.integer({ min: 1, max: 5 })} - Níveis ${minLevel}-${maxLevel}`,
      anchorLevelMin: minLevel,
      anchorLevelMax: maxLevel,
      targetTtkTurns: this.chance.integer({ min: 1, max: 20 }),
      targetTtkActions: this.chance.integer({ min: 2, max: 50 }),
      tolerancePercent: this.chance.integer({ min: 5, max: 30 }),
      troopIds: Array.from(
        { length: this.chance.integer({ min: 1, max: 5 }) },
        () => this.chance.integer({ min: 1, max: 100 })
      ),
      party: new PartyConfigFakeBuilder().withRandomMembers(this.chance.integer({ min: 1, max: 4 })).build(),
    };
    return this;
  }

  /**
   * Builds the Trecho instance.
   */
  build(): Trecho {
    return new Trecho(this.data);
  }
}
