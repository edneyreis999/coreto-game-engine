/**
 * IGameDataLoader Port
 *
 * Port interface for loading and parsing RPG Maker MZ game data files.
 * Implements Clean Architecture's Dependency Inversion Principle.
 */

/**
 * Troop data from RPG Maker MZ
 */
export interface TroopData {
  id: number;
  name: string;
  members: Array<{
    enemyId: number;
    x: number;
    y: number;
    hidden: boolean;
  }>;
}

/**
 * Class data from RPG Maker MZ
 */
export interface ClassData {
  id: number;
  name: string;
  expTable: number[];
}

/**
 * Enemy data from RPG Maker MZ
 */
export interface EnemyData {
  id: number;
  name: string;
  params: number[];
  dropItems: Array<{
    kind: number;
    dataId: number;
    denominator: number;
  }>;
}

/**
 * Port interface for loading game data from RPG Maker MZ projects.
 * Implementations should be placed in infrastructure/adapters.
 */
export interface IGameDataLoader {
  /**
   * Loads all troops from the project's Troops.json file.
   *
   * @param projectPath - Absolute path to project directory
   * @returns Array of troop data (null entries filtered out)
   */
  loadTroops(projectPath: string): Promise<TroopData[]>;

  /**
   * Loads all classes from the project's Classes.json file.
   *
   * @param projectPath - Absolute path to project directory
   * @returns Array of class data (null entries filtered out)
   */
  loadClasses(projectPath: string): Promise<ClassData[]>;

  /**
   * Loads all enemies from the project's Enemies.json file.
   *
   * @param projectPath - Absolute path to project directory
   * @returns Array of enemy data
   */
  loadEnemies(projectPath: string): Promise<EnemyData[]>;
}
