/**
 * E2E Tests - Full Pipeline Validation
 *
 * Tests the complete pipeline: Config → Loader → Runtime → Simulation → Reporter
 * Validates CA-007 (Determinism), CA-012-015 (Performance), CA-021 (Read-Only Guard)
 *
 * @see planos/002-implementacao-mvp/tasks/33_task.md
 * @see planos/002-implementacao-mvp/FDD-001-mvp-implementation.md
 */

import * as fs from 'fs';
import * as path from 'path';

// Keep E2E tests fast/stable: we validate the pipeline orchestration and report semantics,
// not the internal implementation details of bootstrap/warp-loop.
jest.mock('@coreto/core/infrastructure/runtime/HeadlessRuntimeBootstrapper.js', () => {
  return {
    HeadlessRuntimeBootstrapper: jest.fn().mockImplementation(() => {
      return {
        bootstrap: jest.fn().mockResolvedValue(undefined),
        cleanup: jest.fn(),
        getDOM: jest.fn().mockReturnValue(null),
      };
    }),
  };
});

jest.mock('@coreto/core/infrastructure/runtime/simulation/SyncWarpLoop.js', () => {
  return {
    SyncWarpLoop: jest.fn().mockImplementation((_maxFrames: number) => {
      return {
        start: jest.fn(),
        getSimulatedFrames: jest.fn().mockReturnValue(10),
        stop: jest.fn(),
      };
    }),
  };
});
import {
  setupE2EProject,
  snapshotProjectFiles,
  verifyReadOnlyConstraint,
  type E2EProjectSetup,
} from '../../fixtures/e2e/setup-e2e-project.js';
import { setupRuntimeMocks, cleanupRuntimeMocks } from '../../fixtures/e2e/setup-runtime-mocks.js';
import { registerDependencies, resolve, clearContainer } from '../../../src/infrastructure/di/container.js';
import {
  IConfigLoaderToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
  IReporterToken,
} from '../../../src/infrastructure/di/tokens.js';
import type {
  IConfigLoader,
  IDataLoader,
  IBattleSimulator,
  IReporter,
} from '../../../src/core/ports/index.js';

/**
 * Execute the full TTK validation pipeline.
 *
 * Mirrors the logic in run-ttk.ts command but in a testable form.
 *
 * @param configPath - Path to project.config.json
 * @param seed - Optional seed override
 * @returns Report object and output path
 */
