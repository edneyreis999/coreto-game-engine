/**
 * ConfigurationPanel Validation Utilities
 *
 * Form validation helpers using Zod schemas from @coreto/core.
 * Provides real-time validation for all form fields with error messages.
 *
 * @see packages/core/src/infrastructure/config/schemas.ts
 */

import { z } from 'zod';
import type {
  TrechoFormData,
  PartyMemberFormData,
  GlobalSettingsFormData,
  FormErrors,
  FormValidation,
} from './types';

// ============================================================================
// Zod Schemas for Form Validation
// ============================================================================

/**
 * Zod schema for party member validation.
 * Matches the core package's PartyMemberSchema.
 */
const PartyMemberFormSchema = z.object({
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
const PartyConfigFormSchema = z.object({
  members: z
    .array(PartyMemberFormSchema, {
      required_error: 'Party members are required',
      invalid_type_error: 'Party members must be an array',
    })
    .min(1, 'At least 1 party member is required')
    .max(4, 'Cannot have more than 4 party members'),
});

/**
 * Zod schema for tolerance percentage validation.
 */
const _TolerancePercentFormSchema = z
  .number({
    required_error: 'Tolerance is required',
    invalid_type_error: 'Tolerance must be a number',
  })
  .min(0, 'Tolerance must be at least 0%')
  .max(100, 'Tolerance cannot exceed 100%');

/**
 * Zod schema for troop IDs validation.
 */
const TroopIdsFormSchema = z
  .array(
    z
      .number({
        invalid_type_error: 'Troop IDs must be numbers',
      })
      .int('Troop IDs must be integers')
      .positive('Troop IDs must be positive numbers'),
    {
      required_error: 'Troop IDs are required',
      invalid_type_error: 'Troop IDs must be an array',
    }
  )
  .min(1, 'At least 1 troop must be selected');

/**
 * Zod schema for trecho form validation.
 * Matches the core package's TrechoSchema with flat field structure.
 */
export const TrechoFormSchema = z.object({
  id: z
    .string({
      required_error: 'ID is required',
      invalid_type_error: 'ID must be a string',
    })
    .min(1, 'ID cannot be empty')
    .regex(
      /^[a-z0-9-]+$/,
      'ID must contain only lowercase letters, numbers, and hyphens'
    ),
  name: z
    .string({
      invalid_type_error: 'Name must be a string',
    })
    .min(1, 'Name cannot be empty')
    .optional(),
  anchorLevelMin: z
    .number({
      required_error: 'Minimum level is required',
      invalid_type_error: 'Minimum level must be a number',
    })
    .int('Minimum level must be an integer')
    .min(1, 'Minimum level must be at least 1')
    .max(99, 'Minimum level cannot exceed 99'),
  anchorLevelMax: z
    .number({
      required_error: 'Maximum level is required',
      invalid_type_error: 'Maximum level must be a number',
    })
    .int('Maximum level must be an integer')
    .min(1, 'Maximum level must be at least 1')
    .max(99, 'Maximum level cannot exceed 99'),
  targetTtkTurns: z
    .number({
      required_error: 'Target turns is required',
      invalid_type_error: 'Target turns must be a number',
    })
    .int('Target turns must be an integer')
    .positive('Target turns must be a positive number'),
  targetTtkActions: z
    .number({
      required_error: 'Target actions is required',
      invalid_type_error: 'Target actions must be a number',
    })
    .int('Target actions must be an integer')
    .positive('Target actions must be a positive number'),
  tolerancePercent: z
    .number({
      required_error: 'Tolerance is required',
      invalid_type_error: 'Tolerance must be a number',
    })
    .min(0, 'Tolerance must be at least 0%')
    .max(100, 'Tolerance cannot exceed 100%'),
  troopIds: TroopIdsFormSchema,
  party: PartyConfigFormSchema,
})
  .refine((data) => data.anchorLevelMax >= data.anchorLevelMin, {
    message: 'Maximum level must be greater than or equal to minimum level',
    path: ['anchorLevelMax'],
  });

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
// ============================================================================**

/**
 * Validates a trecho form data against the Zod schema.
 *
 * @param data - Form data to validate
 * @returns Validation result with errors if invalid
 *
 * @example
 * const validation = validateTrechoForm({ id: '', ... });
 * if (!validation.isValid) {
 *   console.log(validation.errors); // { id: { message: 'ID cannot be empty' } }
 * }
 */
export function validateTrechoForm(data: TrechoFormData): FormValidation {
  const result = TrechoFormSchema.safeParse(data);

  if (result.success) {
    return { isValid: true, errors: {} };
  }

  // Convert Zod errors to FormErrors format
  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    errors[path] = { message: issue.message };
  }

  return { isValid: false, errors };
}

/**
 * Validates a party member form data.
 *
 * @param data - Party member data to validate
 * @returns Validation result with errors if invalid
 */
export function validatePartyMemberForm(data: PartyMemberFormData): FormValidation {
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

/**
 * Validates global settings form data.
 *
 * @param data - Global settings data to validate
 * @returns Validation result with errors if invalid
 */
export function validateGlobalSettingsForm(
  data: GlobalSettingsFormData
): FormValidation {
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
 * Validates a single field of the trecho form.
 * Used for real-time validation on field change.
 *
 * @param fieldName - Path to the field (e.g., 'id', 'party.members.0.classId')
 * @param value - Value to validate
 * @param schema - Optional partial schema to use for validation
 * @returns Validation error message or undefined if valid
 *
 * @example
 * const error = validateTrechoField('id', '');
 * // Returns: 'ID cannot be empty'
 *
 * const valid = validateTrechoField('id', 'ato1-floresta');
 * // Returns: undefined
 */
export function validateTrechoField(
  fieldName: string,
  value: unknown
): string | undefined {
  // Create a partial schema with only the field being validated
  const fieldSchema = getSchemaForField(fieldName);

  if (!fieldSchema) {
    return undefined; // No validation for this field
  }

  const result = fieldSchema.safeParse(value);

  if (result.success) {
    return undefined;
  }

  return result.error.issues[0]?.message;
}

/**
 * Gets the Zod schema for a specific field path.
 * Handles nested paths like 'party.members.0.classId'.
 */
function getSchemaForField(fieldName: string): z.ZodTypeAny | undefined {
  // Map field names to their schemas
  const schemaMap: Record<string, z.ZodTypeAny> = {
    id: z.string().min(1, 'ID cannot be empty'),
    name: z.string().min(1, 'Name cannot be empty').optional(),
    anchorLevelMin: z.number().int().min(1).max(99),
    anchorLevelMax: z.number().int().min(1).max(99),
    targetTtkTurns: z.number().int().positive(),
    targetTtkActions: z.number().int().positive(),
    tolerancePercent: z.number().min(0).max(100),
    'party.members.0.classId': PartyMemberFormSchema.shape.classId,
    'party.members.0.level': PartyMemberFormSchema.shape.level,
    'party.members.1.classId': PartyMemberFormSchema.shape.classId,
    'party.members.1.level': PartyMemberFormSchema.shape.level,
    'party.members.2.classId': PartyMemberFormSchema.shape.classId,
    'party.members.2.level': PartyMemberFormSchema.shape.level,
    'party.members.3.classId': PartyMemberFormSchema.shape.classId,
    'party.members.3.level': PartyMemberFormSchema.shape.level,
  };

  return schemaMap[fieldName];
}

/**
 * Checks if a field has an error in the FormErrors object.
 * Handles nested paths for array fields.
 *
 * @param errors - Form errors object
 * @param fieldName - Path to the field
 * @returns Error message if field has error, undefined otherwise
 */
export function getFieldError(
  errors: FormErrors,
  fieldName: string
): string | undefined {
  return errors[fieldName]?.message;
}

/**
 * Creates a default trecho form data object.
 * Useful for initializing the form in create mode.
 *
 * @returns Default trecho form data
 */
export function getDefaultTrechoFormData(): TrechoFormData {
  return {
    id: '',
    name: '',
    anchorLevelMin: 1,
    anchorLevelMax: 10,
    targetTtkTurns: 3,
    targetTtkActions: 8,
    tolerancePercent: 15,
    troopIds: [],
    party: {
      members: [
        { classId: 1, level: 1 },
        { classId: 1, level: 1 },
        { classId: 1, level: 1 },
        { classId: 1, level: 1 },
      ],
    },
  };
}

/**
 * Creates a default global settings form data object.
 *
 * @returns Default global settings form data
 */
export function getDefaultGlobalSettingsFormData(): GlobalSettingsFormData {
  return {
    seed: 12345,
    maxBattleTurns: 100,
  };
}
