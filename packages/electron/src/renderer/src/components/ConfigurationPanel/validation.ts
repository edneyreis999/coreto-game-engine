/**
 * ConfigurationPanel Validation Utilities
 *
 * Form validation helpers using Zod schemas from @coreto/core.
 * Provides real-time validation for all form fields with error messages.
 *
 * This file re-exports validation logic from the domain layer.
 * We import directly from validation files to avoid pulling in use-cases
 * that depend on @coreto/core (which uses jsdom and causes issues in renderer tests).
 *
 * @see packages/core/src/infrastructure/config/schemas.ts
 * @see src/domain/validation
 */

// Import directly from validation files to avoid circular dependencies
// and jsdom issues in renderer tests
export {
  TrechoFormSchema,
  TroopIdsFormSchema,
  validateTrechoForm,
  validateTrechoField,
  getFieldError,
  getDefaultTrechoFormData,
} from '@coreto/electron/domain/validation/trecho-validation';
export type { TrechoFormData } from '@coreto/electron/domain/validation/trecho-validation';

export {
  PartyMemberFormSchema,
  PartyConfigFormSchema,
  validatePartyMemberForm,
} from '@coreto/electron/domain/validation/party-validation';
export type { PartyFormData, PartyMemberFormData } from '@coreto/electron/domain/validation/party-validation';

export {
  GlobalSettingsFormSchema,
  validateGlobalSettingsForm,
  getDefaultGlobalSettingsFormData,
} from '@coreto/electron/domain/validation/global-settings-validation';
export type { GlobalSettingsFormData } from '@coreto/electron/domain/validation/global-settings-validation';

export type {
  FormErrors,
  FormValidation,
} from '@coreto/electron/domain/validation/types';
