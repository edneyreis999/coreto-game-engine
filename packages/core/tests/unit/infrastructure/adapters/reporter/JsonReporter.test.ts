/**
 * Unit tests for JsonReporter
 *
 * Tests aggregation logic, metrics calculation, and report serialization.
 */

import * as fs from 'fs';
import * as path from 'path';
import { JsonReporter } from '@coreto/core/infrastructure/adapters/reporter/JsonReporter.js';
import { BattleResult } from '@coreto/core/core/domain/BattleResult.js';
import { Warning } from '@coreto/core/core/domain/Warning.js';
import { FileSystemError } from '@coreto/core/core/errors/index.js';
import type { ReportMetadata } from '@coreto/core/core/domain/Report.js';

describe('JsonReporter', () => {
  let reporter: JsonReporter;
  let tempDir: string;

  /**
   * Helper to create valid ReportMetadata
   */
  const createMetadata = (): ReportMetadata => ({
    version: '1.0.0',
    generatedAt: new Date(),
    seed: 12345,
    projectPath: '/path/to/project',
  });

  beforeEach(() => {
    reporter = new JsonReporter();
    tempDir = path.join(__dirname, '..', '..', '..', '..', '..', 'temp', 'reporter-tests');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('addBattleResult', () => {
    it('should collect battle results per trecho', () => {
      const result1 = new BattleResult({
        troopId: 1,
        troopName: 'Troop 1',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 12345,
      });

      const result2 = new BattleResult({
        troopId: 2,
        troopName: 'Troop 2',
        outcome: 'victory',
        ttkTurns: 5,
        ttkActions: 12,
        durationMs: 1500,
        seed: 12345,
      });

      reporter.addBattleResult('ato1-nivel1-10', result1);
      reporter.addBattleResult('ato1-nivel1-10', result2);

      const report = reporter.generateReport(createMetadata());

      const trecho = report.trechos.find((t) => t.trechoId === 'ato1-nivel1-10');
      expect(trecho).toBeDefined();
      expect(trecho!.battles).toHaveLength(2);
    });

    it('should segregate results by trecho', () => {
      const result1 = new BattleResult({
        troopId: 1,
        troopName: 'Troop 1',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 12345,
      });

      const result2 = new BattleResult({
        troopId: 2,
        troopName: 'Troop 2',
        outcome: 'victory',
        ttkTurns: 5,
        ttkActions: 12,
        durationMs: 1500,
        seed: 12345,
      });

      reporter.addBattleResult('ato1-nivel1-10', result1);
      reporter.addBattleResult('ato2-nivel11-20', result2);

      const report = reporter.generateReport(createMetadata());

      expect(report.trechos).toHaveLength(2);
      expect(report.trechos[0]!.trechoId).toBe('ato1-nivel1-10');
      expect(report.trechos[1]!.trechoId).toBe('ato2-nivel11-20');
    });
  });

  describe('addWarning', () => {
    it('should collect warnings with trechoId in context', () => {
      const warning = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'TTK fora da tolerância',
        context: { trechoId: 'ato1-nivel1-10', troopId: 1 },
      });

      reporter.addWarning(warning);

      const report = reporter.generateReport(createMetadata());

      const trecho = report.trechos.find((t) => t.trechoId === 'ato1-nivel1-10');
      expect(trecho).toBeDefined();
      expect(trecho!.warnings).toHaveLength(1);
      expect(trecho!.warnings[0]!.type).toBe('ttk_out_of_tolerance');
    });

    it('should collect global warnings without trechoId', () => {
      const warning = new Warning({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Troop not found',
        context: { troopId: 999 },
      });

      reporter.addWarning(warning);

      const report = reporter.generateReport(createMetadata());

      // Global warnings should not be in trecho warnings
      expect(report.trechos).toHaveLength(0);
    });
  });

  describe('generateReport', () => {
    it('should calculate avgTtkTurns correctly', () => {
      const result1 = new BattleResult({
        troopId: 1,
        troopName: 'Troop 1',
        outcome: 'victory',
        ttkTurns: 2,
        ttkActions: 5,
        durationMs: 1000,
        seed: 12345,
      });

      const result2 = new BattleResult({
        troopId: 2,
        troopName: 'Troop 2',
        outcome: 'victory',
        ttkTurns: 4,
        ttkActions: 10,
        durationMs: 1500,
        seed: 12345,
      });

      const result3 = new BattleResult({
        troopId: 3,
        troopName: 'Troop 3',
        outcome: 'victory',
        ttkTurns: 6,
        ttkActions: 15,
        durationMs: 2000,
        seed: 12345,
      });

      reporter.addBattleResult('ato1-nivel1-10', result1);
      reporter.addBattleResult('ato1-nivel1-10', result2);
      reporter.addBattleResult('ato1-nivel1-10', result3);

      const report = reporter.generateReport(createMetadata());

      const trecho = report.trechos[0]!;
      expect(trecho.aggregates.avgTtkTurns).toBe(4); // (2 + 4 + 6) / 3
      expect(trecho.aggregates.avgTtkActions).toBe(10); // (5 + 10 + 15) / 3
    });

    it('should calculate p95TtkTurns correctly', () => {
      // Create 100 results with TTK from 1 to 100
      const results = Array.from({ length: 100 }, (_, i) => {
        const ttkTurns = i + 1;
        return new BattleResult({
          troopId: i + 1,
          troopName: `Troop ${i + 1}`,
          outcome: 'victory',
          ttkTurns,
          ttkActions: ttkTurns * 2,
          durationMs: 1000,
          seed: 12345,
        });
      });

      results.forEach((r) => reporter.addBattleResult('ato1-nivel1-10', r));

      const report = reporter.generateReport(createMetadata());

      const trecho = report.trechos[0]!;
      // P95 of [1..100] should be 95 (or close, depending on interpolation)
      expect(trecho.aggregates.p95TtkTurns).toBeCloseTo(95, 0);
    });

    it('should handle empty results gracefully', () => {
      const report = reporter.generateReport(createMetadata());

      expect(report.trechos).toHaveLength(0);
      expect(report.summary.totalBattles).toBe(0);
      expect(report.summary.totalTrechos).toBe(0);
    });

    it('should calculate summary correctly', () => {
      const result1 = new BattleResult({
        troopId: 1,
        troopName: 'Troop 1',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 12345,
      });

      const result2 = new BattleResult({
        troopId: 2,
        troopName: 'Troop 2',
        outcome: 'victory',
        ttkTurns: 5,
        ttkActions: 12,
        durationMs: 1500,
        seed: 12345,
      });

      reporter.addBattleResult('ato1-nivel1-10', result1);
      reporter.addBattleResult('ato2-nivel11-20', result2);

      const warning = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'TTK out of tolerance',
        context: { trechoId: 'ato1-nivel1-10', troopId: 1 },
      });

      reporter.addWarning(warning);

      const report = reporter.generateReport(createMetadata());

      expect(report.summary.totalTrechos).toBe(2);
      expect(report.summary.totalBattles).toBe(2);
      expect(report.summary.totalWarnings).toBe(1);
      expect(report.summary.warningsByType['ttk_out_of_tolerance']).toBe(1);
    });

    it('should calculate successRate correctly', () => {
      const result1 = new BattleResult({
        troopId: 1,
        troopName: 'Troop 1',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 12345,
      });

      const result2 = new BattleResult({
        troopId: 2,
        troopName: 'Troop 2',
        outcome: 'victory',
        ttkTurns: 5,
        ttkActions: 12,
        durationMs: 1500,
        seed: 12345,
      });

      reporter.addBattleResult('ato1-nivel1-10', result1);
      reporter.addBattleResult('ato2-nivel11-20', result2);

      // Add non-critical warning (should not affect success rate)
      const warning = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'TTK out of tolerance',
        context: { trechoId: 'ato1-nivel1-10', troopId: 1 },
      });

      reporter.addWarning(warning);

      const report = reporter.generateReport(createMetadata());

      // Both trechos have no critical warnings, so success rate should be 100%
      expect(report.summary.successRate).toBe(1.0);
    });

    it('should calculate successRate with critical warnings', () => {
      const result1 = new BattleResult({
        troopId: 1,
        troopName: 'Troop 1',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 12345,
      });

      const result2 = new BattleResult({
        troopId: 2,
        troopName: 'Troop 2',
        outcome: 'victory',
        ttkTurns: 5,
        ttkActions: 12,
        durationMs: 1500,
        seed: 12345,
      });

      reporter.addBattleResult('ato1-nivel1-10', result1);
      reporter.addBattleResult('ato2-nivel11-20', result2);

      // Add critical warning to ato1
      const criticalWarning = new Warning({
        type: 'battle_timeout',
        severity: 'critical',
        message: 'Battle timeout',
        context: { trechoId: 'ato1-nivel1-10', troopId: 1 },
      });

      reporter.addWarning(criticalWarning);

      const report = reporter.generateReport(createMetadata());

      // ato1 has critical warning (1 battle failed), ato2 is ok (1 battle passed)
      // Success rate: 1 / 2 = 0.5
      expect(report.summary.successRate).toBe(0.5);
    });

    it('should include metadata in report', () => {
      const metadata = createMetadata();

      const report = reporter.generateReport(metadata);

      expect(report.metadata.version).toBe(metadata.version);
      expect(report.metadata.generatedAt).toBe(metadata.generatedAt);
      expect(report.metadata.seed).toBe(metadata.seed);
      expect(report.metadata.projectPath).toBe(metadata.projectPath);
    });
  });

  describe('writeReport', () => {
    it('should write report to JSON file', async () => {
      const result = new BattleResult({
        troopId: 1,
        troopName: 'Troop 1',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 12345,
      });

      reporter.addBattleResult('ato1-nivel1-10', result);

      const report = reporter.generateReport(createMetadata());

      const outputPath = path.join(tempDir, 'report.json');
      await reporter.writeReport(report, outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);

      const fileContent = fs.readFileSync(outputPath, 'utf-8');
      const parsedReport = JSON.parse(fileContent);

      expect(parsedReport.seed).toBe(12345);
      expect(parsedReport.trechos).toHaveLength(1);
    });

    it('should create output directory if not exists', async () => {
      const result = new BattleResult({
        troopId: 1,
        troopName: 'Troop 1',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 12345,
      });

      reporter.addBattleResult('ato1-nivel1-10', result);

      const report = reporter.generateReport(createMetadata());

      const outputPath = path.join(tempDir, 'nested', 'deep', 'report.json');
      await reporter.writeReport(report, outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should throw FileSystemError on write failure', async () => {
      const result = new BattleResult({
        troopId: 1,
        troopName: 'Troop 1',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 12345,
      });

      reporter.addBattleResult('ato1-nivel1-10', result);

      const report = reporter.generateReport(createMetadata());

      // Try to write to invalid path
      const invalidPath = '/invalid/path/that/does/not/exist/report.json';

      await expect(reporter.writeReport(report, invalidPath)).rejects.toThrow(
        FileSystemError
      );
    });

    it('should format JSON with indentation', async () => {
      const result = new BattleResult({
        troopId: 1,
        troopName: 'Troop 1',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 12345,
      });

      reporter.addBattleResult('ato1-nivel1-10', result);

      const report = reporter.generateReport(createMetadata());

      const outputPath = path.join(tempDir, 'report.json');
      await reporter.writeReport(report, outputPath);

      const fileContent = fs.readFileSync(outputPath, 'utf-8');

      // Should have newlines and indentation
      expect(fileContent).toContain('\n');
      expect(fileContent).toContain('  '); // 2-space indentation
    });
  });

  describe('exportContext', () => {
    it('should export summary.json and trecho files', async () => {
      const result1 = new BattleResult({
        troopId: 1,
        troopName: 'Troop 1',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 12345,
      });

      const result2 = new BattleResult({
        troopId: 2,
        troopName: 'Troop 2',
        outcome: 'victory',
        ttkTurns: 5,
        ttkActions: 12,
        durationMs: 1500,
        seed: 12345,
      });

      reporter.addBattleResult('ato1-nivel1-10', result1);
      reporter.addBattleResult('ato2-nivel11-20', result2);

      const report = reporter.generateReport(createMetadata());

      const outputDir = path.join(tempDir, 'context');
      await reporter.exportContext(report, outputDir);

      // Check summary.json exists
      const summaryPath = path.join(outputDir, 'summary.json');
      expect(fs.existsSync(summaryPath)).toBe(true);

      // Check trecho files exist
      const trecho1Path = path.join(outputDir, 'trecho-ato1-nivel1-10.json');
      const trecho2Path = path.join(outputDir, 'trecho-ato2-nivel11-20.json');
      expect(fs.existsSync(trecho1Path)).toBe(true);
      expect(fs.existsSync(trecho2Path)).toBe(true);
    });

    it('should create output directory if not exists', async () => {
      const result = new BattleResult({
        troopId: 1,
        troopName: 'Troop 1',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 12345,
      });

      reporter.addBattleResult('ato1-nivel1-10', result);

      const report = reporter.generateReport(createMetadata());

      const outputDir = path.join(tempDir, 'nested', 'context');
      await reporter.exportContext(report, outputDir);

      expect(fs.existsSync(outputDir)).toBe(true);
    });
  });

  describe('percentile calculation', () => {
    it('should calculate p95 for single value', () => {
      const result = new BattleResult({
        troopId: 1,
        troopName: 'Troop 1',
        outcome: 'victory',
        ttkTurns: 5,
        ttkActions: 10,
        durationMs: 1000,
        seed: 12345,
      });

      reporter.addBattleResult('ato1-nivel1-10', result);

      const report = reporter.generateReport(createMetadata());

      const trecho = report.trechos[0]!;
      expect(trecho.aggregates.p95TtkTurns).toBe(5);
      expect(trecho.aggregates.p95TtkActions).toBe(10);
    });

    it('should calculate p95 with linear interpolation', () => {
      // Values: [1, 2, 3, 4, 5]
      // P95 index = 0.95 * (5 - 1) = 3.8
      // Interpolation: values[3] + 0.8 * (values[4] - values[3]) = 4 + 0.8 * 1 = 4.8
      const values = [1, 2, 3, 4, 5];
      const results = values.map(
        (v) =>
          new BattleResult({
            troopId: v,
            troopName: `Troop ${v}`,
            outcome: 'victory',
            ttkTurns: v,
            ttkActions: v * 2,
            durationMs: 1000,
            seed: 12345,
          })
      );

      results.forEach((r) => reporter.addBattleResult('ato1-nivel1-10', r));

      const report = reporter.generateReport(createMetadata());

      const trecho = report.trechos[0]!;
      expect(trecho.aggregates.p95TtkTurns).toBeCloseTo(4.8, 1);
    });
  });
});
