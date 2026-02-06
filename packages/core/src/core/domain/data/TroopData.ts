/**
 * Domain-level Troop data structure.
 * Pure domain type with no infrastructure dependencies.
 *
 * Represents raw troop data from RPG Maker MZ Troops.json,
 * mapped to domain types.
 */

/**
 * Troop member definition.
 * Defines an enemy's position in a troop formation.
 */
export interface TroopMemberData {
  /** ID of the enemy (references Enemies.json) */
  enemyId: number;
  /** X coordinate on battle screen */
  x: number;
  /** Y coordinate on battle screen */
  y: number;
  /** Whether the enemy is initially hidden */
  hidden: boolean;
}

/**
 * Battle event page conditions.
 * Determines when a battle event page is active.
 */
export interface TroopPageConditionsData {
  /** Actor HP percentage threshold */
  actorHp: number;
  /** Actor ID for condition check */
  actorId: number;
  /** Whether actor condition is active */
  actorValid: boolean;
  /** Enemy HP percentage threshold */
  enemyHp: number;
  /** Enemy index (0-7) for condition check */
  enemyIndex: number;
  /** Whether enemy condition is active */
  enemyValid: boolean;
  /** Switch ID for condition check */
  switchId: number;
  /** Whether switch condition is active */
  switchValid: boolean;
  /** Turn count start (for turn range) */
  turnA: number;
  /** Turn count end (for turn range) */
  turnB: number;
  /** Whether turn ending condition is active */
  turnEnding: boolean;
  /** Whether turn condition is active */
  turnValid: boolean;
}

/**
 * Battle event command.
 * Part of battle event page execution.
 */
export interface TroopEventCommandData {
  /** Command code (0 = end of list) */
  code: number;
  /** Indentation level for conditional branches */
  indent: number;
  /** Command parameters (vary by command code) */
  parameters: unknown[];
}

/**
 * Battle event page.
 * Defines conditional events that can occur during battle.
 */
export interface TroopPageData {
  /** Conditions for this page to be active */
  conditions: TroopPageConditionsData;
  /** List of event commands to execute */
  list: TroopEventCommandData[];
  /**
   * Page span (when to check conditions).
   * 0 = Battle (once per battle)
   * 1 = Turn (every turn)
   * 2 = Moment (continuously)
   */
  span: number;
}

/**
 * Domain-level Troop data structure.
 * Contains all data from Troops.json.
 */
export interface TroopData {
  /** Unique troop ID (1-based) */
  id: number;
  /** Enemy positions in this troop */
  members: TroopMemberData[];
  /** Troop display name */
  name: string;
  /** Battle event pages for this troop */
  pages: TroopPageData[];
}
