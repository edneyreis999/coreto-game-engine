import { FakeBuilder } from './FakeBuilder.js';
import { Report, ReportData, ReportMetadata, ReportSummary, TrechoSummary, TrechoAggregates, BattleResult, Warning } from '@coreto/core';
import { BattleResultFakeBuilder } from './BattleResultFakeBuilder.js';

/**
 * Builder for creating Report instances in tests.
 * Provides sensible defaults and fluent interface for customization.
 *
 * @example
 * ```typescript
 * const report = new ReportFakeBuilder()
 *   .withTrechoSummary('ato1-nivel1-10', 'Ato 1', true)
 *   .build();
 *
 * const failed = new ReportFakeBuilder()
 *   .withFailedTrecho()
 *   .build();
 * ```
 */
export class ReportFakeBuilder extends FakeBuilder<Report> {
  private metadata: ReportMetadata = {
    version: '1.0.0',
    generatedAt: new Date('2024-01-01T00:00:00Z'),
    seed: 12345,
    projectPath: '/test/project',
  };

  private summary: ReportSummary = {
    executionTimeMs: 1000,
    totalTrechos: 1,
    totalBattles: 3,
    totalWarnings: 0,
    warningsByType: {},
    successRate: 1.0,
    peakMemoryMB: 100,
  };

  private trechos: TrechoSummary[] = [];
  private warnings: Warning[] = [];

  /**
   * Set the report metadata.
   *
   * @param metadata - Report metadata
   * @returns This builder for chaining
   */
  withMetadata(metadata: ReportMetadata): this {
    this.metadata = { ...metadata };
    return this;
  }

  /**
   * Set the report version.
   *
   * @param version - Version string
   * @returns This builder for chaining
   */
  withVersion(version: string): this {
    this.metadata.version = version;
    return this;
  }

  /**
   * Set the generated timestamp.
   *
   * @param date - Generation timestamp
   * @returns This builder for chaining
   */
  withGeneratedAt(date: Date): this {
    this.metadata.generatedAt = date;
    return this;
  }

  /**
   * Set the RNG seed.
   *
   * @param seed - RNG seed value
   * @returns This builder for chaining
   */
  withSeed(seed: number): this {
    this.metadata.seed = seed;
    return this;
  }

  /**
   * Set the project path.
   *
   * @param path - Project path
   * @returns This builder for chaining
   */
  withProjectPath(path: string): this {
    this.metadata.projectPath = path;
    return this;
  }

  /**
   * Set the report summary.
   *
   * @param summary - Report summary
   * @returns This builder for chaining
   */
  withSummary(summary: ReportSummary): this {
    this.summary = { ...summary };
    return this;
  }

  /**
   * Set execution time.
   *
   * @param timeMs - Execution time in milliseconds
   * @returns This builder for chaining
   */
  withExecutionTime(timeMs: number): this {
    this.summary.executionTimeMs = timeMs;
    return this;
  }

  /**
   * Set total trechos count.
   *
   * @param count - Total trechos
   * @returns This builder for chaining
   */
  withTotalTrechos(count: number): this {
    this.summary.totalTrechos = count;
    return this;
  }

  /**
   * Set total battles count.
   *
   * @param count - Total battles
   * @returns This builder for chaining
   */
  withTotalBattles(count: number): this {
    this.summary.totalBattles = count;
    return this;
  }

  /**
   * Set total warnings count.
   *
   * @param count - Total warnings
   * @returns This builder for chaining
   */
  withTotalWarnings(count: number): this {
    this.summary.totalWarnings = count;
    return this;
  }

  /**
   * Set success rate.
   *
   * @param rate - Success rate (0.0-1.0)
   * @returns This builder for chaining
   */
  withSuccessRate(rate: number): this {
    this.summary.successRate = rate;
    return this;
  }

