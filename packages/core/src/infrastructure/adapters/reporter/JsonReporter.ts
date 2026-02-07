/**
 * JsonReporter - Aggregates battle results and generates report.json
 *
 * Implements IReporter port interface.
 * Follows ADR-011 (JSON Output), ADR-012 (Aggregation), ADR-013 (Warnings).
 *
 * @see docs/adrs/REPORTER/ADR-011-json-file-based-report-output-format.md
 * @see docs/adrs/REPORTER/ADR-012-statistical-aggregation-metrics.md
 * @see docs/adrs/REPORTER/ADR-013-typed-warning-system-with-severity-levels.md
 */

import { injectable } from 'tsyringe';
import * as fs from 'fs';
import * as path from 'path';
import type { IReporter, Warning } from '@coreto/core';
import {
  Report,
  type ReportMetadata,
  type TrechoAggregates,
  type ReportSummary,
  type TrechoSummary,
} from '@coreto/core';
import type { BattleResult } from '@coreto/core';
import { ReportSchema } from '../../schemas/report.schema.js';
import { FileSystemError } from '@coreto/core';

/**
 * Internal structure for collecting battle results per trecho.
 */
interface TrechoData {
  trechoId: string;
  results: BattleResult[];
  warnings: Warning[];
}

/**
 * JsonReporter implementation.
 *
 * Responsibilities:
 * - Collect battle results per trecho (addBattleResult)
 * - Collect warnings (addWarning)
 * - Calculate statistical aggregates (avg, p95) per trecho
 * - Generate complete Report entity (generateReport)
 * - Serialize report to JSON file (writeReport)
 * - Export context-optimized data for AI (exportContext)
 *
 * Aggregation metrics (ADR-012):
 * - avgTtkTurns: Average TTK in turns
 * - p95TtkTurns: 95th percentile TTK in turns (worst-case scenarios)
 * - avgTtkActions: Average TTK in actions
 * - p95TtkActions: 95th percentile TTK in actions
 *
 * @example
 * ```typescript
 * const reporter = new JsonReporter();
 *
 * // Collect results
 * reporter.addBattleResult('ato1-nivel1-10', battleResult1);
 * reporter.addBattleResult('ato1-nivel1-10', battleResult2);
 * reporter.addWarning({
 *   type: 'ttk_out_of_tolerance',
 *   severity: 'warning',
 *   message: 'TTK fora da tolerância',
 *   context: { troopId: 1 }
 * });
 *
 * // Generate report
 * const report = reporter.generateReport({
 *   timestamp: new Date().toISOString(),
 *   seed: 12345,
 *   projectPath: '/path/to/project'
 * });
 *
 * // Write to file
 * await reporter.writeReport(report, '/path/to/report.json');
 * ```
 */
@injectable()
export class JsonReporter implements IReporter {
  /**
   * Map of trecho ID to collected battle results and warnings.
   */
  private trechoData: Map<string, TrechoData> = new Map();

  /**
   * Global warnings not tied to specific trecho.
   */
  private globalWarnings: Warning[] = [];

  /**
   * Add a validation warning to the report.
   * Warnings are collected for later inclusion in report (ADR-013).
   *
   * @param warning - Structured warning object
   */
  addWarning(warning: Warning): void {
    // If warning has trechoId in context, associate with trecho
    if (warning.context.trechoId && typeof warning.context.trechoId === 'string') {
      const trechoId = warning.context.trechoId;
      const data = this.getTrechoData(trechoId);
      data.warnings.push(warning);
    } else {
      // Otherwise, add to global warnings
      this.globalWarnings.push(warning);
    }
  }

  /**
   * Add a battle result to a trecho summary.
   * Results are aggregated per trecho for report generation.
   *
   * @param trechoId - Trecho identifier (matches Trecho.id)
   * @param result - Battle result to add to trecho summary
   */
  addBattleResult(trechoId: string, result: BattleResult): void {
    const data = this.getTrechoData(trechoId);
    data.results.push(result);
  }