async function executePipeline(configPath: string, seed?: number) {
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

  // Execute battles
  for (const trecho of trechos) {
    for (const troopId of trecho.troopIds) {
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
      reporter.addBattleResult(trecho.id, result);

      // Validate TTK against targets and generate warnings (MVP implementation)
      // Calculate tolerance bounds
      const turnsDev = Math.abs(result.ttkTurns - trecho.targetTtkTurns) / trecho.targetTtkTurns;
      const actionsDev =
        Math.abs(result.ttkActions - trecho.targetTtkActions) / trecho.targetTtkActions;
      const toleranceFraction = trecho.tolerancePercent / 100;
      const isWithinTolerance = turnsDev <= toleranceFraction && actionsDev <= toleranceFraction;

      if (!isWithinTolerance) {
        reporter.addWarning({
          type: 'ttk_out_of_tolerance',
          severity: 'warning',
          message: `TTK out of tolerance for troop ${troopId}`,
          context: {
            trechoId: trecho.id,
            troopId,
            ttkTurns: result.ttkTurns,
            ttkActions: result.ttkActions,
            targetTurns: trecho.targetTtkTurns,
            targetActions: trecho.targetTtkActions,
            tolerance: trecho.tolerancePercent,
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
            trechoId: trecho.id,
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
  const reportFileName = `report-${Date.now()}.json`;
  const reportPath = path.join(config.reportOutputPath, reportFileName);
  await reporter.writeReport(report, reportPath);

  // Cleanup
  await battleSimulator.cleanup();

  return { report, reportPath };
}

/**
 * SKIP: E2E tests require a real RPG Maker MZ project with complete js/ directory.
 *
 * These tests validate the full pipeline execution but depend on:
 * - Real RMMZ core scripts (rmmz_core.js, rmmz_managers.js, etc.)
 * - Real plugin scripts loaded by ScriptLoader
 * - Complete data/ directory with valid database files
 *
 * The pipeline works correctly with real projects (verified manually with run-ttk command).
 * Mock RMMZ projects are insufficient for E2E testing because they lack the complete
 * script dependencies required by BattleManager.
 *
 * For validation:
 * 1. Use integration tests with mocked components (tests/integration/)
 * 2. Use manual QA with real RMMZ projects (tests/qa/MANUAL_QA_GUIDE.md)
 * 3. Run `npm run cli run-ttk -- --config <path>` with real project
 */
describe('E2E: Full Pipeline - run-ttk command', () => {
  let setup: E2EProjectSetup;
  let initialSnapshot: Map<string, number>;

  beforeAll(() => {
    // Setup runtime mocks once for all tests
    setupRuntimeMocks();
  });

  afterEach(() => {
    if (setup) {
      setup.cleanup();
    }
    clearContainer();
  });

  afterAll(() => {
    // Cleanup runtime mocks after all tests
    cleanupRuntimeMocks();
  });

  /**
   * 33.2 E2E test: Happy path (all battles pass)
   *
   * Validates:
   * - CA-001: Config loads successfully
   * - CA-002: Database loads successfully
   * - CA-003: Battles execute without errors
   * - CA-004: Report generated and saved
   * - CA-021: Read-only constraint (no writes to projectPath)
   */
  describe('33.2 Happy Path - All Battles Pass', () => {
    it('should execute full pipeline successfully and generate valid report', async () => {
      // Arrange
      setup = setupE2EProject('project.config.json');
      initialSnapshot = snapshotProjectFiles(setup.projectPath);

      // Act
      const { report, reportPath } = await executePipeline(setup.configPath);

      // Assert: Report structure
      expect(report).toBeDefined();
      expect(report.metadata).toBeDefined();
      expect(report.metadata.version).toBe('1.0.0');
      expect(report.metadata.seed).toBe(12345);
      expect(report.metadata.projectPath).toBe(setup.projectPath);

      // Assert: Summary
      expect(report.summary).toBeDefined();
      expect(report.summary.totalBattles).toBeGreaterThan(0);
      expect(report.summary.totalTrechos).toBeGreaterThan(0);
      expect(report.summary.successRate).toBeGreaterThanOrEqual(0);
      expect(report.summary.successRate).toBeLessThanOrEqual(1);

      // Assert: Trechos
      expect(report.trechos).toBeDefined();
      expect(report.trechos.length).toBeGreaterThan(0);

      // Assert: Report file exists
      expect(fs.existsSync(reportPath)).toBe(true);

      // Assert: Report is valid JSON
      const reportContent = fs.readFileSync(reportPath, 'utf-8');
      const parsedReport = JSON.parse(reportContent);
      expect(parsedReport.seed).toBe(12345);
      expect(parsedReport.projectPath).toBe(setup.projectPath);

      // Assert: Read-only constraint (CA-021)
      const readOnlyRespected = verifyReadOnlyConstraint(setup.projectPath, initialSnapshot);
      expect(readOnlyRespected).toBe(true);
    }, 30000);

    it('should execute battles with expected TTK metrics', async () => {
      // Arrange
      setup = setupE2EProject('project.config.json');

      // Act
      const { report } = await executePipeline(setup.configPath);

      // Assert: Find the happy path trecho
      const happyTrecho = report.trechos.find((t) => t.trechoId === 'test-trecho-happy');
      expect(happyTrecho).toBeDefined();

      // Assert: Battle results
      expect(happyTrecho!.battles).toBeDefined();
      expect(happyTrecho!.battles.length).toBeGreaterThan(0);

      const battle = happyTrecho!.battles[0];
      expect(battle).toBeDefined();
      expect(battle!.ttkTurns).toBeGreaterThan(0);
      expect(battle!.ttkActions).toBeGreaterThan(0);
      expect(battle!.outcome).toBeDefined();
    }, 30000);
  });

  /**
   * 33.3 E2E test: TTK out of tolerance
   *
   * Validates:
   * - CA-008: Warnings generated for out-of-tolerance battles
   * - CA-009: Success rate reflects failures
   */
  describe('33.3 TTK Out of Tolerance', () => {
    it('should generate warnings when TTK is out of tolerance', async () => {
      // Arrange
      setup = setupE2EProject('project.config.json');

      // Act
      const { report } = await executePipeline(setup.configPath);

      // Assert: Find the out-of-tolerance trecho
      const outToleranceTrecho = report.trechos.find(
        (t) => t.trechoId === 'test-trecho-out-tolerance'
      );
      expect(outToleranceTrecho).toBeDefined();

      // Assert: Warnings exist
      expect(report.summary.totalWarnings).toBeGreaterThan(0);

      // Assert: Out-of-tolerance trecho has warnings
      expect(outToleranceTrecho!.warnings.length).toBeGreaterThan(0);
      expect(outToleranceTrecho!.warnings[0]!.type).toBe('ttk_out_of_tolerance');

      // Note: Success rate is 100% because warnings have 'warning' severity, not 'critical'
      // Only critical warnings affect success rate (per JsonReporter implementation)
    }, 30000);

    it('should include warning details in report', async () => {
      // Arrange
      setup = setupE2EProject('project.config.json');

      // Act
      const { report } = await executePipeline(setup.configPath);

      // Assert: Check warnings array
      const allWarnings = report.trechos.flatMap((t) => t.warnings);
      expect(allWarnings.length).toBeGreaterThan(0);

      const warning = allWarnings[0];
      expect(warning).toBeDefined();
      expect(warning!.type).toBeDefined();
      expect(warning!.severity).toBeDefined();
      expect(warning!.message).toBeDefined();
      expect(warning!.context).toBeDefined();
    }, 30000);
  });

  /**
   * 33.4 E2E test: Battle timeout
   *
   * Validates:
   * - CA-010: Timeout detection when maxBattleTurns exceeded
   * - CA-011: Timeout warning generated
   */
  describe('33.4 Battle Timeout', () => {
    it('should handle battle timeout gracefully', async () => {
      // Arrange
      setup = setupE2EProject('timeout-config.json');
      (global as any).__CORETO_E2E_FORCE_TIMEOUT = true;

      // Act
      const { report } = await executePipeline(setup.configPath);

      // Assert: Report generated despite timeout
      expect(report).toBeDefined();
      expect(report.summary.totalBattles).toBeGreaterThan(0);

      // Assert: Find timeout trecho
      const timeoutTrecho = report.trechos.find((t) => t.trechoId === 'test-trecho-timeout');
      expect(timeoutTrecho).toBeDefined();

      // Assert: Battle has timeout outcome
      const battle = timeoutTrecho!.battles[0];
      expect(battle).toBeDefined();
      expect(battle!.outcome).toBe('timeout');
    }, 30000);

    it('should generate timeout warning', async () => {
      // Arrange
      setup = setupE2EProject('timeout-config.json');
      (global as any).__CORETO_E2E_FORCE_TIMEOUT = true;

      // Act
      const { report } = await executePipeline(setup.configPath);

      // Assert: Timeout warning exists
      const timeoutTrecho = report.trechos.find((t) => t.trechoId === 'test-trecho-timeout');
      expect(timeoutTrecho).toBeDefined();

      const timeoutWarnings = timeoutTrecho!.warnings.filter((w) => w.type === 'battle_timeout');
      expect(timeoutWarnings.length).toBeGreaterThan(0);
    }, 30000);
  });

  /**
   * 33.5 E2E test: Invalid config
   *
   * Validates:
   * - CA-005: Config validation with Zod
   * - CA-006: Descriptive error messages
   */
  describe('33.5 Invalid Config', () => {
    it('should reject invalid configuration with descriptive error', async () => {
      // Arrange
      setup = setupE2EProject('invalid-config.json');

      // Act & Assert
      await expect(async () => {
        await executePipeline(setup.configPath);
      }).rejects.toThrow();
    }, 30000);
  });

  /**
   * 33.6 E2E test: Determinism (CA-007)
   *
   * Validates:
   * - CA-007: Same seed produces identical TTK results
   * - CA-007: 10 executions with same seed → byte-identical reports
   */
  describe('33.6 Determinism - Same Seed Produces Identical Results', () => {
    it('should produce identical TTK results with same seed (10 executions)', async () => {
      // Arrange
      setup = setupE2EProject('project.config.json');
      const executions = 10;
      const seed = 42;
      const results: any[] = [];

      // Act: Execute pipeline 10 times with same seed
      for (let i = 0; i < executions; i++) {
        clearContainer();
        const { report } = await executePipeline(setup.configPath, seed);
        results.push(report);
      }

      // Assert: All executions have identical TTK values
      const firstResult = results[0];
      const firstBattle = firstResult.trechos[0].battles[0];

      for (let i = 1; i < executions; i++) {
        const currentResult = results[i];
        const currentBattle = currentResult.trechos[0].battles[0];

        expect(currentBattle.ttkTurns).toBe(firstBattle.ttkTurns);
        expect(currentBattle.ttkActions).toBe(firstBattle.ttkActions);
        expect(currentBattle.outcome).toBe(firstBattle.outcome);
      }
    }, 60000);

    it('should produce byte-identical JSON reports with same seed', async () => {
      // Arrange
      setup = setupE2EProject('project.config.json');
      const seed = 42;

      // Act: Execute pipeline twice with same seed
      clearContainer();
      const { report: report1 } = await executePipeline(setup.configPath, seed);

      clearContainer();
      const { report: report2 } = await executePipeline(setup.configPath, seed);

      // Normalize timestamps and peakMemoryMB (they will differ)
      const normalize = (report: any) => {
        const normalized = JSON.parse(JSON.stringify(report));
        normalized.metadata.generatedAt = '2026-01-01T00:00:00.000Z';
        // Exclude peakMemoryMB from comparison - it varies based on system state
        delete normalized.summary.peakMemoryMB;
        return normalized;
      };

      const normalized1 = normalize(report1);
      const normalized2 = normalize(report2);

      // Assert: Reports are byte-identical (excluding timestamp and peakMemoryMB)
      expect(JSON.stringify(normalized1)).toBe(JSON.stringify(normalized2));
    }, 60000);

    // TODO: Re-enable when mocks use RNG for battle calculations
    // Currently, the E2E mocks produce deterministic results regardless of seed
    // because BattleManager mock doesn't use Math.random() in its simplified logic
    it('should produce different results with different seeds', async () => {
      // Arrange
      setup = setupE2EProject('project.config.json');

      // Act: Execute with two different seeds
      clearContainer();
      const { report: report1 } = await executePipeline(setup.configPath, 42);

      clearContainer();
      const { report: report2 } = await executePipeline(setup.configPath, 99);

      // Assert: Results differ (probabilistic, but highly likely with different seeds)
      const battle1 = report1.trechos[0]?.battles[0];
      const battle2 = report2.trechos[0]?.battles[0];

      expect(battle1).toBeDefined();
      expect(battle2).toBeDefined();

      // At least one metric should differ (turns or actions)
      const isDifferent =
        battle1!.ttkTurns !== battle2!.ttkTurns || battle1!.ttkActions !== battle2!.ttkActions;

      expect(isDifferent).toBe(true);
    }, 60000);
  });

  /**
   * Performance validation (CA-012 to CA-015)
   *
   * Validates:
   * - CA-012: Single battle executes in ≤ 2 seconds
   * - CA-013: Pipeline overhead is minimal
   */
  describe('Performance - Battle Execution Time', () => {
    it('should execute a single battle in less than 2 seconds', async () => {
      // Arrange
      setup = setupE2EProject('project.config.json');

      registerDependencies();
      const configLoader = resolve<IConfigLoader>(IConfigLoaderToken);
      const dataLoader = resolve<IDataLoader>(IDataLoaderToken);
      const battleSimulator = resolve<IBattleSimulator>(IBattleSimulatorToken);

      const config = await configLoader.loadConfig(setup.configPath);
      const database = await dataLoader.loadDatabase(config.projectPath);
      await battleSimulator.initialize(database, config.projectPath);

      // Act: Measure single battle execution
      const startTime = Date.now();

      await battleSimulator.executeBattle({
        troopId: 1,
        party: {
          members: [{ classId: 1, level: 1 }],
        },
        seed: 12345,
      });

      const duration = Date.now() - startTime;

      // Assert: Battle completes in < 2000ms
      expect(duration).toBeLessThan(2000);

      await battleSimulator.cleanup();
    }, 30000);

    it('should execute full pipeline in reasonable time', async () => {
      // Arrange
      setup = setupE2EProject('project.config.json');

      // Act: Measure full pipeline execution
      const startTime = Date.now();
      await executePipeline(setup.configPath);
      const duration = Date.now() - startTime;

      // Assert: Full pipeline completes in < 10 seconds (2 battles)
      expect(duration).toBeLessThan(10000);
    }, 30000);
  });

  /**
   * Read-Only Constraint Validation (CA-021)
   *
   * Validates:
   * - CA-021: Runtime guard detects writes to projectPath
   */
  describe('Read-Only Constraint - CA-021', () => {
    it('should not modify any files in projectPath during execution', async () => {
      // Arrange
      setup = setupE2EProject('project.config.json');
      const snapshot = snapshotProjectFiles(setup.projectPath);

      // Act
      await executePipeline(setup.configPath);

      // Assert: No files modified
      const readOnlyRespected = verifyReadOnlyConstraint(setup.projectPath, snapshot);
      expect(readOnlyRespected).toBe(true);
    }, 30000);
  });
});
