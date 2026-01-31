import 'reflect-metadata';
import { GenerateReportUseCase, GenerateReportInput } from '@coreto/core/core/use-cases/GenerateReportUseCase.js';
import { IReporter, Warning } from '@coreto/core/core/ports/IReporter.js';
import { Report, ReportMetadata } from '@coreto/core/core/domain/Report.js';
import { TrechoValidationResult } from '@coreto/core/core/use-cases/ValidateTrechoUseCase.js';
import { BattleResult } from '@coreto/core/core/domain/BattleResult.js';

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

  const createMetadata = (): ReportMetadata => ({
    version: '1.0.0',
    generatedAt: new Date('2024-01-01T00:00:00Z'),
    seed: 12345,
    projectPath: '/path/to/project',
  });

  const createBattleResult = (overrides?: Partial<{
    troopId: number;
    troopName: string;
    ttkTurns: number;
    ttkActions: number;
  }>): BattleResult => {
    return new BattleResult({
      troopId: overrides?.troopId ?? 1,
      troopName: overrides?.troopName ?? 'Goblin Pack',
      outcome: 'victory',
      ttkTurns: overrides?.ttkTurns ?? 3,
      ttkActions: overrides?.ttkActions ?? 8,
      durationMs: 1250,
      seed: 12345,
    });
  };

  const createTrechoValidationResult = (
    overrides?: Partial<TrechoValidationResult>
  ): TrechoValidationResult => ({
    trechoId: overrides?.trechoId ?? 'ato1-nivel1-10',
    trechoName: overrides?.trechoName ?? 'Ato 1 - Níveis 1-10',
    passed: overrides?.passed ?? true,
    avgTtkTurns: overrides?.avgTtkTurns ?? 3,
    avgTtkActions: overrides?.avgTtkActions ?? 8,
    battles: overrides?.battles ?? [createBattleResult()],
    failedBattles: overrides?.failedBattles ?? [],
  });

  const createWarning = (overrides?: Partial<Warning>): Warning => ({
    type: overrides?.type ?? 'ttk_out_of_tolerance',
    severity: overrides?.severity ?? 'warning',
    message: overrides?.message ?? 'TTK out of tolerance',
    context: overrides?.context ?? { troopId: 1 },
  });

  describe('execute', () => {
    it('should create report with correct metadata', () => {
      // Arrange
      const metadata = createMetadata();
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
        createBattleResult({ troopId: 1, ttkTurns: 3, ttkActions: 8 }),
        createBattleResult({ troopId: 2, ttkTurns: 4, ttkActions: 10 }),
      ];

      const trechoResult = createTrechoValidationResult({
        trechoId: 'ato1-nivel1-10',
        trechoName: 'Ato 1 - Níveis 1-10',
        passed: true,
        avgTtkTurns: 3.5,
        avgTtkActions: 9,
        battles,
      });

      const input: GenerateReportInput = {
        metadata: createMetadata(),
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
          p95TtkTurns: 3.5,
          avgTtkActions: 9,
          p95TtkActions: 9,
        },
        warnings: [],
        passed: true,
      });
    });

    it('should include all warnings in report', () => {
      // Arrange
      const warnings = [
        createWarning({ type: 'ttk_out_of_tolerance', severity: 'warning' }),
        createWarning({ type: 'battle_timeout', severity: 'critical' }),
        createWarning({ type: 'skill_formula_error', severity: 'info' }),
      ];

      const input: GenerateReportInput = {
        metadata: createMetadata(),
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

      const input: GenerateReportInput = {
        metadata: createMetadata(),
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
      const input: GenerateReportInput = {
        metadata: createMetadata(),
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
      const input: GenerateReportInput = {
        metadata: createMetadata(),
        trechoResults: [createTrechoValidationResult()],
        warnings: [createWarning()],
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
        createBattleResult({ troopId: 1, troopName: 'Troop 1' }),
        createBattleResult({ troopId: 2, troopName: 'Troop 2' }),
        createBattleResult({ troopId: 3, troopName: 'Troop 3' }),
      ];

      const trechoResult = createTrechoValidationResult({ battles });

      const input: GenerateReportInput = {
        metadata: createMetadata(),
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
      const input: GenerateReportInput = {
        metadata: createMetadata(),
        trechoResults: [createTrechoValidationResult()],
        warnings: [],
      };

      const report = useCase.execute(input);
      const outputPath = '/path/to/report.json';

      mockReporter.writeReport.mockResolvedValue();

      // Act
      await useCase.writeReport(report, outputPath);

      // Assert
      expect(mockReporter.writeReport).toHaveBeenCalledWith(report, outputPath);
      expect(mockReporter.writeReport).toHaveBeenCalledTimes(1);
    });

    it('should propagate write errors', async () => {
      // Arrange
      const input: GenerateReportInput = {
        metadata: createMetadata(),
        trechoResults: [createTrechoValidationResult()],
        warnings: [],
      };

      const report = useCase.execute(input);
      const outputPath = '/path/to/report.json';
      const writeError = new Error('Write failed');

      mockReporter.writeReport.mockRejectedValue(writeError);

      // Act & Assert
      await expect(useCase.writeReport(report, outputPath)).rejects.toThrow('Write failed');
    });

    it('should handle absolute paths', async () => {
      // Arrange
      const input: GenerateReportInput = {
        metadata: createMetadata(),
        trechoResults: [createTrechoValidationResult()],
        warnings: [],
      };

      const report = useCase.execute(input);
      const absolutePath = '/absolute/path/to/report.json';

      mockReporter.writeReport.mockResolvedValue();

      // Act
      await useCase.writeReport(report, absolutePath);

      // Assert
      expect(mockReporter.writeReport).toHaveBeenCalledWith(report, absolutePath);
    });
  });
});
