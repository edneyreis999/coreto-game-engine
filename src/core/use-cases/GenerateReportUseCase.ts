import { inject, injectable } from 'tsyringe';
import { IReporter, Warning } from '../ports/IReporter.js';
import { Report, ReportMetadata, TrechoSummary } from '../domain/Report.js';
import { TrechoValidationResult } from './ValidateTrechoUseCase.js';
import { IReporterToken } from '../../infrastructure/di/tokens.js';

/**
 * Input data for GenerateReportUseCase.
 * Contains all components needed to generate a complete report.
 */
export interface GenerateReportInput {
  /** Report metadata (version, timestamp, seed, project path) */
  metadata: ReportMetadata;
  /** Trecho validation results with aggregated metrics */
  trechoResults: TrechoValidationResult[];
  /** Validation warnings collected during simulation (ADR-013) */
  warnings: Warning[];
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
@injectable()
export class GenerateReportUseCase {
  constructor(@inject(IReporterToken) private readonly reporter: IReporter) {}

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
    const trechos: TrechoSummary[] = input.trechoResults.map((result) => ({
      trechoId: result.trechoId,
      trechoName: result.trechoName,
      battles: result.battles,
      avgTtkTurns: result.avgTtkTurns,
      avgTtkActions: result.avgTtkActions,
      passed: result.passed,
    }));

    return new Report({
      metadata: input.metadata,
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
