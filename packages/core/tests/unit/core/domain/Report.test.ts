import {
  Report,
  ReportData,
  ReportMetadata,
  ReportSummary,
  TrechoSummary,
  TrechoAggregates,
} from '@coreto/core/core/domain/Report.js';
import { BattleResult } from '@coreto/core/core/domain/BattleResult.js';
import type { Warning } from '@coreto/core/core/ports/IReporter.js';

describe('Report', () => {
  const createValidMetadata = (): ReportMetadata => ({
    version: '1.0.0',
    generatedAt: new Date('2025-01-04T12:00:00.000Z'),
    seed: 12345,
    projectPath: '/path/to/project',
  });

  const createValidSummary = (): ReportSummary => ({
    executionTimeMs: 1500,
    totalTrechos: 1,
    totalBattles: 1,
    totalWarnings: 0,
    warningsByType: {},
    successRate: 1.0,
    peakMemoryMB: 128.5,
  });

  const createValidAggregates = (): TrechoAggregates => ({
    avgTtkTurns: 3.2,
    p95TtkTurns: 4.0,
    avgTtkActions: 8.5,
    p95TtkActions: 10.0,
  });

  const createValidBattleResult = (): BattleResult =>
    new BattleResult({
      troopId: 1,
      troopName: 'Goblin Pack',
      outcome: 'victory',
      ttkTurns: 3,
      ttkActions: 8,
      durationMs: 1250,
      seed: 12345,
    });

  const createValidTrechoSummary = (passed: boolean = true): TrechoSummary => ({
    trechoId: 'ato1-nivel1-10',
    trechoName: 'Ato 1 - Níveis 1-10',
    battles: [createValidBattleResult()],
    aggregates: createValidAggregates(),
    warnings: [],
    passed,
  });

  const createValidWarning = (): Warning => ({
    type: 'ttk_out_of_tolerance',
    severity: 'warning',
    message: 'TTK outside tolerance window',
    context: { troopId: 1 },
  });

  describe('constructor', () => {
    it('should create report with valid data', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        summary: createValidSummary(),
        trechos: [createValidTrechoSummary()],
        warnings: [createValidWarning()],
      };

      const report = new Report(data);

      expect(report.metadata.version).toBe('1.0.0');
      expect(report.metadata.seed).toBe(12345);
      expect(report.trechos).toHaveLength(1);
      expect(report.warnings).toHaveLength(1);
    });

    describe('edge cases', () => {
      it('should handle empty trechos', () => {
        const data: ReportData = {
          metadata: createValidMetadata(),
          summary: createValidSummary(),
          trechos: [],
          warnings: [],
        };

        const report = new Report(data);
        expect(report.trechos).toHaveLength(0);
      });

      it('should handle empty warnings', () => {
        const data: ReportData = {
          metadata: createValidMetadata(),
          summary: createValidSummary(),
          trechos: [createValidTrechoSummary()],
          warnings: [],
        };

        const report = new Report(data);
        expect(report.warnings).toHaveLength(0);
      });

      it('should create report with multiple trechos', () => {
        const data: ReportData = {
          metadata: createValidMetadata(),
          summary: createValidSummary(),
          trechos: [
            createValidTrechoSummary(),
            {
              trechoId: 'ato2-nivel11-20',
              trechoName: 'Ato 2 - Níveis 11-20',
              battles: [createValidBattleResult()],
              aggregates: {
                avgTtkTurns: 4.5,
                p95TtkTurns: 5.5,
                avgTtkActions: 12.0,
                p95TtkActions: 14.0,
              },
              warnings: [],
              passed: false,
            },
          ],
          warnings: [],
        };

        const report = new Report(data);

        expect(report.trechos).toHaveLength(2);
        expect(report.trechos[0]?.trechoId).toBe('ato1-nivel1-10');
        expect(report.trechos[1]?.trechoId).toBe('ato2-nivel11-20');
      });

      it('should create report with multiple warnings', () => {
        const warnings: Warning[] = [
          {
            type: 'ttk_out_of_tolerance',
            severity: 'warning',
            message: 'TTK outside tolerance',
            context: { troopId: 1 },
          },
          {
            type: 'battle_timeout',
            severity: 'critical',
            message: 'Battle timed out',
            context: { troopId: 2 },
          },
        ];

        const data: ReportData = {
          metadata: createValidMetadata(),
          summary: createValidSummary(),
          trechos: [createValidTrechoSummary()],
          warnings,
        };

        const report = new Report(data);

        expect(report.warnings).toHaveLength(2);
        expect(report.warnings[0]?.type).toBe('ttk_out_of_tolerance');
        expect(report.warnings[1]?.type).toBe('battle_timeout');
      });
    });
  });

  describe('overallPassed', () => {
    describe('should correctly calculate overallPassed status', () => {
      it('should be true when all trechos passed', () => {
        const data: ReportData = {
          metadata: createValidMetadata(),
          summary: createValidSummary(),
          trechos: [createValidTrechoSummary(true), createValidTrechoSummary(true)],
          warnings: [],
        };

        const report = new Report(data);
        expect(report.overallPassed).toBe(true);
      });

      it('should be false when any trecho failed', () => {
        const data: ReportData = {
          metadata: createValidMetadata(),
          summary: createValidSummary(),
          trechos: [createValidTrechoSummary(true), createValidTrechoSummary(false)],
          warnings: [],
        };

        const report = new Report(data);
        expect(report.overallPassed).toBe(false);
      });

      it('should be false when all trechos failed', () => {
        const data: ReportData = {
          metadata: createValidMetadata(),
          summary: createValidSummary(),
          trechos: [createValidTrechoSummary(false), createValidTrechoSummary(false)],
          warnings: [],
        };

        const report = new Report(data);
        expect(report.overallPassed).toBe(false);
      });

      it('should be true when no trechos (empty report)', () => {
        const data: ReportData = {
          metadata: createValidMetadata(),
          summary: createValidSummary(),
          trechos: [],
          warnings: [],
        };

        const report = new Report(data);
        expect(report.overallPassed).toBe(true);
      });

      it('should be independent of warnings', () => {
        const data: ReportData = {
          metadata: createValidMetadata(),
          summary: createValidSummary(),
          trechos: [createValidTrechoSummary(true)],
          warnings: [createValidWarning(), createValidWarning()],
        };

        const report = new Report(data);

        // Warnings don't affect overallPassed status
        expect(report.overallPassed).toBe(true);
        expect(report.warnings).toHaveLength(2);
      });
    });
  });

  describe('immutability', () => {
    it('should freeze the report object', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        summary: createValidSummary(),
        trechos: [createValidTrechoSummary()],
        warnings: [],
      };

      const report = new Report(data);

      expect(Object.isFrozen(report)).toBe(true);
    });

    it('should not share reference with input metadata', () => {
      const metadata = createValidMetadata();
      const data: ReportData = {
        metadata,
        summary: createValidSummary(),
        trechos: [createValidTrechoSummary()],
        warnings: [],
      };

      const report = new Report(data);

      // Mutate original metadata
      (metadata as any).seed = 99999;

      // Report metadata should be unchanged
      expect(report.metadata.seed).toBe(12345);
    });

    it('should not share reference with input trechos', () => {
      const trechos = [createValidTrechoSummary()];
      const data: ReportData = {
        metadata: createValidMetadata(),
        summary: createValidSummary(),
        trechos,
        warnings: [],
      };

      const report = new Report(data);

      // Mutate original trechos
      trechos.push(createValidTrechoSummary());

      // Report trechos should be unchanged
      expect(report.trechos).toHaveLength(1);
    });

    it('should not share reference with input warnings', () => {
      const warnings = [createValidWarning()];
      const data: ReportData = {
        metadata: createValidMetadata(),
        summary: createValidSummary(),
        trechos: [createValidTrechoSummary()],
        warnings,
      };

      const report = new Report(data);

      // Mutate original warnings
      warnings.push(createValidWarning());

      // Report warnings should be unchanged
      expect(report.warnings).toHaveLength(1);
    });
  });

  describe('data integrity', () => {
    it('should preserve metadata timestamp as Date object', () => {
      const timestamp = new Date('2025-01-04T12:00:00.000Z');
      const data: ReportData = {
        metadata: {
          version: '1.0.0',
          generatedAt: timestamp,
          seed: 12345,
          projectPath: '/path/to/project',
        },
        summary: createValidSummary(),
        trechos: [],
        warnings: [],
      };

      const report = new Report(data);

      expect(report.metadata.generatedAt).toBeInstanceOf(Date);
      expect(report.metadata.generatedAt.toISOString()).toBe('2025-01-04T12:00:00.000Z');
    });

    it('should preserve all trecho summary properties', () => {
      const summary: TrechoSummary = {
        trechoId: 'test-id',
        trechoName: 'Test Name',
        battles: [createValidBattleResult()],
        aggregates: {
          avgTtkTurns: 5.5,
          p95TtkTurns: 6.5,
          avgTtkActions: 15.25,
          p95TtkActions: 18.0,
        },
        warnings: [],
        passed: true,
      };

      const data: ReportData = {
        metadata: createValidMetadata(),
        summary: createValidSummary(),
        trechos: [summary],
        warnings: [],
      };

      const report = new Report(data);

      expect(report.trechos[0]).toMatchObject({
        trechoId: 'test-id',
        trechoName: 'Test Name',
        aggregates: {
          avgTtkTurns: 5.5,
          avgTtkActions: 15.25,
        },
        passed: true,
      });
      expect(report.trechos[0]?.battles).toHaveLength(1);
    });
  });
});
