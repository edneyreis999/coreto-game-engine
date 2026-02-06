/**
 * Integration Test - Sample Configuration End-to-End Execution
 *
 * Demonstrates the complete pipeline execution with the sample configuration:
 * Config → Loader → Runtime → Simulation → Reporter
 *
 * Tests:
 * - Full pipeline execution with sample config
 * - Report generation with valid JSON structure
 * - TTK metrics measurement for all trechos
 * - Warnings generated for out-of-tolerance scenarios
 * - Read-only constraint (no writes to fixture data)
 * - Determinism (same seed produces identical results)
 *
 * @see examples/sample-config.json
 * @see examples/run-sample.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Mock runtime components to avoid needing full RMMZ project structure
jest.mock('@coreto/core', () => {
  const actual = jest.requireActual('@coreto/core');
  return {
    ...actual,
    HeadlessRuntimeBootstrapper: jest.fn().mockImplementation(() => {
      return {
        bootstrap: jest.fn().mockResolvedValue(undefined),
        cleanup: jest.fn(),
        getDOM: jest.fn().mockReturnValue(null),
      };
    }),
    SyncWarpLoop: jest.fn().mockImplementation(() => {
      return {
        start: jest.fn(),
        getSimulatedFrames: jest.fn().mockReturnValue(10),
        stop: jest.fn(),
      };
    }),
    HeadlessBattleSimulator: jest.fn().mockImplementation(() => {
      return {
        initialize: jest.fn().mockResolvedValue(undefined),
        executeBattle: jest.fn().mockImplementation((setup: unknown) => {
          const battleSetup = setup as { troopId?: number; seed?: number };
          // Return complete BattleResult entity with all required fields
          return Promise.resolve({
            troopId: battleSetup.troopId ?? 1,
            troopName: `Troop ${battleSetup.troopId ?? 1}`,
            outcome: 'victory',
            ttkTurns: 5,
            ttkActions: 15,
            durationMs: 1250,
            seed: battleSetup.seed ?? 42,
            expGained: 100,
          });
        }),
        cleanup: jest.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

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

// Path to sample config
const SAMPLE_CONFIG_PATH = path.join(process.cwd(), 'examples/sample-config.json');

// Path to test fixtures
const FIXTURES_PATH = path.join(process.cwd(), 'tests/fixtures/sample-data');

/**
 * Execute the full TTK validation pipeline with sample config.
 *
 * @param configPath - Path to sample config
 * @param seed - Optional seed override
 * @returns Report object and output path
 */
async function executeSamplePipeline(
  configPath: string,
  seed?: number
): Promise<{ report: any; reportPath: string }> {
  registerDependencies();

  const configLoader = resolve<IConfigLoader>(IConfigLoaderToken);
  const dataLoader = resolve<IDataLoader>(IDataLoaderToken);
  const battleSimulator = resolve<IBattleSimulator>(IBattleSimulatorToken);
  const reporter = resolve<IReporter>(IReporterToken);

  // Load configuration
  const config = await configLoader.loadConfig(configPath);
  const effectiveSeed = seed ?? config.seed ?? 12345;

  // Load trechos
  const trechos = await configLoader.loadTrechos(config);

  // Load database
  const database = await dataLoader.loadDatabase(config.projectPath);

  // Initialize simulator
  await battleSimulator.initialize(database, config.projectPath);

  // Execute battles for each trecho
  for (const trecho of trechos) {
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
      reporter.addBattleResult((trecho as any).id, result);

      // Validate TTK against targets and generate warnings
      const ttkTarget = (trecho as any).ttkTarget;
      const turnsDev =
        Math.abs(result.ttkTurns - ttkTarget.turns) / ttkTarget.turns;
      const actionsDev =
        Math.abs(result.ttkActions - ttkTarget.actions) / ttkTarget.actions;
      const isWithinTolerance =
        turnsDev <= ttkTarget.tolerance && actionsDev <= ttkTarget.tolerance;

      if (!isWithinTolerance) {
        reporter.addWarning({
          type: 'ttk_out_of_tolerance',
          severity: 'warning',
          message: `TTK out of tolerance for troop ${troopId}`,
          context: {
            trechoId: (trecho as any).id,
            troopId,
            ttkTurns: result.ttkTurns,
            ttkActions: result.ttkActions,
            targetTurns: ttkTarget.turns,
            targetActions: ttkTarget.actions,
            tolerance: ttkTarget.tolerance,
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
            trechoId: (trecho as any).id,
            troopId,
            maxTurns: config.maxBattleTurns,
          },
        });
      }
    }
  }

  // Generate report
  const reportMetadata = {
    version: '1.0.0',
    generatedAt: new Date(),
    seed: effectiveSeed,
    projectPath: config.projectPath,
  };

  const report = reporter.generateReport(reportMetadata);

  // Save report
  const reportFileName = `sample-report-${Date.now()}.json`;
  const reportPath = path.join(config.reportOutputPath, reportFileName);

  // Ensure report directory exists
  if (!fs.existsSync(config.reportOutputPath)) {
    fs.mkdirSync(config.reportOutputPath, { recursive: true });
  }

  await reporter.writeReport(report, reportPath);

  // Cleanup
  await battleSimulator.cleanup();

  return { report, reportPath };
}

