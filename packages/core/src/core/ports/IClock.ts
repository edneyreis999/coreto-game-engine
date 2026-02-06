/**
 * Clock port for time-related operations
 *
 * Provides abstraction for current time access, allowing for deterministic
 * time sources in testing while using real system time in production.
 *
 * Production: SystemClock (wraps Date.now())
 * Testing: MockClock (controlled time)
 */
export interface IClock {
  /**
   * Returns current timestamp in milliseconds
   *
   * Production: Returns Date.now() - current Unix timestamp in milliseconds
   * Testing: Returns controlled time value for deterministic test execution
   *
   * @returns Current timestamp in milliseconds since epoch
   */
  now(): number;
}
