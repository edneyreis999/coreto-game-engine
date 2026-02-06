/**
 * ConfigurationPanel Module Exports
 *
 * Barrel exports for ConfigurationPanel components and utilities.
 *
 * @see Task 67885303-12bf-4091-b9a1-b55662b4735e
 */

// Main component
export { ConfigurationPanel } from './ConfigurationPanel';
export type { ConfigurationPanelProps } from './ConfigurationPanel';

// Sub-components
export { TrechosListSection } from './TrechosListSection';
export type { TrechosListSectionProps } from './TrechosListSection';

export { TrechoForm } from './TrechoForm/index';
export type { TrechoFormProps } from './types';

export { GlobalSettingsSection } from './GlobalSettingsSection';
export type { GlobalSettingsSectionProps } from './GlobalSettingsSection';

// Types
export type {
  TrechoFormData,
  PartyFormData,
  PartyMemberFormData,
  GlobalSettingsFormData,
  FormErrors,
  FormValidation,
  SelectOption,
  ProjectDropdownData,
  ProjectConfigFormData,
  FormMode,
} from './types';

// Validation utilities
export {
  validateTrechoForm,
  validatePartyMemberForm,
  validateGlobalSettingsForm,
  validateTrechoField,
  getFieldError,
  getDefaultTrechoFormData,
  getDefaultGlobalSettingsFormData,
} from './validation';
