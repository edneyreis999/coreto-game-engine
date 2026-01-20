import { TtkTarget } from '../../../../packages/core/src/core/domain/TtkTarget';
import { ValidationError } from '../../../../packages/core/src/core/errors/index.js'ValidationError';

describe('TtkTarget', () => {
  describe('constructor', () => {
    it('should create valid target with turns and actions', () => {
      const target = new TtkTarget(10, 40);

      expect(target.turns).toBe(10);
      expect(target.actions).toBe(40);
      expect(target.tolerancePercent).toBe(15); // Default
    });

    it('should accept custom tolerance', () => {
      const target = new TtkTarget(10, 40, 20);

      expect(target.tolerancePercent).toBe(20);
    });

    it('should accept 0% tolerance', () => {
      const target = new TtkTarget(10, 40, 0);

      expect(target.tolerancePercent).toBe(0);
    });

    it('should accept 100% tolerance', () => {
      const target = new TtkTarget(10, 40, 100);

      expect(target.tolerancePercent).toBe(100);
    });

    it('should throw ValidationError if turns < 1', () => {
      expect(() => new TtkTarget(0, 40)).toThrow(ValidationError);
      expect(() => new TtkTarget(0, 40)).toThrow('TTK turns must be >= 1');
    });

    it('should throw ValidationError if actions < 1', () => {
      expect(() => new TtkTarget(10, 0)).toThrow(ValidationError);
      expect(() => new TtkTarget(10, 0)).toThrow('TTK actions must be >= 1');
    });

    it('should throw ValidationError if tolerance < 0', () => {
      expect(() => new TtkTarget(10, 40, -1)).toThrow(ValidationError);
      expect(() => new TtkTarget(10, 40, -1)).toThrow('Tolerance must be 0-100');
    });

    it('should throw ValidationError if tolerance > 100', () => {
      expect(() => new TtkTarget(10, 40, 101)).toThrow(ValidationError);
      expect(() => new TtkTarget(10, 40, 101)).toThrow('Tolerance must be 0-100');
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const target = new TtkTarget(10, 40);

      expect(Object.isFrozen(target)).toBe(true);
    });

    it('should not allow modification of turns', () => {
      const target = new TtkTarget(10, 40);

      expect(() => {
        (target as any).turns = 20;
      }).toThrow();
    });

    it('should not allow modification of actions', () => {
      const target = new TtkTarget(10, 40);

      expect(() => {
        (target as any).actions = 50;
      }).toThrow();
    });

    it('should not allow modification of tolerancePercent', () => {
      const target = new TtkTarget(10, 40);

      expect(() => {
        (target as any).tolerancePercent = 25;
      }).toThrow();
    });
  });

  describe('toleranceFraction', () => {
    it('should convert 15% to 0.15', () => {
      const target = new TtkTarget(10, 40, 15);

      expect(target.toleranceFraction).toBe(0.15);
    });

    it('should convert 0% to 0.0', () => {
      const target = new TtkTarget(10, 40, 0);

      expect(target.toleranceFraction).toBe(0);
    });

    it('should convert 100% to 1.0', () => {
      const target = new TtkTarget(10, 40, 100);

      expect(target.toleranceFraction).toBe(1.0);
    });

    it('should convert 50% to 0.5', () => {
      const target = new TtkTarget(10, 40, 50);

      expect(target.toleranceFraction).toBe(0.5);
    });
  });

  describe('turnsRange', () => {
    it('should calculate range with 15% tolerance', () => {
      const target = new TtkTarget(10, 40, 15);
      const range = target.turnsRange;

      // 10 ± 15% = 10 ± 1.5 = [8.5, 11.5] → [8, 12]
      expect(range.min).toBe(8);
      expect(range.max).toBe(12);
    });

    it('should calculate range with 0% tolerance', () => {
      const target = new TtkTarget(10, 40, 0);
      const range = target.turnsRange;

      expect(range.min).toBe(10);
      expect(range.max).toBe(10);
    });

    it('should never go below 1', () => {
      const target = new TtkTarget(1, 10, 50);
      const range = target.turnsRange;

      expect(range.min).toBeGreaterThanOrEqual(1);
    });

    it('should floor min and ceil max', () => {
      const target = new TtkTarget(10, 40, 20);
      const range = target.turnsRange;

      // 10 ± 20% = 10 ± 2 = [8, 12]
      expect(range.min).toBe(8);
      expect(range.max).toBe(12);
    });
  });

  describe('actionsRange', () => {
    it('should calculate range with 15% tolerance', () => {
      const target = new TtkTarget(10, 40, 15);
      const range = target.actionsRange;

      // 40 ± 15% = 40 ± 6 = [34, 46]
      expect(range.min).toBe(34);
      expect(range.max).toBe(46);
    });

    it('should calculate range with 0% tolerance', () => {
      const target = new TtkTarget(10, 40, 0);
      const range = target.actionsRange;

      expect(range.min).toBe(40);
      expect(range.max).toBe(40);
    });

    it('should never go below 1', () => {
      const target = new TtkTarget(1, 1, 100);
      const range = target.actionsRange;

      expect(range.min).toBeGreaterThanOrEqual(1);
    });

    it('should floor min and ceil max', () => {
      const target = new TtkTarget(10, 50, 10);
      const range = target.actionsRange;

      // 50 ± 10% = 50 ± 5 = [45, 55]
      expect(range.min).toBe(45);
      expect(range.max).toBe(55);
    });
  });

  describe('isWithinTolerance', () => {
    it('should return true if both metrics are within tolerance', () => {
      const target = new TtkTarget(10, 40, 15);

      expect(target.isWithinTolerance(9, 38)).toBe(true);
    });

    it('should return true for exact match', () => {
      const target = new TtkTarget(10, 40, 15);

      expect(target.isWithinTolerance(10, 40)).toBe(true);
    });

    it('should return true at min boundary', () => {
      const target = new TtkTarget(10, 40, 15);

      expect(target.isWithinTolerance(8, 34)).toBe(true);
    });

    it('should return true at max boundary', () => {
      const target = new TtkTarget(10, 40, 15);

      expect(target.isWithinTolerance(12, 46)).toBe(true);
    });

    it('should return false if turns below tolerance', () => {
      const target = new TtkTarget(10, 40, 15);

      expect(target.isWithinTolerance(7, 40)).toBe(false);
    });

    it('should return false if turns above tolerance', () => {
      const target = new TtkTarget(10, 40, 15);

      expect(target.isWithinTolerance(13, 40)).toBe(false);
    });

    it('should return false if actions below tolerance', () => {
      const target = new TtkTarget(10, 40, 15);

      expect(target.isWithinTolerance(10, 30)).toBe(false);
    });

    it('should return false if actions above tolerance', () => {
      const target = new TtkTarget(10, 40, 15);

      expect(target.isWithinTolerance(10, 50)).toBe(false);
    });

    it('should return false if only one metric is within tolerance', () => {
      const target = new TtkTarget(10, 40, 15);

      expect(target.isWithinTolerance(9, 50)).toBe(false); // Turns OK, actions not
      expect(target.isWithinTolerance(15, 40)).toBe(false); // Actions OK, turns not
    });

    it('should work with 0% tolerance', () => {
      const target = new TtkTarget(10, 40, 0);

      expect(target.isWithinTolerance(10, 40)).toBe(true);
      expect(target.isWithinTolerance(9, 40)).toBe(false);
      expect(target.isWithinTolerance(10, 39)).toBe(false);
    });
  });

  describe('calculateDeviation', () => {
    it('should calculate positive deviation', () => {
      const target = new TtkTarget(10, 40);
      const deviation = target.calculateDeviation(12, 48);

      expect(deviation.turnsDeviation).toBeCloseTo(0.2); // (12 - 10) / 10
      expect(deviation.actionsDeviation).toBeCloseTo(0.2); // (48 - 40) / 40
    });

    it('should calculate negative deviation', () => {
      const target = new TtkTarget(10, 40);
      const deviation = target.calculateDeviation(8, 32);

      expect(deviation.turnsDeviation).toBeCloseTo(-0.2); // (8 - 10) / 10
      expect(deviation.actionsDeviation).toBeCloseTo(-0.2); // (32 - 40) / 40
    });

    it('should return zero deviation for exact match', () => {
      const target = new TtkTarget(10, 40);
      const deviation = target.calculateDeviation(10, 40);

      expect(deviation.turnsDeviation).toBe(0);
      expect(deviation.actionsDeviation).toBe(0);
    });

    it('should calculate independent deviations', () => {
      const target = new TtkTarget(10, 40);
      const deviation = target.calculateDeviation(12, 32);

      expect(deviation.turnsDeviation).toBeCloseTo(0.2);
      expect(deviation.actionsDeviation).toBeCloseTo(-0.2);
    });
  });

  describe('equals', () => {
    it('should return true for identical targets', () => {
      const target1 = new TtkTarget(10, 40, 15);
      const target2 = new TtkTarget(10, 40, 15);

      expect(target1.equals(target2)).toBe(true);
    });

    it('should return false for different turns', () => {
      const target1 = new TtkTarget(10, 40, 15);
      const target2 = new TtkTarget(11, 40, 15);

      expect(target1.equals(target2)).toBe(false);
    });

    it('should return false for different actions', () => {
      const target1 = new TtkTarget(10, 40, 15);
      const target2 = new TtkTarget(10, 41, 15);

      expect(target1.equals(target2)).toBe(false);
    });

    it('should return false for different tolerance', () => {
      const target1 = new TtkTarget(10, 40, 15);
      const target2 = new TtkTarget(10, 40, 20);

      expect(target1.equals(target2)).toBe(false);
    });

    it('should support reflexive equality', () => {
      const target = new TtkTarget(10, 40, 15);

      expect(target.equals(target)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should format as "TTK({turns}T/{actions}A ±{tolerance}%)"', () => {
      const target = new TtkTarget(10, 40, 15);

      expect(target.toString()).toBe('TTK(10T/40A ±15%)');
    });

    it('should format with 0% tolerance', () => {
      const target = new TtkTarget(10, 40, 0);

      expect(target.toString()).toBe('TTK(10T/40A ±0%)');
    });

    it('should format with 100% tolerance', () => {
      const target = new TtkTarget(10, 40, 100);

      expect(target.toString()).toBe('TTK(10T/40A ±100%)');
    });

    it('should format with single-digit values', () => {
      const target = new TtkTarget(5, 20, 10);

      expect(target.toString()).toBe('TTK(5T/20A ±10%)');
    });
  });
});
