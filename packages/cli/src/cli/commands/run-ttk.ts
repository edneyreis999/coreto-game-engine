/**
 * run-ttk Command - Execute TTK validation pipeline
 *
 * Orchestrates complete pipeline: Config → Loader → Runtime → Simulation → Reporter
 * Implements ADR-007 (Oclif CLI Framework)
 *
 * @see docs/adrs/CLI/ADR-007-oclif-cli-framework.md
 * @see planos/002-implementacao-mvp/FDD-001-mvp-implementation.md Section 4.1
 */

import { Command, Flags } from '@oclif/core';
import * as path from 'path';
import {
  registerDependencies,
  resolve,
  IConfigLoaderToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
  IReporterToken,
  type IConfigLoader,
  type IDataLoader,
  type IBattleSimulator,
  type IReporter,
  ConfigError,
  ValidationError,
  FileSystemError,
  DataLoadError,
} from '@coreto/core';
import { ProgressBarManager, DiagnosticLogger, SummaryFormatter } from '../ui/index.js';

/**
 * RunTtk Command - Main CLI command for TTK validation
 *
 * Features:
 * - Pipeline orchestration with DI container
 * - Flag-based configuration (--config, --seed, --trecho, --verbose, --diagnostic)
 * - Exit codes: 0 (success), 1 (validation), 2 (filesystem), 3 (runtime)
 * - Graceful shutdown on SIGINT/SIGTERM
 *
 * Usage:
 *   coreto-engine run-ttk --config project.config.json
 *   coreto-engine run-ttk -c project.config.json --seed 42
 *   coreto-engine run-ttk -c project.config.json --trecho ato1-nivel1-10
 *   coreto-engine run-ttk -c project.config.json --verbose
 *   coreto-engine run-ttk -c project.config.json --diagnostic
 */
export default class RunTtk extends Command {
  static description = 'Execute TTK validation for configured trechos';

  static examples = [
    '<%= config.bin %> <%= command.id %> --config project.config.json',
    '<%= config.bin %> <%= command.id %> -c project.config.json --seed 42',
    '<%= config.bin %> <%= command.id %> -c project.config.json --trecho ato1-nivel1-10',
    '<%= config.bin %> <%= command.id %> -c project.config.json --verbose',
    '<%= config.bin %> <%= command.id %> -c project.config.json --diagnostic',
  ];

