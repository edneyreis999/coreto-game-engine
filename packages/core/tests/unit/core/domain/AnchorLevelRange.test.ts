import { ValidationError } from '@coreto/core';
import { AnchorLevelRangeFakeBuilder } from '../../../fakes';

describe('AnchorLevelRange', () => {
  describe('constructor', () => {
    it('should create valid range with min and max', () => {
      const range = new AnchorLevelRangeFakeBuilder().withRange(5, 10).build();

      expect(range.min).toBe(5);
      expect(range.max).toBe(10);
    });

    it('should accept same min and max', () => {
      const range = new AnchorLevelRangeFakeBuilder().withSingleLevel(5).build();

      expect(range.min).toBe(5);
      expect(range.max).toBe(5);
    });

    it('should accept level 1 as min', () => {
      const range = new AnchorLevelRangeFakeBuilder().withRange(1, 10).build();

      expect(range.min).toBe(1);
    });

    it('should accept level 99 as max', () => {
      const range = new AnchorLevelRangeFakeBuilder().withRange(1, 99).build();

      expect(range.max).toBe(99);
    });

    it('should throw ValidationError if min < 1', () => {
      const builder = new AnchorLevelRangeFakeBuilder().withInvalidMin();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Level min must be 1-99');
    });

    it('should throw ValidationError if min > 99', () => {
      const builder = new AnchorLevelRangeFakeBuilder().withMin(100);

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Level min must be 1-99');
    });

    it('should throw ValidationError if max < 1', () => {
      const builder = new AnchorLevelRangeFakeBuilder().withRange(1, 0);

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Level max must be 1-99');
    });

    it('should throw ValidationError if max > 99', () => {
      const builder = new AnchorLevelRangeFakeBuilder().withInvalidMax();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Level max must be 1-99');
    });

    it('should throw ValidationError if min > max', () => {
      const builder = new AnchorLevelRangeFakeBuilder().withInvalidRange();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Level min must be <= max');
    });

    it('should include context in ValidationError', () => {
      const builder = new AnchorLevelRangeFakeBuilder().withInvalidRange();

      expect(() => builder.build()).toThrow(ValidationError);

      try {
        builder.build();
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
      const range = new AnchorLevelRangeFakeBuilder().build();

      expect(Object.isFrozen(range)).toBe(true);
    });

    it('should not allow modification of min', () => {
      const range = new AnchorLevelRangeFakeBuilder().build();

      expect(() => {
        (range as any).min = 20;
      }).toThrow();
    });

    it('should not allow modification of max', () => {
      const range = new AnchorLevelRangeFakeBuilder().build();

      expect(() => {
        (range as any).max = 20;
      }).toThrow();
    });
  });

  describe('contains', () => {
    it('should return true if level is within range', () => {
      const range = new AnchorLevelRangeFakeBuilder().build();

      expect(range.contains(7)).toBe(true);
    });

    it('should return true for min level', () => {
      const range = new AnchorLevelRangeFakeBuilder().build();

      expect(range.contains(5)).toBe(true);
    });

    it('should return true for max level', () => {
      const range = new AnchorLevelRangeFakeBuilder().build();

      expect(range.contains(10)).toBe(true);
    });

    it('should return false if level is below min', () => {
      const range = new AnchorLevelRangeFakeBuilder().build();

      expect(range.contains(4)).toBe(false);
    });

    it('should return false if level is above max', () => {
      const range = new AnchorLevelRangeFakeBuilder().build();

      expect(range.contains(11)).toBe(false);
    });

    it('should return true for single-level range', () => {
      const range = new AnchorLevelRangeFakeBuilder().withSingleLevel().build();

      expect(range.contains(5)).toBe(true);
    });

    it('should return false for level outside single-level range', () => {
      const range = new AnchorLevelRangeFakeBuilder().withSingleLevel().build();

      expect(range.contains(4)).toBe(false);
      expect(range.contains(6)).toBe(false);
    });
  });

  describe('midpoint', () => {
    it('should calculate midpoint for even range', () => {
      const range = new AnchorLevelRangeFakeBuilder().build();

      expect(range.midpoint).toBe(7);
    });

    it('should calculate midpoint for odd range', () => {
      const range = new AnchorLevelRangeFakeBuilder().withRange(5, 11).build();

      expect(range.midpoint).toBe(8);
    });

    it('should floor midpoint for fractional result', () => {
      const range = new AnchorLevelRangeFakeBuilder().withRange(5, 9).build();

      expect(range.midpoint).toBe(7); // (5 + 9) / 2 = 7
    });

    it('should return same value for single-level range', () => {
      const range = new AnchorLevelRangeFakeBuilder().withSingleLevel().build();

      expect(range.midpoint).toBe(5);
    });

    it('should calculate midpoint for full range', () => {
      const range = new AnchorLevelRangeFakeBuilder().withFullRange().build();

      expect(range.midpoint).toBe(50);
    });
  });

  describe('equals', () => {
    it('should return true for identical ranges', () => {
      const range1 = new AnchorLevelRangeFakeBuilder().build();
      const range2 = new AnchorLevelRangeFakeBuilder().build();

      expect(range1.equals(range2)).toBe(true);
    });

    it('should return false for different min', () => {
      const range1 = new AnchorLevelRangeFakeBuilder().build();
      const range2 = new AnchorLevelRangeFakeBuilder().withMin(6).build();

      expect(range1.equals(range2)).toBe(false);
    });

    it('should return false for different max', () => {
      const range1 = new AnchorLevelRangeFakeBuilder().build();
      const range2 = new AnchorLevelRangeFakeBuilder().withMax(11).build();

      expect(range1.equals(range2)).toBe(false);
    });

    it('should return false for completely different ranges', () => {
      const range1 = new AnchorLevelRangeFakeBuilder().build();
      const range2 = new AnchorLevelRangeFakeBuilder().withRange(15, 20).build();

      expect(range1.equals(range2)).toBe(false);
    });

    it('should support reflexive equality', () => {
      const range = new AnchorLevelRangeFakeBuilder().build();

      expect(range.equals(range)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should format range as "Lv{min}-{max}"', () => {
      const range = new AnchorLevelRangeFakeBuilder().build();

      expect(range.toString()).toBe('Lv5-10');
    });

    it('should format single-level range', () => {
      const range = new AnchorLevelRangeFakeBuilder().withSingleLevel().build();

      expect(range.toString()).toBe('Lv5-5');
    });

    it('should format full range', () => {
      const range = new AnchorLevelRangeFakeBuilder().withFullRange().build();

      expect(range.toString()).toBe('Lv1-99');
    });
  });
});
