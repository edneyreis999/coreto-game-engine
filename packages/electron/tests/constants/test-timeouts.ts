/**
 * Test Timeout Constants
 *
 * Centralized timeout values for test reliability.
 * Prevents magic numbers and improves test maintainability.
 *
 * @see packages/electron/test-health-action-plan.md Task 1
 */

/**
 * Delay between concurrent exports to ensure unique timestamps.
 */
export const CONCURRENT_EXPORT_DELAY_MS = 2;

/**
 * Default timeout for async operations in tests.
 */
export const TEST_TIMEOUT_MS = 100;

/**
 * Delay before auto-clearing success messages (5 seconds).
 */
export const SUCCESS_MESSAGE_AUTO_CLEAR_MS = 5000;

/**
 * Delay to check if message is still visible before auto-clear.
 */
export const MESSAGE_CHECK_DELAY_MS = 4000;

/**
 * Additional delay after message check (total 6 seconds to verify clear).
 */
export const MESSAGE_CLEARED_CHECK_DELAY_MS = 2000;

/**
 * Number of concurrent exports for stress testing.
 */
export const CONCURRENT_EXPORTS_COUNT = 5;

/**
 * Number of rapid exports for performance testing.
 */
export const RAPID_EXPORTS_COUNT = 10;
