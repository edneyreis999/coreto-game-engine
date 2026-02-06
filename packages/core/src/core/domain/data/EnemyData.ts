/**
 * Domain-level Enemy data structure.
 * Pure domain type with no infrastructure dependencies.
 *
 * Represents raw enemy data from RPG Maker MZ Enemies.json,
 * mapped to domain types.
 */

/**
 * Enemy action pattern data.
 * Defines what skills an enemy can use and under what conditions.
 */
export interface ActionData {
  /** First condition parameter (meaning depends on conditionType) */
  conditionParam1: number;
  /** Second condition parameter (meaning depends on conditionType) */
  conditionParam2: number;
  /** Condition type (0 = always) */
  conditionType: number;
  /** Action priority rating (higher = more likely to use) */
  rating: number;
  /** ID of the skill to use (references Skills.json) */
  skillId: number;
}

/**
 * Trait definition for enemies.
 * Traits modify character properties like element rates, parameter bonuses, etc.
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
 * Enemy drop item configuration.
 * Defines what items an enemy can drop when defeated.
 */
export interface DropItemData {
  /**
   * ID of the item/weapon/armor to drop.
   * Meaning depends on 'kind' field.
   */
  dataId: number;
  /**
   * Drop rate denominator (1/denominator chance).
   * 1 = 100%, 2 = 50%, 3 = 33.3%, etc.
   */
  denominator: number;
  /**
   * Type of item to drop.
   * 0 = Item (references Items.json)
   * 1 = Weapon (references Weapons.json)
   * 2 = Armor (references Armors.json)
   */
  kind: number;
}

/**
 * Domain-level Enemy data structure.
 * Contains all data from Enemies.json.
 */
export interface EnemyData {
  /** Unique enemy ID (1-based) */
  id: number;
  /** Action patterns for AI behavior */
  actions: ActionData[];
  /** Battler graphic hue rotation (0-360) */
  battlerHue: number;
  /** Filename of battler graphic (without extension) */
  battlerName: string;
  /** Items that can be dropped when enemy is defeated */
  dropItems: DropItemData[];
  /** Experience points awarded when enemy is defeated */
  exp: number;
  /** Enemy-specific traits */
  traits: TraitData[];
  /** Gold awarded when enemy is defeated */
  gold: number;
  /** Enemy display name */
  name: string;
  /** Additional notes (may contain custom notetags) */
  note: string;
  /**
   * Enemy base parameters [MaxHP, MaxMP, ATK, DEF, MAT, MDF, AGI, LUK].
   * Fixed array of 8 numbers.
   */
  params: [number, number, number, number, number, number, number, number];
}
