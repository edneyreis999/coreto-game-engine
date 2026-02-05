/**
 * Shared Components
 *
 * Reusable components that can be used across the application.
 * These components follow consistent design patterns and are fully typed.
 *
 * @see Task 07 - Shared Component Library
 */

// ErrorDisplay Component
export {
  ErrorDisplay,
  type ErrorDisplayProps,
  type ErrorDisplayVariant,
  type ErrorSeverity,
} from './ErrorDisplay';

// ExecutionProgress Component
export {
  ExecutionProgress,
  type ExecutionProgressProps,
  type ExecutionStatus,
} from './ExecutionProgress';

// ValidationMessage Component
export {
  ValidationMessage,
  type ValidationMessageProps,
  type ValidationSeverity,
} from './ValidationMessage';
