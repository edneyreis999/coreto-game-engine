/**
 * RmmzDataLoader Unit Tests
 *
 * Tests synchronous loading of RPG Maker MZ database files.
 * Validates proper error handling and data parsing.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { RmmzDataLoader } from '../../../../packages/core/src/infrastructure/adapters/data/index.js'RmmzDataLoader.js';
import { RmmzProjectValidator } from '../../../../packages/core/src/infrastructure/adapters/data/index.js'RmmzProjectValidator.js';
import type { IFileSystem, RmmzDatabase } from '../../../../packages/core/src/core/ports/index.js';
import { DataLoadError } from '../../../../packages/core/src/core/errors/index.js'DataLoadError.js';
import type { EnemyData, TroopData, ClassData, SkillData, ItemData, SystemData } from '../../../../packages/core/src/types/rmmz-data.js';

describe('RmmzDataLoader', () => {
  let loader: RmmzDataLoader;
  let mockFileSystem: IFileSystem;
  let mockValidator: RmmzProjectValidator;

  beforeEach(() => {
    // Mock IFileSystem
    mockFileSystem = {
      exists: (filePath: string): boolean => {
        // Simulate file existence based on path
        return filePath.includes('data/') && !filePath.includes('NonExistent.json');
      },
      readFileSync: (filePath: string): string => {
        // Return mock JSON data based on file name
        if (filePath.includes('Enemies.json')) {
          return JSON.stringify([
            { id: 1, name: 'Goblin', params: [100, 50, 20, 15, 10, 10, 15, 10], actions: [], traits: [], dropItems: [], exp: 10, gold: 5, battlerName: '', battlerHue: 0, note: '' },
          ]);
        }
        if (filePath.includes('Troops.json')) {
          return JSON.stringify([
            { id: 1, name: 'Goblin*2', members: [{ enemyId: 1, x: 300, y: 400, hidden: false }], pages: [] },
          ]);
        }
        if (filePath.includes('Classes.json')) {
          return JSON.stringify([
            { id: 1, name: 'Warrior', expParams: [30, 20, 30, 30], traits: [], learnings: [], params: [[100], [50], [20], [15], [10], [10], [15], [10]], note: '' },
          ]);
        }
        if (filePath.includes('Skills.json')) {
          return JSON.stringify([
            {
              id: 1,
              name: 'Attack',
              description: '',
              animationId: -1,
              damage: { type: 1, elementId: -1, formula: 'a.atk * 4 - b.def * 2', variance: 20, critical: true },
              effects: [],
              hitType: 1,
              iconIndex: 76,
              message1: '',
              message2: '',
              mpCost: 0,
              note: '',
              occasion: 1,
              repeats: 1,
              requiredWtypeId1: 0,
              requiredWtypeId2: 0,
              scope: 1,
              speed: 0,
              stypeId: 0,
              successRate: 100,
              tpCost: 0,
              tpGain: 0,
              messageType: 1,
            },
          ]);
        }
        if (filePath.includes('Items.json')) {
          return JSON.stringify([
            {
              id: 1,
              name: 'Potion',
              description: '',
              animationId: 0,
              consumable: true,
              damage: { type: 0, elementId: 0, formula: '0', variance: 20, critical: false },
              effects: [],
              hitType: 0,
              iconIndex: 0,
              itypeId: 1,
              note: '',
              occasion: 0,
              price: 0,
              repeats: 1,
              scope: 7,
              speed: 0,
              successRate: 100,
              tpGain: 0,
            },
          ]);
        }
        if (filePath.includes('System.json')) {
          return JSON.stringify({
            gameTitle: 'Test Game',
            versionId: 1,
            locale: 'en_US',
            partyMembers: [1],
            currencyUnit: 'G',
            elements: ['', 'Physical'],
            skillTypes: ['', 'Magic'],
            weaponTypes: ['', 'Sword'],
            armorTypes: ['', 'Armor'],
            equipTypes: ['', 'Weapon'],
            terms: {},
            testBattlers: [],
            testTroopId: 1,
            battleSystem: 0,
            optDisplayTp: false,
            optSideView: true,
            optAutosave: false,
            optDrawTitle: true,
            optExtraExp: false,
            optFloorDeath: false,
            optFollowers: false,
            optKeyItemsNumber: false,
            optSlipDeath: false,
            optTransparent: false,
            startMapId: 1,
            startX: 0,
            startY: 0,
            editMapId: 1,
            battleback1Name: '',
            battleback2Name: '',
            battlerHue: 0,
            battlerName: '',
            title1Name: '',
            title2Name: '',
            variables: [],
            switches: [],
            windowTone: [0, 0, 0, 0] as [number, number, number, number],
            menuCommands: [],
            itemCategories: [],
            magicSkills: [],
            sounds: [],
            attackMotions: [],
            advanced: {},
            airship: {},
            boat: {},
            ship: {},
            battleBgm: {},
            defeatMe: {},
            gameoverMe: {},
            titleBgm: {},
            victoryMe: {},
            titleCommandWindow: {},
          });
        }
        if (filePath.includes('Actors.json')) {
          return JSON.stringify([{ id: 1, name: 'Actor' }]);
        }
        if (filePath.includes('Weapons.json')) {
          return JSON.stringify([{ id: 1, name: 'Sword' }]);
        }
        if (filePath.includes('Armors.json')) {
          return JSON.stringify([{ id: 1, name: 'Armor' }]);
        }
        if (filePath.includes('States.json')) {
          return JSON.stringify([{ id: 1, name: 'State' }]);
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

  describe('loadDataFile', () => {
    it('should load and parse Enemies.json', async () => {
      const enemies = await loader.loadDataFile<EnemyData[]>('/valid/project', 'Enemies.json');

      expect(Array.isArray(enemies)).toBe(true);
      expect(enemies).toHaveLength(1);
      expect(enemies[0]).toMatchObject({
        id: 1,
        name: 'Goblin',
      });
    });

    it('should load and parse Troops.json', async () => {
      const troops = await loader.loadDataFile<TroopData[]>('/valid/project', 'Troops.json');

      expect(Array.isArray(troops)).toBe(true);
      expect(troops).toHaveLength(1);
      expect(troops[0]).toMatchObject({
        id: 1,
        name: 'Goblin*2',
      });
    });

    it('should load and parse Classes.json', async () => {
      const classes = await loader.loadDataFile<ClassData[]>('/valid/project', 'Classes.json');

      expect(Array.isArray(classes)).toBe(true);
      expect(classes).toHaveLength(1);
      expect(classes[0]).toMatchObject({
        id: 1,
        name: 'Warrior',
      });
    });

    it('should load and parse Skills.json', async () => {
      const skills = await loader.loadDataFile<SkillData[]>('/valid/project', 'Skills.json');

      expect(Array.isArray(skills)).toBe(true);
      expect(skills).toHaveLength(1);
      expect(skills[0]).toMatchObject({
        id: 1,
        name: 'Attack',
      });
    });

    it('should load and parse Items.json', async () => {
      const items = await loader.loadDataFile<ItemData[]>('/valid/project', 'Items.json');

      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        id: 1,
        name: 'Potion',
      });
    });

    it('should load and parse System.json', async () => {
      const system = await loader.loadDataFile<SystemData>('/valid/project', 'System.json');

      expect(system).toMatchObject({
        gameTitle: 'Test Game',
        versionId: 1,
      });
    });

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

  describe('loadDatabase', () => {
    it('should load all database files', async () => {
      const database = await loader.loadDatabase('/valid/project');

      // Verify all required properties are present
      expect(database).toHaveProperty('$dataActors');
      expect(database).toHaveProperty('$dataClasses');
      expect(database).toHaveProperty('$dataSkills');
      expect(database).toHaveProperty('$dataItems');
      expect(database).toHaveProperty('$dataWeapons');
      expect(database).toHaveProperty('$dataArmors');
      expect(database).toHaveProperty('$dataEnemies');
      expect(database).toHaveProperty('$dataTroops');
      expect(database).toHaveProperty('$dataStates');
      expect(database).toHaveProperty('$dataSystem');

      // Verify data is loaded correctly
      expect(database.$dataEnemies).toHaveLength(1);
      expect(database.$dataTroops).toHaveLength(1);
      expect(database.$dataClasses).toHaveLength(1);
      expect(database.$dataSkills).toHaveLength(1);
      expect(database.$dataItems).toHaveLength(1);
      expect(database.$dataSystem.gameTitle).toBe('Test Game');
    });

    it('should validate project structure before loading', async () => {
      await expect(loader.loadDatabase('/invalid/project')).rejects.toThrow();
    });

    it('should throw DataLoadError if loading fails', async () => {
      // Override mock to simulate file read error
      const originalReadFileSync = mockFileSystem.readFileSync;
      mockFileSystem.readFileSync = (): string => {
        throw new Error('File read error');
      };

      await expect(loader.loadDatabase('/valid/project')).rejects.toThrow(DataLoadError);

      // Restore mock
      mockFileSystem.readFileSync = originalReadFileSync;
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

    it('should use IntegrityValidator to validate cross-references', async () => {
      const database = await loader.loadDatabase('/valid/project');
      const warnings = await loader.validateReferences(database);

      // Mock data in RmmzDataLoader.test.ts has valid references
      // so warnings should be empty
      expect(Array.isArray(warnings)).toBe(true);
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
