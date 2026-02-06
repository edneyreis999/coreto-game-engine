/**
 * Party Form Validation
 *
 * Domain validation rules for party configuration forms.
 * Uses Zod schemas for validation with detailed error messages.
 */

import { z } from 'zod';
import type { FormErrors, FormValidation } from './types';

// Import form data types from domain layer
export type { PartyFormData, PartyMemberFormData } from '../types/form-types';

// ============================================================================
// Zod Schemas for Party Validation
// ============================================================================

/**
 * Zod schema for party member validation.
 * Matches the core package's PartyMemberSchema.
 */
export const PartyMemberFormSchema = z.object({
  classId: z
    .number({
      required_error: 'Class is required',
      invalid_type_error: 'Class must be a number',
    })
    .int('Class must be an integer')
    .positive('Class must be a positive number'),
  level: z
    .number({
      required_error: 'Level is required',
      invalid_type_error: 'Level must be a number',
    })
    .int('Level must be an integer')
    .min(1, 'Level must be at least 1')
    .max(99, 'Level cannot exceed 99'),
});

/**
 * Zod schema for party configuration validation.
 * Matches the core package's PartyConfigSchema.
 */
export const PartyConfigFormSchema = z.object({
  members: z
    .array(PartyMemberFormSchema, {
      required_error: 'Party members are required',
      invalid_type_error: 'Party members must be an array',
    })
    .min(1, 'At least 1 party member is required')
    .max(4, 'Cannot have more than 4 party members'),
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates a party member form data.
 *
 * @param data - Party member data to validate
 * @returns Validation result with errors if invalid
 */
export function validatePartyMemberForm(data: unknown): FormValidation {
  const result = PartyMemberFormSchema.safeParse(data);

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
