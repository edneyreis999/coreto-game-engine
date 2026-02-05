/**
 * ConfigurationPanel Validation Utilities
 *
 * Form validation helpers using Zod schemas from @coreto/core.
 * Provides real-time validation for all form fields with error messages.
 *
 * This file now re-exports validation logic from the domain layer.
 * The domain layer is the source of truth for validation rules.
 *
 * @see packages/core/src/infrastructure/config/schemas.ts
 * @see @coreto/electron/domain/validation
 */

// Re-export all validation logic from domain layer
export {
  TrechoFormSchema,
  TroopIdsFormSchema,
  validateTrechoForm,
  validateTrechoField,
  getFieldError,
  getDefaultTrechoFormData,
  PartyMemberFormSchema,
  PartyConfigFormSchema,
  validatePartyMemberForm,
  GlobalSettingsFormSchema,
  validateGlobalSettingsForm,
  getDefaultGlobalSettingsFormData,
} from '@coreto/electron/domain/validation';

// Re-export types from domain layer
export type {
  TrechoFormData,
  PartyFormData,
  PartyMemberFormData,
  GlobalSettingsFormData,
} from '@coreto/electron/domain/validation';
export type {
  FormErrors,
  FormValidation,
} from '@coreto/electron/domain/validation/types';
