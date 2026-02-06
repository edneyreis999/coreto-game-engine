/**
 * export-context Command - Export AI context from TTK validation report
 *
 * Splits large report JSONs into smaller files for AI context limits.
 * Implements ADR-007 (Oclif CLI Framework), ADR-024 (Synchronous File Write)
 *
 * @see docs/adrs/CLI/ADR-007-oclif-cli-framework.md
 * @see docs/adrs/Filesystem/ADR-024-synchronous-file-write.md
 */

import { Command, Flags } from '@oclif/core';
import * as fs from 'fs';
import {
  registerDependencies,
  resolve,
  IConfigLoaderToken,
  IReporterToken,
  type IConfigLoader,
  type IReporter,
  ConfigError,
  ValidationError,
  FileSystemError,
} from '@coreto/core';
import type { Report } from '@coreto/core';

/**
 * ExportContext Command - Export AI context from TTK validation report
 *
 * Features:
 * - Load and validate report JSON files
 * - Split large reports into smaller context-optimized files
 * - Flag-based configuration (--config, --report, --output)
 * - Exit codes: 0 (success), 1 (validation), 2 (filesystem), 3 (runtime)
 * - Graceful shutdown on SIGINT/SIGTERM
 *
 * Usage:
 *   coreto-engine export-context --config project.config.json --report report-12345.json
 *   coreto-engine export-context -c project.config.json -r report-12345.json -o ./ai-context
 */
export default class ExportContext extends Command {
  static description = 'Export AI context from TTK validation report (splits large JSONs for LLM context limits)';

  static examples = [
    '<%= config.bin %> <%= command.id %> --config project.config.json --report report-12345.json',
    '<%= config.bin %> <%= command.id %> -c project.config.json -r report-12345.json -o ./ai-context',
    '<%= config.bin %> <%= command.id %> -c project.config.json -r report-12345.json --verbose',
  ];

  static flags = {
    config: Flags.string({
      char: 'c',
      description: 'Path to project.config.json',
      required: true,
    }),
    report: Flags.string({
      char: 'r',
      description: 'Path to report JSON file (output from run-ttk command)',
      required: true,
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output directory for split context files',
      required: false,
      default: './ai-context',
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Enable verbose output',
      default: false,
    }),
  };

  /**
   * Flag to track if graceful shutdown has been initiated.
   */
  private shutdownInitiated = false;

  /**
   * Main command execution logic.
   */
  async run(): Promise<void> {
    const { flags } = await this.parse(ExportContext);

    try {
      // Register dependencies in DI container
      registerDependencies();

      // Setup graceful shutdown handlers
      this.setupGracefulShutdown();

      // Execute export pipeline
      await this.executePipeline(flags);

      // Success
      this.log('');
      this.log('✅ AI context export completed successfully');
      this.exit(0);
    } catch (error) {
      // Oclif exit(0) throws an error, ignore it
      if (error instanceof Error && error.message === 'EEXIT: 0') {
        return;
      }
      await this.handleError(error);
    }
  }

  /**
   * Execute the AI context export pipeline.
   *
   * Pipeline stages:
   * 1. Load and validate configuration
   * 2. Load report JSON file
   * 3. Export context-optimized files
   *
   * @param flags - Command-line flags
   */
  private async executePipeline(flags: {
    config: string;
    report: string;
    output: string;
    verbose: boolean;
  }): Promise<void> {
    // Resolve dependencies from DI container
    const configLoader = resolve<IConfigLoader>(IConfigLoaderToken);
    const reporter = resolve<IReporter>(IReporterToken);

    // Stage 1: Load configuration
    if (flags.verbose) {
      this.log('📂 Loading configuration...');
    }
    const config = await configLoader.loadConfig(flags.config);

    if (flags.verbose) {
      this.log(`   Project path: ${config.projectPath}`);
      this.log(`   Report output path: ${config.reportOutputPath}`);
    }

    // Stage 2: Load report JSON file
    this.log('📋 Loading report...');
    const report = await this.loadReportFile(flags.report);

    if (flags.verbose) {
      this.log(`   Report version: ${report.metadata?.version || 'unknown'}`);
      this.log(`   Total trechos: ${report.summary?.totalTrechos || 0}`);
      this.log(`   Total battles: ${report.summary?.totalBattles || 0}`);
    }

    // Validate report structure
    this.validateReport(report);

    // Stage 3: Export context-optimized files
    this.log(`📤 Exporting AI context to: ${flags.output}`);
    await reporter.exportContext(report, flags.output);

    this.log(`   ✓ Context files exported to ${flags.output}`);
  }

