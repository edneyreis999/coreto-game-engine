import type {
  DomainClassData,
  DomainEnemyData,
  DomainTroopData,
  DomainSkillData,
  DomainSystemData,
  DomainItemData,
} from '../domain/data/index.js';
import type { Warning } from './IReporter.js';

/**
 * Container for all loaded RPG Maker MZ database objects.
 * Follows RPG Maker MZ's global variable naming convention ($dataX).
 */
export interface RmmzDatabase {
  /** Actor data from Actors.json (1-based array, index 0 is null) */
  $dataActors: unknown[];
  /** Class data from Classes.json (1-based array, index 0 is null) */
  $dataClasses: Array<DomainClassData | null>;
  /** Skill data from Skills.json (1-based array, index 0 is null) */
  $dataSkills: Array<DomainSkillData | null>;
  /** Item data from Items.json (1-based array, index 0 is null) */
  $dataItems: Array<DomainItemData | null>;
  /** Weapon data from Weapons.json (1-based array, index 0 is null) */
  $dataWeapons: unknown[];
  /** Armor data from Armors.json (1-based array, index 0 is null) */
  $dataArmors: unknown[];
  /** Enemy data from Enemies.json (1-based array, index 0 is null) */
  $dataEnemies: Array<DomainEnemyData | null>;
  /** Troop data from Troops.json (1-based array, index 0 is null) */
  $dataTroops: Array<DomainTroopData | null>;
  /** State data from States.json (1-based array, index 0 is null) */
  $dataStates: unknown[];
  /** System configuration from System.json */
  $dataSystem: DomainSystemData;
}

/**
 * DataLoader port interface.
 * Responsible for loading RPG Maker MZ data/*.json files (ADR-016).
 */
export interface IDataLoader {
  /**
   * Validate RPG Maker MZ project structure.
   * Checks for presence of game.rmmzproject marker file and data/ directory.
   * @param projectPath - Absolute path to RPG Maker MZ project
   * @returns true if valid project structure
   * @throws {DataLoadError} If structure is invalid (ADR-001)
   */
  validateProjectStructure(projectPath: string): Promise<boolean>;

  /**
   * Load all required database files from RPG Maker MZ project.
   * Implements synchronous loading override (ADR-016) instead of async XHR.
   * @param projectPath - Absolute path to RPG Maker MZ project
   * @returns Complete database with all required data loaded
   * @throws {DataLoadError} If loading fails
   */
  loadDatabase(projectPath: string): Promise<RmmzDatabase>;

  /**
   * Validate cross-references between database entries.
   * Examples: troopId exists in $dataTroops, enemyId exists in $dataEnemies.
   * Follows warning-based validation approach (ADR-013).
   * @param database - Loaded database to validate
   * @returns Array of validation warnings (empty if all valid)
   */
  validateReferences(database: RmmzDatabase): Promise<Warning[]>;

  /**
   * Load a specific data file from RPG Maker MZ project.
   * @param projectPath - Absolute path to RPG Maker MZ project
   * @param fileName - File name relative to data/ directory (e.g., 'Enemies.json')
   * @returns Parsed JSON object
   * @throws {DataLoadError} If file not found or parse fails
   */
  loadDataFile<T>(projectPath: string, fileName: string): Promise<T>;
}

/**
 * Legacy export alias for backward compatibility.
 * @deprecated Use RmmzDatabase instead
 */
export type DatabaseObjects = RmmzDatabase;
