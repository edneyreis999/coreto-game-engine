/**
 * RmmzDataLoader - RPG Maker MZ database loader implementation
 *
 * Implements synchronous loading of RPG Maker MZ data/*.json files (ADR-016).
 * Loads all required database files using fs.readFileSync for deterministic execution.
 *
 * @example
 * ```typescript
 * const loader = new RmmzDataLoader(fileSystem, validator);
 * const database = await loader.loadDatabase('/path/to/project');
 * console.log(database.$dataEnemies.length); // All enemies loaded
 * ```
 */

import { injectable, inject } from 'tsyringe';
import * as path from 'path';
import { IFileSystemToken } from '../../di/tokens.js';
import type { IFileSystem, IDataLoader, RmmzDatabase } from '../../../core/ports/index.js';
import type { Warning } from '../../../core/ports/IReporter.js';
import type {
  ClassData,
  EnemyData,
  TroopData,
  SkillData,
  SystemData,
  ItemData,
} from '../../../types/rmmz-data.js';
import { DataLoadError } from '../../../core/errors/DataLoadError.js';
import { RmmzProjectValidator } from './RmmzProjectValidator.js';
import { IntegrityValidator } from './IntegrityValidator.js';

/**
 * RmmzDataLoader loads all RPG Maker MZ database files.
 * Implements IDataLoader port interface.
 */
@injectable()
export class RmmzDataLoader implements IDataLoader {
  private readonly integrityValidator: IntegrityValidator;

  constructor(
    @inject(IFileSystemToken) private readonly fileSystem: IFileSystem,
    @inject(RmmzProjectValidator) private readonly validator: RmmzProjectValidator
  ) {
    this.integrityValidator = new IntegrityValidator();
  }

  /**
   * Validate RPG Maker MZ project structure.
   * Delegates to RmmzProjectValidator for comprehensive validation.
   *
   * @param projectPath - Absolute path to RPG Maker MZ project
   * @returns true if valid project structure
   * @throws {DataLoadError} If structure is invalid (ADR-001)
   */
  async validateProjectStructure(projectPath: string): Promise<boolean> {
    return this.validator.validateProjectStructure(projectPath);
  }

  /**
   * Load all required database files from RPG Maker MZ project.
   * Implements synchronous loading override (ADR-016) instead of async XHR.
   *
   * @param projectPath - Absolute path to RPG Maker MZ project
   * @returns Complete database with all required data loaded
   * @throws {DataLoadError} If loading fails
   *
   * @example
   * ```typescript
   * const database = await loader.loadDatabase('/path/to/project');
   * console.log(database.$dataEnemies[1].name); // "Goblin"
   * ```
   */
  async loadDatabase(projectPath: string): Promise<RmmzDatabase> {
    // Validate project structure first
    await this.validateProjectStructure(projectPath);

    try {
      // Load all database files synchronously
      // RPG Maker MZ uses 1-based arrays (index 0 is null)
      const database: RmmzDatabase = {
        $dataActors: await this.loadDataFile<unknown[]>(projectPath, 'Actors.json'),
        $dataClasses: await this.loadDataFile<ClassData[]>(projectPath, 'Classes.json'),
        $dataSkills: await this.loadDataFile<SkillData[]>(projectPath, 'Skills.json'),
        $dataItems: await this.loadDataFile<ItemData[]>(projectPath, 'Items.json'),
        $dataWeapons: await this.loadDataFile<unknown[]>(projectPath, 'Weapons.json'),
        $dataArmors: await this.loadDataFile<unknown[]>(projectPath, 'Armors.json'),
        $dataEnemies: await this.loadDataFile<EnemyData[]>(projectPath, 'Enemies.json'),
        $dataTroops: await this.loadDataFile<TroopData[]>(projectPath, 'Troops.json'),
        $dataStates: await this.loadDataFile<unknown[]>(projectPath, 'States.json'),
        $dataSystem: await this.loadDataFile<SystemData>(projectPath, 'System.json'),
      };

      return database;
    } catch (error: unknown) {
      if (error instanceof DataLoadError) {
        throw error;
      }

      // Wrap any other errors as DataLoadError
      if (error instanceof Error) {
        throw new DataLoadError(
          `Failed to load database from project: ${error.message}`,
          'critical',
          { projectPath, originalError: error.message }
        );
      }

      throw new DataLoadError('Failed to load database from project: unknown error', 'critical', {
        projectPath,
      });
    }
  }

  /**
   * Validate cross-references between database entries.
   * Examples: troopId exists in $dataTroops, enemyId exists in $dataEnemies.
   * Follows warning-based validation approach (ADR-013).
   *
   * Validates:
   * - TroopMember.enemyId references exist in $dataEnemies
   * - EnemyAction.skillId references exist in $dataSkills
   * - ClassLearning.skillId references exist in $dataSkills
   * - SystemData.testBattlers classId references exist in $dataClasses
   *
   * @param database - Loaded database to validate
   * @returns Array of validation warnings (empty if all valid)
   */
  async validateReferences(database: RmmzDatabase): Promise<Warning[]> {
    return this.integrityValidator.validate(database);
  }

  /**
   * Load a specific data file from RPG Maker MZ project.
   * Uses synchronous fs.readFileSync for deterministic loading (ADR-016).
   *
   * @param projectPath - Absolute path to RPG Maker MZ project
   * @param fileName - File name relative to data/ directory (e.g., 'Enemies.json')
   * @returns Parsed JSON object
   * @throws {DataLoadError} If file not found or parse fails
   *
   * @example
   * ```typescript
   * const enemies = await loader.loadDataFile<EnemyData[]>(projectPath, 'Enemies.json');
   * console.log(enemies[1].name); // "Goblin"
   * ```
   */
  async loadDataFile<T>(projectPath: string, fileName: string): Promise<T> {
    const filePath = path.join(projectPath, 'data', fileName);

    // Check if file exists
    if (!this.fileSystem.exists(filePath)) {
      throw new DataLoadError(`Data file not found: ${fileName}`, 'critical', {
        projectPath,
        fileName,
        filePath,
      });
    }

    try {
      // Read file synchronously (ADR-016)
      const fileContent = this.fileSystem.readFileSync(filePath);

      // Parse JSON
      const data = JSON.parse(fileContent) as T;

      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new DataLoadError(
          `Failed to parse data file ${fileName}: ${error.message}`,
          'critical',
          { projectPath, fileName, filePath, originalError: error.message }
        );
      }

      throw new DataLoadError(`Failed to parse data file ${fileName}: unknown error`, 'critical', {
        projectPath,
        fileName,
        filePath,
      });
    }
  }
}
