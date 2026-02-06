import { ReportFakeBuilder, WarningFakeBuilder, BattleResultFakeBuilder } from '../../../fakes';

describe('Report', () => {
  describe('constructor', () => {
    it('should create report with valid data', () => {
      const report = new ReportFakeBuilder()
        .withPassedTrecho()
        .withWarning(new WarningFakeBuilder()
          .withTtkOutOfTolerance(1, 12, 10)
          .withMessage('TTK outside tolerance window')
          .build())
        .build();

      expect(report.metadata.version).toBe('1.0.0');
      expect(report.metadata.seed).toBe(12345);
      expect(report.trechos).toHaveLength(1);
      expect(report.warnings).toHaveLength(1);
    });

    describe('edge cases', () => {
      it('should handle empty trechos', () => {
        const report = new ReportFakeBuilder().withNoTrechos().build();
        expect(report.trechos).toHaveLength(0);
      });

      it('should handle empty warnings', () => {
        const report = new ReportFakeBuilder()
          .withPassedTrecho()
          .build();
        expect(report.warnings).toHaveLength(0);
      });

      it('should create report with multiple trechos', () => {
        const report = new ReportFakeBuilder()
          .withPassedTrecho('ato1-nivel1-10', 'Ato 1 - Níveis 1-10')
          .withTrechoSummary('ato2-nivel11-20', 'Ato 2 - Níveis 11-20', false, undefined, {
            avgTtkTurns: 4.5,
            p95TtkTurns: 5.5,
            avgTtkActions: 12.0,
            p95TtkActions: 14.0,
          })
          .build();

        expect(report.trechos).toHaveLength(2);
        expect(report.trechos[0]?.trechoId).toBe('ato1-nivel1-10');
        expect(report.trechos[1]?.trechoId).toBe('ato2-nivel11-20');
      });

      it('should create report with multiple warnings', () => {
        const warnings = [
          new WarningFakeBuilder()
            .withTtkOutOfTolerance(1, 12, 10)
            .withMessage('TTK outside tolerance')
            .build(),
          new WarningFakeBuilder()
            .withBattleTimeout(2, 50)
            .withCriticalSeverity()
            .withMessage('Battle timed out')
            .build(),
        ];

        const report = new ReportFakeBuilder()
          .withPassedTrecho()
          .withWarnings(warnings)
          .build();

        expect(report.warnings).toHaveLength(2);
        expect(report.warnings[0]?.type).toBe('ttk_out_of_tolerance');
        expect(report.warnings[1]?.type).toBe('battle_timeout');
      });
    });
  });

  describe('overallPassed', () => {
    describe('should correctly calculate overallPassed status', () => {
      it('should be true when all trechos passed', () => {
        const report = new ReportFakeBuilder()
          .withPassedTrecho()
          .withPassedTrecho()
          .build();

        expect(report.overallPassed).toBe(true);
      });

      it('should be false when any trecho failed', () => {
        const report = new ReportFakeBuilder()
          .withPassedTrecho()
          .withFailedTrecho()
          .build();

        expect(report.overallPassed).toBe(false);
      });

      it('should be false when all trechos failed', () => {
        const report = new ReportFakeBuilder()
          .withFailedTrecho()
          .withFailedTrecho()
          .build();

        expect(report.overallPassed).toBe(false);
      });

      it('should be true when no trechos (empty report)', () => {
        const report = new ReportFakeBuilder().withNoTrechos().build();
        expect(report.overallPassed).toBe(true);
      });

      it('should be independent of warnings', () => {
        const report = new ReportFakeBuilder()
          .withPassedTrecho()
          .withWarning(new WarningFakeBuilder()
            .withTtkOutOfTolerance()
            .build())
          .withWarning(new WarningFakeBuilder()
            .withBattleTimeout()
            .build())
          .build();

        // Warnings don't affect overallPassed status
        expect(report.overallPassed).toBe(true);
        expect(report.warnings).toHaveLength(2);
      });
    });
  });

  describe('immutability', () => {
    it('should freeze the report object', () => {
      const report = new ReportFakeBuilder()
        .withPassedTrecho()
        .build();

      expect(Object.isFrozen(report)).toBe(true);
    });

    it('should not share reference with input metadata', () => {
      const report = new ReportFakeBuilder()
        .withSeed(12345)
        .withPassedTrecho()
        .build();

      // Build another report with different seed
      const report2 = new ReportFakeBuilder()
        .withSeed(99999)
        .withPassedTrecho()
        .build();

      // First report metadata should be unchanged
      expect(report.metadata.seed).toBe(12345);
      expect(report2.metadata.seed).toBe(99999);
    });

    it('should not share reference with input trechos', () => {
      const report = new ReportFakeBuilder()
        .withPassedTrecho()
        .build();

      // Add another trecho via new builder
      const report2 = new ReportFakeBuilder()
        .withPassedTrecho()
        .withPassedTrecho('ato2-nivel11-20', 'Ato 2')
        .build();

      // First report trechos should be unchanged
      expect(report.trechos).toHaveLength(1);
      expect(report2.trechos).toHaveLength(2);
    });

    it('should not share reference with input warnings', () => {
      const warning = new WarningFakeBuilder()
        .withTtkOutOfTolerance()
        .build();

      const report = new ReportFakeBuilder()
        .withPassedTrecho()
        .withWarning(warning)
        .build();

      // Add another warning via new builder
      const report2 = new ReportFakeBuilder()
        .withPassedTrecho()
        .withWarning(warning)
        .withWarning(new WarningFakeBuilder()
          .withBattleTimeout()
          .build())
        .build();

      // First report warnings should be unchanged
      expect(report.warnings).toHaveLength(1);
      expect(report2.warnings).toHaveLength(2);
    });
  });

  describe('data integrity', () => {
    it('should preserve metadata timestamp as Date object', () => {
      const timestamp = new Date('2025-01-04T12:00:00.000Z');
      const report = new ReportFakeBuilder()
        .withGeneratedAt(timestamp)
        .withNoTrechos()
        .build();

      expect(report.metadata.generatedAt).toBeInstanceOf(Date);
      expect(report.metadata.generatedAt.toISOString()).toBe('2025-01-04T12:00:00.000Z');
    });

    it('should preserve all trecho summary properties', () => {
      const report = new ReportFakeBuilder()
        .withTrechoSummary('test-id', 'Test Name', true, [new BattleResultFakeBuilder().build()], {
          avgTtkTurns: 5.5,
          p95TtkTurns: 6.5,
          avgTtkActions: 15.25,
          p95TtkActions: 18.0,
        })
        .build();

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
