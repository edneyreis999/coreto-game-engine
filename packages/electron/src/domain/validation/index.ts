/**
 * Domain Validation Module
 *
 * Exports all validation rules, schemas, and types for form validation.
 */

// Types
export type {
  FieldError,
  FormErrors,
  FormValidation,
} from './types';

// Trecho Validation
export {
  TrechoFormSchema,
  TroopIdsFormSchema,
  validateTrechoForm,
  validateTrechoField,
  getFieldError,
  getDefaultTrechoFormData,
} from './trecho-validation';
export type { TrechoFormData } from './trecho-validation';

// Party Validation
export {
  PartyMemberFormSchema,
  PartyConfigFormSchema,
  validatePartyMemberForm,
} from './party-validation';
export type { PartyFormData, PartyMemberFormData } from './party-validation';

// Global Settings Validation
export {
  GlobalSettingsFormSchema,
  validateGlobalSettingsForm,
  getDefaultGlobalSettingsFormData,
} from './global-settings-validation';
export type { GlobalSettingsFormData } from './global-settings-validation';
