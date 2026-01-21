#!/usr/bin/env tsx
/**
 * Run Sample Configuration Script
 *
 * Executable TypeScript script that demonstrates the complete TTK validation pipeline
 * using the sample configuration.
 *
 * Usage:
 *   tsx examples/run-sample.ts
 *
 * Or via npm script:
 *   npm run sample
 *
 * @see examples/sample-config.json
 * @see examples/sample-execution.integration.test.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

// Get the current directory (__dirname equivalent in ESM)
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Import from core package
import {
  registerDependencies,
  clearContainer,
  resolve,
  IConfigLoaderToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
  IReporterToken,
  type IConfigLoader,
  type IDataLoader,
  type IBattleSimulator,
  type IReporter,
} from '@coreto/core';

/**
 * Execute the full TTK validation pipeline with sample config.
 *
 * @param configPath - Path to sample config
 * @returns Exit code (0 for success, 1 for failure)
 */
async function runSample(configPath: string): Promise<number> {
  console.log('='.repeat(60));
  console.log('Coreto Game Engine - Sample Configuration Execution');
  console.log('='.repeat(60));
  console.log(`Config: ${configPath}`);
  console.log('');

  try {
    // Register DI container dependencies
    registerDependencies();

    const configLoader = resolve<IConfigLoader>(IConfigLoaderToken);
    const dataLoader = resolve<IDataLoader>(IDataLoaderToken);
    const battleSimulator = resolve<IBattleSimulator>(IBattleSimulatorToken);
    const reporter = resolve<IReporter>(IReporterToken);

    // Load configuration
    console.log('Loading configuration...');
    const config = await configLoader.loadConfig(configPath);
    console.log(`  ✓ projectPath: ${config.projectPath}`);
    console.log(`  ✓ reportOutputPath: ${config.reportOutputPath}`);
    console.log(`  ✓ seed: ${config.seed ?? 12345}`);
    console.log(`  ✓ maxBattleTurns: ${config.maxBattleTurns ?? 'not set'}`);
    console.log('');

    // Load trechos
    console.log('Loading trechos...');
    const trechos = await configLoader.loadTrechos(config);
    console.log(`  ✓ Loaded ${trechos.length} trechos:`);
    for (const trecho of trechos) {
      console.log(`    - ${(trecho as any).id}: ${(trecho as any).name ?? '(no name)'}`);
      console.log(`      troopIds: ${(trecho as any).troopIds.join(', ')}`);
      console.log(`      party: ${(trecho as any).party.members.length} members`);
    }
    console.log('');

    // Load database
    console.log('Loading RPG Maker MZ database...');
    const database = await dataLoader.loadDatabase(config.projectPath);
    console.log(`  ✓ Loaded ${Object.keys(database).length} database objects`);
    console.log('');

    // Initialize simulator
    console.log('Initializing battle simulator...');
    await battleSimulator.initialize(database, config.projectPath);
    console.log('  ✓ Simulator initialized');
    console.log('');

    // Execute battles
    const effectiveSeed = config.seed ?? 12345;
    console.log(`Executing battles (seed: ${effectiveSeed})...`);
    console.log('');

    for (const trecho of trechos) {
      const trechoId = (trecho as any).id;
      const trechoName = (trecho as any).name ?? trechoId;

      console.log(`  Trecho: ${trechoName}`);

      for (const troopId of (trecho as any).troopIds) {
        const battleSetup =
          config.maxBattleTurns !== undefined
            ? {
                troopId,
                party: (trecho as any).party,
                seed: effectiveSeed,
                maxTurns: config.maxBattleTurns,
              }
            : {
                troopId,
                party: (trecho as any).party,
                seed: effectiveSeed,
              };

        const result = await battleSimulator.executeBattle(battleSetup);
        reporter.addBattleResult(trechoId, result);

        // Validate TTK against targets and generate warnings
        const ttkTarget = (trecho as any).ttkTarget;
        const turnsDev =
          Math.abs(result.ttkTurns - ttkTarget.turns) / ttkTarget.turns;
        const actionsDev =
          Math.abs(result.ttkActions - ttkTarget.actions) / ttkTarget.actions;
        const toleranceFraction = ttkTarget.tolerance;
        const isWithinTolerance =
          turnsDev <= toleranceFraction && actionsDev <= toleranceFraction;

        if (!isWithinTolerance) {
          reporter.addWarning({
            type: 'ttk_out_of_tolerance',
            severity: 'warning',
            message: `TTK out of tolerance for troop ${troopId}`,
            context: {
              trechoId,
              troopId,
              ttkTurns: result.ttkTurns,
              ttkActions: result.ttkActions,
              targetTurns: ttkTarget.turns,
              targetActions: ttkTarget.actions,
              tolerance: toleranceFraction,
            },
          });
        }

        // Check for battle timeout
        if (result.outcome === 'timeout') {
          reporter.addWarning({
            type: 'battle_timeout',
            severity: 'warning',
            message: `Battle timeout for troop ${troopId}`,
            context: {
              trechoId,
              troopId,
              maxTurns: config.maxBattleTurns,
            },
          });
        }

        // Print battle result
        const statusIcon = isWithinTolerance ? '✓' : '⚠';
        console.log(`    ${statusIcon} Troop ${troopId}: ${result.ttkTurns} turns, ${result.ttkActions} actions (${result.outcome})`);
      }
      console.log('');
    }

    // Cleanup
    await battleSimulator.cleanup();

    // Generate report
    console.log('Generating report...');
    const reportMetadata = {
      version: '1.0.0',
      generatedAt: new Date(),
      seed: effectiveSeed,
      projectPath: config.projectPath,
    };

    const report = reporter.generateReport(reportMetadata);

    // Ensure report directory exists
    if (!fs.existsSync(config.reportOutputPath)) {
      fs.mkdirSync(config.reportOutputPath, { recursive: true });
    }

    // Save report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const reportFileName = `sample-report-${timestamp}.json`;
    const reportPath = path.join(config.reportOutputPath, reportFileName);

    await reporter.writeReport(report, reportPath);
    console.log(`  ✓ Report saved to: ${reportPath}`);
    console.log('');

    // Print summary
    console.log('Summary:');
    console.log(`  Total battles: ${report.summary.totalBattles}`);
    console.log(`  Total trechos: ${report.summary.totalTrechos}`);
    console.log(`  Total warnings: ${report.summary.totalWarnings}`);
    console.log(`  Success rate: ${(report.summary.successRate * 100).toFixed(1)}%`);
    console.log('');

    if (report.summary.totalWarnings > 0) {
      console.log('Warnings:');
      for (const trecho of report.trechos) {
        for (const warning of (trecho as any).warnings) {
          console.log(`  - [${warning.severity.toUpperCase()}] ${warning.type}: ${warning.message}`);
        }
      }
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('Sample execution completed successfully!');
    console.log('='.repeat(60));

    return 0;
  } catch (error) {
    console.error('');
    console.error('Error executing sample configuration:');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('');
    console.error('Stack trace:');
    console.error(error instanceof Error ? error.stack : String(error));
    console.error('');

    return 1;
  } finally {
    // Clear DI container
    clearContainer();
  }
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  // Get path to sample config
  const sampleConfigPath = path.join(__dirname, 'sample-config.json');

  // Check if sample config exists
  if (!fs.existsSync(sampleConfigPath)) {
    console.error(`Error: Sample configuration not found at: ${sampleConfigPath}`);
    process.exit(1);
  }

  // Run sample
  const exitCode = await runSample(sampleConfigPath);
  process.exit(exitCode);
}

// Execute main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