  static flags = {
    config: Flags.string({
      char: 'c',
      description: 'Path to project.config.json',
      required: true,
    }),
    seed: Flags.integer({
      char: 's',
      description: 'RNG seed override (overrides config value)',
      required: false,
    }),
    trecho: Flags.string({
      char: 't',
      description: 'Execute only this trecho ID',
      required: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Enable verbose output with progress details',
      default: false,
    }),
    diagnostic: Flags.boolean({
      char: 'd',
      description: 'Enable diagnostic mode (performance profiling, detailed logging)',
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
    const { flags } = await this.parse(RunTtk);

    try {
      // Register dependencies in DI container
      registerDependencies();

      // Setup graceful shutdown handlers
      this.setupGracefulShutdown();

      // Execute pipeline
      await this.executePipeline(flags);

      // Success
      this.log('');
      this.log('✅ TTK validation completed successfully');
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
   * Execute the complete TTK validation pipeline.
   *
   * Pipeline stages:
   * 1. Load and validate configuration
   * 2. Load RPG Maker MZ database
   * 3. Initialize battle simulator
   * 4. Execute battles for each trecho
   * 5. Generate and save report
   *
   * @param flags - Command-line flags
   */
  private async executePipeline(flags: {
    config: string;
    seed: number | undefined;
    trecho: string | undefined;
    verbose: boolean;
    diagnostic: boolean;
  }): Promise<void> {
    // Initialize UI components
    const progressBar = new ProgressBarManager();
    const diagnosticLogger = new DiagnosticLogger(flags.diagnostic);

    diagnosticLogger.startExecution();

    // Resolve dependencies from DI container
    const configLoader = resolve<IConfigLoader>(IConfigLoaderToken);
    const dataLoader = resolve<IDataLoader>(IDataLoaderToken);
    const battleSimulator = resolve<IBattleSimulator>(IBattleSimulatorToken);
    const reporter = resolve<IReporter>(IReporterToken);

    // Stage 1: Load configuration
    this.log('📂 Loading configuration...');
    diagnosticLogger.startStage('config_load');
    const config = await configLoader.loadConfig(flags.config);
    diagnosticLogger.endStage('config_load');

    diagnosticLogger.log('config', 'Config loaded from path', {
      configPath: flags.config,
      projectPath: config.projectPath,
      reportOutputPath: config.reportOutputPath,
    });

    // Override seed if provided via flag
    const effectiveSeed = flags.seed ?? config.seed ?? 12345;
    if (flags.seed) {
      this.log(`🎲 Using seed override: ${flags.seed}`);
    } else if (config.seed) {
      this.log(`🎲 Using seed from config: ${config.seed}`);
    } else {
      this.log(`🎲 Using default seed: 12345`);
    }

    // Stage 2: Load trechos
    this.log('📋 Loading trecho configurations...');
    diagnosticLogger.startStage('trecho_load');
    const allTrechos = await configLoader.loadTrechos(config);
    diagnosticLogger.endStage('trecho_load');
    this.log(`   Found ${allTrechos.length} trecho(s)`);
    diagnosticLogger.log('trecho', 'Trechos loaded', { count: allTrechos.length });

    // Filter trechos if --trecho flag provided
    const trechosToRun = flags.trecho
      ? allTrechos.filter((t) => t.id === flags.trecho)
      : allTrechos;

    if (trechosToRun.length === 0) {
      throw new ValidationError(`Trecho "${flags.trecho}" not found in configuration`, {
        requestedTrecho: flags.trecho,
        availableTrechos: allTrechos.map((t) => t.id),
      });
    }

    if (flags.trecho) {
      this.log(`   Filtered to trecho: ${flags.trecho}`);
    }

    // Stage 3: Load RPG Maker MZ database
    this.log('⏳ Loading RPG Maker MZ database...');
    diagnosticLogger.startStage('database_load');
    const database = await dataLoader.loadDatabase(config.projectPath);
    diagnosticLogger.endStage('database_load');
    this.log('   ✓ Database loaded');
    diagnosticLogger.log('database', 'Database loaded successfully');

    // Stage 4: Initialize battle simulator
    this.log('⚙️  Initializing battle simulator...');
    diagnosticLogger.startStage('simulator_init');
    await battleSimulator.initialize(database, config.projectPath);
    diagnosticLogger.endStage('simulator_init');
    this.log('   ✓ Simulator ready');
    diagnosticLogger.log('simulator', 'Simulator initialized successfully');

    // Stage 5: Execute battles for each trecho
    this.log('');
    this.log(`⚔️  Executing battles for ${trechosToRun.length} trecho(s)...`);

    // Calculate total battles for progress bar
    const totalBattleCount = trechosToRun.reduce((sum, t) => sum + t.troopIds.length, 0);

    // Start progress bar if verbose mode enabled
    if (flags.verbose && !flags.diagnostic) {
      progressBar.start(totalBattleCount);
    }

    diagnosticLogger.startStage('battle_execution');

    let totalBattles = 0;
    for (const trecho of trechosToRun) {
      if (flags.verbose && flags.diagnostic) {
        this.log(SummaryFormatter.formatTrechoHeader(trecho.id, trecho.troopIds.length));
      } else if (!flags.verbose) {
        this.log(`   Trecho: ${trecho.id}`);
      }

      for (const troopId of trecho.troopIds) {
        const startTime = Date.now();

        const battleSetup =
          config.maxBattleTurns !== undefined
            ? {
                troopId,
                party: trecho.party,
                seed: effectiveSeed,
                maxTurns: config.maxBattleTurns,
              }
            : {
                troopId,
                party: trecho.party,
                seed: effectiveSeed,
              };

        const result = await battleSimulator.executeBattle(battleSetup);

        const duration = Date.now() - startTime;

        // Update progress bar
        if (flags.verbose && !flags.diagnostic) {
          progressBar.increment(trecho.id, troopId);
        }

        // Verbose output (without progress bar)
        if (flags.verbose && flags.diagnostic) {
          this.log(
            SummaryFormatter.formatBattleDetail(
              trecho.id,
              troopId,
              result.ttkTurns,
              result.ttkActions,
              duration
            )
          );
        }

        // Diagnostic logging
        diagnosticLogger.log('battle', `Battle completed: Troop ${troopId}`, {
          troopId,
          trechoId: trecho.id,
          outcome: result.outcome,
          ttkTurns: result.ttkTurns,
          ttkActions: result.ttkActions,
          durationMs: duration,
        });

        reporter.addBattleResult(trecho.id, result);
        totalBattles++;
      }
    }

    // Stop progress bar if active
    if (progressBar.getIsActive()) {
      progressBar.stop();
    }

    diagnosticLogger.endStage('battle_execution');
    this.log(`   ✓ Completed ${totalBattles} battle(s)`);

    // Stage 6: Generate report
    this.log('');
    this.log('📊 Generating report...');
    diagnosticLogger.startStage('report_generation');

    const reportMetadata = {
      version: '1.0.0',
      generatedAt: new Date(),
      seed: effectiveSeed,
      projectPath: config.projectPath,
    };

    const report = reporter.generateReport(reportMetadata);
    diagnosticLogger.endStage('report_generation');

    // Stage 7: Save report
    diagnosticLogger.startStage('report_save');
    const reportFileName = `report-${Date.now()}.json`;
    const reportPath = path.join(config.reportOutputPath, reportFileName);

    await reporter.writeReport(report, reportPath);
    diagnosticLogger.endStage('report_save');

    this.log(`   ✓ Report saved: ${reportPath}`);

    // Display formatted summary
    const summary = SummaryFormatter.format(
      {
        totalBattles: report.summary.totalBattles,
        totalTrechos: report.summary.totalTrechos,
        successRate: report.summary.successRate,
        totalWarnings: report.summary.totalWarnings,
      },
      flags.verbose
    );
    this.log(summary);

    // Print diagnostic summary if enabled
    if (flags.diagnostic) {
      diagnosticLogger.printSummary(totalBattles);
    }

    // Cleanup
    diagnosticLogger.startStage('cleanup');
    await battleSimulator.cleanup();
    diagnosticLogger.endStage('cleanup');
    diagnosticLogger.log('cleanup', 'Cleanup completed successfully');
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
    if (error instanceof ValidationError) return 1;
    if (error instanceof ConfigError) return 1;
    if (error instanceof FileSystemError) return 2;
    if (error instanceof DataLoadError) {
      // DataLoadError can be filesystem or validation
      if (error.message.includes('ENOENT') || error.message.includes('EACCES')) {
        return 2;
      }
      return 1;
    }

    // Check error name for Node.js filesystem errors
    if (error instanceof Error) {
      if (error.name.includes('ENOENT')) return 2;
      if (error.name.includes('EACCES')) return 2;
      if (error.name.includes('EPERM')) return 2;
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
      if (this.shutdownInitiated) return;

      this.shutdownInitiated = true;
      this.log('');
      this.log('⚠️  Received SIGINT, shutting down gracefully...');
      this.exit(130); // Standard SIGINT exit code
    });

    process.on('SIGTERM', () => {
      if (this.shutdownInitiated) return;

      this.shutdownInitiated = true;
      this.log('');
      this.log('⚠️  Received SIGTERM, shutting down gracefully...');
      this.exit(143); // Standard SIGTERM exit code
    });
  }
}
