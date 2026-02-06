/**
 * FakeBuilder for GlobalSettingsFormData in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/domain/types/form-types.ts
 */

import Chance from 'chance';
import type { GlobalSettingsFormData } from '../../../../src/domain/types/form-types';

const chance = new Chance();

/**
 * Builder for creating GlobalSettingsFormData in tests.
 */
export class GlobalSettingsFormBuilder {
  private data: Partial<GlobalSettingsFormData> = {};

  static create(): GlobalSettingsFormBuilder {
    return new GlobalSettingsFormBuilder().withDefaults();
  }

  withDefaults(): this {
    this.data = {
      seed: chance.natural({ min: 1, max: 999999 }),
      maxBattleTurns: 100,
    };
    return this;
  }

  withSeed(seed: number): this {
    this.data.seed = seed;
    return this;
  }

  withMaxBattleTurns(turns: number): this {
    this.data.maxBattleTurns = turns;
    return this;
  }

  /**
   * Creates settings with a fixed seed for deterministic tests.
   */
  withDeterministicSeed(): this {
    this.data.seed = 12345;
    return this;
  }

  build(): GlobalSettingsFormData {
    return {
      seed: this.data.seed ?? chance.natural({ min: 1, max: 999999 }),
      maxBattleTurns: this.data.maxBattleTurns ?? 100,
    };
  }
}
