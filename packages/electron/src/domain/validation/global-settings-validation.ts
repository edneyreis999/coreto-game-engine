/**
 * Global Settings Form Validation
 *
 * Domain validation rules for global settings forms.
 * Uses Zod schemas for validation with detailed error messages.
 */

import { z } from 'zod';
import type { FormErrors, FormValidation } from './types';

// Import form data types from domain layer
export type { GlobalSettingsFormData } from '../types/form-types';

// ============================================================================
// Zod Schemas for Global Settings Validation
// ============================================================================

/**
 * Zod schema for global settings validation.
 */
export const GlobalSettingsFormSchema = z.object({
  seed: z
    .number({
      required_error: 'Seed is required',
      invalid_type_error: 'Seed must be a number',
    })
    .int('Seed must be an integer')
    .positive('Seed must be a positive number'),
  maxBattleTurns: z
    .number({
      invalid_type_error: 'Max battle turns must be a number',
    })
    .int('Max battle turns must be an integer')
    .positive('Max battle turns must be positive')
    .optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates global settings form data.
 *
 * @param data - Global settings data to validate
 * @returns Validation result with errors if invalid
 */
export function validateGlobalSettingsForm(data: unknown): FormValidation {
  const result = GlobalSettingsFormSchema.safeParse(data);

  if (result.success) {
    return { isValid: true, errors: {} };
  }

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    errors[path] = { message: issue.message };
  }

  return { isValid: false, errors };
}

/**
 * Creates a default global settings form data object.
 *
 * @returns Default global settings form data
 */
export function getDefaultGlobalSettingsFormData() {
  return {
    seed: 12345,
    maxBattleTurns: 100,
  };
}
