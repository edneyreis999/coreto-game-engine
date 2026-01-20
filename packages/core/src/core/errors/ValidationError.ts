import { DomainError } from './DomainError.js';
import { ZodError } from 'zod';

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
   * Creates a ValidationError from a Zod validation error.
   * Extracts all validation issues and includes them in the error context.
   *
   * @param zodError - The ZodError from schema validation
   * @returns ValidationError with formatted Zod issues
   *
   * @example
   * ```typescript
   * const schema = z.object({ id: z.string() });
   * try {
   *   schema.parse({ id: 123 });
   * } catch (error) {
   *   const validationError = ValidationError.fromZodError(error as ZodError);
   *   // validationError.context.issues contains formatted validation errors
   * }
   * ```
   */
  static fromZodError(zodError: ZodError): ValidationError {
    const issues = zodError.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    return new ValidationError('Schema validation failed', { issues });
  }
}
