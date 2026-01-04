import {
  Report,
  ReportData,
  ReportMetadata,
  TrechoSummary,
} from '@/core/domain/Report.js';
import { BattleResult } from '@/core/domain/BattleResult.js';
import type { Warning } from '@/core/ports/IReporter.js';

describe('Report', () => {
  const createValidMetadata = (): ReportMetadata => ({
    version: '1.0.0',
    generatedAt: new Date('2025-01-04T12:00:00.000Z'),
    seed: 12345,
    projectPath: '/path/to/project',
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
    avgTtkTurns: 3.2,
    avgTtkActions: 8.5,
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
        trechos: [createValidTrechoSummary()],
        warnings: [createValidWarning()],
      };

      const report = new Report(data);

      expect(report.metadata.version).toBe('1.0.0');
      expect(report.metadata.seed).toBe(12345);
      expect(report.trechos).toHaveLength(1);
      expect(report.warnings).toHaveLength(1);
    });

    it('should create report with empty trechos', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [],
        warnings: [],
      };

      const report = new Report(data);

      expect(report.trechos).toHaveLength(0);
    });

    it('should create report with empty warnings', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [createValidTrechoSummary()],
        warnings: [],
      };

      const report = new Report(data);

      expect(report.warnings).toHaveLength(0);
    });

    it('should create report with multiple trechos', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [
          createValidTrechoSummary(),
          {
            trechoId: 'ato2-nivel11-20',
            trechoName: 'Ato 2 - Níveis 11-20',
            battles: [createValidBattleResult()],
            avgTtkTurns: 4.5,
            avgTtkActions: 12.0,
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
        trechos: [createValidTrechoSummary()],
        warnings,
      };

      const report = new Report(data);

      expect(report.warnings).toHaveLength(2);
      expect(report.warnings[0]?.type).toBe('ttk_out_of_tolerance');
      expect(report.warnings[1]?.type).toBe('battle_timeout');
    });
  });

  describe('overallPassed', () => {
    it('should be true when all trechos passed', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [
          createValidTrechoSummary(true),
          createValidTrechoSummary(true),
        ],
        warnings: [],
      };

      const report = new Report(data);

      expect(report.overallPassed).toBe(true);
    });

    it('should be false when any trecho failed', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [
          createValidTrechoSummary(true),
          createValidTrechoSummary(false),
        ],
        warnings: [],
      };

      const report = new Report(data);

      expect(report.overallPassed).toBe(false);
    });

    it('should be false when all trechos failed', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [
          createValidTrechoSummary(false),
          createValidTrechoSummary(false),
        ],
        warnings: [],
      };

      const report = new Report(data);

      expect(report.overallPassed).toBe(false);
    });

    it('should be true when no trechos (empty report)', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [],
        warnings: [],
      };

      const report = new Report(data);

      // Empty array: every() returns true
      expect(report.overallPassed).toBe(true);
    });

    it('should calculate overallPassed independently of warnings', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [createValidTrechoSummary(true)],
        warnings: [createValidWarning(), createValidWarning()],
      };

      const report = new Report(data);

      // Warnings don't affect overallPassed status
      expect(report.overallPassed).toBe(true);
      expect(report.warnings).toHaveLength(2);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [createValidTrechoSummary()],
        warnings: [],
      };

      const report = new Report(data);

      expect(Object.isFrozen(report)).toBe(true);
    });

    it('should have frozen metadata', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [createValidTrechoSummary()],
        warnings: [],
      };

      const report = new Report(data);

      expect(Object.isFrozen(report.metadata)).toBe(true);
    });

    it('should have frozen trechos array', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [createValidTrechoSummary()],
        warnings: [],
      };

      const report = new Report(data);

      expect(Object.isFrozen(report.trechos)).toBe(true);
    });

    it('should have frozen each trecho summary', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [createValidTrechoSummary()],
        warnings: [],
      };

      const report = new Report(data);

      report.trechos.forEach((trecho) => {
        expect(Object.isFrozen(trecho)).toBe(true);
      });
    });

    it('should have frozen warnings array', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [createValidTrechoSummary()],
        warnings: [createValidWarning()],
      };

      const report = new Report(data);

      expect(Object.isFrozen(report.warnings)).toBe(true);
    });

    it('should not allow modification of trechos array', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [createValidTrechoSummary()],
        warnings: [],
      };

      const report = new Report(data);

      expect(() => {
        (report.trechos as TrechoSummary[]).push(createValidTrechoSummary());
      }).toThrow();
    });

    it('should not allow modification of warnings array', () => {
      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [createValidTrechoSummary()],
        warnings: [],
      };

      const report = new Report(data);

      expect(() => {
        (report.warnings as Warning[]).push(createValidWarning());
      }).toThrow();
    });

    it('should not share reference with input metadata', () => {
      const metadata = createValidMetadata();
      const data: ReportData = {
        metadata,
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
        avgTtkTurns: 5.5,
        avgTtkActions: 15.25,
        passed: true,
      };

      const data: ReportData = {
        metadata: createValidMetadata(),
        trechos: [summary],
        warnings: [],
      };

      const report = new Report(data);

      expect(report.trechos[0]).toMatchObject({
        trechoId: 'test-id',
        trechoName: 'Test Name',
        avgTtkTurns: 5.5,
        avgTtkActions: 15.25,
        passed: true,
      });
      expect(report.trechos[0]?.battles).toHaveLength(1);
    });
  });
});
