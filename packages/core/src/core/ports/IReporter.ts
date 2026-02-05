import type { Report, ReportMetadata } from '../domain/Report.js';
import type { BattleResult } from '../domain/BattleResult.js';
import type { WarningType, WarningSeverity } from '../domain/Warning.js';

// Re-export domain types for backward compatibility
export type { WarningType, WarningSeverity };

/**
 * Structured warning object for validation failures.
 * Warnings are collected instead of throwing exceptions (ADR-013).
 * This is a plain DTO interface, different from the domain Warning class.
 */
export interface Warning {
  /** Type of warning for categorization */
  type: WarningType;
  /** Severity level indicating impact */
  severity: WarningSeverity;
  /** Human-readable warning message */
  message: string;
  /** Additional context data for debugging */
  context: Record<string, unknown>;
}

/**
 * Reporter port interface.
 * Generates reports from simulation results (ADR-011, ADR-012, ADR-013).
 * Follows warning-based validation approach instead of throwing exceptions.
 */
export interface IReporter {
  /**
   * Add a validation warning to the report.
   * Warnings are collected for later inclusion in report (ADR-013).
   * @param warning - Structured warning object
   */
  addWarning(warning: Warning): void;

  /**
   * Add a battle result to a trecho summary.
   * Results are aggregated per trecho for report generation.
   * @param trechoId - Trecho identifier (matches Trecho.id)
   * @param result - Battle result to add to trecho summary
   */
  addBattleResult(trechoId: string, result: BattleResult): void;

  /**
   * Generate complete report from collected results and warnings.
   * Implements aggregation logic (ADR-012) for TTK metrics.
   * @param metadata - Report metadata (version, seed, timestamps)
   * @returns Complete Report domain entity with all summaries and warnings
   */
  generateReport(metadata: ReportMetadata): Report;

  /**
   * Write report to JSON file.
   * Follows JSON output format specification (ADR-011).
   * @param report - Report entity to serialize
   * @param outputPath - Absolute file path for output JSON
   * @throws {FileSystemError} If write fails
   */
  writeReport(report: Report, outputPath: string): Promise<void>;

  /**
   * Export context-optimized data for AI analysis (ADR-024).
   * Splits large reports into smaller JSON files for LLM context limits.
   * @param report - Report to export
   * @param outputDir - Directory for split JSON files
   */
  exportContext(report: Report, outputDir: string): Promise<void>;
}
