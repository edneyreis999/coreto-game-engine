/**
 * Domain-level System data structure.
 * Pure domain type with no infrastructure dependencies.
 *
 * Represents raw system configuration from RPG Maker MZ System.json,
 * mapped to domain types.
 */

/**
 * Domain-level System data structure.
 * Contains global game configuration and database references.
 */
export interface SystemData {
  /** Advanced settings object */
  advanced: Record<string, unknown>;
  /** Airship vehicle configuration */
  airship: Record<string, unknown>;
  /** Armor type names array (index 0 is empty string) */
  armorTypes: string[];
  /** Attack motion definitions */
  attackMotions: unknown[];
  /** Battle BGM configuration */
  battleBgm: Record<string, unknown>;
  /** Battle background 1 filename */
  battleback1Name: string;
  /** Battle background 2 filename */
  battleback2Name: string;
  /** Default battler graphic hue */
  battlerHue: number;
  /** Default battler graphic filename */
  battlerName: string;
  /**
   * Battle system type (VisuStella Battle Core extension).
   * 0 = Default Turn-Based
   * 1 = ATB (Active Time Battle) or CTB (Charge Turn Battle)
   */
  battleSystem: number;
  /** Boat vehicle configuration */
  boat: Record<string, unknown>;
  /** Currency unit name (e.g., "G", "Gold") */
  currencyUnit: string;
  /** Defeat ME (music effect) configuration */
  defeatMe: Record<string, unknown>;
  /** Map ID used in editor */
  editMapId: number;
  /**
   * Element names array (index 0 is empty string).
   * Example: ["", "Físico", "Fogo", "Gelo", "Trovão"]
   */
  elements: string[];
  /** Equipment type names array */
  equipTypes: string[];
  /** Game title */
  gameTitle: string;
  /** Game over ME configuration */
  gameoverMe: Record<string, unknown>;
  /** Item category definitions */
  itemCategories: unknown[];
  /** Game locale/language */
  locale: string;
  /** Magic skill IDs array */
  magicSkills: number[];
  /** Menu command configurations */
  menuCommands: unknown[];
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
  ship: Record<string, unknown>;
  /**
   * Skill type names array (index 0 is empty string).
   * Example: ["", "Mágica", "Especial"]
   */
  skillTypes: string[];
  /** System sound effects */
  sounds: unknown[];
  /** Starting map ID */
  startMapId: number;
  /** Starting X coordinate */
  startX: number;
  /** Starting Y coordinate */
  startY: number;
  /** Switch names array */
  switches: string[];
  /** Game terminology definitions */
  terms: Record<string, unknown>;
  /** Test battle party configuration */
  testBattlers: unknown[];
  /** Test battle troop ID */
  testTroopId: number;
  /** Title screen graphic 1 filename */
  title1Name: string;
  /** Title screen graphic 2 filename */
  title2Name: string;
  /** Title screen BGM configuration */
  titleBgm: Record<string, unknown>;
  /** Title command window configuration */
  titleCommandWindow: Record<string, unknown>;
  /** Variable names array */
  variables: string[];
  /** RPG Maker MZ version ID */
  versionId: number;
  /** Victory ME configuration */
  victoryMe: Record<string, unknown>;
  /**
   * Weapon type names array (index 0 is empty string).
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
  editor?: Record<string, unknown>;
  /** Face graphic size */
  faceSize?: number;
  /** Icon size */
  iconSize?: number;
}
