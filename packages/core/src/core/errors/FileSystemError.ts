import { DomainError } from './DomainError.js';

/**
 * Error thrown when file system operations fail.
 * Used for report writing, context export, and other file operations.
 *
 * This is a critical error because it prevents report generation,
 * which is the primary output of the system.
 *
 * @example
 * ```typescript
 * try {
 *   fs.writeFileSync(outputPath, json, 'utf-8');
 * } catch (error) {
 *   throw new FileSystemError(`Failed to write report: ${error.message}`, {
 *     outputPath,
 *     error
 *   });
 * }
 * ```
 */
export class FileSystemError extends DomainError {
  /**
   * Creates a new FileSystemError.
   *
   * @param message - Human-readable error message
   * @param context - Additional file system context (path, operation, etc.)
   */
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'critical', context);
  }
}
