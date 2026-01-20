/**
 * Integration tests for Report Generation
 *
 * Tests end-to-end report generation workflow.
 */

import * as fs from 'fs';
import * as path from 'path';
import { JsonReporter } from '../../../../packages/core/src/infrastructure/adapters/reporter/JsonReporter.js';
import { BattleResult } from '../../../../packages/core/src/core/domain/BattleResult.js';
import { Warning } from '../../../../packages/core/src/core/domain/Warning.js';
import type { ReportMetadata } from '../../../../packages/core/src/core/domain/Report.js';
import { ReportSchema } from '../../../../packages/core/src/infrastructure/schemas/report.schema.js';

describe('Report Generation Integration Tests', () => {
  let reporter: JsonReporter;
  let tempDir: string;

  const createMetadata = (): ReportMetadata => ({
    version: '1.0.0',
    generatedAt: new Date('2026-01-05T10:00:00.000Z'),
    seed: 12345,
    projectPath: '/Users/edney/projects/test-game',
  });

  beforeEach(() => {
    reporter = new JsonReporter();
    tempDir = path.join(__dirname, '..', '..', '..', 'temp', 'integration-tests');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Full Report Workflow', () => {
    it('should generate complete report with multiple trechos', async () => {
      // Arrange: Create battle results for multiple trechos
      const ato1Results = [
        new BattleResult({
          troopId: 1,
          troopName: 'Goblin Pack',
          outcome: 'victory',
          ttkTurns: 2,
          ttkActions: 5,
          durationMs: 800,
          seed: 12345,
        }),
        new BattleResult({
          troopId: 2,
          troopName: 'Orc Warriors',
          outcome: 'victory',
          ttkTurns: 3,
          ttkActions: 8,
          durationMs: 1200,
          seed: 12345,
        }),
        new BattleResult({
          troopId: 3,
          troopName: 'Slime Horde',
          outcome: 'victory',
          ttkTurns: 1,
          ttkActions: 3,
          durationMs: 500,
          seed: 12345,
        }),
      ];

      const ato2Results = [
        new BattleResult({
          troopId: 10,
          troopName: 'Dragon Boss',
          outcome: 'victory',
          ttkTurns: 10,
          ttkActions: 25,
          durationMs: 5000,
          seed: 12345,
        }),
        new BattleResult({
          troopId: 11,
          troopName: 'Elite Guards',
          outcome: 'victory',
          ttkTurns: 8,
          ttkActions: 20,
          durationMs: 4000,
          seed: 12345,
        }),
      ];

      // Add results to reporter
      ato1Results.forEach((r) => reporter.addBattleResult('ato1-nivel1-10', r));
      ato2Results.forEach((r) => reporter.addBattleResult('ato2-nivel11-20', r));

      // Add some warnings
      reporter.addWarning(
        new Warning({
          type: 'ttk_out_of_tolerance',
          severity: 'warning',
          message: 'TTK slightly above target',
          context: { trechoId: 'ato1-nivel1-10', troopId: 2, ttkTurns: 3, targetTurns: 2 },
        })
      );

      // Act: Generate report
      const report = reporter.generateReport(createMetadata());

      // Assert: Verify report structure
      expect(report.trechos).toHaveLength(2);
      expect(report.summary.totalBattles).toBe(5);
      expect(report.summary.totalTrechos).toBe(2);
      expect(report.summary.totalWarnings).toBe(1);

      // Verify ato1 metrics
      const ato1 = report.trechos.find((t) => t.trechoId === 'ato1-nivel1-10');
      expect(ato1).toBeDefined();
      expect(ato1!.battles).toHaveLength(3);
      expect(ato1!.aggregates.avgTtkTurns).toBe(2); // (2+3+1)/3 = 2
      expect(ato1!.aggregates.avgTtkActions).toBeCloseTo(5.33, 1); // (5+8+3)/3 = 5.33

      // Verify ato2 metrics
      const ato2 = report.trechos.find((t) => t.trechoId === 'ato2-nivel11-20');
      expect(ato2).toBeDefined();
      expect(ato2!.battles).toHaveLength(2);
      expect(ato2!.aggregates.avgTtkTurns).toBe(9); // (10+8)/2 = 9
      expect(ato2!.aggregates.avgTtkActions).toBe(22.5); // (25+20)/2 = 22.5
    });

    it('should write report to JSON file and validate schema', async () => {
      // Arrange
      const result = new BattleResult({
        troopId: 1,
        troopName: 'Test Troop',
        outcome: 'victory',
        ttkTurns: 5,
        ttkActions: 12,
        durationMs: 2000,
        seed: 12345,
      });

      reporter.addBattleResult('test-trecho', result);

      const report = reporter.generateReport(createMetadata());

      // Act: Write to file
      const outputPath = path.join(tempDir, 'test-report.json');
      await reporter.writeReport(report, outputPath);

      // Assert: File exists and is valid JSON
      expect(fs.existsSync(outputPath)).toBe(true);

      const fileContent = fs.readFileSync(outputPath, 'utf-8');
      const parsedReport = JSON.parse(fileContent);

      // Validate against Zod schema
      expect(() => ReportSchema.parse(parsedReport)).not.toThrow();

      // Verify content
      expect(parsedReport.seed).toBe(12345);
      expect(parsedReport.trechos).toHaveLength(1);
      expect(parsedReport.trechos[0].trechoId).toBe('test-trecho');
    });

    it('should export context for AI analysis', async () => {
      // Arrange
      const results = [
        new BattleResult({
          troopId: 1,
          troopName: 'Troop 1',
          outcome: 'victory',
          ttkTurns: 3,
          ttkActions: 8,
          durationMs: 1000,
          seed: 12345,
        }),
        new BattleResult({
          troopId: 2,
          troopName: 'Troop 2',
          outcome: 'victory',
          ttkTurns: 5,
          ttkActions: 12,
          durationMs: 1500,
          seed: 12345,
        }),
      ];

      results.forEach((r) => reporter.addBattleResult('ato1-nivel1-10', r));
      const report = reporter.generateReport(createMetadata());

      // Act: Export context
      const contextDir = path.join(tempDir, 'context');
      await reporter.exportContext(report, contextDir);

      // Assert: Check exported files
      const summaryPath = path.join(contextDir, 'summary.json');
      const trechoPath = path.join(contextDir, 'trecho-ato1-nivel1-10.json');

      expect(fs.existsSync(summaryPath)).toBe(true);
      expect(fs.existsSync(trechoPath)).toBe(true);

      // Verify summary content
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      expect(summary.seed).toBe(12345);
      expect(summary.summary.totalBattles).toBe(2);

      // Verify trecho content
      const trecho = JSON.parse(fs.readFileSync(trechoPath, 'utf-8'));
      expect(trecho.trechoId).toBe('ato1-nivel1-10');
      expect(trecho.battles).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle report with no battles', async () => {
      const report = reporter.generateReport(createMetadata());

      const outputPath = path.join(tempDir, 'empty-report.json');
      await reporter.writeReport(report, outputPath);

      const fileContent = fs.readFileSync(outputPath, 'utf-8');
      const parsedReport = JSON.parse(fileContent);

      expect(parsedReport.trechos).toHaveLength(0);
      expect(parsedReport.summary.totalBattles).toBe(0);
      expect(parsedReport.summary.successRate).toBe(0);
    });

    it('should handle large number of battles (performance test)', async () => {
      // Create 1000 battle results
      const results = Array.from({ length: 1000 }, (_, i) => {
        return new BattleResult({
          troopId: i + 1,
          troopName: `Troop ${i + 1}`,
          outcome: 'victory',
          ttkTurns: Math.floor(Math.random() * 10) + 1,
          ttkActions: Math.floor(Math.random() * 20) + 5,
          durationMs: Math.floor(Math.random() * 3000) + 500,
          seed: 12345,
        });
      });

      // Distribute across 10 trechos
      results.forEach((r, i) => {
        const trechoId = `ato${Math.floor(i / 100) + 1}-nivel${i % 100}`;
        reporter.addBattleResult(trechoId, r);
      });

      const startTime = Date.now();
      const report = reporter.generateReport(createMetadata());
      const generationTime = Date.now() - startTime;

      expect(generationTime).toBeLessThan(1000); // Should generate in less than 1 second
      expect(report.summary.totalBattles).toBe(1000);
    });

    it('should handle warnings without trechoId (global warnings)', async () => {
      reporter.addWarning(
        new Warning({
          type: 'troop_not_found',
          severity: 'critical',
          message: 'Global config error',
          context: { troopId: 999 },
        })
      );

      const result = new BattleResult({
        troopId: 1,
        troopName: 'Valid Troop',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 12345,
      });

      reporter.addBattleResult('test-trecho', result);

      const report = reporter.generateReport(createMetadata());

      // Global warning should not appear in trecho warnings
      const trecho = report.trechos.find((t) => t.trechoId === 'test-trecho');
      expect(trecho!.warnings).toHaveLength(0);

      // But should appear in report.warnings
      expect(report.warnings).toHaveLength(1);
    });
  });

  describe('Schema Validation', () => {
    it('should produce report matching ReportSchema exactly', async () => {
      const result = new BattleResult({
        troopId: 42,
        troopName: 'Schema Test Troop',
        outcome: 'victory',
        ttkTurns: 7,
        ttkActions: 18,
        durationMs: 3500,
        seed: 99999,
      });

      reporter.addBattleResult('schema-test-trecho', result);

      reporter.addWarning(
        new Warning({
          type: 'skill_formula_error',
          severity: 'warning',
          message: 'Formula parsing warning',
          context: { trechoId: 'schema-test-trecho', skillId: 10, formula: 'a.atk * 4' },
        })
      );

      const report = reporter.generateReport({
        version: '1.0.0',
        generatedAt: new Date('2026-01-05T15:30:00.000Z'),
        seed: 99999,
        projectPath: '/test/path',
      });

      const outputPath = path.join(tempDir, 'schema-validated-report.json');
      await reporter.writeReport(report, outputPath);

      const fileContent = fs.readFileSync(outputPath, 'utf-8');
      const parsedReport = JSON.parse(fileContent);

      // This should not throw - validates entire schema
      const validated = ReportSchema.parse(parsedReport);

      // Verify all required fields are present
      expect(validated.timestamp).toBeDefined();
      expect(validated.seed).toBe(99999);
      expect(validated.projectPath).toBe('/test/path');
      expect(validated.summary).toBeDefined();
      expect(validated.trechos).toHaveLength(1);

      const trecho = validated.trechos[0]!;
      expect(trecho.trechoId).toBe('schema-test-trecho');
      expect(trecho.results).toHaveLength(1);
      expect(trecho.aggregates).toBeDefined();
      expect(trecho.warnings).toHaveLength(1);
    });
  });
});
