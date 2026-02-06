/**
 * FakeBuilder for TrechoFormData in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/domain/types/form-types.ts
 */

import Chance from 'chance';
import type { TrechoFormData, PartyFormData } from '../../../../src/domain/types/form-types';

const chance = new Chance();

/**
 * Builder for creating TrechoFormData in tests.
 */
export class TrechoFormBuilder {
  private data: Partial<TrechoFormData> = {};

  static create(): TrechoFormBuilder {
    return new TrechoFormBuilder().withDefaults();
  }

  withDefaults(): this {
    const ato = chance.natural({ min: 1, max: 3 });
    const nivel = chance.natural({ min: 1, max: 10 });
    const trechoNum = chance.natural({ min: 1, max: 99 });

    this.data = {
      id: `ato${ato}-nivel${nivel}-${trechoNum}`,
      name: `Trecho ${ato}-${nivel}-${trechoNum}`,
      anchorLevelMin: chance.natural({ min: 1, max: 20 }),
      anchorLevelMax: chance.natural({ min: 21, max: 99 }),
      targetTtkTurns: chance.natural({ min: 1, max: 20 }),
      targetTtkActions: chance.natural({ min: 5, max: 50 }),
      tolerancePercent: chance.natural({ min: 0, max: 30 }),
      troopIds: [chance.natural({ min: 1, max: 999 })],
      party: {
        members: [
          {
            classId: chance.natural({ min: 1, max: 99 }),
            level: chance.natural({ min: 1, max: 99 }),
          },
        ],
      },
    };
    return this;
  }

  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  withAnchorLevels(min: number, max: number): this {
    this.data.anchorLevelMin = min;
    this.data.anchorLevelMax = max;
    return this;
  }

  withTtkTargets(turns: number, actions: number): this {
    this.data.targetTtkTurns = turns;
    this.data.targetTtkActions = actions;
    return this;
  }

  withTolerance(percent: number): this {
    this.data.tolerancePercent = percent;
    return this;
  }

  withTroopIds(troopIds: number[]): this {
    this.data.troopIds = troopIds;
    return this;
  }

  withParty(party: PartyFormData): this {
    this.data.party = party;
    return this;
  }

  /**
   * Creates a valid trecho that should pass all validation.
   * Uses sensible defaults for testing.
   */
  withValidDefaults(): this {
    this.data = {
      id: 'ato1-nivel1-1',
      name: 'Valid Trecho',
      anchorLevelMin: 10,
      anchorLevelMax: 15,
      targetTtkTurns: 5,
      targetTtkActions: 10,
      tolerancePercent: 15,
      troopIds: [101, 102],
      party: {
        members: [
          { classId: 1, level: 12 },
          { classId: 2, level: 12 },
        ],
      },
    };
    return this;
  }

  build(): TrechoFormData {
    return {
      id: this.data.id ?? `trecho-${chance.string({ pool: 'abcdefghijklmnopqrstuvwxyz0123456789-', length: 10 })}`,
      name: this.data.name ?? `Trecho ${chance.natural({ min: 1, max: 99 })}`,
      anchorLevelMin: this.data.anchorLevelMin ?? 1,
      anchorLevelMax: this.data.anchorLevelMax ?? 99,
      targetTtkTurns: this.data.targetTtkTurns ?? 10,
      targetTtkActions: this.data.targetTtkActions ?? 20,
      tolerancePercent: this.data.tolerancePercent ?? 15,
      troopIds: this.data.troopIds ?? [chance.natural({ min: 1, max: 999 })],
      party: this.data.party ?? {
        members: [{ classId: 1, level: 10 }],
      },
    };
  }
}