  /**
   * Generate complete report from collected results and warnings.
   * Implements aggregation logic (ADR-012) for TTK metrics.
   *
   * @param metadata - Report metadata (version, generatedAt, seed, projectPath)
   * @returns Complete Report domain entity with all summaries and warnings
   */
  generateReport(metadata: ReportMetadata): Report {
    const trechoSummaries: TrechoSummary[] = [];

    // Generate trecho summaries with aggregates
    for (const [trechoId, data] of this.trechoData.entries()) {
      const aggregates = this.calculateAggregates(data.results);

      // Determine if trecho passed (placeholder logic for MVP)
      // In full implementation, this would check against tolerance thresholds
      const passed = data.warnings.filter((w) => w.severity === 'critical').length === 0;

      trechoSummaries.push({
        trechoId,
        trechoName: trechoId, // TODO: Get actual name from config
        battles: data.results,
        aggregates,
        warnings: data.warnings,
        passed,
      });
    }

    // Calculate summary
    const summary = this.calculateSummary(trechoSummaries);

    // Construct Report domain entity
    const report = new Report({
      metadata,
      summary,
      trechos: trechoSummaries,
      warnings: this.globalWarnings,
    });

    return report;
  }

  /**
   * Write report to JSON file.
   * Follows JSON output format specification (ADR-011).
   *
   * @param report - Report entity to serialize
   * @param outputPath - Absolute file path for output JSON
   * @throws {FileSystemError} If write fails
   */
  async writeReport(report: Report, outputPath: string): Promise<void> {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Convert Report domain entity to schema format for validation and serialization
      const reportSchema = this.convertReportToSchema(report);

      // Validate against schema (throws ZodError if invalid)
      ReportSchema.parse(reportSchema);

      // Serialize report with pretty formatting
      const json = JSON.stringify(reportSchema, null, 2);

      // Write to file synchronously (simpler error handling)
      fs.writeFileSync(outputPath, json, 'utf-8');
    } catch (error) {
      throw new FileSystemError(
        `Failed to write report to ${outputPath}: ${error instanceof Error ? error.message : String(error)}`,
        { outputPath, error }
      );
    }
  }

  /**
   * Convert Report domain entity to schema format for serialization.
   *
   * @param report - Report domain entity
   * @returns Report in schema format
   */
  private convertReportToSchema(report: Report): import('../../schemas/report.schema.js').Report {
    return {
      timestamp: report.metadata.generatedAt.toISOString(),
      seed: report.metadata.seed,
      projectPath: report.metadata.projectPath,
      summary: report.summary,
      trechos: report.trechos.map((t) => ({
        trechoId: t.trechoId,
        results: t.battles.map((b) => ({
          trechoId: t.trechoId,
          troopId: b.troopId,
          troopName: b.troopName,
          seed: b.seed,
          ttkTurns: b.ttkTurns,
          ttkActions: b.ttkActions,
          victory: b.outcome === 'victory',
          expGained: b.expGained,
          turns: [], // MVP doesn't track turn-level detail
        })),
        aggregates: t.aggregates,
        warnings: t.warnings.map((w) => ({
          type: w.type,
          severity: w.severity,
          message: w.message,
          context: w.context,
        })),
      })),
    };
  }

  /**
   * Export context-optimized data for AI analysis (ADR-024).
   * Splits large reports into smaller JSON files for LLM context limits.
   *
   * This is a placeholder implementation for MVP.
   * Full implementation will be in future task.
   *
   * @param report - Report to export
   * @param outputDir - Directory for split JSON files
   */
  async exportContext(report: Report, outputDir: string): Promise<void> {
    // Placeholder: Write summary.json and trechos.json separately
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Export summary
      const summaryPath = path.join(outputDir, 'summary.json');
      fs.writeFileSync(
        summaryPath,
        JSON.stringify(
          {
            timestamp: report.metadata.generatedAt.toISOString(),
            seed: report.metadata.seed,
            projectPath: report.metadata.projectPath,
            summary: report.summary,
          },
          null,
          2
        ),
        'utf-8'
      );

      // Export each trecho separately
      for (const trecho of report.trechos) {
        const trechoPath = path.join(outputDir, `trecho-${trecho.trechoId}.json`);
        fs.writeFileSync(trechoPath, JSON.stringify(trecho, null, 2), 'utf-8');
      }
    } catch (error) {
      throw new FileSystemError(
        `Failed to export context to ${outputDir}: ${error instanceof Error ? error.message : String(error)}`,
        { outputDir, error }
      );
    }
  }

  /**
   * Get or create TrechoData for a given trecho ID.
   *
   * @param trechoId - Trecho identifier
   * @returns TrechoData for the trecho
   */
  private getTrechoData(trechoId: string): TrechoData {
    let data = this.trechoData.get(trechoId);
    if (!data) {
      data = {
        trechoId,
        results: [],
        warnings: [],
      };
      this.trechoData.set(trechoId, data);
    }
    return data;
  }

  /**
   * Calculate statistical aggregates for a trecho's battle results.
   * Implements ADR-012 aggregation metrics.
   *
   * @param results - Battle results for a trecho
   * @returns Aggregated metrics (avg, p95)
   */
  private calculateAggregates(results: BattleResult[]): TrechoAggregates {
    if (results.length === 0) {
      return {
        avgTtkTurns: 0,
        p95TtkTurns: 0,
        avgTtkActions: 0,
        p95TtkActions: 0,
      };
    }

    const ttkTurns = results.map((r) => r.ttkTurns);
    const ttkActions = results.map((r) => r.ttkActions);

    return {
      avgTtkTurns: this.calculateAverage(ttkTurns),
      p95TtkTurns: this.calculatePercentile(ttkTurns, 95),
      avgTtkActions: this.calculateAverage(ttkActions),
      p95TtkActions: this.calculatePercentile(ttkActions, 95),
    };
  }

  /**
   * Calculate average of numbers.
   *
   * @param values - Array of numbers
   * @returns Average value
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Calculate percentile of numbers.
   * Uses linear interpolation method.
   *
   * @param values - Array of numbers
   * @param percentile - Percentile to calculate (0-100)
   * @returns Percentile value
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) {
      return 0;
    }
    if (values.length === 1) {
      const single = values[0];
      return single !== undefined ? single : 0;
    }

    // Sort values in ascending order
    const sorted = [...values].sort((a, b) => a - b);

    // Calculate index using linear interpolation formula
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    // If index is exact, return that value
    if (lower === upper) {
      const value = sorted[lower];
      return value !== undefined ? value : 0;
    }

    // Otherwise, interpolate between lower and upper
    const lowerValue = sorted[lower] ?? 0;
    const upperValue = sorted[upper] ?? 0;
    const fraction = index - lower;
    return lowerValue + fraction * (upperValue - lowerValue);
  }

  /**
   * Calculate report summary from trecho summaries.
   * Aggregates metrics across all trechos.
   *
   * @param trechos - Array of trecho summaries
   * @returns Report summary
   */
  private calculateSummary(trechos: TrechoSummary[]): ReportSummary {
    const totalBattles = trechos.reduce((sum, t) => sum + t.battles.length, 0);
    const totalWarnings = trechos.reduce((sum, t) => sum + t.warnings.length, 0);

    // Count warnings by type
    const warningsByType: Record<string, number> = {};
    for (const trecho of trechos) {
      for (const warning of trecho.warnings) {
        warningsByType[warning.type] = (warningsByType[warning.type] || 0) + 1;
      }
    }

    // Count battles without critical warnings
    let successfulBattles = 0;
    for (const trecho of trechos) {
      const criticalWarnings = trecho.warnings.filter((w) => w.severity === 'critical');
      if (criticalWarnings.length === 0) {
        successfulBattles += trecho.battles.length;
      }
    }

    const successRate = totalBattles > 0 ? successfulBattles / totalBattles : 0;

    // Get peak memory (if available)
    const memoryUsage = process.memoryUsage();
    const peakMemoryMB = memoryUsage.heapUsed / (1024 * 1024);

    return {
      executionTimeMs: 0, // Will be set by orchestrator
      totalTrechos: trechos.length,
      totalBattles,
      totalWarnings,
      warningsByType,
      successRate,
      peakMemoryMB,
    };
  }
}