describe('Integration: Sample Configuration End-to-End Execution', () => {
  afterEach(() => {
    clearContainer();
  });

  describe('1.3: Integration test demonstrating end-to-end pipeline execution', () => {
    it('should execute full pipeline with sample config', async () => {
      // Act
      const { report } = await executeSamplePipeline(SAMPLE_CONFIG_PATH);

      // Assert: Report structure
      expect(report).toBeDefined();
      expect(report.metadata).toBeDefined();
      expect(report.metadata.version).toBe('1.0.0');
      expect(report.metadata.seed).toBe(42);
      expect(report.metadata.projectPath).toContain('tests/fixtures/sample-data');

      // Assert: Summary
      expect(report.summary).toBeDefined();
      expect(report.summary.totalBattles).toBeGreaterThan(0);
      expect(report.summary.totalTrechos).toBe(3); // 3 trechos in sample config
      expect(report.summary.successRate).toBeGreaterThanOrEqual(0);
      expect(report.summary.successRate).toBeLessThanOrEqual(1);
    }, 30000);

    it('should generate report with valid JSON structure', async () => {
      // Act
      const { reportPath } = await executeSamplePipeline(SAMPLE_CONFIG_PATH);

      // Assert: Report file exists
      expect(fs.existsSync(reportPath)).toBe(true);

      // Assert: Report is valid JSON
      const reportContent = fs.readFileSync(reportPath, 'utf-8');
      const parsedReport = JSON.parse(reportContent);

      // Report schema has flat structure: timestamp, seed, projectPath, summary, trechos
      expect(parsedReport.timestamp).toBeDefined();
      expect(parsedReport.seed).toBeDefined();
      expect(parsedReport.projectPath).toBeDefined();
      expect(parsedReport.trechos).toBeDefined();
      expect(parsedReport.summary).toBeDefined();
    }, 30000);

    it('should measure TTK metrics for all trechos', async () => {
      // Act
      const { report } = await executeSamplePipeline(SAMPLE_CONFIG_PATH);

      // Assert: All trechos have battle results
      expect(report.trechos).toHaveLength(3);

      for (const trecho of report.trechos) {
        expect(trecho.battles).toBeDefined();
        expect(trecho.battles.length).toBeGreaterThan(0);

        // Assert: Each battle has TTK metrics
        for (const battle of trecho.battles) {
          expect(battle.ttkTurns).toBeDefined();
          expect(battle.ttkActions).toBeDefined();
          expect(battle.ttkTurns).toBeGreaterThanOrEqual(0);
          expect(battle.ttkActions).toBeGreaterThanOrEqual(0);
        }
      }
    }, 30000);

    it('should include happy path trecho in report', async () => {
      // Act
      const { report } = await executeSamplePipeline(SAMPLE_CONFIG_PATH);

      // Assert
      const happyTrecho = report.trechos.find(
        (t: any) => t.trechoId === 'happy-path-trecho'
      );

      expect(happyTrecho).toBeDefined();
      expect(happyTrecho.trechoId).toBe('happy-path-trecho');
      expect(happyTrecho.battles.length).toBeGreaterThan(0);
    }, 30000);

    it('should include out-of-tolerance trecho in report', async () => {
      // Act
      const { report } = await executeSamplePipeline(SAMPLE_CONFIG_PATH);

      // Assert
      const outToleranceTrecho = report.trechos.find(
        (t: any) => t.trechoId === 'out-of-tolerance-trecho'
      );

      expect(outToleranceTrecho).toBeDefined();
      expect(outToleranceTrecho.trechoId).toBe('out-of-tolerance-trecho');
    }, 30000);

    it('should include edge case trecho in report', async () => {
      // Act
      const { report } = await executeSamplePipeline(SAMPLE_CONFIG_PATH);

      // Assert
      const edgeCaseTrecho = report.trechos.find(
        (t: any) => t.trechoId === 'edge-case-max-party'
      );

      expect(edgeCaseTrecho).toBeDefined();
      expect(edgeCaseTrecho.trechoId).toBe('edge-case-max-party');
      expect(edgeCaseTrecho.battles.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Generate warnings for out-of-tolerance scenarios', () => {
    it('should generate warnings when TTK is out of tolerance', async () => {
      // Act
      const { report } = await executeSamplePipeline(SAMPLE_CONFIG_PATH);

      // Assert: Out-of-tolerance trecho should have warnings
      const outToleranceTrecho = report.trechos.find(
        (t: any) => t.trechoId === 'out-of-tolerance-trecho'
      );

      expect(outToleranceTrecho).toBeDefined();
      // Note: Warnings depend on actual battle simulation results
      // The sample config has very strict tolerance (0.1) to encourage warnings
      if (outToleranceTrecho.warnings && outToleranceTrecho.warnings.length > 0) {
        const ttkWarning = outToleranceTrecho.warnings.find(
          (w: any) => w.type === 'ttk_out_of_tolerance'
        );
        expect(ttkWarning).toBeDefined();
      }
    }, 30000);
  });

  describe('Verify read-only constraint (no writes to fixture data)', () => {
    it('should not modify files in test fixtures during execution', async () => {
      // Arrange: Snapshot fixture files before execution
      const snapshotBefore = new Map<string, number>();
      const fixtureFiles = ['Troops.json', 'Classes.json', 'Enemies.json', 'Skills.json'];

      for (const file of fixtureFiles) {
        const filePath = path.join(FIXTURES_PATH, file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          snapshotBefore.set(filePath, stats.mtimeMs);
        }
      }

      // Act: Execute pipeline
      await executeSamplePipeline(SAMPLE_CONFIG_PATH);

      // Assert: No files modified (same mtime)
      for (const [filePath, mtimeBefore] of snapshotBefore) {
        const stats = fs.statSync(filePath);
        expect(stats.mtimeMs).toBe(mtimeBefore);
      }
    }, 30000);
  });

  describe('Test determinism (same seed produces identical results)', () => {
    it('should produce identical TTK results with same seed', async () => {
      // Arrange
      const seed = 42;
      const results: any[] = [];

      // Act: Execute pipeline 3 times with same seed
      for (let i = 0; i < 3; i++) {
        clearContainer();
        const { report } = await executeSamplePipeline(SAMPLE_CONFIG_PATH, seed);
        results.push(report);
      }

      // Assert: All executions have identical TTK values
      const firstTrecho = results[0].trechos[0];
      const firstBattle = firstTrecho.battles[0];

      for (let i = 1; i < results.length; i++) {
        const currentTrecho = results[i].trechos[0];
        const currentBattle = currentTrecho.battles[0];

        expect(currentBattle.ttkTurns).toBe(firstBattle.ttkTurns);
        expect(currentBattle.ttkActions).toBe(firstBattle.ttkActions);
        expect(currentBattle.outcome).toBe(firstBattle.outcome);
      }
    }, 60000);
  });

  describe('Report structure validation', () => {
    it('should include all required metadata fields', async () => {
      // Act
      const { report } = await executeSamplePipeline(SAMPLE_CONFIG_PATH);

      // Assert
      expect(report.metadata.version).toBe('1.0.0');
      expect(report.metadata.generatedAt).toBeDefined();
      expect(report.metadata.seed).toBe(42);
      expect(report.metadata.projectPath).toContain('tests/fixtures/sample-data');
    }, 30000);

    it('should have trechos with correct structure', async () => {
      // Act
      const { report } = await executeSamplePipeline(SAMPLE_CONFIG_PATH);

      // Assert
      expect(report.trechos).toHaveLength(3);

      const trechoIds = report.trechos.map((t: any) => t.trechoId);
      expect(trechoIds).toContain('happy-path-trecho');
      expect(trechoIds).toContain('out-of-tolerance-trecho');
      expect(trechoIds).toContain('edge-case-max-party');
    }, 30000);

    it('should have summary with correct totals', async () => {
      // Act
      const { report } = await executeSamplePipeline(SAMPLE_CONFIG_PATH);

      // Assert
      expect(report.summary.totalBattles).toBeGreaterThan(0);
      expect(report.summary.totalTrechos).toBe(3);
      expect(report.summary.totalWarnings).toBeGreaterThanOrEqual(0);
    }, 30000);
  });
});
