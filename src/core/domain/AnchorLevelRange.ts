import { ValidationError } from '@/core/errors/index.js';

/**
 * Value Object representing a level range for party members.
 * Immutable - all properties are readonly and object is frozen.
 *
 * @example
 * ```typescript
 * const range = new AnchorLevelRange(5, 10);
 * range.contains(7); // true
 * range.contains(15); // false
 * range.midpoint; // 7
 * ```
 */
export class AnchorLevelRange {
  readonly min: number;
  readonly max: number;

  constructor(min: number, max: number) {
    if (min < 1 || min > 99) {
      throw new ValidationError('Level min must be 1-99', { min });
    }
    if (max < 1 || max > 99) {
      throw new ValidationError('Level max must be 1-99', { max });
    }
    if (min > max) {
      throw new ValidationError('Level min must be <= max', { min, max });
    }

    this.min = min;
    this.max = max;
    Object.freeze(this);
  }

  /**
   * Check if a level is within this range (inclusive).
   *
   * @param level - The level to check
   * @returns True if level is within [min, max]
   */
  contains(level: number): boolean {
    return level >= this.min && level <= this.max;
  }

  /**
   * Get the middle level of the range.
   * Uses floor to ensure integer result.
   *
   * @returns The midpoint level (rounded down)
   */
  get midpoint(): number {
    return Math.floor((this.min + this.max) / 2);
  }

  /**
   * Value equality check.
   * Two ranges are equal if they have the same min and max.
   *
   * @param other - The other AnchorLevelRange to compare
   * @returns True if both ranges are equal
   */
  equals(other: AnchorLevelRange): boolean {
    return this.min === other.min && this.max === other.max;
  }

  /**
   * String representation of the range.
   *
   * @returns String in format "Lv{min}-{max}"
   */
  toString(): string {
    return `Lv${this.min}-${this.max}`;
  }
}
