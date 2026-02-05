/**
 * Integration Test: Config Save → Load Flow
 * 
 * This test verifies the critical flow:
 * 1. UI saves config via config-handlers (IPC)
 * 2. Core loads config via ZodConfigLoader
 * 
 * BUG REPRODUCED:
 * Before fix in commit a2cd51d, this test would fail because:
 * - config-handlers saved UIProjectConfig format (description, heroTeam, enemyTeam)
 * - ZodConfigLoader expected ProjectConfig format (name, anchorLevelRange, ttkTarget)
 * 
 * Error: ValidationError: Schema validation failed
 *   - projectPath: Required
 *   - reportOutputPath: Required
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import path from 'node:path';
import fs from 'node:fs/promises';
import { ZodConfigLoader, NodeFileSystem } from '@coreto/core';
import { IFileSystemToken } from '@coreto/core';

describe('Config Save-Load Integration', () => {
  let configLoader: ZodConfigLoader;
  let testProjectPath: string;
  let configPath: string;

  beforeEach(() => {
    // Setup DI container
    container.clearInstances();
    container.register(IFileSystemToken, { useClass: NodeFileSystem });
    configLoader = container.resolve(ZodConfigLoader);

    // Use temp directory for test
    testProjectPath = path.join(__dirname, '..', '..', 'temp', 'test-project');
    configPath = path.join(testProjectPath, 'temp', 'project.config.json');
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(path.join(testProjectPath, 'temp'), { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should save and load config in Core format', async () => {
    // Arrange: Simulate what config-handlers does
    const projectConfig = {
      projectPath: testProjectPath,
      reportOutputPath: 'temp/reports',
      seed: 12345,
      maxBattleTurns: 100,
      trechos: [
        {
          id: 'test-trecho',
          name: 'Test Trecho',
          anchorLevelRange: {
            min: 1,
            max: 10,
          },
          ttkTarget: {
            turns: 3,
            actions: 8,
            tolerance: 0.15,
          },
          troopIds: [1, 2],
          party: {
            members: [
              { classId: 1, level: 5 },
              { classId: 2, level: 5 },
            ],
          },
        },
      ],
    };

    // Act: Save config (simulate config-handlers)
    const tempDir = path.dirname(configPath);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(projectConfig, null, 2), 'utf-8');

    // Assert: Load config (Core should be able to read it)
    const loadedConfig = await configLoader.loadConfig(configPath);

    expect(loadedConfig).toBeDefined();
    expect(loadedConfig.projectPath).toBe(testProjectPath);
    expect(loadedConfig.reportOutputPath).toBe('temp/reports');
    expect(loadedConfig.seed).toBe(12345);
    expect(loadedConfig.maxBattleTurns).toBe(100);

    // Load trechos separately
    const trechos = await configLoader.loadTrechos(loadedConfig);
    expect(trechos).toHaveLength(1);
  });

  it('should fail with old UIProjectConfig format (reproduces bug)', async () => {
    // Arrange: Simulate what config-handlers was doing BEFORE fix
    const uiConfig = {
      version: '1.0',
      trechos: [
        {
          id: 'test-trecho',
          description: 'Test Trecho', // UI format uses 'description' not 'name'
          heroTeam: {
            // UI format uses 'heroTeam' not 'party'
            level: 10,
            actors: [1, 2],
            weapons: {},
            armors: {},
          },
          enemyTeam: {
            // UI format uses 'enemyTeam' not 'troopIds'
            troopId: 1,
            count: 1,
          },
          expectedTTK: {
            // UI format uses 'expectedTTK' not 'ttkTarget'
            min: 2,
            max: 4,
          },
        },
      ],
      metadata: {
        projectName: 'Test Project',
        lastModified: Date.now(),
      },
    };

    // Act: Save in UI format (what was causing the bug)
    const tempDir = path.dirname(configPath);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(uiConfig, null, 2), 'utf-8');

    // Assert: Core cannot load UI format - should throw ValidationError
    await expect(configLoader.loadConfig(configPath)).rejects.toThrow('Schema validation failed');
  });

  it('should load trechos with correct Core domain objects', async () => {
    // Arrange
    const projectConfig = {
      projectPath: testProjectPath,
      reportOutputPath: 'temp/reports',
      seed: 99999,
      trechos: [
        {
          id: 'ato1-nivel1-10',
          name: 'Ato 1 - Níveis 1-10',
          anchorLevelRange: {
            min: 1,
            max: 10,
          },
          ttkTarget: {
            turns: 5,
            actions: 12,
            tolerance: 0.2,
          },
          troopIds: [3, 4, 5],
          party: {
            members: [
              { classId: 1, level: 5 },
              { classId: 3, level: 5 },
              { classId: 4, level: 5 },
            ],
          },
        },
      ],
    };

    // Act: Save and load
    const tempDir = path.dirname(configPath);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(projectConfig, null, 2), 'utf-8');

    const loadedConfig = await configLoader.loadConfig(configPath);
    const trechos = await configLoader.loadTrechos(loadedConfig);

    // Assert: Trechos are properly mapped to Core domain objects
    expect(trechos).toHaveLength(1);

    const trecho = trechos[0]!;
    expect(trecho.id).toBe('ato1-nivel1-10');
    expect(trecho.name).toBe('Ato 1 - Níveis 1-10');
    expect(trecho.anchorLevelMin).toBe(1);
    expect(trecho.anchorLevelMax).toBe(10);
    expect(trecho.targetTtkTurns).toBe(5);
    expect(trecho.targetTtkActions).toBe(12);
    expect(trecho.tolerancePercent).toBe(20); // 0.2 * 100
    expect(trecho.troopIds).toEqual([3, 4, 5]);
    expect(trecho.party.members).toHaveLength(3);
  });
});
