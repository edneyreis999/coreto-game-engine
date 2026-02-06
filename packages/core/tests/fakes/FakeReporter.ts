import type { IReporter, Warning } from '@coreto/core/core/ports/IReporter.js';
import type { Report, ReportMetadata, ReportSummary } from '@coreto/core/core/domain/Report.js';
import type { WarningData } from '@coreto/core/core/domain/Warning.js';
import { BattleResult } from '@coreto/core/core/domain/BattleResult.js';

/**
 * In-memory fake implementation of IReporter for testing.
 *
 * Tracks all calls for verification without writing to filesystem.
 * Stores warnings and battle results for inspection in tests.
 *
 * @example
 * ```typescript
 * const reporter = new FakeReporter();
 *
 * const warning: Warning = {
 *   type: 'tkk_exceeded',
 *   severity: 'high',
 *   message: 'TTK exceeded target',
 *   context: { trechoId: 'ato1-nivel1-10' }
 * };
 * reporter.addWarning(warning);
 *
 * const result = new BattleResultFakeBuilder().build();
 * reporter.addBattleResult('ato1-nivel1-10', result);
 *
 * expect(reporter.warnings).toHaveLength(1);
 * expect(reporter.battleResults.get('ato1-nivel1-10')).toContain(result);
 * ```
 */
export class FakeReporter implements IReporter {
  /** Track all warnings added */
  public warnings: Warning[] = [];

  /** Track battle results per trecho */
  public battleResults = new Map<string, BattleResult[]>();

  /** Track writeReport calls for verification */
  public writeReportCalls: Array<{ report: Report; path: string }> = [];

  /** Track exportContext calls for verification */
  public exportContextCalls: Array<{ report: Report; dir: string }> = [];

  /**
   * Optional Report constructor override for testing.
   * Allows injecting a mock Report class if needed.
   */
  private ReportConstructor: new (data: {
    metadata: ReportMetadata;
    summary: ReportSummary;
    trechos: unknown[];
    warnings: WarningData[];
  }) => Report;

  constructor(
    ReportConstructor?: new (data: {
      metadata: ReportMetadata;
      summary: ReportSummary;
      trechos: unknown[];
      warnings: WarningData[];
    }) => Report
  ) {
    if (ReportConstructor) {
      this.ReportConstructor = ReportConstructor;
    } else {
      // Dynamic import to avoid circular dependency
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Report: ReportClass } = require('@coreto/core/core/domain/Report.js');
      this.ReportConstructor = ReportClass;
    }
  }

  addWarning(warning: Warning): void {
    this.warnings.push(warning);
  }

  addBattleResult(trechoId: string, result: BattleResult): void {
    const existing = this.battleResults.get(trechoId) ?? [];
    existing.push(result);
    this.battleResults.set(trechoId, existing);
  }

  generateReport(metadata: ReportMetadata): Report {
    // Delegates to domain: create Report with collected data
    const totalBattles = Array.from(this.battleResults.values()).reduce(
      (sum, battles) => sum + battles.length,
      0
    );

    const summary: ReportSummary = {
      executionTimeMs: 0,
      totalTrechos: this.battleResults.size,
      totalBattles,
      totalWarnings: this.warnings.length,
      warningsByType: {},
      successRate: totalBattles > 0 ? 1.0 : 0,
      peakMemoryMB: 0,
    };

    return new this.ReportConstructor({
      metadata,
      summary,
      trechos: [],
      warnings: [],
    });
  }

  async writeReport(report: Report, outputPath: string): Promise<void> {
    this.writeReportCalls.push({ report, path: outputPath });
  }

  async exportContext(report: Report, outputDir: string): Promise<void> {
    this.exportContextCalls.push({ report, dir: outputDir });
  }
}
