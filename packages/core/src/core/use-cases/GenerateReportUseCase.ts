import { IReporter, Warning } from '../ports/IReporter.js';
import { Report, ReportMetadata, TrechoSummary } from '../domain/Report.js';
import { TrechoValidationResult } from './ValidateTrechoUseCase.js';

/**
 * Input data for GenerateReportUseCase.
 * Contains all components needed to generate a complete report.
 */
export interface GenerateReportInput {
  /** Report metadata (version, timestamp, seed, project path) */
  readonly metadata: ReportMetadata;
  /** Trecho validation results with aggregated metrics */
  readonly trechoResults: TrechoValidationResult[];
  /** Validation warnings collected during simulation (ADR-013) */
  readonly warnings: Warning[];
  /** Optional peak memory usage in MB */
  readonly peakMemoryMB?: number;
}

/**
 * Calculates the 95th percentile of an array of numeric values.
 *
 * @param values - Array of numeric values to calculate percentile for
 * @returns The 95th percentile value, or 0 for empty arrays
 */
function calculateP95(values: number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0]!;

  // Sort values in ascending order
  const sorted = [...values].sort((a, b) => a - b);

  // Calculate p95 index (ensure it's within bounds)
  const index = Math.min(Math.ceil(values.length * 0.95) - 1, values.length - 1);

  return sorted[Math.max(0, index)]!;
}

/**
 * Use Case: Generate Report
 *
 * Generates a complete TTK validation report from trecho results and warnings.
 * Implements the business logic for report aggregation (ADR-012):
 * - Converts validation results into report format
 * - Aggregates warnings from all simulations
 * - Creates immutable Report domain entity
 * - Delegates persistence to IReporter port
 *
 * Separation of concerns:
 * - execute() → Creates Report entity (pure domain logic)
 * - writeReport() → Delegates persistence to infrastructure (IReporter)
 *
 * This separation enables:
 * - Testing report generation without file I/O
 * - Reusing Report entity in multiple contexts (API, CLI, etc.)
 * - Swapping storage implementations (JSON, database, etc.)
 *
 * Follows Clean Architecture principles:
 * - Domain logic isolated from infrastructure
 * - Uses port abstraction for persistence
 * - Testable with mocked reporter
 *
 * @example
 * ```typescript
 * const useCase = new GenerateReportUseCase(reporter);
 *
 * // Generate report entity
 * const report = useCase.execute({
 *   metadata: {
 *     version: '1.0.0',
 *     generatedAt: new Date(),
 *     seed: 12345,
 *     projectPath: '/path/to/project'
 *   },
 *   trechoResults: [validation1, validation2],
 *   warnings: [warning1, warning2]
 * });
 *
 * // Persist report to file
 * await useCase.writeReport(report, '/path/to/report.json');
 * ```
 */
export class GenerateReportUseCase {
  constructor(private readonly reporter: IReporter) {}

  /**
   * Generate a Report entity from validation results and warnings.
   *
   * Converts TrechoValidationResult into TrechoSummary format suitable for
   * report serialization. Does NOT perform I/O - creates domain entity only.
   *
   * @param input - Report input with metadata, trecho results, and warnings
   * @returns Immutable Report domain entity
   */
  execute(input: GenerateReportInput): Report {
    // Convert TrechoValidationResult to TrechoSummary
    const trechos: TrechoSummary[] = input.trechoResults.map((result) => {
      // Calculate p95 percentiles from battle results
      const ttkTurns = result.battles.map((b) => b.ttkTurns);
      const ttkActions = result.battles.map((b) => b.ttkActions);

      return {
        trechoId: result.trechoId,
        trechoName: result.trechoName,
        battles: result.battles,
        aggregates: {
          avgTtkTurns: result.avgTtkTurns,
          p95TtkTurns: calculateP95(ttkTurns),
          avgTtkActions: result.avgTtkActions,
          p95TtkActions: calculateP95(ttkActions),
        },
        warnings: [], // Warnings are now collected at trecho level by reporter
        passed: result.passed,
      };
    });

    // Calculate summary
    const totalBattles = trechos.reduce((sum, t) => sum + t.battles.length, 0);
    const totalWarnings = input.warnings.length;
    const warningsByType: Record<string, number> = {};
    for (const warning of input.warnings) {
      warningsByType[warning.type] = (warningsByType[warning.type] || 0) + 1;
    }
    const successRate =
      totalBattles > 0 ? trechos.filter((t) => t.passed).length / trechos.length : 0;

    return new Report({
      metadata: input.metadata,
      summary: {
        executionTimeMs: 0, // Set by orchestrator
        totalTrechos: trechos.length,
        totalBattles,
        totalWarnings,
        warningsByType,
        successRate,
        peakMemoryMB: input.peakMemoryMB ?? 0,
      },
      trechos,
      warnings: input.warnings,
    });
  }

  /**
   * Write report to JSON file.
   *
   * Delegates persistence to IReporter port (infrastructure layer).
   * Follows ADR-011 (JSON output format specification).
   *
   * @param report - Report entity to serialize
   * @param outputPath - Absolute file path for output JSON
   * @throws {FileSystemError} If write fails
   */
  async writeReport(report: Report, outputPath: string): Promise<void> {
    await this.reporter.writeReport(report, outputPath);
  }
}
