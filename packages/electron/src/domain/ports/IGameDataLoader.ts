/**
 * IGameDataLoader Port
 *
 * Port interface for loading and parsing RPG Maker MZ game data files.
 * Implements Clean Architecture's Dependency Inversion Principle.
 */

import type { TroopData, ClassData, EnemyData } from '../entities/game-data.js';

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
