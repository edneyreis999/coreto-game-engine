import { AnchorLevelRange } from '../../../../packages/core/src/core/domain/AnchorLevelRange';
import { ValidationError } from '@coreto/core';

describe('AnchorLevelRange', () => {
  describe('constructor', () => {
    it('should create valid range with min and max', () => {
      const range = new AnchorLevelRange(5, 10);

      expect(range.min).toBe(5);
      expect(range.max).toBe(10);
    });

    it('should accept same min and max', () => {
      const range = new AnchorLevelRange(5, 5);

      expect(range.min).toBe(5);
      expect(range.max).toBe(5);
    });

    it('should accept level 1 as min', () => {
      const range = new AnchorLevelRange(1, 10);

      expect(range.min).toBe(1);
    });

    it('should accept level 99 as max', () => {
      const range = new AnchorLevelRange(1, 99);

      expect(range.max).toBe(99);
    });

    it('should throw ValidationError if min < 1', () => {
      expect(() => new AnchorLevelRange(0, 10)).toThrow(ValidationError);
      expect(() => new AnchorLevelRange(0, 10)).toThrow('Level min must be 1-99');
    });

    it('should throw ValidationError if min > 99', () => {
      expect(() => new AnchorLevelRange(100, 100)).toThrow(ValidationError);
      expect(() => new AnchorLevelRange(100, 100)).toThrow('Level min must be 1-99');
    });

    it('should throw ValidationError if max < 1', () => {
      expect(() => new AnchorLevelRange(1, 0)).toThrow(ValidationError);
      expect(() => new AnchorLevelRange(1, 0)).toThrow('Level max must be 1-99');
    });

    it('should throw ValidationError if max > 99', () => {
      expect(() => new AnchorLevelRange(1, 100)).toThrow(ValidationError);
      expect(() => new AnchorLevelRange(1, 100)).toThrow('Level max must be 1-99');
    });

    it('should throw ValidationError if min > max', () => {
      expect(() => new AnchorLevelRange(10, 5)).toThrow(ValidationError);
      expect(() => new AnchorLevelRange(10, 5)).toThrow('Level min must be <= max');
    });

    it('should include context in ValidationError', () => {
      try {
        new AnchorLevelRange(10, 5);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context).toHaveProperty('min', 10);
        expect(validationError.context).toHaveProperty('max', 5);
      }
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const range = new AnchorLevelRange(5, 10);

      expect(Object.isFrozen(range)).toBe(true);
    });

    it('should not allow modification of min', () => {
      const range = new AnchorLevelRange(5, 10);

      expect(() => {
        (range as any).min = 20;
      }).toThrow();
    });

    it('should not allow modification of max', () => {
      const range = new AnchorLevelRange(5, 10);

      expect(() => {
        (range as any).max = 20;
      }).toThrow();
    });
  });

  describe('contains', () => {
    it('should return true if level is within range', () => {
      const range = new AnchorLevelRange(5, 10);

      expect(range.contains(7)).toBe(true);
    });

    it('should return true for min level', () => {
      const range = new AnchorLevelRange(5, 10);

      expect(range.contains(5)).toBe(true);
    });

    it('should return true for max level', () => {
      const range = new AnchorLevelRange(5, 10);

      expect(range.contains(10)).toBe(true);
    });

    it('should return false if level is below min', () => {
      const range = new AnchorLevelRange(5, 10);

      expect(range.contains(4)).toBe(false);
    });

    it('should return false if level is above max', () => {
      const range = new AnchorLevelRange(5, 10);

      expect(range.contains(11)).toBe(false);
    });

    it('should return true for single-level range', () => {
      const range = new AnchorLevelRange(5, 5);

      expect(range.contains(5)).toBe(true);
    });

    it('should return false for level outside single-level range', () => {
      const range = new AnchorLevelRange(5, 5);

      expect(range.contains(4)).toBe(false);
      expect(range.contains(6)).toBe(false);
    });
  });

  describe('midpoint', () => {
    it('should calculate midpoint for even range', () => {
      const range = new AnchorLevelRange(5, 10);

      expect(range.midpoint).toBe(7);
    });

    it('should calculate midpoint for odd range', () => {
      const range = new AnchorLevelRange(5, 11);

      expect(range.midpoint).toBe(8);
    });

    it('should floor midpoint for fractional result', () => {
      const range = new AnchorLevelRange(5, 9);

      expect(range.midpoint).toBe(7); // (5 + 9) / 2 = 7
    });

    it('should return same value for single-level range', () => {
      const range = new AnchorLevelRange(5, 5);

      expect(range.midpoint).toBe(5);
    });

    it('should calculate midpoint for full range', () => {
      const range = new AnchorLevelRange(1, 99);

      expect(range.midpoint).toBe(50);
    });
  });

  describe('equals', () => {
    it('should return true for identical ranges', () => {
      const range1 = new AnchorLevelRange(5, 10);
      const range2 = new AnchorLevelRange(5, 10);

      expect(range1.equals(range2)).toBe(true);
    });

    it('should return false for different min', () => {
      const range1 = new AnchorLevelRange(5, 10);
      const range2 = new AnchorLevelRange(6, 10);

      expect(range1.equals(range2)).toBe(false);
    });

    it('should return false for different max', () => {
      const range1 = new AnchorLevelRange(5, 10);
      const range2 = new AnchorLevelRange(5, 11);

      expect(range1.equals(range2)).toBe(false);
    });

    it('should return false for completely different ranges', () => {
      const range1 = new AnchorLevelRange(5, 10);
      const range2 = new AnchorLevelRange(15, 20);

      expect(range1.equals(range2)).toBe(false);
    });

    it('should support reflexive equality', () => {
      const range = new AnchorLevelRange(5, 10);

      expect(range.equals(range)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should format range as "Lv{min}-{max}"', () => {
      const range = new AnchorLevelRange(5, 10);

      expect(range.toString()).toBe('Lv5-10');
    });

    it('should format single-level range', () => {
      const range = new AnchorLevelRange(5, 5);

      expect(range.toString()).toBe('Lv5-5');
    });

    it('should format full range', () => {
      const range = new AnchorLevelRange(1, 99);

      expect(range.toString()).toBe('Lv1-99');
    });
  });
});
