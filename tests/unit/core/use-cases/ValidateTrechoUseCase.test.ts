import 'reflect-metadata';
import { ValidateTrechoUseCase } from '@/core/use-cases/ValidateTrechoUseCase.js';
import { Trecho } from '@/core/domain/Trecho.js';
import { BattleResult } from '@/core/domain/BattleResult.js';
import { PartyConfig } from '@/core/domain/PartyConfig.js';

describe('ValidateTrechoUseCase', () => {
  let useCase: ValidateTrechoUseCase;

  beforeEach(() => {
    useCase = new ValidateTrechoUseCase();
  });

  const createTrecho = (overrides?: Partial<{
    targetTtkTurns: number;
    targetTtkActions: number;
    tolerancePercent: number;
  }>): Trecho => {
    const party = new PartyConfig([{ classId: 1, level: 5 }]);
    return new Trecho({
      id: 'ato1-nivel1-10',
      name: 'Ato 1 - Níveis 1-10',
      anchorLevelMin: 1,
      anchorLevelMax: 10,
      targetTtkTurns: overrides?.targetTtkTurns ?? 3,
      targetTtkActions: overrides?.targetTtkActions ?? 8,
      tolerancePercent: overrides?.tolerancePercent ?? 15,
      troopIds: [1, 2, 3],
      party,
    });
  };

  const createBattleResult = (overrides?: Partial<{
    troopId: number;
    troopName: string;
    ttkTurns: number;
    ttkActions: number;
    outcome: 'victory' | 'defeat' | 'timeout';
  }>): BattleResult => {
    return new BattleResult({
      troopId: overrides?.troopId ?? 1,
      troopName: overrides?.troopName ?? 'Goblin Pack',
      outcome: overrides?.outcome ?? 'victory',
      ttkTurns: overrides?.ttkTurns ?? 3,
      ttkActions: overrides?.ttkActions ?? 8,
      durationMs: 1250,
      seed: 12345,
    });
  };

  describe('execute', () => {
    it('should pass when average TTK within tolerance', () => {
      // Arrange
      const trecho = createTrecho({
        targetTtkTurns: 3,
        targetTtkActions: 8,
        tolerancePercent: 15,
      });

      const battles = [
        createBattleResult({ ttkTurns: 3, ttkActions: 8 }),
        createBattleResult({ ttkTurns: 3, ttkActions: 9 }),
        createBattleResult({ ttkTurns: 3, ttkActions: 7 }),
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.passed).toBe(true);
      expect(result.avgTtkTurns).toBe(3);
      expect(result.avgTtkActions).toBe(8);
    });

    it('should fail when average TTK outside tolerance', () => {
      // Arrange
      const trecho = createTrecho({
        targetTtkTurns: 3,
        targetTtkActions: 8,
        tolerancePercent: 15,
      });

      const battles = [
        createBattleResult({ ttkTurns: 5, ttkActions: 12 }), // Far outside tolerance
        createBattleResult({ ttkTurns: 5, ttkActions: 13 }),
        createBattleResult({ ttkTurns: 6, ttkActions: 14 }),
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.passed).toBe(false);
      expect(result.avgTtkTurns).toBeGreaterThan(3 * 1.15); // Outside +15%
    });

    it('should calculate correct averages', () => {
      // Arrange
      const trecho = createTrecho();
      const battles = [
        createBattleResult({ ttkTurns: 2, ttkActions: 6 }),
        createBattleResult({ ttkTurns: 3, ttkActions: 8 }),
        createBattleResult({ ttkTurns: 4, ttkActions: 10 }),
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.avgTtkTurns).toBe(3); // (2+3+4)/3 = 3
      expect(result.avgTtkActions).toBe(8); // (6+8+10)/3 = 8
    });

    it('should identify failed individual battles', () => {
      // Arrange
      const trecho = createTrecho({
        targetTtkTurns: 3,
        targetTtkActions: 8,
        tolerancePercent: 15,
      });

      const battles = [
        createBattleResult({ troopId: 1, troopName: 'Troop 1', ttkTurns: 3, ttkActions: 8 }), // Pass
        createBattleResult({ troopId: 2, troopName: 'Troop 2', ttkTurns: 6, ttkActions: 15 }), // Fail
        createBattleResult({ troopId: 3, troopName: 'Troop 3', ttkTurns: 3, ttkActions: 9 }), // Pass
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.failedBattles).toHaveLength(1);
      expect(result.failedBattles[0]?.troopId).toBe(2);
    });

    it('should handle empty battle results', () => {
      // Arrange
      const trecho = createTrecho();
      const battles: BattleResult[] = [];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.passed).toBe(false);
      expect(result.avgTtkTurns).toBe(0);
      expect(result.avgTtkActions).toBe(0);
      expect(result.battles).toEqual([]);
      expect(result.failedBattles).toEqual([]);
    });

    it('should handle single battle result', () => {
      // Arrange
      const trecho = createTrecho({
        targetTtkTurns: 3,
        targetTtkActions: 8,
        tolerancePercent: 15,
      });

      const battles = [createBattleResult({ ttkTurns: 3, ttkActions: 8 })];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.passed).toBe(true);
      expect(result.avgTtkTurns).toBe(3);
      expect(result.avgTtkActions).toBe(8);
      expect(result.battles).toHaveLength(1);
    });

    it('should include trecho id and name in result', () => {
      // Arrange
      const trecho = createTrecho();
      const battles = [createBattleResult()];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.trechoId).toBe('ato1-nivel1-10');
      expect(result.trechoName).toBe('Ato 1 - Níveis 1-10');
    });

    it('should include all battles in result', () => {
      // Arrange
      const trecho = createTrecho();
      const battles = [
        createBattleResult({ troopId: 1 }),
        createBattleResult({ troopId: 2 }),
        createBattleResult({ troopId: 3 }),
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.battles).toEqual(battles);
      expect(result.battles).toHaveLength(3);
    });

    it('should pass when average is exactly at tolerance boundary', () => {
      // Arrange
      const trecho = createTrecho({
        targetTtkTurns: 10,
        targetTtkActions: 40,
        tolerancePercent: 20, // ±20%
      });

      // Average will be 12 turns (20% above) and 48 actions (20% above) - should pass
      const battles = [
        createBattleResult({ ttkTurns: 12, ttkActions: 48 }),
        createBattleResult({ ttkTurns: 12, ttkActions: 48 }),
        createBattleResult({ ttkTurns: 12, ttkActions: 48 }),
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.passed).toBe(true);
      expect(result.avgTtkTurns).toBe(12);
      expect(result.avgTtkActions).toBe(48);
    });

    it('should fail when only one metric outside tolerance', () => {
      // Arrange
      const trecho = createTrecho({
        targetTtkTurns: 3,
        targetTtkActions: 8,
        tolerancePercent: 15,
      });

      // Turns within tolerance, but actions outside
      const battles = [
        createBattleResult({ ttkTurns: 3, ttkActions: 15 }), // Actions way outside
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.passed).toBe(false);
    });
  });
});
