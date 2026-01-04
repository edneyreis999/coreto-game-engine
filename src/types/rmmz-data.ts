/**
 * RPG Maker MZ Data Structure Types
 *
 * Generated from empirical analysis of "Daratrine - A Origem" project
 * RPG Maker MZ Version ID: 83639521
 * VisuStella Plugin Versions: 1.85
 * Analysis Date: 2026-01-04
 *
 * These types represent the actual structure of data/*.json files
 * from a real RPG Maker MZ project with VisuStella plugins and
 * custom Coreto plugins installed.
 */

// =============================================================================
// Auxiliary Types
// =============================================================================

/**
 * Skill learning definition for a class
 * Defines at which level a class learns a specific skill
 */
export interface Learning {
  /** Level at which the skill is learned (1-99) */
  level: number;
  /** Additional notes (usually empty string) */
  note: string;
  /** ID of the skill to be learned (references Skills.json) */
  skillId: number;
}

/**
 * Trait definition for actors, classes, enemies, equipment, and states
 * Traits modify character properties like element rates, parameter bonuses, etc.
 */
export interface Trait {
  /**
   * Trait code determining the type of trait
   * Common codes found in analysis:
   * - 22: Parameter (xparam) rate
   * - 23: Attack element
   * - 31: Attack state
   * - 41: Skill type seal
   * - 51: Equipment type seal
   * - 52: Equip slot seal
   * - 55: Action times+
   */
  code: number;
  /** Data ID for the trait (meaning depends on code) */
  dataId: number;
  /** Trait value (meaning depends on code) */
  value: number;
}

/**
 * Enemy action pattern
 * Defines what skills an enemy can use and under what conditions
 */
export interface Action {
  /** First condition parameter (meaning depends on conditionType) */
  conditionParam1: number;
  /** Second condition parameter (meaning depends on conditionType) */
  conditionParam2: number;
  /**
   * Condition type (0 = always)
   * Other values determine when the action can be used
   */
  conditionType: number;
  /** Action priority rating (higher = more likely to use) */
  rating: number;
  /** ID of the skill to use (references Skills.json) */
  skillId: number;
}

/**
 * Effect applied by skills/items
 * Defines what happens when a skill or item is used
 */
export interface Effect {
  /**
   * Effect code determining the type of effect
   * Common codes:
   * - 21: Common event
   * - 22: Special effect (escape, etc.)
   */
  code: number;
  /** Data ID for the effect (meaning depends on code) */
  dataId: number;
  /** First value parameter */
  value1: number;
  /** Second value parameter */
  value2: number;
}

/**
 * Damage formula configuration for skills/items
 * Defines how damage is calculated and displayed
 */
