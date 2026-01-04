/**
 * Logger port interface.
 * Provides logging abstraction for the application.
 */
export interface ILogger {
  /**
   * Log informational messages.
   * @param message - The message to log
   * @param meta - Optional metadata to include
   */
  info(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log warning messages.
   * @param message - The message to log
   * @param meta - Optional metadata to include
   */
  warn(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log error messages.
   * @param message - The message to log
   * @param meta - Optional metadata to include
   */
  error(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log debug messages.
   * @param message - The message to log
   * @param meta - Optional metadata to include
   */
  debug(message: string, meta?: Record<string, unknown>): void;
}
