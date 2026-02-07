/**
 * SystemClock - Production clock implementation
 *
 * Wraps Date.now() to provide current time in milliseconds.
 * Used in production environments for real-time measurements.
 *
 * @example
 * ```typescript
 * const clock = new SystemClock();
 * const timestamp = clock.now(); // Returns Date.now()
 * ```
 */

import type { IClock } from '@coreto/core';

export class SystemClock implements IClock {
  now(): number {
    return Date.now();
  }
}
