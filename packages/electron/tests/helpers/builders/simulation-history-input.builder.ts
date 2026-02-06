/**
 * FakeBuilder for SimulationHistoryInput in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/main/database/queries/simulation-history.ts
 */

import Chance from 'chance';
import type { SimulationHistoryInput } from '../../../src/main/database/queries/simulation-history';

const chance = new Chance();

/**
 * Builder for creating SimulationHistoryInput in tests.
 */
export class SimulationHistoryInputBuilder {
  private data: Partial<SimulationHistoryInput> = {};

  static create(): SimulationHistoryInputBuilder {
    return new SimulationHistoryInputBuilder().withDefaults();
  }

  withDefaults(): this {
    this.data = {
      project_path: `/Users/dev/rpgmaker/${chance.word()}`,
      config_name: `${chance.word()}-config.json`,
      trecho_id: `ato${chance.natural({ min: 1, max: 3 })}-nivel${chance.natural({ min: 1, max: 10 })}-${chance.natural({ min: 1, max: 99 })}`,
      troop_id: chance.natural({ min: 1, max: 50 }),
      troop_name: chance.sentence({ words: 2 }),
      ttk_turns: chance.natural({ min: 1, max: 20 }),
      ttk_actions: chance.natural({ min: 5, max: 50 }),
      duration_ms: chance.natural({ min: 1000, max: 60000 }),
      seed: chance.natural({ min: 1, max: 999999 }),
      exp_gained: chance.natural({ min: 0, max: 1000 }),
      outcome: chance.pickone(['victory', 'defeat', 'timeout']),
      passed: chance.bool(),
      warnings: chance.natural({ min: 0, max: 3 }) === 0 ? [] : [chance.sentence()],
    };
    return this;
  }

  withProjectPath(path: string): this {
    this.data.project_path = path;
    return this;
  }

  withConfigName(name: string | null): this {
    this.data.config_name = name;
    return this;
  }

  withTrechoId(id: string): this {
    this.data.trecho_id = id;
    return this;
  }

  withTroopId(id: number): this {
    this.data.troop_id = id;
    return this;
  }

  withTroopName(name: string): this {
    this.data.troop_name = name;
    return this;
  }

  withTtkTurns(turns: number): this {
    this.data.ttk_turns = turns;
    return this;
  }

  withTtkActions(actions: number): this {
    this.data.ttk_actions = actions;
    return this;
  }

  withDurationMs(ms: number): this {
    this.data.duration_ms = ms;
    return this;
  }

  withSeed(seed: number): this {
    this.data.seed = seed;
    return this;
  }

  withExpGained(exp: number): this {
    this.data.exp_gained = exp;
    return this;
  }

  withOutcome(outcome: 'victory' | 'defeat' | 'timeout'): this {
    this.data.outcome = outcome;
    return this;
  }

  withPassed(passed: boolean): this {
    this.data.passed = passed;
    return this;
  }

  withWarnings(warnings: string[]): this {
    this.data.warnings = warnings;
    return this;
  }

  withVictory(): this {
    return this.withOutcome('victory').withPassed(true);
  }

  withDefeat(): this {
    return this.withOutcome('defeat').withPassed(false);
  }

  withTimeout(): this {
    return this.withOutcome('timeout').withPassed(false);
  }

  build(): SimulationHistoryInput {
    return this.data as SimulationHistoryInput;
  }
}
