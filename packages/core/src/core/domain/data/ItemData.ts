/**
 * Domain-level Item data structure.
 * Pure domain type with no infrastructure dependencies.
 *
 * Represents raw item data from RPG Maker MZ Items.json,
 * mapped to domain types.
 */

/**
 * Effect applied by items.
 * Defines what happens when an item is used.
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
 * Damage formula configuration for items.
 * Defines how damage is calculated.
 */
export interface DamageData {
  /** Whether the item can deal critical hits */
  critical: boolean;
  /** Element ID for damage calculation */
  elementId: number;
  /** Damage formula as JavaScript expression */
  formula: string;
  /** Damage type (0 = None, 1 = HP Damage, etc.) */
  type: number;
  /** Damage variance percentage (0-100) */
  variance: number;
}

/**
 * Domain-level Item data structure.
 * Contains all data from Items.json.
 */
export interface ItemData {
  /** Unique item ID (1-based) */
  id: number;
  /** Animation ID to play when item is used (0+ references Animations.json) */
  animationId: number;
  /** Whether item is consumed upon use */
  consumable: boolean;
  /** Damage configuration (usually type 0 for items) */
  damage: DamageData;
  /** Item description shown in menus */
  description: string;
  /** Effects applied when item is used */
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
  /** Item type ID (references System.itemCategories) */
  itypeId: number;
  /** Item display name */
  name: string;
  /** Additional notes (may contain custom notetags) */
  note: string;
  /**
   * Occasion when item can be used.
   * 0 = Always
   * 1 = Battle only
   * 2 = Menu only
   * 3 = Never
   */
  occasion: number;
  /** Shop price in gold */
  price: number;
  /** Number of times item effect repeats */
  repeats: number;
  /**
   * Item scope (target selection).
   * 0 = None
   * 1 = One enemy
   * 2 = All enemies
   * 7 = One ally
   * 11 = User
   */
  scope: number;
  /** Speed correction */
  speed: number;
  /** Base success rate percentage (0-100) */
  successRate: number;
  /** TP gained by target when hit by item */
  tpGain: number;
}
