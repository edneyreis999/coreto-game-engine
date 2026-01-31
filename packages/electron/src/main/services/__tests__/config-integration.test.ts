/**
 * Integration Tests for ConfigService
 *
 * Tests CLI-GUI compatibility and end-to-end config workflows.
 * Ensures configs saved by GUI can be loaded by CLI and vice versa.
 *
 * @see planos/005-run-ttk-electron/tasks/04_task.md
 * @see packages/electron/src/main/services/config-service.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { ConfigService } from '../config-service.js';
import type { ProjectConfig } from '../schemas.js';

describe('ConfigService Integration', () => {
  let service: ConfigService;
  const testProjectPath = '/tmp/test-ttk-project';
  const configPath = path.join(testProjectPath, 'temp', 'project.config.json');

  beforeAll(async () => {
    service = new ConfigService();

    // Create test project directory
    await fs.mkdir(testProjectPath, { recursive: true });
    await fs.mkdir(path.join(testProjectPath, 'temp'), { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test directory
    await fs.rm(testProjectPath, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // Clean config file before each test
    try {
      await fs.unlink(configPath);
    } catch {
      // File doesn't exist, that's fine
    }
  });

  describe('CLI-GUI Compatibility', () => {
    const cliCompatibleConfig: ProjectConfig = {
      version: '1.0',
      trechos: [
        {
          id: 'trecho-1',
          description: 'Test Battle',
          heroTeam: {
            level: 5,
            actors: [1, 2, 3, 4],
            weapons: { 1: 10, 2: 5 },
            armors: { 3: 8, 4: 3 },
          },
          enemyTeam: {
            troopId: 1,
            count: 5,
          },
          expectedTTK: {
            min: 15,
            max: 25,
          },
        },
      ],
      metadata: {
        projectName: 'CLI Test Project',
        lastModified: Date.now(),
      },
    };

    it('should save config that CLI can load', async () => {
      // Save config via GUI (ConfigService)
      await service.saveConfig(testProjectPath, cliCompatibleConfig);

      // Verify file exists and is valid JSON
      const fileContent = await fs.readFile(configPath, 'utf-8');
      const parsedConfig = JSON.parse(fileContent);

      expect(parsedConfig).toMatchObject({
        version: '1.0',
        trechos: expect.arrayContaining([
          expect.objectContaining({
            id: 'trecho-1',
          }),
        ]),
      });

      // Verify pretty-printed formatting (human-readable)
      expect(fileContent).toContain('\n  '); // indented
    });

    it('should load config saved by CLI', async () => {
      // Simulate CLI creating config file
      const cliConfig = {
        version: '1.0',
        trechos: [
          {
            id: 'cli-trecho-1',
            description: 'CLI Created Trecho',
            heroTeam: {
              level: 10,
              actors: [1],
              weapons: {},
              armors: {},
            },
            enemyTeam: {
              troopId: 2,
            },
            expectedTTK: {
              min: 20,
              max: 30,
            },
          },
        ],
        metadata: {
          projectName: 'CLI Project',
          lastModified: Date.now(),
        },
      };

      await fs.writeFile(
        configPath,
        JSON.stringify(cliConfig, null, 2),
        'utf-8'
      );

      // Load via GUI (ConfigService)
      const loadedConfig = await service.loadConfig(testProjectPath);

      expect(loadedConfig.version).toBe('1.0');
      expect(loadedConfig.trechos).toHaveLength(1);
      expect(loadedConfig.trechos[0]).toBeDefined();
      expect(loadedConfig.trechos[0]?.id).toBe('cli-trecho-1');
    });

    it('should normalize and load legacy CLI config', async () => {
      // Simulate old CLI config format
      const legacyConfig = {
        maxTurns: 100, // old field name
        trechos: [],
      };

      await fs.writeFile(
        configPath,
        JSON.stringify(legacyConfig),
        'utf-8'
      );

      // Load via GUI (ConfigService) - should normalize
      const loadedConfig = await service.loadConfig(testProjectPath);

      expect(loadedConfig.version).toBe('1.0');
      expect(loadedConfig.trechos).toEqual([]);
      // maxBattleTurns would be added by normalization
    });
  });

  describe('Schema Versioning', () => {
    it('should handle missing version field (v0.x configs)', async () => {
      const v0Config = {
        trechos: [],
      };

      await fs.writeFile(configPath, JSON.stringify(v0Config), 'utf-8');

      const loaded = await service.loadConfig(testProjectPath);

      expect(loaded.version).toBe('1.0'); // normalized to current version
    });

    it('should preserve version field when saving', async () => {
      const config: ProjectConfig = {
        version: '1.0',
        trechos: [],
      };

      await service.saveConfig(testProjectPath, config);

      const fileContent = await fs.readFile(configPath, 'utf-8');
      const parsed = JSON.parse(fileContent);

      expect(parsed.version).toBe('1.0');
    });
  });

  describe('Round-Trip Tests', () => {
    it('should preserve data through load-save cycle', async () => {
      const originalConfig: ProjectConfig = {
        version: '1.0',
        trechos: [
          {
            id: 'round-trip-1',
            description: 'Round Trip Test',
            heroTeam: {
              level: 15,
              actors: [1, 2],
              weapons: { 1: 100 },
              armors: { 2: 50 },
            },
            enemyTeam: {
              troopId: 3,
              count: 2,
            },
            expectedTTK: {
              min: 10,
              max: 40,
            },
          },
        ],
        metadata: {
          projectName: 'Round Trip Project',
          lastModified: 1234567890,
        },
      };

      // Save original
      await service.saveConfig(testProjectPath, originalConfig);

      // Load
      const loaded = await service.loadConfig(testProjectPath);

      // Save again
      await service.saveConfig(testProjectPath, loaded);

      // Load again
      const final = await service.loadConfig(testProjectPath);

      // Verify data integrity
      expect(final.trechos).toHaveLength(1);
      expect(final.trechos[0]).toBeDefined();
      const trecho = final.trechos[0];
      expect(trecho?.id).toBe('round-trip-1');
      expect(trecho?.heroTeam.level).toBe(15);
      expect(trecho?.heroTeam.actors).toEqual([1, 2]);
      expect(trecho?.heroTeam.weapons).toEqual({ 1: 100 });
      expect(trecho?.enemyTeam.troopId).toBe(3);
      expect(trecho?.expectedTTK).toEqual({ min: 10, max: 40 });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      await fs.writeFile(configPath, '{ invalid json }', 'utf-8');

      await expect(service.loadConfig(testProjectPath)).rejects.toThrow();
    });

    it('should handle missing required fields after normalization', async () => {
      const invalidConfig = {
        version: '1.0',
        trechos: [
          {
            id: 'invalid',
            description: 'Test',
            heroTeam: {
              level: 5,
              actors: [],
              weapons: {},
              armors: {},
            },
            // missing enemyTeam
          },
        ],
      };

      await fs.writeFile(configPath, JSON.stringify(invalidConfig), 'utf-8');

      await expect(service.loadConfig(testProjectPath)).rejects.toThrow();
    });
  });

  describe('File I/O Edge Cases', () => {
    it('should handle empty config file', async () => {
      await fs.writeFile(configPath, '{}', 'utf-8');

      const loaded = await service.loadConfig(testProjectPath);

      expect(loaded.version).toBe('1.0'); // normalized
      expect(loaded.trechos).toEqual([]);
    });

    it('should handle config with extra unknown fields', async () => {
      const configWithExtras = {
        version: '1.0',
        trechos: [],
        unknownField: 'should be ignored',
        anotherUnknown: 123,
      };

      await fs.writeFile(configPath, JSON.stringify(configWithExtras), 'utf-8');

      const loaded = await service.loadConfig(testProjectPath);

      // Zod strips unknown fields
      expect(loaded.version).toBe('1.0');
      expect(loaded).not.toHaveProperty('unknownField');
      expect(loaded).not.toHaveProperty('anotherUnknown');
    });
  });
});