  /**
   * Load report JSON file from disk.
   *
   * @param reportPath - Path to report JSON file
   * @returns Parsed Report object
   * @throws {FileSystemError} If file cannot be read
   * @throws {ValidationError} If JSON parsing fails
   */
  private async loadReportFile(reportPath: string): Promise<Report> {
    try {
      const fileContent = fs.readFileSync(reportPath, 'utf-8');
      const report = JSON.parse(fileContent) as Report;
      return report;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ValidationError(`Invalid JSON in report file: ${reportPath}`, {
          reportPath,
          parseError: error.message,
        });
      }
      throw new FileSystemError(`Failed to read report file: ${reportPath}`, {
        reportPath,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Validate report structure.
   *
   * @param report - Report object to validate
   * @throws {ValidationError} If report structure is invalid
   */
  private validateReport(report: Report): void {
    if (!report.metadata) {
      throw new ValidationError('Report missing required metadata field', {
        receivedReport: report,
      });
    }

    if (!report.summary) {
      throw new ValidationError('Report missing required summary field', {
        receivedReport: report,
      });
    }

    if (!Array.isArray(report.trechos)) {
      throw new ValidationError('Report trechos field must be an array', {
        receivedReport: report,
      });
    }

    if (!Array.isArray(report.warnings)) {
      throw new ValidationError('Report warnings field must be an array', {
        receivedReport: report,
      });
    }
  }

  /**
   * Handle errors with appropriate exit codes and logging.
   *
   * Exit codes:
   * - 0: Success
   * - 1: Validation or configuration error
   * - 2: Filesystem error
   * - 3: Runtime error (default)
   * - 130: SIGINT (Ctrl+C)
   * - 143: SIGTERM
   *
   * @param error - Error object to handle
   */
  private async handleError(error: unknown): Promise<void> {
    if (this.shutdownInitiated) {
      // Don't process errors during shutdown
      return;
    }

    // Log full stack trace for debugging
    if (error instanceof Error) {
      console.error('[ERROR] Full stack trace:', error.stack);
    } else {
      console.error('[ERROR] Unknown error:', error);
    }

    const exitCode = this.getExitCode(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    this.error(errorMessage, { exit: exitCode });
  }

  /**
   * Determine exit code based on error type.
   *
   * @param error - Error object
   * @returns Exit code (1-3)
   */
  private getExitCode(error: unknown): number {
    if (error instanceof ValidationError) {
      return 1;
    }
    if (error instanceof ConfigError) {
      return 1;
    }
    if (error instanceof FileSystemError) {
      return 2;
    }

    // Check error name for Node.js filesystem errors
    if (error instanceof Error) {
      if (error.name.includes('ENOENT')) {
        return 2;
      }
      if (error.name.includes('EACCES')) {
        return 2;
      }
      if (error.name.includes('EPERM')) {
        return 2;
      }
    }

    return 3; // Runtime error (default)
  }

  /**
   * Setup graceful shutdown handlers for SIGINT and SIGTERM.
   *
   * Ensures clean exit when user presses Ctrl+C or process is terminated.
   * Standard exit codes:
   * - 130: SIGINT (128 + 2)
   * - 143: SIGTERM (128 + 15)
   */
  private setupGracefulShutdown(): void {
    process.on('SIGINT', () => {
      if (this.shutdownInitiated) {
        return;
      }

      this.shutdownInitiated = true;
      this.log('');
      this.log('⚠️  Received SIGINT, shutting down gracefully...');
      this.exit(130); // Standard SIGINT exit code
    });

    process.on('SIGTERM', () => {
      if (this.shutdownInitiated) {
        return;
      }

      this.shutdownInitiated = true;
      this.log('');
      this.log('⚠️  Received SIGTERM, shutting down gracefully...');
      this.exit(143); // Standard SIGTERM exit code
    });
  }
}
