/**
 * Error severity levels for domain errors.
 * - critical: System cannot continue, requires immediate attention
 * - warning: Non-fatal issue, system can continue with degraded functionality
 * - info: Informational message, no impact on functionality
 */
export type ErrorSeverity = 'critical' | 'warning' | 'info';

/**
 * Base class for all domain errors in the Coreto Game Engine.
 * Extends Error with severity levels, structured context, and JSON serialization.
 *
 * All domain-specific errors should extend this class to ensure consistent
 * error handling and reporting across the system.
 *
 * @example
 * ```typescript
 * class CustomError extends DomainError {
 *   constructor(message: string, context?: Record<string, unknown>) {
 *     super(message, 'critical', context);
 *   }
 * }
 * ```
 */
export abstract class DomainError extends Error {
  /**
   * Severity level of this error.
   */
  public readonly severity: ErrorSeverity;

  /**
   * Structured context data associated with this error.
   * Contains domain-specific information for debugging and logging.
   */
  public readonly context: Record<string, unknown>;

  /**
   * Timestamp when this error was created.
   */
  public readonly timestamp: Date;

  /**
   * Creates a new DomainError.
   *
   * @param message - Human-readable error message
   * @param severity - Error severity level (default: 'critical')
   * @param context - Additional context data for debugging
   */
  constructor(
    message: string,
    severity: ErrorSeverity = 'critical',
    context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serializes this error to a JSON-compatible object.
   * Useful for logging, reporting, and API responses.
   *
   * @returns JSON representation of this error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}
