import { FakeBuilder } from './FakeBuilder.js';
import type { TrechoValidationResult } from '@coreto/core/core/use-cases/ValidateTrechoUseCase.js';
import { BattleResult } from '@coreto/core/core/domain/BattleResult.js';
import { BattleResultFakeBuilder } from './BattleResultFakeBuilder.js';
import { TEST_CONSTANTS, TEST_TRECHO_IDS, TEST_TRECHO_NAMES } from '../fixtures/test-constants.js';

/**
 * Builder for creating TrechoValidationResult instances in tests.
 *
 * Provides sensible defaults and fluent interface for customization.
 *
 * @example
 * ```typescript
 * const result = new TrechoValidationResultFakeBuilder()
 *   .withTrechoId('ato1-nivel1-10')
 *   .withTrechoName('Ato 1 - Níveis 1-10')
 *   .withPassed(true)
 *   .withAvgTtk(3, 8)
 *   .build();
 * ```
 */
export class TrechoValidationResultFakeBuilder extends FakeBuilder<TrechoValidationResult> {
  private trechoId: string = TEST_TRECHO_IDS.ATO1_NIVEL1_10;
  private trechoName: string = TEST_TRECHO_NAMES.ATO1_NIVEL1_10;
  private passed: boolean = true;
  private avgTtkTurns: number = TEST_CONSTANTS.DEFAULT_TTK_TURNS;
  private avgTtkActions: number = TEST_CONSTANTS.DEFAULT_TTK_ACTIONS;
  private battles: BattleResult[] = [new BattleResultFakeBuilder().build()];
  private failedBattles: BattleResult[] = [];

  withTrechoId(id: string): this {
    this.trechoId = id;
    return this;
  }

  withTrechoName(name: string): this {
    this.trechoName = name;
    return this;
  }

  withPassed(passed: boolean): this {
    this.passed = passed;
    return this;
  }

  withAvgTtk(turns: number, actions: number): this {
    this.avgTtkTurns = turns;
    this.avgTtkActions = actions;
    return this;
  }

  withBattles(battles: BattleResult[]): this {
    this.battles = battles;
    return this;
  }

  withFailedBattles(battles: BattleResult[]): this {
    this.failedBattles = battles;
    return this;
  }

  withFailed(): this {
    this.passed = false;
    this.failedBattles = [new BattleResultFakeBuilder().withDefeat().build()];
    return this;
  }

  build(): TrechoValidationResult {
    return {
      trechoId: this.trechoId,
      trechoName: this.trechoName,
      passed: this.passed,
      avgTtkTurns: this.avgTtkTurns,
      avgTtkActions: this.avgTtkActions,
      battles: this.battles,
      failedBattles: this.failedBattles,
    };
  }

  withInvalidData(): this {
    this.passed = false;
    this.battles = [];
    this.avgTtkTurns = 0;
    this.avgTtkActions = 0;
    return this;
  }
}
