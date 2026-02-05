import { FakeBuilder } from './FakeBuilder.js';
import { AnchorLevelRange } from '@coreto/core';

/**
 * Builder for creating AnchorLevelRange instances in tests.
 * Provides sensible defaults and fluent interface for customization.
 *
 * @example
 * ```typescript
 * const range = new AnchorLevelRangeFakeBuilder()
 *   .withRange(5, 10)
 *   .build();
 *
 * const invalid = new AnchorLevelRangeFakeBuilder()
 *   .withInvalidRange()
 *   .build();
 * ```
 */
export class AnchorLevelRangeFakeBuilder extends FakeBuilder<AnchorLevelRange> {
  private min = 5;
  private max = 10;

  /**
   * Set the min and max levels.
   *
   * @param min - Minimum level (1-99)
   * @param max - Maximum level (1-99, must be >= min)
   * @returns This builder for chaining
   */
  withRange(min: number, max: number): this {
    this.min = min;
    this.max = max;
    return this;
  }

  /**
   * Set the minimum level.
   *
   * @param min - Minimum level (1-99)
   * @returns This builder for chaining
   */
  withMin(min: number): this {
    this.min = min;
    return this;
  }

  /**
   * Set the maximum level.
   *
   * @param max - Maximum level (1-99)
   * @returns This builder for chaining
   */
  withMax(max: number): this {
    this.max = max;
    return this;
  }

  /**
   * Create a range with invalid data (min > max).
   * Useful for testing validation errors.
   *
   * @returns This builder for chaining
   */
  withInvalidRange(): this {
    return this.withRange(10, 5);
  }

  /**
   * Create a range with min below valid range.
   *
   * @returns This builder for chaining
   */
  withInvalidMin(): this {
    return this.withMin(0);
  }

  /**
   * Create a range with max above valid range.
   *
   * @returns This builder for chaining
   */
  withInvalidMax(): this {
    return this.withMax(100);
  }

  /**
   * Create a single-level range.
   *
   * @param level - The level for both min and max
   * @returns This builder for chaining
   */
  withSingleLevel(level: number = 5): this {
    return this.withRange(level, level);
  }

  /**
   * Create the full valid range (1-99).
   *
   * @returns This builder for chaining
   */
  withFullRange(): this {
    return this.withRange(1, 99);
  }

  /**
   * Build the AnchorLevelRange instance.
   * Will throw ValidationError if current state is invalid.
   *
   * @returns AnchorLevelRange instance
   * @throws {ValidationError} If range is invalid
   */
  build(): AnchorLevelRange {
    return new AnchorLevelRange(this.min, this.max);
  }

  /**
   * Create builder with invalid data.
   */
  withInvalidData(): this {
    return this.withInvalidRange();
  }
}
