/**
 * ConfigurationPanel Types
 *
 * Type definitions for the Configuration Panel component.
 * Extends IPC types with form-specific types.
 *
 * Form types are imported from the domain layer to maintain
 * Clean Architecture principles.
 */

// ============================================================================
// Re-export Form Types from Domain Layer
// ============================================================================

/**
 * Form data types imported from the domain layer.
 * These are the source of truth for form data structures.
 */
export type {
  TrechoFormData,
  PartyFormData,
  PartyMemberFormData,
  GlobalSettingsFormData,
} from '@coreto/electron/domain/types/form-types';

// Import for local use in type definitions below
import type {
  TrechoFormData,
  GlobalSettingsFormData,
} from '@coreto/electron/domain/types/form-types';

// ============================================================================
// Validation Types
// ============================================================================
/**
 * Validation types are now exported from the domain layer.
 * These types define the structure of validation results and errors.
 *
 * @see @coreto/electron/domain/validation/types
 */
export type {
  FieldError,
  FormErrors,
  FormValidation,
} from '@coreto/electron/domain/validation/types';

// ============================================================================
// Dropdown Option Types
// ============================================================================

/**
 * Option for a select dropdown.
 */
export interface SelectOption {
  /**
   * Option value.
   */
  value: number;

  /**
   * Display label.
   */
  label: string;
}

/**
 * Data loaded from RPG Maker MZ project for dropdowns.
 */
export interface ProjectDropdownData {
  /**
   * Available classes from Classes.json.
   */
  classes: SelectOption[];

  /**
   * Available troops from Troops.json.
   */
  troops: SelectOption[];
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for ConfigurationPanel component.
 */
export interface ConfigurationPanelProps {
  /**
   * Absolute path to the currently selected RPG Maker MZ project.
   */
  projectPath: string;

  /**
   * Initial trechos to load from database (auto-load feature).
   * When provided, the panel will populate with these trechos on mount.
   */
  initialTrechos?: TrechoFormData[];

  /**
   * Callback when configuration is saved.
   */
  onConfigSaved?: (config: ProjectConfigFormData) => void;

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

/**
 * Complete project configuration form data.
 */
export interface ProjectConfigFormData {
  /**
   * Path to the RPG Maker MZ project.
   */
  projectPath: string;

  /**
   * All configured trechos.
   */
  trechos: TrechoFormData[];

  /**
   * Global settings.
   */
  globalSettings: GlobalSettingsFormData;
}

// ============================================================================
// Mode Types
// ============================================================================

/**
 * Form mode - either creating a new trecho or editing an existing one.
 */
export type FormMode = 'create' | 'edit';

/**
 * Props for TrechoForm component.
 */
export interface TrechoFormProps {
  /**
   * Current form mode (create or edit).
   */
  mode: FormMode;

  /**
   * Initial form data (for edit mode).
   */
  initialData?: TrechoFormData;

  /**
   * Available classes for party member selection.
   */
  classes: SelectOption[];

  /**
   * Available troops for troop selection.
   */
  troops: SelectOption[];

  /**
   * Callback when form is submitted with valid data.
   */
  onSubmit: (data: TrechoFormData) => void;

  /**
   * Callback when form is cancelled.
   */
  onCancel: () => void;

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}
