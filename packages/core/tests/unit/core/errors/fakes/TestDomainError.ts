import { DomainError, ErrorSeverity } from '@coreto/core/core/errors/DomainError';

// Concrete implementation for testing the abstract class
export class TestDomainError extends DomainError {
  constructor(
    message: string,
    severity: ErrorSeverity = 'critical',
    context?: Record<string, unknown>
  ) {
    super(message, severity, context);
  }
}