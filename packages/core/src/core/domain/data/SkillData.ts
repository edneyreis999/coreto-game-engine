/**
 * Domain-level Skill data structure.
 * Pure domain type with no infrastructure dependencies.
 *
 * Represents raw skill data from RPG Maker MZ Skills.json,
 * mapped to domain types.
 */

/**
 * Effect applied by skills.
 * Defines what happens when a skill is used.
 */
export interface EffectData {
  /** Effect code determining the type of effect */
  code: number;
  /** Data ID for the effect (meaning depends on code) */
  dataId: number;
  /** First value parameter */
  value1: number;
  /** Second value parameter */
  value2: number;
}

/**
 * Damage formula configuration for skills.
 * Defines how damage is calculated and displayed.
 */
export interface DamageData {
  /** Whether the skill can deal critical hits */
  critical: boolean;
  /**
   * Element ID for damage calculation.
   * -1 = Normal Attack element
   * 0+ = references System.elements
   */
  elementId: number;
  /**
   * Damage formula as JavaScript expression.
   * Variables available: a (attacker), b (target), v (game variables)
   * Example: "a.atk * 4 - b.def * 2"
   */
  formula: string;
  /**
   * Damage type.
   * 0 = None
   * 1 = HP Damage
   * 2 = MP Damage
   * 3 = HP Recover
   * 4 = MP Recover
   * 5 = HP Drain
   * 6 = MP Drain
   */
  type: number;
  /** Damage variance percentage (0-100) */
  variance: number;
}

/**
 * Domain-level Skill data structure.
 * Contains all data from Skills.json.
 */
export interface SkillData {
  /** Unique skill ID (1-based) */
  id: number;
  /**
   * Animation ID to play when skill is used.
   * -1 = use default weapon animation
   * 0+ = references Animations.json
   */
  animationId: number;
  /** Damage configuration */
  damage: DamageData;
  /** Skill description shown in menus */
  description: string;
  /** Effects applied when skill is used */
  effects: EffectData[];
  /**
   * Hit type.
   * 0 = Certain hit
   * 1 = Physical attack
   * 2 = Magical attack
   */
  hitType: number;
  /** Icon index (0-based) from IconSet.png */
  iconIndex: number;
  /** Battle log message when skill is used */
  message1: string;
  /** Optional second battle log message */
  message2: string;
  /** MP cost to use skill */
  mpCost: number;
  /** Skill display name */
  name: string;
  /** Additional notes (often contains custom notetags) */
  note: string;
  /**
   * Occasion when skill can be used.
   * 0 = Always
   * 1 = Battle only
   * 2 = Menu only
   * 3 = Never
   */
  occasion: number;
  /** Number of times skill hits (1 for normal skills) */
  repeats: number;
  /** Required weapon type 1 (0 = no requirement) */
  requiredWtypeId1: number;
  /** Required weapon type 2 (0 = no requirement) */
  requiredWtypeId2: number;
  /**
   * Skill scope (target selection).
   * 0 = None
   * 1 = One enemy
   * 2 = All enemies
   * 7 = One ally
   * 11 = User
   */
  scope: number;
  /** Speed correction (affects turn order) */
  speed: number;
  /** Skill type ID (references System.skillTypes) */
  stypeId: number;
  /** Base success rate percentage (0-100) */
  successRate: number;
  /** TP cost to use skill */
  tpCost: number;
  /** TP gained by target when hit by skill */
  tpGain: number;
  /**
   * Message type (VisuStella Battle Core extension).
   * 1 = Standard message format
   */
  messageType: number;
}
