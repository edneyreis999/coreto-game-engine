/**
 * Domain Validation Types
 *
 * Type definitions for form validation results and errors.
 * These types are used by both domain validation logic and UI components.
 */

/**
 * Form validation error for a specific field.
 */
export interface FieldError {
  /**
   * Error message for the field.
   */
  message: string;
}

/**
 * Form validation errors mapped by field name.
 * Uses dot notation for nested fields (e.g., "party.members.0.classId").
 */
export type FormErrors = Record<string, FieldError>;

/**
 * Form validation state.
 */
export interface FormValidation {
  /**
   * Whether the form is currently valid.
   */
  isValid: boolean;

  /**
   * Validation errors by field name.
   */
  errors: FormErrors;
}
