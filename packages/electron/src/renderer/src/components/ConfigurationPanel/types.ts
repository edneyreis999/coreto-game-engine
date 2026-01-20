/**
 * ConfigurationPanel Types
 *
 * Type definitions for the Configuration Panel component.
 * Extends IPC types with form-specific types.
 */

// ============================================================================
// Trecho Form Types
// ============================================================================

/**
 * Form data for a single trecho.
 * Matches the TrechoData structure from IPC with additional form fields.
 */
export interface TrechoFormData {
  /**
   * Unique identifier for this trecho (e.g., "ato1-nivel1-10").
   */
  id: string;

  /**
   * Human-readable name for this trecho.
   */
  name: string;

  /**
   * Minimum level in the anchor level range (1-99).
   */
  anchorLevelMin: number;

  /**
   * Maximum level in the anchor level range (1-99).
   */
  anchorLevelMax: number;

  /**
   * Target TTK measured in turns.
   */
  targetTtkTurns: number;

  /**
   * Target TTK measured in actions.
   */
  targetTtkActions: number;

  /**
   * Tolerance percentage (0-100, e.g., 15 = ±15%).
   */
  tolerancePercent: number;

  /**
   * Array of troop IDs to test in this trecho.
   */
  troopIds: number[];

  /**
   * Party configuration for this trecho.
   */
  party: PartyFormData;
}

/**
 * Party form data structure.
 */
export interface PartyFormData {
  /**
   * Array of party members (1-4 members).
   */
  members: PartyMemberFormData[];
}

/**
 * Party member form data.
 */
export interface PartyMemberFormData {
  /**
   * Class ID from RPG Maker MZ Classes.json (1-based index).
   */
  classId: number;

  /**
   * Character level (1-99).
   */
  level: number;
}

// ============================================================================
// Global Settings Types
// ============================================================================

/**
 * Global configuration settings form data.
 */
export interface GlobalSettingsFormData {
  /**
   * RNG seed for deterministic simulation.
   */
  seed: number;

  /**
   * Maximum battle turns before timeout.
   */
  maxBattleTurns?: number;
}

// ============================================================================
// Validation Types
// ============================================================================

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