  /**
   * Add a trecho summary to the report.
   *
   * @param trechoId - Trecho ID
   * @param trechoName - Trecho name
   * @param passed - Validation status
   * @param battles - Battle results (optional, uses default if not provided)
   * @param aggregates - Aggregated metrics (optional, uses default if not provided)
   * @param warnings - Warnings for this trecho (optional)
   * @returns This builder for chaining
   */
  withTrechoSummary(
    trechoId: string,
    trechoName: string,
    passed: boolean,
    battles?: BattleResult[],
    aggregates?: TrechoAggregates,
    warnings?: Warning[],
  ): this {
    const summary: TrechoSummary = {
      trechoId,
      trechoName,
      battles: battles ?? [
        new BattleResultFakeBuilder().build(),
        new BattleResultFakeBuilder().build(),
        new BattleResultFakeBuilder().build(),
      ],
      aggregates: aggregates ?? {
        avgTtkTurns: 3.0,
        p95TtkTurns: 4.0,
        avgTtkActions: 8.0,
        p95TtkActions: 10.0,
      },
      warnings: warnings ?? [],
      passed,
    };
    this.trechos.push(summary);
    return this;
  }

  /**
   * Add a passed trecho summary.
   *
   * @param trechoId - Trecho ID
   * @param trechoName - Trecho name
   * @returns This builder for chaining
   */
  withPassedTrecho(trechoId: string = 'ato1-nivel1-10', trechoName: string = 'Ato 1 - Níveis 1-10'): this {
    return this.withTrechoSummary(trechoId, trechoName, true);
  }

  /**
   * Add a failed trecho summary.
   *
   * @param trechoId - Trecho ID
   * @param trechoName - Trecho name
   * @returns This builder for chaining
   */
  withFailedTrecho(trechoId: string = 'ato1-nivel1-10', trechoName: string = 'Ato 1 - Níveis 1-10'): this {
    return this.withTrechoSummary(trechoId, trechoName, false);
  }

  /**
   * Set all trechos summaries.
   *
   * @param trechos - Array of trecho summaries
   * @returns This builder for chaining
   */
  withTrechos(trechos: TrechoSummary[]): this {
    this.trechos = [...trechos];
    return this;
  }

  /**
   * Set warnings for the report.
   *
   * @param warnings - Array of warnings
   * @returns This builder for chaining
   */
  withWarnings(warnings: Warning[]): this {
    this.warnings = [...warnings];
    return this;
  }

  /**
   * Add a warning to the report.
   *
   * @param warning - Warning to add
   * @returns This builder for chaining
   */
  withWarning(warning: Warning): this {
    this.warnings.push(warning);
    return this;
  }

  /**
   * Clear all trechos (creates report with no trechos).
   *
   * @returns This builder for chaining
   */
  withNoTrechos(): this {
    this.trechos = [];
    return this;
  }

  /**
   * Create a minimal report with default values.
   *
   * @returns This builder for chaining
   */
  withMinimalReport(): this {
    return this.withPassedTrecho();
  }

  /**
   * Create a full report with multiple trechos.
   *
   * @returns This builder for chaining
   */
  withFullReport(): this {
    return this
      .withPassedTrecho('ato1-nivel1-10', 'Ato 1 - Níveis 1-10')
      .withPassedTrecho('ato1-nivel11-20', 'Ato 1 - Níveis 11-20')
      .withPassedTrecho('ato2-nivel21-30', 'Ato 2 - Níveis 21-30')
      .withTotalTrechos(3)
      .withTotalBattles(9);
  }

  /**
   * Build the Report instance.
   *
   * @returns Report instance
   */
  build(): Report {
    const data: ReportData = {
      metadata: { ...this.metadata },
      summary: { ...this.summary },
      trechos: [...this.trechos],
      warnings: [...this.warnings],
    };
    return new Report(data);
  }

  /**
   * Create builder with invalid data.
   * Note: Report doesn't validate, so this creates a minimal report.
   */
  withInvalidData(): this {
    return this.withNoTrechos();
  }
}
