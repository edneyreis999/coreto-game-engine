import { TtkMetrics } from '@coreto/core';
import { ValidationError } from '@coreto/core';
import { TtkMetricsFakeBuilder, TtkTargetFakeBuilder } from '../../../fakes';

describe('TtkMetrics', () => {
  describe('constructor', () => {
    it('should create valid metrics with turns and actions', () => {
      const metrics = new TtkMetricsFakeBuilder().build();

      expect(metrics.turns).toBe(12);
      expect(metrics.actions).toBe(48);
    });

    it('should accept 0 turns', () => {
      const metrics = new TtkMetricsFakeBuilder().withTurns(0).withActions(10).build();

      expect(metrics.turns).toBe(0);
    });

    it('should accept 0 actions', () => {
      const metrics = new TtkMetricsFakeBuilder().withTurns(10).withActions(0).build();

      expect(metrics.actions).toBe(0);
    });

    it('should throw ValidationError if turns is negative', () => {
      const builder = new TtkMetricsFakeBuilder().withInvalidTurns();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('TTK turns cannot be negative');
    });

    it('should throw ValidationError if actions is negative', () => {
      const builder = new TtkMetricsFakeBuilder().withInvalidActions();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('TTK actions cannot be negative');
    });

    it('should include context in ValidationError', () => {
      expect(() => new TtkMetrics(-5, 10)).toThrow(ValidationError);
      try {
        new TtkMetrics(-5, 10);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context).toHaveProperty('turns', -5);
      }
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const metrics = new TtkMetricsFakeBuilder().build();

      expect(Object.isFrozen(metrics)).toBe(true);
    });

    it('should not allow modification of turns', () => {
      const metrics = new TtkMetricsFakeBuilder().build();

      expect(() => {
        (metrics as any).turns = 20;
      }).toThrow();
    });

    it('should not allow modification of actions', () => {
      const metrics = new TtkMetricsFakeBuilder().build();

      expect(() => {
        (metrics as any).actions = 60;
      }).toThrow();
    });
  });

  describe('deviationFrom', () => {
    it('should calculate positive deviation', () => {
      const metrics = new TtkMetricsFakeBuilder().build();
      const target = new TtkTargetFakeBuilder().withTarget(10, 40).build();
      const deviation = metrics.deviationFrom(target);

      expect(deviation.turnsDeviation).toBeCloseTo(0.2);
      expect(deviation.actionsDeviation).toBeCloseTo(0.2);
      expect(deviation.turnsDeviationPercent).toBeCloseTo(20);
      expect(deviation.actionsDeviationPercent).toBeCloseTo(20);
    });

    it('should calculate negative deviation', () => {
      const metrics = new TtkMetricsFakeBuilder().withMetrics(8, 32).build();
      const target = new TtkTargetFakeBuilder().withTarget(10, 40).build();
      const deviation = metrics.deviationFrom(target);

      expect(deviation.turnsDeviation).toBeCloseTo(-0.2);
      expect(deviation.actionsDeviation).toBeCloseTo(-0.2);
      expect(deviation.turnsDeviationPercent).toBeCloseTo(-20);
      expect(deviation.actionsDeviationPercent).toBeCloseTo(-20);
    });

    it('should return zero deviation for exact match', () => {
      const metrics = new TtkMetricsFakeBuilder().withMetrics(10, 40).build();
      const target = new TtkTargetFakeBuilder().withTarget(10, 40).build();
      const deviation = metrics.deviationFrom(target);

      expect(deviation.turnsDeviation).toBe(0);
      expect(deviation.actionsDeviation).toBe(0);
      expect(deviation.turnsDeviationPercent).toBe(0);
      expect(deviation.actionsDeviationPercent).toBe(0);
    });

    it('should calculate independent deviations', () => {
      const metrics = new TtkMetricsFakeBuilder().withMetrics(12, 32).build();
      const target = new TtkTargetFakeBuilder().withTarget(10, 40).build();
      const deviation = metrics.deviationFrom(target);

      expect(deviation.turnsDeviation).toBeCloseTo(0.2);
      expect(deviation.actionsDeviation).toBeCloseTo(-0.2);
      expect(deviation.turnsDeviationPercent).toBeCloseTo(20);
      expect(deviation.actionsDeviationPercent).toBeCloseTo(-20);
    });

    it('should calculate fractional deviations correctly', () => {
      const metrics = new TtkMetricsFakeBuilder().withMetrics(11, 42).build();
      const target = new TtkTargetFakeBuilder().withTarget(10, 40).build();
      const deviation = metrics.deviationFrom(target);

      expect(deviation.turnsDeviation).toBeCloseTo(0.1);
      expect(deviation.actionsDeviation).toBeCloseTo(0.05);
      expect(deviation.turnsDeviationPercent).toBeCloseTo(10);
      expect(deviation.actionsDeviationPercent).toBeCloseTo(5);
    });

    it('should handle large deviations', () => {
      const metrics = new TtkMetricsFakeBuilder().withMetrics(20, 80).build();
      const target = new TtkTargetFakeBuilder().withTarget(10, 40).build();
      const deviation = metrics.deviationFrom(target);

      expect(deviation.turnsDeviation).toBeCloseTo(1.0);
      expect(deviation.actionsDeviation).toBeCloseTo(1.0);
      expect(deviation.turnsDeviationPercent).toBeCloseTo(100);
      expect(deviation.actionsDeviationPercent).toBeCloseTo(100);
    });
  });

  describe('isWithinToleranceOf', () => {
    it('should return true if within tolerance', () => {
      const metrics = new TtkMetricsFakeBuilder().withMetrics(9, 38).build();
      const target = new TtkTargetFakeBuilder().withTarget(10, 40).withTolerance(15).build();

      expect(metrics.isWithinToleranceOf(target)).toBe(true);
    });

    it('should return true for exact match', () => {
      const metrics = new TtkMetricsFakeBuilder().withMetrics(10, 40).build();
      const target = new TtkTargetFakeBuilder().withTarget(10, 40).withTolerance(15).build();

      expect(metrics.isWithinToleranceOf(target)).toBe(true);
    });

    it('should return false if turns outside tolerance', () => {
      const metrics = new TtkMetricsFakeBuilder().withMetrics(15, 40).build();
      const target = new TtkTargetFakeBuilder().withTarget(10, 40).withTolerance(15).build();

      expect(metrics.isWithinToleranceOf(target)).toBe(false);
    });

    it('should return false if actions outside tolerance', () => {
      const metrics = new TtkMetricsFakeBuilder().withMetrics(10, 60).build();
      const target = new TtkTargetFakeBuilder().withTarget(10, 40).withTolerance(15).build();

      expect(metrics.isWithinToleranceOf(target)).toBe(false);
    });

    it('should return false if only one metric within tolerance', () => {
      const metrics = new TtkMetricsFakeBuilder().withMetrics(9, 60).build();
      const target = new TtkTargetFakeBuilder().withTarget(10, 40).withTolerance(15).build();

      expect(metrics.isWithinToleranceOf(target)).toBe(false);
    });

    it('should work with 0% tolerance', () => {
      const metrics1 = new TtkMetricsFakeBuilder().withMetrics(10, 40).build();
      const metrics2 = new TtkMetricsFakeBuilder().withMetrics(11, 40).build();
      const target = new TtkTargetFakeBuilder().withTarget(10, 40).withZeroTolerance().build();

      expect(metrics1.isWithinToleranceOf(target)).toBe(true);
      expect(metrics2.isWithinToleranceOf(target)).toBe(false);
    });

    it('should work with 100% tolerance', () => {
      const metrics = new TtkMetricsFakeBuilder().withMetrics(20, 80).build();
      const target = new TtkTargetFakeBuilder().withTarget(10, 40).withFullTolerance().build();

      expect(metrics.isWithinToleranceOf(target)).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for identical metrics', () => {
      const metrics1 = new TtkMetricsFakeBuilder().build();
      const metrics2 = new TtkMetricsFakeBuilder().build();

      expect(metrics1.equals(metrics2)).toBe(true);
    });

    it('should return false for different turns', () => {
      const metrics1 = new TtkMetricsFakeBuilder().build();
      const metrics2 = new TtkMetricsFakeBuilder().withTurns(13).build();

      expect(metrics1.equals(metrics2)).toBe(false);
    });

    it('should return false for different actions', () => {
      const metrics1 = new TtkMetricsFakeBuilder().build();
      const metrics2 = new TtkMetricsFakeBuilder().withActions(49).build();

      expect(metrics1.equals(metrics2)).toBe(false);
    });

    it('should return false for completely different metrics', () => {
      const metrics1 = new TtkMetricsFakeBuilder().build();
      const metrics2 = new TtkMetricsFakeBuilder().withMetrics(20, 80).build();

      expect(metrics1.equals(metrics2)).toBe(false);
    });

    it('should support reflexive equality', () => {
      const metrics = new TtkMetricsFakeBuilder().build();

      expect(metrics.equals(metrics)).toBe(true);
    });

    it('should handle zero values', () => {
      const metrics1 = new TtkMetricsFakeBuilder().withZeroMetrics().build();
      const metrics2 = new TtkMetricsFakeBuilder().withZeroMetrics().build();

      expect(metrics1.equals(metrics2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should format as "{turns}T/{actions}A"', () => {
      const metrics = new TtkMetricsFakeBuilder().build();

      expect(metrics.toString()).toBe('12T/48A');
    });

    it('should format with single-digit values', () => {
      const metrics = new TtkMetricsFakeBuilder().withMetrics(5, 20).build();

      expect(metrics.toString()).toBe('5T/20A');
    });

    it('should format with large values', () => {
      const metrics = new TtkMetricsFakeBuilder().withMetrics(100, 400).build();

      expect(metrics.toString()).toBe('100T/400A');
    });

    it('should format with zero values', () => {
      const metrics = new TtkMetricsFakeBuilder().withZeroMetrics().build();

      expect(metrics.toString()).toBe('0T/0A');
    });
  });
});
