/**
 * Load Game Data Use Case
 *
 * Pure business logic for loading and transforming RPG Maker MZ game data.
 * Dependencies injected via parameters (no direct imports of infrastructure).
 */

import type { IFileSystem, ILogger } from '@coreto/core';
import * as path from 'path';

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
 * Raw troop data from Troops.json (may contain null entries)
 */
interface RawTroopData {
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
 * Raw class data from Classes.json (may contain null entries)
 */
interface RawClassData {
  id: number;
  name: string;
  expTable: number[];
}

/**
 * Raw enemy data from Enemies.json
 */
interface RawEnemyData {
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
 * Loads all troops from RPG Maker MZ Troops.json file.
 *
 * Business rules:
 * - Filters out null entries (empty slots in RPG Maker)
 * - Returns only valid troop definitions
 * - Logs count of parsed vs valid entries
 *
 * @param projectPath - Absolute path to project directory
 * @param fs - File system port for file operations
 * @param logger - Logger port for diagnostics
 * @returns Array of troop data
 */
export async function loadTroops(
  projectPath: string,
  fs: IFileSystem,
  logger: ILogger
): Promise<TroopData[]> {
  logger.info(`Loading troops data from: ${projectPath}`);

  const troopsPath = path.join(projectPath, 'data', 'Troops.json');
  const troopsJson = fs.readFileSync(troopsPath);
  const troopsData = JSON.parse(troopsJson) as Array<RawTroopData | null>;

  logger.info(`Parsed ${troopsData.length} entries (including nulls)`);

  // Business rule: Filter out null entries (empty slots in RPG Maker)
  const validTroops = troopsData.filter((t): t is RawTroopData => t !== null);
  logger.info(`Found ${validTroops.length} valid troops`);

  const result = validTroops.map((t) => ({
    id: t.id,
    name: t.name,
    members: t.members,
  }));

  logger.info(`Returning ${result.length} troops`);
  return result;
}

/**
 * Loads all classes from RPG Maker MZ Classes.json file.
 *
 * Business rules:
 * - Filters out null entries (empty slots in RPG Maker)
 * - Returns only valid class definitions
 * - Logs count of parsed vs valid entries
 *
 * @param projectPath - Absolute path to project directory
 * @param fs - File system port for file operations
 * @param logger - Logger port for diagnostics
 * @returns Array of class data
 */
export async function loadClasses(
  projectPath: string,
  fs: IFileSystem,
  logger: ILogger
): Promise<ClassData[]> {
  logger.info(`Loading classes data from: ${projectPath}`);

  const classesPath = path.join(projectPath, 'data', 'Classes.json');
  logger.info(`Classes path: ${classesPath}, exists: ${fs.exists(classesPath)}`);

  const classesJson = fs.readFileSync(classesPath);
  const classesData = JSON.parse(classesJson) as Array<RawClassData | null>;

  logger.info(`Parsed ${classesData.length} entries (including nulls)`);

  // Business rule: Filter out null entries (empty slots in RPG Maker)
  const validClasses = classesData.filter((c): c is RawClassData => c !== null);
  logger.info(`Found ${validClasses.length} valid classes`);

  const result = validClasses.map((c) => ({
    id: c.id,
    name: c.name,
    expTable: c.expTable,
  }));

  logger.info(`Returning ${result.length} classes`);
  return result;
}

/**
 * Loads all enemies from RPG Maker MZ Enemies.json file.
 *
 * Business rules:
 * - Returns all enemy definitions (no null filtering needed)
 * - Preserves all enemy parameters and drop items
 *
 * @param projectPath - Absolute path to project directory
 * @param fs - File system port for file operations
 * @param logger - Logger port for diagnostics
 * @returns Array of enemy data
 */
export async function loadEnemies(
  projectPath: string,
  fs: IFileSystem,
  logger: ILogger
): Promise<EnemyData[]> {
  logger.info(`Loading enemies data from: ${projectPath}`);

  const enemiesPath = path.join(projectPath, 'data', 'Enemies.json');
  const enemiesJson = fs.readFileSync(enemiesPath);
  const enemiesData = JSON.parse(enemiesJson) as Array<RawEnemyData>;

  return enemiesData.map((e) => ({
    id: e.id,
    name: e.name,
    params: e.params,
    dropItems: e.dropItems,
  }));
}
