import { BattleResult } from './BattleResult.js';
import type { Warning } from '../ports/IReporter.js';

/**
 * Report metadata.
 * Contains system information and execution context.
 */
export interface ReportMetadata {
  /**
   * Report format version (for backward compatibility).
   */
  version: string;

  /**
   * Timestamp when report was generated.
   */
  generatedAt: Date;

  /**
   * RNG seed used for simulations (for determinism).
   */
  seed: number;

  /**
   * Absolute path to RPG Maker MZ project directory.
   */
  projectPath: string;
}

/**
 * Aggregated metrics for a trecho.
 * Contains statistical aggregates (ADR-012).
 */
export interface TrechoAggregates {
  /**
   * Average TTK in turns across all battles.
   */
  avgTtkTurns: number;

  /**
   * 95th percentile TTK in turns (worst-case scenarios).
   */
  p95TtkTurns: number;

  /**
   * Average TTK in actions across all battles.
   */
  avgTtkActions: number;

  /**
   * 95th percentile TTK in actions (worst-case scenarios).
   */
  p95TtkActions: number;
}

/**
 * Trecho summary in report.
 * Aggregates battle results for a single trecho with validation status.
 */
export interface TrechoSummary {
  /**
   * Trecho unique identifier.
   */
  trechoId: string;

  /**
   * Human-readable trecho name.
   */
  trechoName: string;

  /**
   * Individual battle results for all troops in this trecho.
   */
  battles: BattleResult[];

  /**
   * Aggregated metrics for this trecho.
   */
  aggregates: TrechoAggregates;

  /**
   * Warnings collected for this trecho.
   */
  warnings: Warning[];

  /**
   * Validation status: true if all battles within tolerance.
   */
  passed: boolean;
}

/**
 * Report summary metrics.
 * Contains high-level aggregated statistics across all trechos.
 */
export interface ReportSummary {
  /**
   * Total execution time in milliseconds.
   */
  executionTimeMs: number;

  /**
   * Total number of trechos validated.
   */
  totalTrechos: number;

  /**
   * Total number of battles executed.
   */
  totalBattles: number;

  /**
   * Total number of warnings across all severities.
   */
  totalWarnings: number;

  /**
   * Warning counts grouped by type.
   */
  warningsByType: Record<string, number>;

  /**
   * Success rate (0.0-1.0): percentage of battles without critical warnings.
   */
  successRate: number;

  /**
   * Peak memory usage in megabytes.
   */
  peakMemoryMB: number;
}

/**
 * Report data structure.
 * Contains all data needed to construct a Report entity.
 */
export interface ReportData {
  /**
   * Report metadata.
   */
  metadata: ReportMetadata;

  /**
   * Report summary metrics.
   */
  summary: ReportSummary;

  /**
   * Trecho summaries with battle results.
   */
  trechos: TrechoSummary[];

  /**
   * Validation warnings collected during simulation (ADR-013).
   */
  warnings: Warning[];
}

/**
 * Report entity.
 * Represents the complete output of a TTK validation run.
 *
 * Contains:
 * - Metadata (version, timestamp, seed, project path)
 * - Trecho summaries with aggregated results
 * - Validation warnings
 * - Overall pass/fail status
 *
 * Immutable entity following domain-driven design principles.
 * Frozen to ensure data integrity for JSON serialization.
 *
 * @example
 * ```typescript
 * const report = new Report({
 *   metadata: {
 *     version: '1.0.0',
 *     generatedAt: new Date(),
 *     seed: 12345,
 *     projectPath: '/path/to/project'
 *   },
 *   trechos: [
 *     {
 *       trechoId: 'ato1-nivel1-10',
 *       trechoName: 'Ato 1 - Níveis 1-10',
 *       battles: [...],
 *       avgTtkTurns: 3.2,
 *       avgTtkActions: 8.5,
 *       passed: true
 *     }
 *   ],
 *   warnings: []
 * });
 *
 * console.log(report.overallPassed); // true if all trechos passed
 * ```
 */
export class Report {
  readonly metadata: ReportMetadata;
  readonly summary: ReportSummary;
  readonly trechos: readonly TrechoSummary[];
  readonly warnings: readonly Warning[];
  readonly overallPassed: boolean;

  /**
   * Creates a new Report.
   *
   * @param data - Report data with metadata, trechos, and warnings
   */
  constructor(data: ReportData) {
    // Deep freeze metadata
    this.metadata = Object.freeze({ ...data.metadata });

    // Deep freeze summary
    this.summary = Object.freeze({ ...data.summary });

    // Deep freeze trechos array and each summary
    this.trechos = Object.freeze(data.trechos.map((t) => Object.freeze({ ...t })));

    // Freeze warnings array
    this.warnings = Object.freeze([...data.warnings]);

    // Calculate overall status: passes only if ALL trechos passed
    this.overallPassed = this.trechos.every((t) => t.passed);

    // Freeze entire entity
    Object.freeze(this);
  }
}
