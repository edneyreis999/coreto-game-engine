import 'reflect-metadata';
import { ValidateTrechoUseCase } from '@coreto/core/core/use-cases/ValidateTrechoUseCase.js';
import { Trecho } from '@coreto/core/core/domain/Trecho.js';
import { BattleResult } from '@coreto/core/core/domain/BattleResult.js';
import { PartyConfig } from '@coreto/core/core/domain/PartyConfig.js';

describe('ValidateTrechoUseCase', () => {
  let useCase: ValidateTrechoUseCase;

  beforeEach(() => {
    useCase = new ValidateTrechoUseCase();
  });

  describe('execute', () => {
    it('should pass when average TTK within tolerance', () => {
      // Arrange
      const trecho = new TrechoFakeBuilder()
        .withId(TEST_TRECHO_IDS.ATO1_NIVEL1_10)
        .withTargetTtk(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withTolerance(15)
        .build();

      const battles = [
        new BattleResultFakeBuilder()
          .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
          .build(),
        new BattleResultFakeBuilder()
          .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, 9)
          .build(),
        new BattleResultFakeBuilder()
          .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, 7)
          .build(),
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.passed).toBe(true);
      expect(result.avgTtkTurns).toBe(TEST_CONSTANTS.DEFAULT_TTK_TURNS);
      expect(result.avgTtkActions).toBe(TEST_CONSTANTS.DEFAULT_TTK_ACTIONS);
    });

    it('should fail when average TTK outside tolerance', () => {
      // Arrange
      const trecho = new TrechoFakeBuilder()
        .withId(TEST_TRECHO_IDS.ATO1_NIVEL1_10)
        .withTargetTtk(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withTolerance(15)
        .build();

      const battles = [
        new BattleResultFakeBuilder()
          .withTtkMetrics(5, 12)
          .build(), // Far outside tolerance
        new BattleResultFakeBuilder()
          .withTtkMetrics(5, 13)
          .build(),
        new BattleResultFakeBuilder()
          .withTtkMetrics(6, 14)
          .build(),
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.passed).toBe(false);
      expect(result.avgTtkTurns).toBeGreaterThan(3 * 1.15); // Outside +15%
    });

    it('should calculate correct averages', () => {
      // Arrange
      const trecho = new TrechoFakeBuilder().build();
      const battles = [
        new BattleResultFakeBuilder()
          .withTtkMetrics(2, 6)
          .build(),
        new BattleResultFakeBuilder()
          .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
          .build(),
        new BattleResultFakeBuilder()
          .withTtkMetrics(4, 10)
          .build(),
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.avgTtkTurns).toBe(TEST_CONSTANTS.DEFAULT_TTK_TURNS); // (2+3+4)/3 = 3
      expect(result.avgTtkActions).toBe(TEST_CONSTANTS.DEFAULT_TTK_ACTIONS); // (6+8+10)/3 = 8
    });

    it('should identify failed individual battles', () => {
      // Arrange
      const trecho = new TrechoFakeBuilder()
        .withId(TEST_TRECHO_IDS.ATO1_NIVEL1_10)
        .withTargetTtk(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withTolerance(15)
        .build();

      const battles = [
        new BattleResultFakeBuilder()
          .withTroopId(1)
          .withTroopName('Troop 1')
          .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
          .build(), // Pass
        new BattleResultFakeBuilder()
          .withTroopId(2)
          .withTroopName('Troop 2')
          .withTtkMetrics(6, 15)
          .build(), // Fail
        new BattleResultFakeBuilder()
          .withTroopId(3)
          .withTroopName('Troop 3')
          .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, 9)
          .build(), // Pass
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.failedBattles).toHaveLength(1);
      expect(result.failedBattles[0]?.troopId).toBe(2);
    });

    it('should handle empty battle results', () => {
      // Arrange
      const trecho = new TrechoFakeBuilder().build();
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
      const trecho = new TrechoFakeBuilder()
        .withId(TEST_TRECHO_IDS.ATO1_NIVEL1_10)
        .withTargetTtk(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withTolerance(15)
        .build();

      const battles = [
        new BattleResultFakeBuilder()
          .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
          .build(),
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.passed).toBe(true);
      expect(result.avgTtkTurns).toBe(TEST_CONSTANTS.DEFAULT_TTK_TURNS);
      expect(result.avgTtkActions).toBe(TEST_CONSTANTS.DEFAULT_TTK_ACTIONS);
      expect(result.battles).toHaveLength(1);
    });

    it('should include trecho id and name in result', () => {
      // Arrange
      const trecho = new TrechoFakeBuilder()
        .withId(TEST_TRECHO_IDS.ATO1_NIVEL1_10)
        .build();
      const battles = [new BattleResultFakeBuilder().build()];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.trechoId).toBe(TEST_TRECHO_IDS.ATO1_NIVEL1_10);
      expect(result.trechoName).toBe('Ato 1 - Níveis 1-10');
    });

    it('should include all battles in result', () => {
      // Arrange
      const trecho = new TrechoFakeBuilder().build();
      const battles = [
        new BattleResultFakeBuilder()
          .withTroopId(1)
          .build(),
        new BattleResultFakeBuilder()
          .withTroopId(2)
          .build(),
        new BattleResultFakeBuilder()
          .withTroopId(3)
          .build(),
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.battles).toEqual(battles);
      expect(result.battles).toHaveLength(3);
    });

    it('should pass when average is exactly at tolerance boundary', () => {
      // Arrange
      const trecho = new TrechoFakeBuilder()
        .withId(TEST_TRECHO_IDS.ATO1_NIVEL1_10)
        .withTargetTtk(10, 40)
        .withTolerance(20)
        .build(); // ±20%

      // Average will be 12 turns (20% above) and 48 actions (20% above) - should pass
      const battles = [
        new BattleResultFakeBuilder()
          .withTtkMetrics(12, 48)
          .build(),
        new BattleResultFakeBuilder()
          .withTtkMetrics(12, 48)
          .build(),
        new BattleResultFakeBuilder()
          .withTtkMetrics(12, 48)
          .build(),
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
      const trecho = new TrechoFakeBuilder()
        .withId(TEST_TRECHO_IDS.ATO1_NIVEL1_10)
        .withTargetTtk(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withTolerance(15)
        .build();

      // Turns within tolerance, but actions outside
      const battles = [
        new BattleResultFakeBuilder()
          .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, 15)
          .build(), // Actions way outside
      ];

      // Act
      const result = useCase.execute(trecho, battles);

      // Assert
      expect(result.passed).toBe(false);
    });
  });
});
