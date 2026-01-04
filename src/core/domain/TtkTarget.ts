import { ValidationError } from '@/core/errors/index.js';

/**
 * Value Object representing TTK target with tolerance.
 * Dual-metric: turns + actions (ADR-020).
 *
 * @example
 * ```typescript
 * const target = new TtkTarget(10, 40, 15); // 10 turns, 40 actions, ±15%
 * target.isWithinTolerance(9, 38); // true
 * target.calculateDeviation(12, 50); // { turnsDeviation: 0.2, actionsDeviation: 0.25 }
 * ```
 */
export class TtkTarget {
  readonly turns: number;
  readonly actions: number;
  readonly tolerancePercent: number; // 0-100

  constructor(turns: number, actions: number, tolerancePercent: number = 15) {
    if (turns < 1) {
      throw new ValidationError('TTK turns must be >= 1', { turns });
    }
    if (actions < 1) {
      throw new ValidationError('TTK actions must be >= 1', { actions });
    }
    if (tolerancePercent < 0 || tolerancePercent > 100) {
      throw new ValidationError('Tolerance must be 0-100', { tolerancePercent });
    }

    this.turns = turns;
    this.actions = actions;
    this.tolerancePercent = tolerancePercent;
    Object.freeze(this);
  }

  /**
   * Get tolerance as fraction (0.0-1.0).
   *
   * @returns Tolerance as a decimal fraction
   */
  get toleranceFraction(): number {
    return this.tolerancePercent / 100;
  }

  /**
   * Get acceptable turns range [min, max].
   *
   * @returns Object with min and max acceptable turns
   */
  get turnsRange(): { min: number; max: number } {
    const delta = this.turns * this.toleranceFraction;
    return {
      min: Math.max(1, Math.floor(this.turns - delta)),
      max: Math.ceil(this.turns + delta),
    };
  }

  /**
   * Get acceptable actions range [min, max].
   *
   * @returns Object with min and max acceptable actions
   */
  get actionsRange(): { min: number; max: number } {
    const delta = this.actions * this.toleranceFraction;
    return {
      min: Math.max(1, Math.floor(this.actions - delta)),
      max: Math.ceil(this.actions + delta),
    };
  }

  /**
   * Check if measured values are within tolerance.
   * Both turns AND actions must be within their respective ranges.
   *
   * @param measuredTurns - Actual turns measured from battle
   * @param measuredActions - Actual actions measured from battle
   * @returns True if both metrics are within tolerance
   */
  isWithinTolerance(measuredTurns: number, measuredActions: number): boolean {
    const turnsOk = measuredTurns >= this.turnsRange.min && measuredTurns <= this.turnsRange.max;
    const actionsOk =
      measuredActions >= this.actionsRange.min && measuredActions <= this.actionsRange.max;
    return turnsOk && actionsOk;
  }

  /**
   * Calculate deviation from target.
   * Returns fractional deviation (e.g., 0.2 = 20% above target).
   *
   * @param measuredTurns - Actual turns measured from battle
   * @param measuredActions - Actual actions measured from battle
   * @returns Object with turnsDeviation and actionsDeviation (as fractions)
   */
  calculateDeviation(
    measuredTurns: number,
    measuredActions: number
  ): {
    turnsDeviation: number;
    actionsDeviation: number;
  } {
    return {
      turnsDeviation: (measuredTurns - this.turns) / this.turns,
      actionsDeviation: (measuredActions - this.actions) / this.actions,
    };
  }

  /**
   * Value equality check.
   * Two targets are equal if they have the same turns, actions, and tolerance.
   *
   * @param other - The other TtkTarget to compare
   * @returns True if both targets are equal
   */
  equals(other: TtkTarget): boolean {
    return (
      this.turns === other.turns &&
      this.actions === other.actions &&
      this.tolerancePercent === other.tolerancePercent
    );
  }

  /**
   * String representation of the target.
   *
   * @returns String in format "TTK({turns}T/{actions}A ±{tolerance}%)"
   */
  toString(): string {
    return `TTK(${this.turns}T/${this.actions}A ±${this.tolerancePercent}%)`;
  }
}
