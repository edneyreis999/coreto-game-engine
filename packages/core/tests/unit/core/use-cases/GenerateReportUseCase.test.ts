import 'reflect-metadata';
import { GenerateReportUseCase, GenerateReportInput } from '@coreto/core/core/use-cases/GenerateReportUseCase.js';
import { Report } from '@coreto/core/core/domain/Report.js';
import { TEST_CONSTANTS } from '../../../fixtures/test-constants.js';
import {
  BattleResultFakeBuilder,
  WarningFakeBuilder,
  TrechoValidationResultFakeBuilder,
  FakeReporter,
} from '../../../fakes/index.js';
import { ReportMetadataFakeBuilder } from '../../../fixtures/builders/ReportMetadataFakeBuilder.js';

describe('GenerateReportUseCase', () => {
  describe('execute', () => {
    it('should create report with correct metadata', () => {
      // Arrange
      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const reporter = new FakeReporter();
      const useCase = new GenerateReportUseCase(reporter);

      const input: GenerateReportInput = {
        metadata,
        trechoResults: [new TrechoValidationResultFakeBuilder().build()],
        warnings: [],
      };

      // Act
      const report = useCase.execute(input);

      // Assert
      expect(report.metadata).toEqual(metadata);
    });

    it('should convert TrechoValidationResult to TrechoSummary', () => {
      // Arrange
      const battles = [
        new BattleResultFakeBuilder()
          .withTroopId(1)
          .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
          .build(),
        new BattleResultFakeBuilder()
          .withTroopId(2)
          .withTtkMetrics(4, 10)
          .build(),
      ];

      const trechoResult = new TrechoValidationResultFakeBuilder()
        .withTrechoId('ato1-nivel1-10')
        .withTrechoName('Ato 1 - Níveis 1-10')
        .withPassed(true)
        .withAvgTtk(3.5, 9)
        .withBattles(battles)
        .build();

      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const reporter = new FakeReporter();
      const useCase = new GenerateReportUseCase(reporter);

      const input: GenerateReportInput = {
        metadata,
        trechoResults: [trechoResult],
        warnings: [],
      };

      // Act
      const report = useCase.execute(input);

      // Assert
      expect(report.trechos).toHaveLength(1);
      expect(report.trechos[0]).toEqual({
        trechoId: 'ato1-nivel1-10',
        trechoName: 'Ato 1 - Níveis 1-10',
        battles,
        aggregates: {
          avgTtkTurns: 3.5,
          p95TtkTurns: 4, // 95th percentile of [3, 4]
          avgTtkActions: 9,
          p95TtkActions: 10, // 95th percentile of [8, 10]
        },
        warnings: [],
        passed: true,
      });
    });

    it('should include all warnings in report', () => {
      // Arrange
      const warnings = [
        new WarningFakeBuilder().withTtkOutOfTolerance(1).build(),
        new WarningFakeBuilder().withBattleTimeout(1, 10000).withCriticalSeverity().build(),
        new WarningFakeBuilder().withInfoSeverity().withType('skill_formula_error').build(),
      ];

      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const reporter = new FakeReporter();
      const useCase = new GenerateReportUseCase(reporter);

      const input: GenerateReportInput = {
        metadata,
        trechoResults: [new TrechoValidationResultFakeBuilder().build()],
        warnings,
      };

      // Act
      const report = useCase.execute(input);

      // Assert
      expect(report.warnings).toEqual(warnings);
      expect(report.warnings).toHaveLength(3);
    });

    it('should handle multiple trechos', () => {
      // Arrange
      const trechoResults = [
        new TrechoValidationResultFakeBuilder()
          .withTrechoId('ato1-nivel1-10')
          .withTrechoName('Ato 1 - Níveis 1-10')
          .build(),
        new TrechoValidationResultFakeBuilder()
          .withTrechoId('ato1-nivel11-20')
          .withTrechoName('Ato 1 - Níveis 11-20')
          .build(),
        new TrechoValidationResultFakeBuilder()
          .withTrechoId('ato2-nivel1-10')
          .withTrechoName('Ato 2 - Níveis 1-10')
          .build(),
      ];

      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const reporter = new FakeReporter();
      const useCase = new GenerateReportUseCase(reporter);

      const input: GenerateReportInput = {
        metadata,
        trechoResults,
        warnings: [],
      };

      // Act
      const report = useCase.execute(input);

      // Assert
      expect(report.trechos).toHaveLength(3);
      expect(report.trechos[0]?.trechoId).toBe('ato1-nivel1-10');
      expect(report.trechos[1]?.trechoId).toBe('ato1-nivel11-20');
      expect(report.trechos[2]?.trechoId).toBe('ato2-nivel1-10');
    });

    it('should handle empty trecho results', () => {
      // Arrange
      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const reporter = new FakeReporter();
      const useCase = new GenerateReportUseCase(reporter);

      const input: GenerateReportInput = {
        metadata,
        trechoResults: [],
        warnings: [],
      };

      // Act
      const report = useCase.execute(input);

      // Assert
      expect(report.trechos).toHaveLength(0);
      expect(report.warnings).toHaveLength(0);
    });

    it('should return immutable Report entity', () => {
      // Arrange
      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const reporter = new FakeReporter();
      const useCase = new GenerateReportUseCase(reporter);

      const input: GenerateReportInput = {
        metadata,
        trechoResults: [new TrechoValidationResultFakeBuilder().build()],
        warnings: [new WarningFakeBuilder().build()],
      };

      // Act
      const report = useCase.execute(input);

      // Assert
      expect(report).toBeInstanceOf(Report);
      expect(Object.isFrozen(report)).toBe(true);
    });

    it('should preserve battle results in trecho summaries', () => {
      // Arrange
      const battles = [
        new BattleResultFakeBuilder().withTroopId(1).withTroopName('Troop 1').build(),
        new BattleResultFakeBuilder().withTroopId(2).withTroopName('Troop 2').build(),
        new BattleResultFakeBuilder().withTroopId(3).withTroopName('Troop 3').build(),
      ];

      const trechoResult = new TrechoValidationResultFakeBuilder()
        .withBattles(battles)
        .build();

      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const reporter = new FakeReporter();
      const useCase = new GenerateReportUseCase(reporter);

      const input: GenerateReportInput = {
        metadata,
        trechoResults: [trechoResult],
        warnings: [],
      };

      // Act
      const report = useCase.execute(input);

      // Assert
      expect(report.trechos[0]?.battles).toEqual(battles);
      expect(report.trechos[0]?.battles).toHaveLength(3);
    });
  });

  describe('writeReport', () => {
    it('should call reporter.writeReport', async () => {
      // Arrange
      const reporter = new FakeReporter();
      const useCase = new GenerateReportUseCase(reporter);

      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const input: GenerateReportInput = {
        metadata,
        trechoResults: [new TrechoValidationResultFakeBuilder().build()],
        warnings: [],
      };

      const report = useCase.execute(input);
      const outputPath = '/path/to/report.json';

      // Act
      await useCase.writeReport(report, outputPath);

      // Assert
      expect(reporter.writeReportCalls).toHaveLength(1);
      expect(reporter.writeReportCalls[0]).toEqual({ report, path: outputPath });
    });

    it('should propagate write errors', async () => {
      // Arrange
      const reporter = new FakeReporter();
      reporter.throwOnWrite(new Error('Write failed'));

      const useCase = new GenerateReportUseCase(reporter);

      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const input: GenerateReportInput = {
        metadata,
        trechoResults: [new TrechoValidationResultFakeBuilder().build()],
        warnings: [],
      };

      const report = useCase.execute(input);
      const outputPath = '/path/to/report.json';

      // Act & Assert
      await expect(useCase.writeReport(report, outputPath)).rejects.toThrow('Write failed');
    });

    it('should handle absolute paths', async () => {
      // Arrange
      const reporter = new FakeReporter();
      const useCase = new GenerateReportUseCase(reporter);

      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const input: GenerateReportInput = {
        metadata,
        trechoResults: [new TrechoValidationResultFakeBuilder().build()],
        warnings: [],
      };

      const report = useCase.execute(input);
      const absolutePath = '/absolute/path/to/report.json';

      // Act
      await useCase.writeReport(report, absolutePath);

      // Assert
      expect(reporter.writeReportCalls).toHaveLength(1);
      expect(reporter.writeReportCalls[0]?.path).toBe(absolutePath);
    });
  });
});
