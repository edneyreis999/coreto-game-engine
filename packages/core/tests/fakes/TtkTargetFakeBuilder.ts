import { TtkTarget } from '@coreto/core';
import { FakeBuilder } from './FakeBuilder.js';

/**
 * Builder for creating TtkTarget instances in tests.
 * Provides sensible defaults and fluent interface for customization.
 *
 * @example
 * ```typescript
 * const target = new TtkTargetFakeBuilder()
 *   .withTurns(3)
 *   .withActions(8)
 *   .build();
 *
 * const invalid = new TtkTargetFakeBuilder()
 *   .withInvalidTurns()
 *   .build();
 * ```
 */
export class TtkTargetFakeBuilder extends FakeBuilder<TtkTarget> {
  private turns = 3;
  private actions = 8;
  private tolerancePercent = 15;

  /**
   * Set both turns and actions.
   *
   * @param turns - Target number of turns
   * @param actions - Target number of actions
   * @returns This builder for chaining
   */
  withTarget(turns: number, actions: number): this {
    this.turns = turns;
    this.actions = actions;
    return this;
  }

  /**
   * Set the tolerance percentage.
   *
   * @param tolerance - Tolerance percentage (0-100)
   * @returns This builder for chaining
   */
  withTolerance(tolerance: number): this {
    this.tolerancePercent = tolerance;
    return this;
  }

  /**
   * Set the target turns.
   *
   * @param turns - Target number of turns
   * @returns This builder for chaining
   */
  withTurns(turns: number): this {
    this.turns = turns;
    return this;
  }

  /**
   * Set the target actions.
   *
   * @param actions - Target number of actions
   * @returns This builder for chaining
   */
  withActions(actions: number): this {
    this.actions = actions;
    return this;
  }

  /**
   * Create target with invalid turns (zero).
   *
   * @returns This builder for chaining
   */
  withInvalidTurns(): this {
    return this.withTurns(0);
  }

  /**
   * Create target with invalid actions (zero).
   *
   * @returns This builder for chaining
   */
  withInvalidActions(): this {
    return this.withActions(0);
  }

  /**
   * Create target with negative turns.
   *
   * @returns This builder for chaining
   */
  withNegativeTurns(): this {
    return this.withTurns(-1);
  }

  /**
   * Create target with negative actions.
   *
   * @returns This builder for chaining
   */
  withNegativeActions(): this {
    return this.withActions(-1);
  }

  /**
   * Create target with 0% tolerance.
   *
   * @returns This builder for chaining
   */
  withZeroTolerance(): this {
    return this.withTolerance(0);
  }

  /**
   * Create target with 100% tolerance.
   *
   * @returns This builder for chaining
   */
  withFullTolerance(): this {
    return this.withTolerance(100);
  }

  /**
   * Create target with negative tolerance (invalid).
   *
   * @returns This builder for chaining
   */
  withNegativeTolerance(): this {
    return this.withTolerance(-1);
  }

  /**
   * Create target with tolerance above 100% (invalid).
   *
   * @returns This builder for chaining
   */
  withAboveMaxTolerance(): this {
    return this.withTolerance(101);
  }

  /**
   * Build the TtkTarget instance.
   *
   * @returns TtkTarget instance
   */
  build(): TtkTarget {
    return new TtkTarget(this.turns, this.actions, this.tolerancePercent);
  }

  /**
   * Create builder with invalid data.
   */
  withInvalidData(): this {
    return this.withInvalidTurns();
  }
}