export interface Damage {
  /** Whether the skill/item can deal critical hits */
  critical: boolean;
  /**
   * Element ID for damage calculation
   * -1 = Normal Attack element
   * 0+ = references System.elements
   */
  elementId: number;
  /**
   * Damage formula as JavaScript expression
   * Variables available: a (attacker), b (target), v (game variables)
   * Example: "a.atk * 4 - b.def * 2"
   */
  formula: string;
  /**
   * Damage type
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
 * Item drop configuration for enemies
 * Defines what items an enemy can drop when defeated
 */
export interface DropItem {
  /**
   * ID of the item/weapon/armor to drop
   * Meaning depends on 'kind' field
   */
  dataId: number;
  /**
   * Drop rate denominator (1/denominator chance)
   * 1 = 100%, 2 = 50%, 3 = 33.3%, etc.
   */
  denominator: number;
  /**
   * Type of item to drop
   * 0 = Item (references Items.json)
   * 1 = Weapon (references Weapons.json)
   * 2 = Armor (references Armors.json)
   */
  kind: number;
}

/**
 * Troop member definition
 * Defines an enemy's position in a troop formation
 */
export interface TroopMember {
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
 * Battle event page conditions
 * Determines when a battle event page is active
 */
export interface TroopPageConditions {
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
 * Battle event command
 * Part of battle event page execution
 */
export interface TroopEventCommand {
  /** Command code (0 = end of list) */
  code: number;
  /** Indentation level for conditional branches */
  indent: number;
  /** Command parameters (vary by command code) */
  parameters: any[];
}

/**
 * Battle event page
 * Defines conditional events that can occur during battle
 */
export interface TroopPage {
  /** Conditions for this page to be active */
  conditions: TroopPageConditions;
  /** List of event commands to execute */
  list: TroopEventCommand[];
  /**
   * Page span (when to check conditions)
   * 0 = Battle (once per battle)
   * 1 = Turn (every turn)
   * 2 = Moment (continuously)
   */
  span: number;
}

// =============================================================================
// Main Data Structures
// =============================================================================

/**
 * Class data from Classes.json
 * Defines character classes with their parameter curves and learnings
 */
export interface ClassData {
  /** Unique class ID (1-based) */
  id: number;
  /**
   * Experience curve parameters [base, extra, accel_a, accel_b]
   * Used to calculate EXP required for each level
   */
  expParams: [number, number, number, number];
  /** Class-specific traits */
  traits: Trait[];
  /**
   * Skills learned by this class at specific levels
   * Empty array if class doesn't learn skills naturally
   */
  learnings: Learning[];
  /** Class display name */
  name: string;
  /** Additional notes (often contains custom notetags) */
  note: string;
  /**
   * Parameter curves for levels 1-99 (100 values, index 0 is level 1)
   * params[0] = MaxHP, params[1] = MaxMP, params[2] = ATK, params[3] = DEF,
   * params[4] = MAT, params[5] = MDF, params[6] = AGI, params[7] = LUK
   * Each is an array of 100 numbers representing growth from level 0-99
   */
  params: number[][];
}

/**
 * Skill data from Skills.json
 * Defines skills, spells, and special abilities
 */
export interface SkillData {
  /** Unique skill ID (1-based) */
  id: number;
  /**
   * Animation ID to play when skill is used
   * -1 = use default weapon animation
   * 0+ = references Animations.json
   */
  animationId: number;
  /** Damage configuration */
  damage: Damage;
  /** Skill description shown in menus */
  description: string;
  /** Effects applied when skill is used */
  effects: Effect[];
  /**
   * Hit type
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
  /**
   * Additional notes (often contains custom notetags)
   * Custom notetags found:
   * - <Skill Shop Require Class: X>
   * - <Skill Shop Cost: X>
   * - <Item 41 Cost: X>
   * - <Item 41 Forget Reward: X>
   */
  note: string;
  /**
   * Occasion when skill can be used
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
   * Skill scope (target selection)
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
   * Message type (VisuStella Battle Core extension)
   * 1 = Standard message format
   * Other values may customize message display
   */
  messageType: number;
}

/**
 * Enemy data from Enemies.json
 * Defines enemy stats, actions, and drops
 */
export interface EnemyData {
  /** Unique enemy ID (1-based) */
  id: number;
  /** Action patterns for AI behavior */
  actions: Action[];
  /** Battler graphic hue rotation (0-360) */
  battlerHue: number;
  /** Filename of battler graphic (without extension) */
  battlerName: string;
  /** Items that can be dropped when enemy is defeated */
  dropItems: DropItem[];
  /** Experience points awarded when enemy is defeated */
  exp: number;
  /** Enemy-specific traits */
  traits: Trait[];
  /** Gold awarded when enemy is defeated */
  gold: number;
  /** Enemy display name */
  name: string;
  /** Additional notes (may contain custom notetags) */
  note: string;
  /**
   * Enemy base parameters [MaxHP, MaxMP, ATK, DEF, MAT, MDF, AGI, LUK]
   * Fixed array of 8 numbers
   */
  params: [number, number, number, number, number, number, number, number];
}

/**
 * Troop data from Troops.json
 * Defines enemy formations and battle events
 */
export interface TroopData {
  /** Unique troop ID (1-based) */
  id: number;
  /** Enemy positions in this troop */
  members: TroopMember[];
  /** Troop display name */
  name: string;
  /** Battle event pages for this troop */
  pages: TroopPage[];
}

/**
 * Item data from Items.json
 * Defines consumable and non-consumable items
 */
export interface ItemData {
  /** Unique item ID (1-based) */
  id: number;
  /** Animation ID to play when item is used (0+ references Animations.json) */
  animationId: number;
  /** Whether item is consumed upon use */
  consumable: boolean;
  /** Damage configuration (usually type 0 for items) */
  damage: Damage;
  /** Item description shown in menus */
  description: string;
  /** Effects applied when item is used */
  effects: Effect[];
  /**
   * Hit type
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
   * Occasion when item can be used
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
   * Item scope (target selection)
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

/**
 * System data from System.json
 * Contains global game configuration and database references
 */
export interface SystemData {
  /** Advanced settings object */
  advanced: Record<string, any>;
  /** Airship vehicle configuration */
  airship: Record<string, any>;
  /** Armor type names array (index 0 is empty string) */
  armorTypes: string[];
  /** Attack motion definitions */
  attackMotions: any[];
  /** Battle BGM configuration */
  battleBgm: Record<string, any>;
  /** Battle background 1 filename */
  battleback1Name: string;
  /** Battle background 2 filename */
  battleback2Name: string;
  /** Default battler graphic hue */
  battlerHue: number;
  /** Default battler graphic filename */
  battlerName: string;
  /**
   * Battle system type (VisuStella Battle Core extension)
   * 0 = Default Turn-Based
   * 1 = ATB (Active Time Battle) or CTB (Charge Turn Battle)
   */
  battleSystem: number;
  /** Boat vehicle configuration */
  boat: Record<string, any>;
  /** Currency unit name (e.g., "G", "Gold") */
  currencyUnit: string;
  /** Defeat ME (music effect) configuration */
  defeatMe: Record<string, any>;
  /** Map ID used in editor */
  editMapId: number;
  /**
   * Element names array (index 0 is empty string)
   * Example: ["", "Físico", "Fogo", "Gelo", "Trovão"]
   */
  elements: string[];
  /** Equipment type names array */
  equipTypes: string[];
  /** Game title */
  gameTitle: string;
  /** Game over ME configuration */
  gameoverMe: Record<string, any>;
  /** Item category definitions */
  itemCategories: any[];
  /** Game locale/language */
  locale: string;
  /** Magic skill IDs array */
  magicSkills: number[];
  /** Menu command configurations */
  menuCommands: any[];
  /** Auto-save option enabled */
  optAutosave: boolean;
  /** Display TP in battle option */
  optDisplayTp: boolean;
  /** Draw title screen option */
  optDrawTitle: boolean;
  /** Extra EXP option */
  optExtraExp: boolean;
  /** Floor damage causes death option */
  optFloorDeath: boolean;
  /** Show followers option */
  optFollowers: boolean;
  /** Show key items number option */
  optKeyItemsNumber: boolean;
  /** Side-view battle option */
  optSideView: boolean;
  /** Slip damage causes death option */
  optSlipDeath: boolean;
  /** Transparent player option */
  optTransparent: boolean;
  /** Initial party member IDs */
  partyMembers: number[];
  /** Ship vehicle configuration */
  ship: Record<string, any>;
  /**
   * Skill type names array (index 0 is empty string)
   * Example: ["", "Mágica", "Especial"]
   */
  skillTypes: string[];
  /** System sound effects */
  sounds: any[];
  /** Starting map ID */
  startMapId: number;
  /** Starting X coordinate */
  startX: number;
  /** Starting Y coordinate */
  startY: number;
  /** Switch names array */
  switches: string[];
  /** Game terminology definitions */
  terms: Record<string, any>;
  /** Test battle party configuration */
  testBattlers: any[];
  /** Test battle troop ID */
  testTroopId: number;
  /** Title screen graphic 1 filename */
  title1Name: string;
  /** Title screen graphic 2 filename */
  title2Name: string;
  /** Title screen BGM configuration */
  titleBgm: Record<string, any>;
  /** Title command window configuration */
  titleCommandWindow: Record<string, any>;
  /** Variable names array */
  variables: string[];
  /** RPG Maker MZ version ID */
  versionId: number;
  /** Victory ME configuration */
  victoryMe: Record<string, any>;
  /**
   * Weapon type names array (index 0 is empty string)
   * Example: ["", "Adaga", "Espada", "Malho", "Machado"]
   */
  weaponTypes: string[];
  /** Window tone [R, G, B] */
  windowTone: [number, number, number];
  /** Splash screen option */
  optSplashScreen?: boolean;
  /** Message skip option */
  optMessageSkip?: boolean;
  /** Tile size configuration */
  tileSize?: number;
  /** Editor configuration */
  editor?: Record<string, any>;
  /** Face graphic size */
  faceSize?: number;
  /** Icon size */
  iconSize?: number;
}
