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
    generatedAt: new Date('2026-01-05T10:00:00.000Z'),
    seed: 12345,
    projectPath: '/test/project',
  });

  beforeEach(() => {
    reporter = new JsonReporter();
    tempDir = path.join(__dirname, '..', '..', '..', '..', '..', 'temp', 'unit-reporter-tests');
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
    it('should handle empty results gracefully', () => {
      const report = reporter.generateReport(createMetadata());

      expect(report.trechos).toHaveLength(0);
      expect(report.summary.totalBattles).toBe(0);
      expect(report.summary.totalTrechos).toBe(0);
    });

    it('should preserve metadata exactly', () => {
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

  describe('percentile calculation', () => {
    it('should handle p95 calculation for single value', () => {
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

    it('should handle p95 with linear interpolation edge case', () => {
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
