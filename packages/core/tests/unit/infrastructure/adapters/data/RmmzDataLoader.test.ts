/**
 * RmmzDataLoader Unit Tests
 *
 * Tests unit-specific behaviors not covered by integration tests.
 * Focuses on edge cases, error handling, and validation logic.
 */

import { RmmzDataLoader } from '@coreto/core/infrastructure/adapters/data/RmmzDataLoader.js';
import { RmmzProjectValidator } from '@coreto/core/infrastructure/adapters/data/RmmzProjectValidator.js';
import type { IFileSystem, RmmzDatabase } from '@coreto/core/core/ports/index.js';
import { DataLoadError } from '@coreto/core/core/errors/DataLoadError.js';
import type { EnemyData, TroopData, SystemData } from '@coreto/core/types/rmmz-data.js';

describe('RmmzDataLoader', () => {
  let loader: RmmzDataLoader;
  let mockFileSystem: IFileSystem;
  let mockValidator: RmmzProjectValidator;

  beforeEach(() => {
    // Mock IFileSystem
    mockFileSystem = {
      exists: (filePath: string): boolean => {
        return filePath.includes('data/') && !filePath.includes('NonExistent.json');
      },
      readFileSync: (filePath: string): string => {
        // Return mock JSON data based on file name
        if (filePath.includes('Enemies.json')) {
          return JSON.stringify([
            { id: 1, name: 'Goblin', params: [100, 50, 20, 15, 10, 10, 15, 10], actions: [], traits: [], dropItems: [], exp: 10, gold: 5, battlerName: '', battlerHue: 0, note: '' },
          ]);
        }
        if (filePath.includes('InvalidJSON.json')) {
          return 'not valid json{[}';
        }
        return '[]';
      },
      writeFileSync: (): void => {
        throw new Error('Write operations not supported in tests');
      },
      validateProjectPath: (projectPath: string): void => {
        if (!projectPath || projectPath === '/invalid/project') {
          throw new Error('Invalid project path');
        }
      },
    };

    // Mock RmmzProjectValidator
    mockValidator = {
      validateProjectStructure: async (projectPath: string): Promise<boolean> => {
        try {
          mockFileSystem.validateProjectPath(projectPath);
          return true;
        } catch (error: unknown) {
          if (error instanceof Error) {
            throw new DataLoadError(
              `Invalid RPG Maker MZ project structure: ${error.message}`,
              'critical',
              { projectPath, originalError: error.message }
            );
          }
          throw error;
        }
      },
    } as RmmzProjectValidator;

    loader = new RmmzDataLoader(mockFileSystem, mockValidator);
  });

  describe('validateProjectStructure', () => {
    it('should delegate to validator and return true for valid project', async () => {
      const result = await loader.validateProjectStructure('/valid/project');
      expect(result).toBe(true);
    });

    it('should throw DataLoadError for invalid project', async () => {
      await expect(loader.validateProjectStructure('/invalid/project')).rejects.toThrow(DataLoadError);
    });
  });

  describe('loadDataFile error handling', () => {
    it('should throw DataLoadError if file does not exist', async () => {
      await expect(
        loader.loadDataFile<unknown[]>('/valid/project', 'NonExistent.json')
      ).rejects.toThrow(DataLoadError);
    });

    it('should throw DataLoadError if JSON is invalid', async () => {
      await expect(
        loader.loadDataFile<unknown[]>('/valid/project', 'InvalidJSON.json')
      ).rejects.toThrow(DataLoadError);
    });

    it('should include context in DataLoadError when file not found', async () => {
      try {
        await loader.loadDataFile<unknown[]>('/valid/project', 'NonExistent.json');
        fail('Should have thrown DataLoadError');
      } catch (error) {
        expect(error).toBeInstanceOf(DataLoadError);
        const dataLoadError = error as DataLoadError;
        expect(dataLoadError.context).toMatchObject({
          projectPath: '/valid/project',
          fileName: 'NonExistent.json',
        });
      }
    });

    it('should include context in DataLoadError when JSON parse fails', async () => {
      try {
        await loader.loadDataFile<unknown[]>('/valid/project', 'InvalidJSON.json');
        fail('Should have thrown DataLoadError');
      } catch (error) {
        expect(error).toBeInstanceOf(DataLoadError);
        const dataLoadError = error as DataLoadError;
        expect(dataLoadError.context).toMatchObject({
          projectPath: '/valid/project',
          fileName: 'InvalidJSON.json',
        });
      }
    });
  });

  describe('validateReferences', () => {
    it('should return empty array for valid database', async () => {
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [],
        $dataSkills: [],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [],
        $dataTroops: [],
        $dataStates: [],
        $dataSystem: {} as SystemData,
      };

      const warnings = await loader.validateReferences(database);

      expect(warnings).toEqual([]);
    });

    it('should detect invalid enemy reference in troop', async () => {
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [],
        $dataSkills: [],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [null] as unknown as EnemyData[],
        $dataTroops: [
          null,
          {
            id: 1,
            name: 'Invalid Troop',
            members: [{ enemyId: 999, x: 300, y: 400, hidden: false }],
            pages: [],
          },
        ] as TroopData[],
        $dataStates: [],
        $dataSystem: {} as SystemData,
      };

      const warnings = await loader.validateReferences(database);

      expect(warnings).toHaveLength(1);
      expect(warnings[0]?.type).toBe('enemy_not_found');
      expect(warnings[0]?.severity).toBe('critical');
      expect(warnings[0]?.context.troopId).toBe(1);
      expect(warnings[0]?.context.enemyId).toBe(999);
    });
  });
});