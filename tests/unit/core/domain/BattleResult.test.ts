import {
  BattleResult,
  BattleResultData,
  BattleOutcome,
} from '@coreto/core';

describe('BattleResult', () => {
  describe('constructor', () => {
    it('should create battle result with victory outcome', () => {
      const data: BattleResultData = {
        troopId: 1,
        troopName: 'Goblin Pack',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1250,
        seed: 12345,
      };

      const result = new BattleResult(data);

      expect(result.troopId).toBe(1);
      expect(result.troopName).toBe('Goblin Pack');
      expect(result.outcome).toBe('victory');
      expect(result.ttkTurns).toBe(3);
      expect(result.ttkActions).toBe(8);
      expect(result.durationMs).toBe(1250);
      expect(result.seed).toBe(12345);
    });

    it('should create battle result with defeat outcome', () => {
      const data: BattleResultData = {
        troopId: 2,
        troopName: 'Dragon Boss',
        outcome: 'defeat',
        ttkTurns: 0,
        ttkActions: 0,
        durationMs: 500,
        seed: 54321,
      };

      const result = new BattleResult(data);

      expect(result.outcome).toBe('defeat');
      expect(result.ttkTurns).toBe(0);
      expect(result.ttkActions).toBe(0);
    });

    it('should create battle result with timeout outcome', () => {
      const data: BattleResultData = {
        troopId: 3,
        troopName: 'Endless Swarm',
        outcome: 'timeout',
        ttkTurns: 100,
        ttkActions: 400,
        durationMs: 30000,
        seed: 99999,
      };

      const result = new BattleResult(data);

      expect(result.outcome).toBe('timeout');
    });

    it('should accept all valid BattleOutcome types', () => {
      const outcomes: BattleOutcome[] = ['victory', 'defeat', 'timeout'];

      outcomes.forEach((outcome) => {
        const data: BattleResultData = {
          troopId: 1,
          troopName: 'Test Troop',
          outcome,
          ttkTurns: 1,
          ttkActions: 1,
          durationMs: 100,
          seed: 1,
        };

        const result = new BattleResult(data);
        expect(result.outcome).toBe(outcome);
      });
    });

    it('should accept zero TTK for non-victory outcomes', () => {
      const data: BattleResultData = {
        troopId: 1,
        troopName: 'Test Troop',
        outcome: 'defeat',
        ttkTurns: 0,
        ttkActions: 0,
        durationMs: 100,
        seed: 1,
      };

      const result = new BattleResult(data);
      expect(result.ttkTurns).toBe(0);
      expect(result.ttkActions).toBe(0);
    });

    it('should accept large TTK values', () => {
      const data: BattleResultData = {
        troopId: 1,
        troopName: 'Test Troop',
        outcome: 'victory',
        ttkTurns: 999,
        ttkActions: 9999,
        durationMs: 100000,
        seed: 1,
      };

      const result = new BattleResult(data);
      expect(result.ttkTurns).toBe(999);
      expect(result.ttkActions).toBe(9999);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
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

      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should not allow modification of properties', () => {
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
      const data: BattleResultData = {
        troopId: 42,
        troopName: 'Ancient Guardians',
        outcome: 'victory',
        ttkTurns: 7,
        ttkActions: 21,
        durationMs: 3500,
        seed: 98765,
      };

      const result = new BattleResult(data);

      expect(result).toMatchObject(data);
    });

    it('should handle special characters in troopName', () => {
      const data: BattleResultData = {
        troopId: 1,
        troopName: 'Goblin "Elite" Squad [Lv.10+]',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1000,
        seed: 1,
      };

      const result = new BattleResult(data);

      expect(result.troopName).toBe('Goblin "Elite" Squad [Lv.10+]');
    });
  });
});
