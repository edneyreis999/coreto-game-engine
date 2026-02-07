/**
 * Validate Project Use Case
 *
 * Pure business logic for validating RPG Maker MZ project structure.
 * Dependencies injected via parameters (no direct imports of infrastructure).
 */

import type { IFileSystem, IDataLoader, ILogger } from '@coreto/core';
import type { ProjectInfo } from '../entities/project.js';
import * as path from 'path';

/**
 * Input for project validation use case
 */
export interface ValidateProjectInput {
  projectPath: string;
}

/**
 * Output from project validation use case
 */
export interface ValidateProjectOutput {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Business rules: which files are required for a valid RPG Maker MZ project
 */
const REQUIRED_DATA_FILES = [
  'System.json',
  'Actors.json',
  'Classes.json',
  'Skills.json',
  'Items.json',
  'Weapons.json',
  'Armors.json',
  'Enemies.json',
  'Troops.json',
  'States.json',
  'Animations.json',
] as const;

/**
 * Validates RPG Maker MZ project structure.
 *
 * Business rules:
 * - Must have game.rmmzproject marker file
 * - Must have data/ directory
 * - Must have all required data files
 * - Data must be loadable by IDataLoader
 *
 * @param input - Project path to validate
 * @param fs - File system port for file operations
 * @param dataLoader - Data loader port for integrity validation
 * @param logger - Logger port for diagnostics
 * @returns Validation result
 */
export async function validateProject(
  input: ValidateProjectInput,
  fs: IFileSystem,
  dataLoader: IDataLoader,
  logger: ILogger
): Promise<ValidateProjectOutput> {
  const { projectPath } = input;
  const errors: string[] = [];
  const warnings: string[] = [];

  logger.info(`Validating project: ${projectPath}`);

  // Rule 1: Project directory must exist
  if (!fs.exists(projectPath)) {
    errors.push('Project directory does not exist');
    return { isValid: false, errors, warnings };
  }

  // Rule 2: Must have game.rmmzproject marker file
  const markerPath = path.join(projectPath, 'game.rmmzproject');
  if (!fs.exists(markerPath)) {
    errors.push('game.rmmzproject not found - not a valid RPG Maker MZ project');
  }

  // Rule 3: Must have data directory
  const dataDir = path.join(projectPath, 'data');
  if (!fs.exists(dataDir)) {
    errors.push('data directory not found');
  } else {
    // Rule 4: Validate required data files
    for (const file of REQUIRED_DATA_FILES) {
      const filePath = path.join(dataDir, file);
      if (!fs.exists(filePath)) {
        errors.push(`Required data file missing: ${file}`);
      }
    }
  }

  // Rule 5: Try to load data to validate integrity
  if (errors.length === 0) {
    try {
      await dataLoader.loadDatabase(projectPath);
    } catch (error) {
      if (error instanceof Error) {
        warnings.push(`Data validation warning: ${error.message}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gets basic project information and metadata.
 *
 * Business rules:
 * - Project name derived from directory name
 * - Counts entities from data files
 * - Invalid projects return zero counts
 *
 * @param projectPath - Absolute path to project directory
 * @param fs - File system port for file operations
 * @param logger - Logger port for diagnostics
 * @returns Project information
 */
export async function getProjectInfo(
  projectPath: string,
  fs: IFileSystem,
  logger: ILogger
): Promise<ProjectInfo> {
  logger.info(`Getting project info: ${projectPath}`);

  // Validate using fs.validateProjectPath
  try {
    fs.validateProjectPath(projectPath);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid RPG Maker MZ project: ${error.message}`);
    }
    throw error;
  }

  // Check if project directory exists
  if (!fs.exists(projectPath)) {
    throw new Error(`Project directory does not exist: ${projectPath}`);
  }

  // Check for game.rmmzproject marker file
  const markerPath = path.join(projectPath, 'game.rmmzproject');
  if (!fs.exists(markerPath)) {
    throw new Error('Invalid RPG Maker MZ project: game.rmmzproject not found');
  }

  // Check for data directory
  const dataDir = path.join(projectPath, 'data');
  if (!fs.exists(dataDir)) {
    throw new Error('Invalid RPG Maker MZ project: data directory not found');
  }

  // Get project name from directory name
  const name = path.basename(projectPath);

  // Count data files if possible
  let troopsCount = 0;
  let classesCount = 0;
  let enemiesCount = 0;

  try {
    const troopsPath = path.join(dataDir, 'Troops.json');
    const classesPath = path.join(dataDir, 'Classes.json');
    const enemiesPath = path.join(dataDir, 'Enemies.json');

    if (fs.exists(troopsPath)) {
      const troopsData = JSON.parse(fs.readFileSync(troopsPath));
      troopsCount = troopsData.length ?? 0;
    }

    if (fs.exists(classesPath)) {
      const classesData = JSON.parse(fs.readFileSync(classesPath));
      classesCount = classesData.length ?? 0;
    }

    if (fs.exists(enemiesPath)) {
      const enemiesData = JSON.parse(fs.readFileSync(enemiesPath));
      enemiesCount = enemiesData.length ?? 0;
    }
  } catch {
    // File reading failed, but project is still valid
    // Return zero counts
  }

  return {
    path: projectPath,
    name,
    isValid: true,
    troopsCount,
    classesCount,
    enemiesCount,
  };
}
