/**
 * RuntimeError
 *
 * Error class for runtime-related failures in the Coreto Game Engine.
 * Used for JSDOM initialization, script loading, and headless execution errors.
 *
 * @example
 * ```typescript
 * throw new RuntimeError(
 *   'Failed to initialize JSDOM environment',
 *   'critical',
 *   { originalError: error.message }
 * );
 * ```
 */

import type { ErrorSeverity } from './DomainError.js';
import { DomainError } from './DomainError.js';

/**
 * Runtime-related errors in the headless execution environment.
 *
 * Scenarios where RuntimeError is thrown:
 * - JSDOM initialization fails
 * - Core scripts cannot be loaded
 * - Mock setup fails
 * - Bootstrap process fails at any step
 *
 * ADRs applicable:
 * - ADR-014: JSDOM Browser Emulation
 * - ADR-015: Graphics Mocking
 */
export class RuntimeError extends DomainError {
  /**
   * Creates a new RuntimeError.
   *
   * @param message - Human-readable error message
   * @param severity - Error severity level (default: 'critical')
   * @param context - Additional context data for debugging (projectPath, seed, originalError, etc.)
   */
  constructor(
    message: string,
    severity: ErrorSeverity = 'critical',
    context: Record<string, unknown> = {}
  ) {
    super(message, severity, context);
    this.name = 'RuntimeError';
  }
}
