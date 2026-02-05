import 'reflect-metadata';
import { GenerateReportUseCase, GenerateReportInput } from '@coreto/core';
import { IReporter } from '@coreto/core';
import { Report } from '@coreto/core';
import type { TrechoValidationResult } from '@coreto/core';

import { BattleResultFakeBuilder } from '../../../fixtures/builders/BattleResultFakeBuilder';
import { ReportMetadataFakeBuilder } from '../../../fixtures/builders/ReportMetadataFakeBuilder';
import { WarningFakeBuilder } from '../../../fixtures/builders/WarningFakeBuilder';
import { TEST_CONSTANTS } from '../../../fixtures/test-constants';

describe('GenerateReportUseCase', () => {
  let useCase: GenerateReportUseCase;
  let mockReporter: jest.Mocked<IReporter>;

  beforeEach(() => {
    // Create mock reporter
    mockReporter = {
      addWarning: jest.fn(),
      addBattleResult: jest.fn(),
      generateReport: jest.fn(),
      writeReport: jest.fn(),
      exportContext: jest.fn(),
    };

    // Inject mock reporter
    useCase = new GenerateReportUseCase(mockReporter);
  });

  const createTrechoValidationResult = (
    overrides?: Partial<TrechoValidationResult>
  ): TrechoValidationResult => ({
    trechoId: overrides?.trechoId ?? 'ato1-nivel1-10',
    trechoName: overrides?.trechoName ?? 'Ato 1 - Níveis 1-10',
    passed: overrides?.passed ?? true,
    avgTtkTurns: overrides?.avgTtkTurns ?? TEST_CONSTANTS.DEFAULT_TTK_TURNS,
    avgTtkActions: overrides?.avgTtkActions ?? TEST_CONSTANTS.DEFAULT_TTK_ACTIONS,
    battles: overrides?.battles ?? [new BattleResultFakeBuilder().build()],
    failedBattles: overrides?.failedBattles ?? [],
  });

  describe('execute', () => {
    it('should create report with correct metadata', () => {
      // Arrange
      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const input: GenerateReportInput = {
        metadata,
        trechoResults: [createTrechoValidationResult()],
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

      const trechoResult = createTrechoValidationResult({
        trechoId: 'ato1-nivel1-10',
        trechoName: 'Ato 1 - Níveis 1-10',
        passed: true,
        avgTtkTurns: 3.5,
        avgTtkActions: 9,
        battles,
      });

      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

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
          p95TtkTurns: 4,
          avgTtkActions: 9,
          p95TtkActions: 10,
        },
        warnings: [],
        passed: true,
      });
    });

    it('should include all warnings in report', () => {
      // Arrange
      const warnings = [
        new WarningFakeBuilder().asTtkOutOfTolerance(1).build(),
        new WarningFakeBuilder().asBattleTimeout(1, 10000, 100).asCritical().build(),
        new WarningFakeBuilder().asInfo().withType('skill_formula_error').build(),
      ];

      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const input: GenerateReportInput = {
        metadata,
        trechoResults: [createTrechoValidationResult()],
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
        createTrechoValidationResult({
          trechoId: 'ato1-nivel1-10',
          trechoName: 'Ato 1 - Níveis 1-10',
        }),
        createTrechoValidationResult({
          trechoId: 'ato1-nivel11-20',
          trechoName: 'Ato 1 - Níveis 11-20',
        }),
        createTrechoValidationResult({
          trechoId: 'ato2-nivel1-10',
          trechoName: 'Ato 2 - Níveis 1-10',
        }),
      ];

      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

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

      const input: GenerateReportInput = {
        metadata,
        trechoResults: [createTrechoValidationResult()],
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

      const trechoResult = createTrechoValidationResult({ battles });

      const metadata = new ReportMetadataFakeBuilder()
        .withVersion(TEST_CONSTANTS.DEFAULT_REPORT_VERSION)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

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
});
