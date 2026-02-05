/**
 * Unit Tests for ConfigService
 *
 * Tests configuration file loading, saving, and schema normalization.
 * Ensures CLI compatibility and backward compatibility.
 *
 * @see planos/005-run-ttk-electron/tasks/04_task.md
 * @see packages/electron/src/main/services/config-service.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { ConfigService, ConfigNotFoundError, ConfigValidationError } from '../config-service.js';
import { ProjectConfigSchema, CURRENT_SCHEMA_VERSION } from '../schemas.js';
import type { UIProjectConfig } from '../schemas.js';

// Mock fs module
jest.mock('node:fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates a minimal valid config for testing.
 * Accepts partial overrides to customize specific fields.
 */
function createValidConfig(overrides?: Partial<UIProjectConfig>): UIProjectConfig {
  const defaultConfig: UIProjectConfig = {
    version: '1.0',
    trechos: [],
    metadata: { projectName: 'Test' },
  };

  return { ...defaultConfig, ...overrides };
}

describe('ConfigService', () => {
  let service: ConfigService;
  const mockProjectPath = '/test/project';
  const mockConfigPath = path.join(mockProjectPath, 'temp', 'project.config.json');

  beforeEach(() => {
    service = new ConfigService();
    jest.clearAllMocks();
  });

  describe('config path behavior', () => {
    it('should use correct path matching CLI expectation', async () => {
      // Test through public interface - configExists uses getConfigPath internally
      mockedFs.access.mockResolvedValue(undefined);

      await service.configExists(mockProjectPath);

      // Verify the correct path was used (temp/project.config.json)
      expect(mockedFs.access).toHaveBeenCalledWith(
        expect.stringContaining('temp/project.config.json')
      );
      expect(mockedFs.access).toHaveBeenCalledWith(mockConfigPath);
    });

    it('should load config from temp directory', async () => {
      mockedFs.readFile.mockResolvedValue(JSON.stringify(createValidConfig()));

      await service.loadConfig(mockProjectPath);

      // Verify the correct path was used
      expect(mockedFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('temp/project.config.json'),
        'utf-8'
      );
      expect(mockedFs.readFile).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
    });
  });

  describe('normalizeSchema', () => {
    it('should add missing version field', () => {
      const config = { trechos: [] };
      const normalized = service.normalizeSchema(config) as Record<string, unknown>;

      expect(normalized).toHaveProperty('version', CURRENT_SCHEMA_VERSION);
    });

    it('should add missing metadata field', () => {
      const config = { version: '1.0', trechos: [] };
      const normalized = service.normalizeSchema(config) as Record<string, unknown>;

      expect(normalized).toHaveProperty('metadata');
      expect(typeof normalized.metadata).toBe('object');
    });

    it('should migrate old field names (maxTurns -> maxBattleTurns)', () => {
      const config = {
        version: '1.0',
        maxTurns: 100,
        trechos: [],
      };
      const normalized = service.normalizeSchema(config) as Record<string, unknown>;

      expect(normalized).toHaveProperty('maxBattleTurns', 100);
      expect(normalized).not.toHaveProperty('maxTurns');
    });

    it('should normalize trechos array', () => {
      const config = {
        version: '1.0',
        trechos: [
          { id: 'trecho-1' },
          { id: 'trecho-2', description: 'Test' },
        ],
      };
      const normalized = service.normalizeSchema(config) as { trechos: unknown[] };

      expect(Array.isArray(normalized.trechos)).toBe(true);
      expect(normalized.trechos[0]).toHaveProperty('description');
      expect(normalized.trechos[1]).toHaveProperty('description');
    });

    it('should normalize individual trecho with defaults', () => {
      const config = {
        version: '1.0',
        trechos: [{
          id: 'trecho-1',
        }],
      };
      const normalized = service.normalizeSchema(config) as { trechos: Array<Record<string, unknown>> };

      const trecho = normalized.trechos[0];
      expect(trecho).toHaveProperty('id', 'trecho-1');
      expect(trecho).toHaveProperty('description');
      expect(trecho).toHaveProperty('heroTeam');
      expect(trecho).toHaveProperty('enemyTeam');
      expect(trecho?.heroTeam).toHaveProperty('level', 1);
      expect(trecho?.heroTeam).toHaveProperty('actors', []);
      expect(trecho?.heroTeam).toHaveProperty('weapons', {});
      expect(trecho?.heroTeam).toHaveProperty('armors', {});
    });

    it('should return raw as-is if not an object', () => {
      expect(service.normalizeSchema(null)).toBe(null);
      expect(service.normalizeSchema('string')).toBe('string');
      expect(service.normalizeSchema(123)).toBe(123);
    });
  });

  describe('loadConfig', () => {
    describe('with valid config', () => {
      beforeEach(() => {
        mockedFs.readFile.mockResolvedValue(JSON.stringify(createValidConfig({
          trechos: [
            {
              id: 'trecho-1',
              description: 'Test Trecho',
              heroTeam: {
                level: 5,
                actors: [1, 2],
                weapons: { 1: 10 },
                armors: { 2: 5 },
              },
              enemyTeam: {
                troopId: 1,
                count: 3,
              },
              expectedTTK: {
                min: 10,
                max: 20,
              },
            },
          ],
          metadata: {
            projectName: 'Test Project',
            lastModified: Date.now(),
          },
        })));
      });

      it('should load valid config successfully', async () => {
        const config = await service.loadConfig(mockProjectPath);

        expect(mockedFs.readFile).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
        expect(config.version).toBe('1.0');
        expect(config.trechos).toHaveLength(1);
        expect(config.trechos[0]).toBeDefined();
        expect(config.trechos[0]?.id).toBe('trecho-1');
      });
    });

    it('should normalize and load old config format', async () => {
      mockedFs.readFile.mockResolvedValue(JSON.stringify({ trechos: [] }));

      const config = await service.loadConfig(mockProjectPath);

      expect(config.version).toBe(CURRENT_SCHEMA_VERSION);
      expect(config.metadata).toEqual({});
    });

    it('should throw ConfigNotFoundError if file does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockedFs.readFile.mockRejectedValue(error);

      await expect(service.loadConfig(mockProjectPath)).rejects.toThrow(ConfigNotFoundError);
    });

    it('should throw ConfigValidationError if invalid after normalization', async () => {
      const invalidConfig = createValidConfig({
        trechos: [
          {
            id: 'trecho-1',
            description: 'Test',
            heroTeam: {
              level: 999, // invalid level (> 99)
              actors: [],
              weapons: {},
              armors: {},
            },
            enemyTeam: {
              troopId: 1,
            },
          },
        ],
      });
      mockedFs.readFile.mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(service.loadConfig(mockProjectPath)).rejects.toThrow(ConfigValidationError);
    });

    it('should handle migrated maxTurns field', async () => {
      const legacyConfig = { version: '1.0', maxTurns: 100, trechos: [] };
      mockedFs.readFile.mockResolvedValue(JSON.stringify(legacyConfig));

      const config = await service.loadConfig(mockProjectPath);

      expect(config.version).toBe('1.0');
    });
  });

  describe('saveConfig', () => {
    beforeEach(() => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);
    });

    it('should save config with formatting', async () => {
      const validConfig = createValidConfig({ metadata: { projectName: 'Test Project' } });
      await service.saveConfig(mockProjectPath, validConfig);

      expect(mockedFs.mkdir).toHaveBeenCalledWith(
        path.join(mockProjectPath, 'temp'),
        { recursive: true }
      );
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        mockConfigPath,
        expect.stringContaining('"version": "1.0"'),
        'utf-8'
      );
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        mockConfigPath,
        expect.stringContaining('"trechos": []'),
        'utf-8'
      );

      // Verify the complete saved config can be parsed
      expect(mockedFs.writeFile.mock.calls[0]).toBeDefined();
      const writeCall = mockedFs.writeFile.mock.calls[0];
      const savedConfig = JSON.parse(writeCall?.[1] as string);
      expect(savedConfig).toMatchObject({
        version: '1.0',
        trechos: [],
      });
      expect(savedConfig).toHaveProperty('metadata');
    });

    it('should update lastModified timestamp', async () => {
      const beforeTime = Date.now();
      await service.saveConfig(mockProjectPath, createValidConfig());
      const afterTime = Date.now();

      expect(mockedFs.writeFile.mock.calls[0]).toBeDefined();
      const writeCall = mockedFs.writeFile.mock.calls[0];
      const savedConfig = JSON.parse(writeCall?.[1] as string);

      expect(savedConfig.metadata?.lastModified).toBeGreaterThanOrEqual(beforeTime);
      expect(savedConfig.metadata?.lastModified).toBeLessThanOrEqual(afterTime);
    });

    it('should throw ConfigValidationError for invalid config', async () => {
      const invalidConfig = createValidConfig({
        trechos: [
          {
            id: '', // Invalid: empty id
            description: 'Test',
            heroTeam: { level: 5, actors: [], weapons: {}, armors: {} },
            enemyTeam: { troopId: 1 },
          },
        ],
      }) as unknown as UIProjectConfig;

      await expect(service.saveConfig(mockProjectPath, invalidConfig)).rejects.toThrow(
        ConfigValidationError
      );
    });

    it('should preserve metadata when not provided', async () => {
      await service.saveConfig(mockProjectPath, createValidConfig());

      expect(mockedFs.writeFile.mock.calls[0]).toBeDefined();
      const writeCall = mockedFs.writeFile.mock.calls[0];
      const savedConfig = JSON.parse(writeCall?.[1] as string);

      expect(savedConfig.metadata).toBeDefined();
      expect(savedConfig.metadata.lastModified).toBeDefined();
    });
  });

  describe('configExists', () => {
    it('should return true when config file exists', async () => {
      mockedFs.access.mockResolvedValue(undefined);

      const exists = await service.configExists(mockProjectPath);

      expect(exists).toBe(true);
      expect(mockedFs.access).toHaveBeenCalledWith(mockConfigPath);
    });

    it('should return false when config file does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockedFs.access.mockRejectedValue(error);

      const exists = await service.configExists(mockProjectPath);

      expect(exists).toBe(false);
    });
  });

  describe('createDefaultConfig', () => {
    it('should create valid default config', () => {
      const defaultConfig = service.createDefaultConfig();

      expect(defaultConfig.version).toBe(CURRENT_SCHEMA_VERSION);
      expect(defaultConfig.trechos).toEqual([]);
      expect(defaultConfig.metadata?.projectName).toBe('New Project');
      expect(defaultConfig.metadata?.lastModified).toBeDefined();

      // Validate with Zod
      const result = ProjectConfigSchema.safeParse(defaultConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('deleteConfig', () => {
    it('should delete existing config file', async () => {
      mockedFs.unlink.mockResolvedValue(undefined);

      await service.deleteConfig(mockProjectPath);

      expect(mockedFs.unlink).toHaveBeenCalledWith(mockConfigPath);
    });

    it('should not throw if config file does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockedFs.unlink.mockRejectedValue(error);

      await expect(service.deleteConfig(mockProjectPath)).resolves.toBeUndefined();
    });

    it('should throw other errors during deletion', async () => {
      const error = new Error('Permission denied');
      mockedFs.unlink.mockRejectedValue(error);

      await expect(service.deleteConfig(mockProjectPath)).rejects.toThrow('Permission denied');
    });
  });
});
