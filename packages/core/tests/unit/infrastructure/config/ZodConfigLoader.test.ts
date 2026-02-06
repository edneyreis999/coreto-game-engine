/**
 * Unit tests for ZodConfigLoader
 *
 * Tests configuration loading and validation with Zod schemas.
 */

import { ZodConfigLoader } from '@coreto/core';
import {
  ConfigFileNotFoundError,
  ConfigParseError,
  ValidationError,
} from '@coreto/core';
import type { IFileSystem } from '@coreto/core';

describe('ZodConfigLoader', () => {
  let configLoader: ZodConfigLoader;
  let mockFileSystem: jest.Mocked<IFileSystem>;

  beforeEach(() => {
    // Create mock filesystem
    mockFileSystem = {
      exists: jest.fn() as jest.MockedFunction<(path: string) => boolean>,
      readFileSync: jest.fn() as jest.MockedFunction<(path: string) => string>,
      writeFileSync: jest.fn() as jest.MockedFunction<(path: string, content: string) => void>,
      validateProjectPath: jest.fn() as jest.MockedFunction<(path: string) => void>,
    } as jest.Mocked<IFileSystem>;

    configLoader = new ZodConfigLoader(mockFileSystem);
  });

  describe('loadConfig', () => {
    const validConfigPath = '/path/to/project.config.json';

    it('should load and validate a valid configuration', async () => {
      // Arrange
      const validConfig = {
        projectPath: '/absolute/path/to/rpg-maker-project',
        reportOutputPath: '/absolute/path/to/report',
        seed: 12345,
        maxBattleTurns: 100,
      };

      mockFileSystem.exists.mockReturnValue(true);
      mockFileSystem.readFileSync.mockReturnValue(JSON.stringify(validConfig));

      // Act
      const result = await configLoader.loadConfig(validConfigPath);

      // Assert
      expect(result).toEqual(validConfig);
      expect(mockFileSystem.exists).toHaveBeenCalledWith(validConfigPath);
      expect(mockFileSystem.readFileSync).toHaveBeenCalledWith(validConfigPath);
    });

    it('should load config with optional fields omitted', async () => {
      // Arrange
      const minimalConfig = {
        projectPath: '/absolute/path/to/rpg-maker-project',
        reportOutputPath: '/absolute/path/to/report',
      };

      mockFileSystem.exists.mockReturnValue(true);
      mockFileSystem.readFileSync.mockReturnValue(JSON.stringify(minimalConfig));

      // Act
      const result = await configLoader.loadConfig(validConfigPath);

      // Assert
      expect(result).toEqual(minimalConfig);
      expect(result.seed).toBeUndefined();
      expect(result.maxBattleTurns).toBeUndefined();
    });

    it('should throw ConfigFileNotFoundError when file does not exist', async () => {
      // Arrange
      mockFileSystem.exists.mockReturnValue(false);

      // Act & Assert
      await expect(configLoader.loadConfig(validConfigPath)).rejects.toThrow(
        ConfigFileNotFoundError
      );
      await expect(configLoader.loadConfig(validConfigPath)).rejects.toThrow(
        `Configuration file not found: ${validConfigPath}`
      );
    });

    it('should throw ConfigParseError when JSON is invalid', async () => {
      // Arrange
      mockFileSystem.exists.mockReturnValue(true);
      mockFileSystem.readFileSync.mockReturnValue('{ invalid json');

      // Act & Assert
      await expect(configLoader.loadConfig(validConfigPath)).rejects.toThrow(
        ConfigParseError
      );
    });

    it('should throw ConfigError when file cannot be read', async () => {
      mockFileSystem.exists.mockReturnValue(true);
      mockFileSystem.readFileSync.mockImplementation(() => {
        throw new Error('EACCES');
      });

      await expect(configLoader.loadConfig(validConfigPath)).rejects.toThrow(/Failed to read config file/);
    });

    it('should throw ValidationError when schema validation fails', async () => {
      // Arrange
      const invalidConfig = {
        projectPath: '', // Empty path (invalid)
        reportOutputPath: '/path/to/report',
      };

      mockFileSystem.exists.mockReturnValue(true);
      mockFileSystem.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

      // Act & Assert
      await expect(configLoader.loadConfig(validConfigPath)).rejects.toThrow(
        ValidationError
      );
    });

    it('should reject path with traversal sequences', async () => {
      // Arrange
      const configWithTraversal = {
        projectPath: '../../../etc/passwd',
        reportOutputPath: '/path/to/report',
      };

      mockFileSystem.exists.mockReturnValue(true);
      mockFileSystem.readFileSync.mockReturnValue(
        JSON.stringify(configWithTraversal)
      );

      // Act & Assert
      await expect(configLoader.loadConfig(validConfigPath)).rejects.toMatchObject({
        context: {
          issues: expect.arrayContaining([
            expect.objectContaining({
              message: expect.stringMatching(/path traversal/i),
            }),
          ]),
        },
      });
    });

    it('should reject missing required fields', async () => {
      // Arrange
      const configMissingFields = {
        projectPath: '/path/to/project',
        // Missing reportOutputPath
      };

      mockFileSystem.exists.mockReturnValue(true);
      mockFileSystem.readFileSync.mockReturnValue(
        JSON.stringify(configMissingFields)
      );

      // Act & Assert
      await expect(configLoader.loadConfig(validConfigPath)).rejects.toThrow(
        ValidationError
      );
    });

    it('should reject invalid seed type', async () => {
      // Arrange
      const configInvalidSeed = {
        projectPath: '/path/to/project',
        reportOutputPath: '/path/to/report',
        seed: '12345', // String instead of number
      };

      mockFileSystem.exists.mockReturnValue(true);
      mockFileSystem.readFileSync.mockReturnValue(
        JSON.stringify(configInvalidSeed)
      );

      // Act & Assert
      await expect(configLoader.loadConfig(validConfigPath)).rejects.toThrow(
        ValidationError
      );
    });

    it('should reject non-integer seed', async () => {
      // Arrange
      const configFloatSeed = {
        projectPath: '/path/to/project',
        reportOutputPath: '/path/to/report',
        seed: 123.45,
      };

      mockFileSystem.exists.mockReturnValue(true);
      mockFileSystem.readFileSync.mockReturnValue(
        JSON.stringify(configFloatSeed)
      );

      // Act & Assert
      await expect(configLoader.loadConfig(validConfigPath)).rejects.toThrow(
        ValidationError
      );
    });

    it('should reject invalid maxBattleTurns', async () => {
      // Arrange
      const configInvalidMaxTurns = {
        projectPath: '/path/to/project',
        reportOutputPath: '/path/to/report',
        maxBattleTurns: -10, // Negative number
      };

      mockFileSystem.exists.mockReturnValue(true);
      mockFileSystem.readFileSync.mockReturnValue(
        JSON.stringify(configInvalidMaxTurns)
      );

      // Act & Assert
      await expect(configLoader.loadConfig(validConfigPath)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('validate', () => {
    it('should validate a valid config object', () => {
      // Arrange
      const validConfig = {
        projectPath: '/absolute/path/to/project',
        reportOutputPath: '/absolute/path/to/report',
        seed: 12345,
        maxBattleTurns: 100,
      };

      // Act
      const result = configLoader.validate(validConfig);

      // Assert
      expect(result).toEqual(validConfig);
    });

    it('should throw ValidationError for invalid config', () => {
      // Arrange
      const invalidConfig = {
        projectPath: 123, // Invalid type
        reportOutputPath: '/path/to/report',
      };

      // Act & Assert
      expect(() => configLoader.validate(invalidConfig)).toThrow(ValidationError);
    });

    it('should include detailed error information in ValidationError', () => {
      // Arrange
      const invalidConfig = {
        projectPath: '',
        reportOutputPath: '',
      };

      // Act & Assert
      try {
        configLoader.validate(invalidConfig);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context).toHaveProperty('issues');
        expect(Array.isArray(validationError.context.issues)).toBe(true);
      }
    });
  });

  describe('loadTrechos', () => {
    it('should throw error when no trechos found in config', async () => {
      // Arrange
      const config = {
        projectPath: '/path/to/project',
        reportOutputPath: '/path/to/report',
      };

      // Act & Assert
      await expect(configLoader.loadTrechos(config)).rejects.toThrow(
        /No trechos found/i
      );
    });

    it('should load embedded trechos from config', async () => {
      // Arrange
      const configWithTrechos = {
        projectPath: '/path/to/project',
        reportOutputPath: '/path/to/report',
        trechos: [
          {
            id: 'trecho-1',
            name: 'Trecho Test 1',
            anchorLevelRange: { min: 1, max: 10 },
            ttkTarget: { turns: 3, actions: 8, tolerance: 0.15 },
            troopIds: [1, 2, 3],
            party: {
              members: [{ classId: 1, level: 5 }],
            },
          },
        ],
      };

      // Act
      const trechos = await configLoader.loadTrechos(configWithTrechos);

      // Assert
      expect(trechos).toHaveLength(1);
      expect(trechos[0]).toMatchObject({
        id: 'trecho-1',
        name: 'Trecho Test 1',
      });
    });

    it('should load trechos from cached raw config (after loadConfig)', async () => {
      const configPath = '/path/to/project.config.json';
      const rawWithTrechos = {
        projectPath: '/absolute/path/to/rpg-maker-project',
        reportOutputPath: '/absolute/path/to/report',
        trechos: [
          {
            id: 'cached-trecho',
            anchorLevelRange: { min: 1, max: 10 },
            ttkTarget: { turns: 3, actions: 8, tolerance: 0.15 },
            troopIds: [1],
            party: { members: [{ classId: 1, level: 5 }] },
          },
        ],
      };

      mockFileSystem.exists.mockReturnValue(true);
      mockFileSystem.readFileSync.mockReturnValue(JSON.stringify(rawWithTrechos));

      const validatedConfig = await configLoader.loadConfig(configPath);
      const trechos = await configLoader.loadTrechos(validatedConfig);

      expect(trechos).toHaveLength(1);
      expect(trechos[0]!.id).toBe('cached-trecho');
    });

    it('should validate trecho schema and throw on invalid data', async () => {
      // Arrange
      const configWithInvalidTrecho = {
        projectPath: '/path/to/project',
        reportOutputPath: '/path/to/report',
        trechos: [
          {
            id: '', // Invalid: empty ID
            anchorLevelRange: { min: 1, max: 10 },
            ttkTarget: { turns: 3, actions: 8 },
            troopIds: [1],
            party: { members: [{ classId: 1, level: 5 }] },
          },
        ],
      };

      // Act & Assert
      await expect(configLoader.loadTrechos(configWithInvalidTrecho)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
