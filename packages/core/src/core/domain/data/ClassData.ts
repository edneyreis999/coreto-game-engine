/**
 * Domain-level Class data structure.
 * Pure domain type with no infrastructure dependencies.
 *
 * Represents raw class data from RPG Maker MZ Classes.json,
 * mapped to domain types.
 */

/**
 * Skill learning definition for a class.
 * Defines at which level a class learns a specific skill.
 */
export interface LearningData {
  /** Level at which the skill is learned (1-99) */
  level: number;
  /** Additional notes (usually empty string) */
  note: string;
  /** ID of the skill to be learned (references Skills.json) */
  skillId: number;
}

/**
 * Trait definition for classes.
 * Traits modify character properties.
 */
export interface TraitData {
  /** Trait code determining the type of trait */
  code: number;
  /** Data ID for the trait (meaning depends on code) */
  dataId: number;
  /** Trait value (meaning depends on code) */
  value: number;
}

/**
 * Domain-level Class data structure.
 * Contains all data from Classes.json.
 */
export interface ClassData {
  /** Unique class ID (1-based) */
  id: number;
  /**
   * Experience curve parameters [base, extra, accel_a, accel_b].
   * Used to calculate EXP required for each level.
   */
  expParams: [number, number, number, number];
  /** Class-specific traits */
  traits: TraitData[];
  /**
   * Skills learned by this class at specific levels.
   * Empty array if class doesn't learn skills naturally.
   */
  learnings: LearningData[];
  /** Class display name */
  name: string;
  /** Additional notes (often contains custom notetags) */
  note: string;
  /**
   * Parameter curves for levels 1-99 (100 values, index 0 is level 1).
   * params[0] = MaxHP, params[1] = MaxMP, params[2] = ATK, params[3] = DEF,
   * params[4] = MAT, params[5] = MDF, params[6] = AGI, params[7] = LUK.
   * Each is an array of 100 numbers representing growth from level 0-99.
   */
  params: number[][];
}
