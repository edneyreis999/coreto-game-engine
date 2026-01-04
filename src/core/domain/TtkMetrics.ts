import { ValidationError } from '@/core/errors/index.js';
import { TtkTarget } from './TtkTarget.js';

/**
 * Value Object representing measured TTK metrics from a battle.
 * Immutable - all properties are readonly and object is frozen.
 *
 * @example
 * ```typescript
 * const metrics = new TtkMetrics(12, 48);
 * const target = new TtkTarget(10, 40, 15);
 * metrics.isWithinToleranceOf(target); // false
 * metrics.deviationFrom(target); // { turnsDeviation: 0.2, actionsDeviation: 0.2, ... }
 * ```
 */
export class TtkMetrics {
  readonly turns: number;
  readonly actions: number;

  constructor(turns: number, actions: number) {
    if (turns < 0) {
      throw new ValidationError('TTK turns cannot be negative', { turns });
    }
    if (actions < 0) {
      throw new ValidationError('TTK actions cannot be negative', { actions });
    }

    this.turns = turns;
    this.actions = actions;
    Object.freeze(this);
  }

  /**
   * Calculate deviation from a target.
   * Returns both fractional and percentage deviations.
   *
   * @param target - The TtkTarget to compare against
   * @returns Object with deviation metrics (fractional and percentage)
   */
  deviationFrom(target: TtkTarget): {
    turnsDeviation: number;
    actionsDeviation: number;
    turnsDeviationPercent: number;
    actionsDeviationPercent: number;
  } {
    const turnsDeviation = (this.turns - target.turns) / target.turns;
    const actionsDeviation = (this.actions - target.actions) / target.actions;
    return {
      turnsDeviation,
      actionsDeviation,
      turnsDeviationPercent: turnsDeviation * 100,
      actionsDeviationPercent: actionsDeviation * 100,
    };
  }

  /**
   * Check if within tolerance of target.
   * Delegates to TtkTarget.isWithinTolerance.
   *
   * @param target - The TtkTarget to compare against
   * @returns True if both turns and actions are within target's tolerance
   */
  isWithinToleranceOf(target: TtkTarget): boolean {
    return target.isWithinTolerance(this.turns, this.actions);
  }

  /**
   * Value equality check.
   * Two metrics are equal if they have the same turns and actions.
   *
   * @param other - The other TtkMetrics to compare
   * @returns True if both metrics are equal
   */
  equals(other: TtkMetrics): boolean {
    return this.turns === other.turns && this.actions === other.actions;
  }

  /**
   * String representation of the metrics.
   *
   * @returns String in format "{turns}T/{actions}A"
   */
  toString(): string {
    return `${this.turns}T/${this.actions}A`;
  }
}
