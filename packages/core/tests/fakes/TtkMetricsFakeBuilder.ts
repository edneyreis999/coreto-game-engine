import { TtkMetrics } from '@coreto/core';
import { FakeBuilder } from './FakeBuilder.js';

/**
 * Builder for creating TtkMetrics instances in tests.
 * Provides sensible defaults and fluent interface for customization.
 *
 * @example
 * ```typescript
 * const metrics = new TtkMetricsFakeBuilder()
 *   .withTurns(12)
 *   .withActions(48)
 *   .build();
 *
 * const invalid = new TtkMetricsFakeBuilder()
 *   .withInvalidTurns()
 *   .build();
 * ```
 */
export class TtkMetricsFakeBuilder extends FakeBuilder<TtkMetrics> {
  private turns = 12;
  private actions = 48;

  /**
   * Set both turns and actions.
   *
   * @param turns - Number of turns
   * @param actions - Number of actions
   * @returns This builder for chaining
   */
  withMetrics(turns: number, actions: number): this {
    this.turns = turns;
    this.actions = actions;
    return this;
  }

  /**
   * Set the number of turns.
   *
   * @param turns - Number of turns
   * @returns This builder for chaining
   */
  withTurns(turns: number): this {
    this.turns = turns;
    return this;
  }

  /**
   * Set the number of actions.
   *
   * @param actions - Number of actions
   * @returns This builder for chaining
   */
  withActions(actions: number): this {
    this.actions = actions;
    return this;
  }

  /**
   * Create metrics with invalid turns (negative).
   *
   * @returns This builder for chaining
   */
  withInvalidTurns(): this {
    return this.withTurns(-1);
  }

  /**
   * Create metrics with invalid actions (negative).
   *
   * @returns This builder for chaining
   */
  withInvalidActions(): this {
    return this.withActions(-1);
  }

  /**
   * Create metrics with zero values.
   *
   * @returns This builder for chaining
   */
  withZeroMetrics(): this {
    return this.withMetrics(0, 0);
  }

  /**
   * Build the TtkMetrics instance.
   *
   * @returns TtkMetrics instance
   */
  build(): TtkMetrics {
    return new TtkMetrics(this.turns, this.actions);
  }

  /**
   * Create builder with invalid data.
   */
  withInvalidData(): this {
    return this.withInvalidTurns();
  }
}
