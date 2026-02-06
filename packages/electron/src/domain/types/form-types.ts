/**
 * Form Types - Domain Layer
 *
 * Source of truth for form data types.
 * These types are shared between Domain and Renderer layers,
 * ensuring type compatibility without architectural violations.
 */

// ============================================================================
// Party Form Types
// ============================================================================

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

/**
 * Party form data structure.
 */
export interface PartyFormData {
  /**
   * Array of party members (1-4 members).
   */
  members: PartyMemberFormData[];
}

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
