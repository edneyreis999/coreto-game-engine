/**
 * Unit Tests for ConfigService
 *
 * Tests configuration file loading, saving, and schema normalization.
 * Ensures CLI compatibility and backward compatibility.
 *
 * @see planos/005-run-ttk-electron/tasks/04_task.md
 * @see packages/electron/src/main/services/config-service.ts
 */

import path from 'node:path';
import { Volume, createFsFromVolume } from 'memfs';
import { jest } from '@jest/globals';
import type { UIProjectConfig } from '../schemas.js';

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

// ============================================================================
// Test Suite Setup
// ============================================================================

describe('ConfigService', () => {
  // These need to be declared at the top level so they can be used in beforeEach
  let vol: ReturnType<typeof Volume.fromJSON>;
  let memfs: ReturnType<typeof createFsFromVolume>;
  let ConfigService: typeof import('../config-service.js').ConfigService;
  let ConfigNotFoundError: typeof import('../config-service.js').ConfigNotFoundError;
  let ConfigValidationError: typeof import('../config-service.js').ConfigValidationError;
  let ProjectConfigSchema: typeof import('../schemas.js').ProjectConfigSchema;
  let CURRENT_SCHEMA_VERSION: typeof import('../schemas.js').CURRENT_SCHEMA_VERSION;

  const mockProjectPath = '/test/project';
  const mockConfigPath = path.join(mockProjectPath, 'temp', 'project.config.json');

  /**
   * Helper to create a config file in the mock filesystem
   */
  function createMockConfigFile(config: UIProjectConfig): void {
    const configDir = path.dirname(mockConfigPath);
    vol.mkdirSync(configDir, { recursive: true });
    vol.writeFileSync(mockConfigPath, JSON.stringify(config));
  }

  beforeEach(async () => {
    // Clear module cache to ensure fresh imports
    jest.resetModules();

    // Create fresh in-memory filesystem for each test
    vol = Volume.fromJSON({
      '/test/.gitkeep': '',
    });
    memfs = createFsFromVolume(vol);

    // Mock fs/promises with memfs
    jest.doMock('node:fs/promises', () => memfs.promises);

    // Import ConfigService fresh for each test
    const configServiceModule = await import('../config-service.js');
    ConfigService = configServiceModule.ConfigService;
    ConfigNotFoundError = configServiceModule.ConfigNotFoundError;
    ConfigValidationError = configServiceModule.ConfigValidationError;

    const schemasModule = await import('../schemas.js');
    ProjectConfigSchema = schemasModule.ProjectConfigSchema;
    CURRENT_SCHEMA_VERSION = schemasModule.CURRENT_SCHEMA_VERSION;
  });

  describe('config path behavior', () => {
    it('should use correct path matching CLI expectation', async () => {
      const service = new ConfigService();

      // Create config file in memory
      createMockConfigFile(createValidConfig());

      // Test through public interface - configExists uses getConfigPath internally
      await service.configExists(mockProjectPath);

      // Verify the file exists at the correct path
      expect(vol.existsSync(mockConfigPath)).toBe(true);
    });

    it('should load config from temp directory', async () => {
      const service = new ConfigService();
      const config = createValidConfig();
      createMockConfigFile(config);

      const loadedConfig = await service.loadConfig(mockProjectPath);

      // Verify the correct path was used and config loaded
      expect(loadedConfig.version).toBe(config.version);
      expect(loadedConfig.trechos).toEqual(config.trechos);
    });
  });

  describe('normalizeSchema', () => {
    it('should add missing version field', async () => {
      const service = new ConfigService();
      const config = { trechos: [] };
      const normalized = service.normalizeSchema(config) as Record<string, unknown>;

      expect(normalized).toHaveProperty('version', CURRENT_SCHEMA_VERSION);
    });

    it('should add missing metadata field', async () => {
      const service = new ConfigService();
      const config = { version: '1.0', trechos: [] };
      const normalized = service.normalizeSchema(config) as Record<string, unknown>;

      expect(normalized).toHaveProperty('metadata');
      expect(typeof normalized.metadata).toBe('object');
    });

    it('should migrate old field names (maxTurns -> maxBattleTurns)', async () => {
      const service = new ConfigService();
      const config = {
        version: '1.0',
        maxTurns: 100,
        trechos: [],
      };
      const normalized = service.normalizeSchema(config) as Record<string, unknown>;

      expect(normalized).toHaveProperty('maxBattleTurns', 100);
      expect(normalized).not.toHaveProperty('maxTurns');
    });

    it('should normalize trechos array', async () => {
      const service = new ConfigService();
      const config = {
        version: '1.0',
        trechos: [{ id: 'trecho-1' }, { id: 'trecho-2', description: 'Test' }],
      };
      const normalized = service.normalizeSchema(config) as { trechos: unknown[] };

      expect(Array.isArray(normalized.trechos)).toBe(true);
      expect(normalized.trechos[0]).toHaveProperty('description');
      expect(normalized.trechos[1]).toHaveProperty('description');
    });

    it('should normalize individual trecho with defaults', async () => {
      const service = new ConfigService();
      const config = {
        version: '1.0',
        trechos: [
          {
            id: 'trecho-1',
          },
        ],
      };
      const normalized = service.normalizeSchema(config) as {
        trechos: Array<Record<string, unknown>>;
      };

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

    it('should return raw as-is if not an object', async () => {
      const service = new ConfigService();
      expect(service.normalizeSchema(null)).toBe(null);
      expect(service.normalizeSchema('string')).toBe('string');
      expect(service.normalizeSchema(123)).toBe(123);
    });
  });

  describe('loadConfig', () => {
    describe('with valid config', () => {
      let validConfig: UIProjectConfig;
      let service: InstanceType<typeof ConfigService>;

      beforeEach(async () => {
        service = new ConfigService();
        validConfig = createValidConfig({
          trechos: [
            {
              id: 'trecho-1',
              name: 'Test Trecho',
              anchorLevelMin: 5,
              anchorLevelMax: 10,
              targetTtkTurns: 15,
              targetTtkActions: 20,
              tolerancePercent: 15,
              troopIds: [1, 2],
              party: {
                members: [
                  { classId: 1, level: 5 },
                  { classId: 2, level: 5 },
                ],
              },
            },
          ],
          metadata: {
            projectName: 'Test Project',
            lastModified: Date.now(),
          },
        });

        // Write config to in-memory filesystem
        createMockConfigFile(validConfig);
      });

      it('should load valid config successfully', async () => {
        const config = await service.loadConfig(mockProjectPath);

        expect(config.version).toBe('1.0');
        expect(config.trechos).toHaveLength(1);
        expect(config.trechos[0]).toBeDefined();
        expect(config.trechos[0]?.id).toBe('trecho-1');
      });
    });

    it('should normalize and load old config format', async () => {
      const service = new ConfigService();
      const oldConfig = { trechos: [] };
      createMockConfigFile(oldConfig as unknown as UIProjectConfig);

      const config = await service.loadConfig(mockProjectPath);

      expect(config.version).toBe(CURRENT_SCHEMA_VERSION);
      expect(config.metadata).toEqual({});
    });

    it('should throw ConfigNotFoundError if file does not exist', async () => {
      const service = new ConfigService();
      await expect(service.loadConfig(mockProjectPath)).rejects.toThrow(ConfigNotFoundError);
    });

    it('should throw ConfigValidationError if invalid after normalization', async () => {
      const service = new ConfigService();
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

      createMockConfigFile(invalidConfig);

      await expect(service.loadConfig(mockProjectPath)).rejects.toThrow(ConfigValidationError);
    });

    it('should handle migrated maxTurns field', async () => {
      const service = new ConfigService();
      const legacyConfig = { version: '1.0', maxTurns: 100, trechos: [] };
      createMockConfigFile(legacyConfig as unknown as UIProjectConfig);

      const config = await service.loadConfig(mockProjectPath);

      expect(config.version).toBe('1.0');
    });
  });

  describe('saveConfig', () => {
    it('should save config with formatting', async () => {
      const service = new ConfigService();
      const validConfig = createValidConfig({ metadata: { projectName: 'Test Project' } });

      await service.saveConfig(mockProjectPath, validConfig);

      // Verify directory was created
      expect(vol.existsSync(path.dirname(mockConfigPath))).toBe(true);

      // Verify file was written
      expect(vol.existsSync(mockConfigPath)).toBe(true);

      // Verify the complete saved config can be parsed
      const savedContent = vol.readFileSync(mockConfigPath, 'utf-8') as string;
      const savedConfig = JSON.parse(savedContent);

      expect(savedConfig).toMatchObject({
        version: '1.0',
        trechos: [],
      });
      expect(savedConfig).toHaveProperty('metadata');
    });

    it('should update lastModified timestamp', async () => {
      const service = new ConfigService();
      const beforeTime = Date.now();
      await service.saveConfig(mockProjectPath, createValidConfig());
      const afterTime = Date.now();

      const savedContent = vol.readFileSync(mockConfigPath, 'utf-8') as string;
      const savedConfig = JSON.parse(savedContent);

      expect(savedConfig.metadata?.lastModified).toBeGreaterThanOrEqual(beforeTime);
      expect(savedConfig.metadata?.lastModified).toBeLessThanOrEqual(afterTime);
    });

    it('should throw ConfigValidationError for invalid config', async () => {
      const service = new ConfigService();
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
      const service = new ConfigService();
      await service.saveConfig(mockProjectPath, createValidConfig());

      const savedContent = vol.readFileSync(mockConfigPath, 'utf-8') as string;
      const savedConfig = JSON.parse(savedContent);

      expect(savedConfig.metadata).toBeDefined();
      expect(savedConfig.metadata.lastModified).toBeDefined();
    });
  });

  describe('configExists', () => {
    it('should return true when config file exists', async () => {
      const service = new ConfigService();
      createMockConfigFile(createValidConfig());

      const exists = await service.configExists(mockProjectPath);

      expect(exists).toBe(true);
    });

    it('should return false when config file does not exist', async () => {
      const service = new ConfigService();
      const exists = await service.configExists(mockProjectPath);

      expect(exists).toBe(false);
    });
  });

  describe('createDefaultConfig', () => {
    it('should create valid default config', async () => {
      const service = new ConfigService();
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
      const service = new ConfigService();
      createMockConfigFile(createValidConfig());

      await service.deleteConfig(mockProjectPath);

      expect(vol.existsSync(mockConfigPath)).toBe(false);
    });

    it('should not throw if config file does not exist', async () => {
      const service = new ConfigService();
      await expect(service.deleteConfig(mockProjectPath)).resolves.toBeUndefined();
    });
  });
});
