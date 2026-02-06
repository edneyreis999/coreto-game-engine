/**
 * FakeBuilder for TrechoSummary in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/core/src/core/domain/Report.ts
 */

import Chance from 'chance';
import type { TrechoSummary, TrechoAggregates, BattleResultData, BattleResult, WarningData } from '@coreto/core';

const chance = new Chance();

/**
 * Builder for creating BattleResultData in tests.
 */
export class BattleResultBuilder {
  private data: Partial<BattleResultData> = {};

  static create(): BattleResultBuilder {
    return new BattleResultBuilder().withDefaults();
  }

  withDefaults(): this {
    this.data = {
      troopId: chance.natural({ min: 1, max: 50 }),
      troopName: chance.sentence({ words: 2 }),
      outcome: chance.pickone(['victory', 'defeat', 'timeout']),
      ttkTurns: chance.natural({ min: 1, max: 20 }),
      ttkActions: chance.natural({ min: 5, max: 50 }),
      durationMs: chance.natural({ min: 100, max: 5000 }),
      seed: chance.natural({ min: 1, max: 999999 }),
      expGained: chance.natural({ min: 0, max: 500 }),
    };
    return this;
  }

  withTroopId(id: number): this {
    this.data.troopId = id;
    return this;
  }

  withTroopName(name: string): this {
    this.data.troopName = name;
    return this;
  }

  withOutcome(outcome: 'victory' | 'defeat' | 'timeout'): this {
    this.data.outcome = outcome;
    return this;
  }

  withTtkTurns(turns: number): this {
    this.data.ttkTurns = turns;
    return this;
  }

  withTtkActions(actions: number): this {
    this.data.ttkActions = actions;
    return this;
  }

  withDurationMs(ms: number): this {
    this.data.durationMs = ms;
    return this;
  }

  withSeed(seed: number): this {
    this.data.seed = seed;
    return this;
  }

  withExpGained(exp: number): this {
    this.data.expGained = exp;
    return this;
  }

  withVictory(): this {
    return this.withOutcome('victory');
  }

  withDefeat(): this {
    return this.withOutcome('defeat');
  }

  withTimeout(): this {
    return this.withOutcome('timeout');
  }

  build(): BattleResultData {
    return this.data as BattleResultData;
  }
}

/**
 * Builder for creating TrechoSummary in tests.
 */
export class TrechoSummaryBuilder {
  private data: Partial<TrechoSummary> = {};

  static create(): TrechoSummaryBuilder {
    return new TrechoSummaryBuilder().withDefaults();
  }

  withDefaults(): this {
    const battleCount = chance.natural({ min: 1, max: 10 });
    const battles = Array.from({ length: battleCount }, () =>
      BattleResultBuilder.create().build()
    );

    // Calculate aggregates from battles
    const avgTtkTurns = battles.reduce((sum, b) => sum + b.ttkTurns, 0) / battles.length;
    const avgTtkActions = battles.reduce((sum, b) => sum + b.ttkActions, 0) / battles.length;
    const sortedTtkTurns = [...battles].map((b) => b.ttkTurns).sort((a, b) => a - b);
    const p95TtkTurns = sortedTtkTurns[Math.floor(sortedTtkTurns.length * 0.95)] || avgTtkTurns;
    const sortedTtkActions = [...battles].map((b) => b.ttkActions).sort((a, b) => a - b);
    const p95TtkActions = sortedTtkActions[Math.floor(sortedTtkActions.length * 0.95)] || avgTtkActions;

    this.data = {
      trechoId: `ato${chance.natural({ min: 1, max: 3 })}-nivel${chance.natural({ min: 1, max: 10 })}-${chance.natural({ min: 1, max: 99 })}`,
      trechoName: chance.sentence({ words: 4 }),
      battles: battles as unknown as BattleResult[],
      aggregates: {
        avgTtkTurns,
        p95TtkTurns,
        avgTtkActions,
        p95TtkActions,
      },
      warnings: [],
      passed: chance.bool(),
    };
    return this;
  }

  withTrechoId(id: string): this {
    this.data.trechoId = id;
    return this;
  }

  withTrechoName(name: string): this {
    this.data.trechoName = name;
    return this;
  }

  withBattles(battles: BattleResultData[]): this {
    this.data.battles = battles as unknown as BattleResult[];
    return this;
  }

  addBattle(battle: BattleResultData): this {
    this.data.battles = [...(this.data.battles || []), battle] as unknown as BattleResult[];
    return this;
  }

  withAggregates(aggregates: TrechoAggregates): this {
    this.data.aggregates = aggregates;
    return this;
  }

  withWarnings(warnings: unknown[]): this {
    this.data.warnings = warnings as WarningData[];
    return this;
  }

  addWarning(warning: unknown): this {
    const currentWarnings = (this.data.warnings || []) as unknown[];
    this.data.warnings = [...currentWarnings, warning] as WarningData[];
    return this;
  }

  withPassed(passed: boolean): this {
    this.data.passed = passed;
    return this;
  }

  withSuccessStatus(): this {
    return this.withPassed(true);
  }

  withFailureStatus(): this {
    return this.withPassed(false);
  }

  build(): TrechoSummary {
    return this.data as TrechoSummary;
  }
}
