import type { IClock } from '@coreto/core/core/ports/IClock.js';

/**
 * In-memory fake implementation of IClock for testing.
 *
 * Provides deterministic time control for test reproducibility.
 *
 * @example
 * ```typescript
 * const clock = new FakeClock(1704067200000); // 2024-01-01T00:00:00Z
 *
 * expect(clock.now()).toBe(1704067200000);
 *
 * clock.advance(1000); // Advance 1 second
 * expect(clock.now()).toBe(1704067201000);
 *
 * clock.set(1704070800000); // Set to specific time
 * expect(clock.now()).toBe(1704070800000);
 * ```
 */
export class FakeClock implements IClock {
  private currentTime: number;

  /**
   * Create a new FakeClock.
   * @param initialTime - Initial timestamp in milliseconds (default: 2024-01-01T00:00:00Z)
   */
  constructor(initialTime: number = 1704067200000) {
    // 2024-01-01T00:00:00Z
    this.currentTime = initialTime;
  }

  /**
   * Get current timestamp.
   * @returns Current timestamp in milliseconds
   */
  now(): number {
    return this.currentTime;
  }

  /**
   * Advance time by a specified amount.
   * @param ms - Milliseconds to advance
   */
  advance(ms: number): void {
    this.currentTime += ms;
  }

  /**
   * Set time to a specific value.
   * @param time - Timestamp in milliseconds
   */
  set(time: number): void {
    this.currentTime = time;
  }
}
