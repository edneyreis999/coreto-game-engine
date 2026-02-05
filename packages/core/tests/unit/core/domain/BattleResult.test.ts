import {
  BattleResult,
  BattleResultData,
  BattleOutcome,
} from '@coreto/core';
import { BattleResultFakeBuilder } from '../../../fakes';

describe('BattleResult', () => {
  describe('constructor', () => {
    it('should create battle result with victory outcome', () => {
      const result = new BattleResultFakeBuilder().build();

      expect(result.troopId).toBe(1);
      expect(result.troopName).toBe('Goblin Pack');
      expect(result.outcome).toBe('victory');
      expect(result.ttkTurns).toBe(3);
      expect(result.ttkActions).toBe(8);
      expect(result.durationMs).toBe(1250);
      expect(result.seed).toBe(12345);
    });

    it('should create battle result with defeat outcome', () => {
      const result = new BattleResultFakeBuilder().withDefeat().withTroopId(2).withTroopName('Dragon Boss').build();

      expect(result.outcome).toBe('defeat');
      expect(result.ttkTurns).toBe(0);
      expect(result.ttkActions).toBe(0);
    });

    it('should create battle result with timeout outcome', () => {
      const result = new BattleResultFakeBuilder()
        .withTimeout()
        .withTroopId(3)
        .withTroopName('Endless Swarm')
        .withTtkMetrics(100, 400)
        .withDuration(30000)
        .withSeed(99999)
        .build();

      expect(result.outcome).toBe('timeout');
    });

    it('should accept all valid BattleOutcome types', () => {
      const outcomes: BattleOutcome[] = ['victory', 'defeat', 'timeout'];

      outcomes.forEach((outcome) => {
        const result = new BattleResultFakeBuilder()
          .withOutcome(outcome)
          .withTroopName('Test Troop')
          .build();
        expect(result.outcome).toBe(outcome);
      });
    });

    it('should accept zero TTK for non-victory outcomes', () => {
      const result = new BattleResultFakeBuilder().withDefeat().withNoExp().build();

      expect(result.ttkTurns).toBe(0);
      expect(result.ttkActions).toBe(0);
    });

    it('should accept large TTK values', () => {
      const result = new BattleResultFakeBuilder()
        .withTtkMetrics(999, 9999)
        .withDuration(100000)
        .build();

      expect(result.ttkTurns).toBe(999);
      expect(result.ttkActions).toBe(9999);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const result = new BattleResultFakeBuilder().build();

      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should not allow modification of properties', () => {
      const result = new BattleResultFakeBuilder().build();

      expect(() => {
        (result as any).troopId = 999;
      }).toThrow();

      expect(result.troopId).toBe(1);
    });

    it('should not be affected by mutations to input data', () => {
      const data: BattleResultData = {
        troopId: 1,
        troopName: 'Test Troop',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 12345,
      };

      const result = new BattleResult(data);

      // Mutate original data
      data.troopId = 999;
      data.troopName = 'Modified';
      data.outcome = 'defeat';

      // Result should be unchanged
      expect(result.troopId).toBe(1);
      expect(result.troopName).toBe('Test Troop');
      expect(result.outcome).toBe('victory');
    });
  });

  describe('data integrity', () => {
    it('should preserve all properties exactly as provided', () => {
      const result = new BattleResultFakeBuilder()
        .withTroopId(42)
        .withTroopName('Ancient Guardians')
        .withTtkMetrics(7, 21)
        .withDuration(3500)
        .withSeed(98765)
        .build();

      expect(result.troopId).toBe(42);
      expect(result.troopName).toBe('Ancient Guardians');
      expect(result.ttkTurns).toBe(7);
      expect(result.ttkActions).toBe(21);
      expect(result.durationMs).toBe(3500);
      expect(result.seed).toBe(98765);
    });

    it('should handle special characters in troopName', () => {
      const result = new BattleResultFakeBuilder()
        .withTroopName('Goblin "Elite" Squad [Lv.10+]')
        .build();

      expect(result.troopName).toBe('Goblin "Elite" Squad [Lv.10+]');
    });
  });
});
