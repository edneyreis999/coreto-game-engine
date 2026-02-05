import { DomainError } from './DomainError.js';

/**
 * Generic validation issue structure.
 * Framework-agnostic representation of a validation error.
 */
export interface ValidationIssue {
  /** Dot-separated path to the invalid field */
  path: string;
  /** Human-readable error message */
  message: string;
  /** Machine-readable error code */
  code: string;
}

/**
 * Error thrown when validation fails.
 * Integrates with Zod for schema validation errors.
 *
 * @example
 * ```typescript
 * throw new ValidationError('Invalid configuration', { field: 'trechoId' });
 * ```
 *
 * @example
 * ```typescript
 * try {
 *   TrechoSchema.parse(data);
 * } catch (error) {
 *   throw ValidationError.fromZodError(error);
 * }
 * ```
 */
export class ValidationError extends DomainError {
  /**
   * Creates a new ValidationError.
   *
   * @param message - Human-readable error message
   * @param context - Additional validation context
   */
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'critical', context);
  }

  /**
   * Creates a ValidationError from generic validation issues.
   * Framework-agnostic factory method.
   *
   * @param issues - Array of validation issues
   * @returns ValidationError with formatted issues in context
   *
   * @example
   * ```typescript
   * const issues: ValidationIssue[] = [
   *   { path: 'id', message: 'Expected string, received number', code: 'invalid_type' }
   * ];
   * const error = ValidationError.fromValidationIssues(issues);
   * ```
   */
  static fromValidationIssues(issues: ValidationIssue[]): ValidationError {
    return new ValidationError('Schema validation failed', { issues });
  }
}
