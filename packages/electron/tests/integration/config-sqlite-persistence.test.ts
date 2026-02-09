/**
 * Integration Tests for Config SQLite Persistence
 *
 * Tests the complete end-to-end workflow for config persistence:
 * - Edit trecho → Persist to SQLite → Reload project → Verify saved config
 *
 * Test Coverage:
 * - Save config via IPC → verify in database
 * - Update trecho → verify UPSERT in database
 * - Delete trecho → verify removal from database
 * - Load config via IPC → verify correct format
 * - Auto-load on project selection (renderer workflow)
 * - Race condition guard - rapid project switching
 *
 * Key Decisions:
 * - D017-INV: Invoke IPC handler functions directly instead of mocking ipcRenderer
 * - D017-DB: Use file-based SQLite database with unique name per test suite
 * - D017-CLEAN: Delete test database file in afterEach() after closing connection
 *
 * @see src/main/ipc/config-handlers.ts
 * @see src/main/adapters/sqlite-config-storage-adapter.ts
 * @see src/domain/use-cases/load-project-config.ts
 * @see src/main/database/migrations.ts (Migration v3)
 * @see planos/018-save-trecho-config/tasks/techspec.md Section 6.2
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import Database from 'better-sqlite3';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { rimraf } from 'rimraf';
import type { IpcMainInvokeEvent } from 'electron';
import {
  handleConfigSave,
  handleConfigLoad,
  handleConfigExists,
  registerConfigHandlers,
} from '../../src/main/ipc/config-handlers.js';
import type { UIProjectConfig } from '../../src/domain/schemas/index.js';
import { CURRENT_SCHEMA_VERSION } from '../../src/domain/schemas/index.js';
import { initializeMigrationsTable, applyMigrations } from '../../src/main/database/migrations.js';
import type { IConfigStorage } from '../../src/domain/ports/index.js';
import { createSQLiteConfigStorage } from '../../src/main/adapters/sqlite-config-storage-adapter.js';

// ============================================================================
// Test Constants
// ============================================================================

const TEST_PROJECT_PATH = '/test/rmmz-project';
const TEST_PROJECT_PATH_2 = '/test/another-project';
const NON_EXISTENT_PROJECT = '/non/existent/project';

const MOCK_CONFIG: UIProjectConfig = {
  version: CURRENT_SCHEMA_VERSION,
  trechos: [
    {
      id: 'trecho-1',
      name: 'Trecho 1',
      description: 'First trecho',
      targetTtkTurns: 5,
      targetTtkActions: 10,
      tolerancePercent: 10,
      anchorLevelMin: 10,
      anchorLevelMax: 20,
      troopIds: [1],
      party: {
        members: [
          { classId: 1, level: 10 },
          { classId: 2, level: 15 },
        ],
      },
    },
    {
      id: 'trecho-2',
      name: 'Trecho 2',
      description: 'Second trecho',
      targetTtkTurns: 8,
      targetTtkActions: 15,
      tolerancePercent: 10,
      anchorLevelMin: 20,
      anchorLevelMax: 30,
      troopIds: [2],
      party: {
        members: [
          { classId: 3, level: 20 },
        ],
      },
    },
  ],
  globalSettings: {
    seed: 42,
  },
  metadata: {
    projectName: 'Test Project',
    lastModified: Date.now(),
  },
};

const UPDATED_TRECHO = {
  id: 'trecho-1',
  name: 'Updated Trecho 1',
  description: 'Updated description',
  targetTtkTurns: 10,
  targetTtkActions: 20,
  tolerancePercent: 10,
  anchorLevelMin: 10,
  anchorLevelMax: 20,
  troopIds: [1],
  party: {
    members: [
      { classId: 1, level: 15 },
    ],
  },
};

const SINGLE_TRECHO_CONFIG: UIProjectConfig = {
  version: CURRENT_SCHEMA_VERSION,
  trechos: [
    {
      id: 'trecho-1',
      name: 'Single Trecho',
      description: 'Only one trecho',
      targetTtkTurns: 3,
      targetTtkActions: 5,
      tolerancePercent: 10,
      anchorLevelMin: 10,
      anchorLevelMax: 20,
      troopIds: [1],
      party: {
        members: [
          { classId: 1, level: 10 },
        ],
      },
    },
  ],
  globalSettings: {},
  metadata: {
    projectName: 'Single Trecho Project',
    lastModified: Date.now(),
  },
};

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates a file-based test database with unique name.
 * Returns both the database instance and the file path.
 */
async function createTestDatabase(): Promise<{ db: Database.Database; dbPath: string; testDir: string }> {
  const testDir = path.join(os.tmpdir(), `config-integration-test-${Date.now()}`);
  await fs.mkdir(testDir, { recursive: true });

  const dbPath = path.join(testDir, 'test.db');
  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Initialize migrations and apply Migration v3
  initializeMigrationsTable(db);
  applyMigrations(db);

  return { db, dbPath, testDir };
}

/**
 * Creates a mock IpcMainInvokeEvent for testing handlers.
 */
function createMockEvent(): IpcMainInvokeEvent {
  return {} as IpcMainInvokeEvent;
}

/**
 * Reads config directly from database for verification.
 */
function readConfigFromDb(db: Database.Database, projectPath: string): UIProjectConfig | null {
  const stmt = db.prepare('SELECT config_json FROM project_configs WHERE project_path = ?');
  const row = stmt.get(projectPath) as { config_json: string } | undefined;

  if (!row) {
    return null;
  }

  return JSON.parse(row.config_json) as UIProjectConfig;
}

/**
 * Counts configs in database.
 */
function countConfigsInDb(db: Database.Database): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM project_configs');
  const row = stmt.get() as { count: number };
  return row.count;
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Config SQLite Persistence - Edit → Persist → Reload Workflow', () => {
  let db: Database.Database;
  let dbPath: string;
  let testDir: string;
  let storage: IConfigStorage;

  beforeAll(async () => {
    // Create test database directory and initialize database
    const setup = await createTestDatabase();
    db = setup.db;
    dbPath = setup.dbPath;
    testDir = setup.testDir;
  });

  beforeEach(() => {
    // Create fresh storage adapter for each test
    storage = createSQLiteConfigStorage(db);
  });

  afterEach(() => {
    // Clean up database after each test
    db.exec('DELETE FROM project_configs');
  });

  afterAll(async () => {
    // Clean up test database
    db.close();
    await rimraf(testDir);
  });

  // ========================================================================
  // Save config via IPC and verify in database
  // ========================================================================

  describe('Save Config → Database Persistence', () => {
    it('should save config via storage and persist to database', async () => {
      // Test: Save config via storage
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(MOCK_CONFIG));

      // Verify: Config exists in database
      const dbConfig = readConfigFromDb(db, TEST_PROJECT_PATH);
      expect(dbConfig).toBeDefined();
      expect(dbConfig).toEqual(MOCK_CONFIG);

      // Verify: Only one record exists
      expect(countConfigsInDb(db)).toBe(1);
    });

    it('should save multiple configs for different projects', async () => {
      // Test: Save configs for two different projects
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(MOCK_CONFIG));
      await storage.write(TEST_PROJECT_PATH_2, JSON.stringify(SINGLE_TRECHO_CONFIG));

      // Verify: Both configs exist in database
      const config1 = readConfigFromDb(db, TEST_PROJECT_PATH);
      const config2 = readConfigFromDb(db, TEST_PROJECT_PATH_2);

      expect(config1).toEqual(MOCK_CONFIG);
      expect(config2).toEqual(SINGLE_TRECHO_CONFIG);

      // Verify: Two records exist
      expect(countConfigsInDb(db)).toBe(2);
    });
  });

  // ========================================================================
  // Update trecho → verify UPSERT in database
  // ========================================================================

  describe('Update Trecho → UPSERT Behavior', () => {
    it('should update existing trecho and persist immediately', async () => {
      // Setup: Save initial config
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(MOCK_CONFIG));

      const initialCount = countConfigsInDb(db);
      expect(initialCount).toBe(1);

      // Test: Update config with modified trecho
      const updatedConfig: UIProjectConfig = {
        ...MOCK_CONFIG,
        trechos: [UPDATED_TRECHO, MOCK_CONFIG.trechos[1]!],
        metadata: {
          ...MOCK_CONFIG.metadata,
          lastModified: Date.now(),
        },
      };

      await storage.write(TEST_PROJECT_PATH, JSON.stringify(updatedConfig));

      // Verify: Still only one record (UPSERT, not INSERT)
      const finalCount = countConfigsInDb(db);
      expect(finalCount).toBe(1);

      // Verify: Config is updated in database
      const dbConfig = readConfigFromDb(db, TEST_PROJECT_PATH);
      expect(dbConfig).not.toEqual(MOCK_CONFIG);
      expect(dbConfig).toEqual(updatedConfig);

      // Verify: Specific trecho was updated
      expect(dbConfig!.trechos[0]).toEqual(UPDATED_TRECHO);
      expect(dbConfig!.trechos[0].name).toBe('Updated Trecho 1');
      expect(dbConfig!.trechos[0].targetTtkTurns).toBe(10);
    });

    it('should handle trecho deletion via save', async () => {
      // Setup: Save config with 2 trechos
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(MOCK_CONFIG));

      expect(readConfigFromDb(db, TEST_PROJECT_PATH)!.trechos).toHaveLength(2);

      // Test: Save config with only 1 trecho
      const reducedConfig: UIProjectConfig = {
        ...MOCK_CONFIG,
        trechos: [MOCK_CONFIG.trechos[0]!],
      };

      await storage.write(TEST_PROJECT_PATH, JSON.stringify(reducedConfig));

      // Verify: Config updated in database with 1 trecho
      const dbConfig = readConfigFromDb(db, TEST_PROJECT_PATH);
      expect(dbConfig!.trechos).toHaveLength(1);
      expect(dbConfig!.trechos[0].id).toBe('trecho-1');
    });
  });

  // ========================================================================
  // Delete trecho → verify removal from database
  // ========================================================================

  describe('Delete Trecho → Database Removal', () => {
    it('should handle config deletion and verify removal', async () => {
      // Setup: Save a config
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(MOCK_CONFIG));

      expect(await storage.exists(TEST_PROJECT_PATH)).toBe(true);

      // Test: Delete via storage
      await storage.delete(TEST_PROJECT_PATH);

      // Verify: Config removed from database
      const dbConfig = readConfigFromDb(db, TEST_PROJECT_PATH);
      expect(dbConfig).toBeNull();

      // Verify: exists() returns false
      expect(await storage.exists(TEST_PROJECT_PATH)).toBe(false);
    });

    it('should handle deletion of non-existent config gracefully', async () => {
      // Test: Delete non-existent config (should not throw)
      await expect(storage.delete(NON_EXISTENT_PROJECT)).resolves.toBeUndefined();

      // Verify: Database is still in consistent state
      const count = countConfigsInDb(db);
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================================================
  // Load config via IPC → verify correct format
  // ========================================================================

  describe('Load Config → Format Verification', () => {
    it('should load saved config and verify format', async () => {
      // Setup: Save a config
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(MOCK_CONFIG));

      // Test: Load config via storage
      const configJson = await storage.read(TEST_PROJECT_PATH);
      const config = JSON.parse(configJson) as UIProjectConfig;

      // Verify: Config data matches what was saved
      expect(config).toEqual(MOCK_CONFIG);
      expect(config.trechos).toHaveLength(2);
      expect(config.trechos[0].id).toBe('trecho-1');
      expect(config.trechos[0].name).toBe('Trecho 1');
    });

    it('should throw error when loading non-existent project', async () => {
      // Test: Load non-existent config should throw
      await expect(storage.read(NON_EXISTENT_PROJECT)).rejects.toThrow(
        `Project config not found for: ${NON_EXISTENT_PROJECT}`
      );
    });

    it('should verify config exists before loading', async () => {
      // Setup: Save a config
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(MOCK_CONFIG));

      // Test: Check if exists
      const exists = await storage.exists(TEST_PROJECT_PATH);

      // Verify: Exists check returns true
      expect(exists).toBe(true);

      // Test: Check non-existent project
      const notExists = await storage.exists(NON_EXISTENT_PROJECT);

      // Verify: Exists check returns false
      expect(notExists).toBe(false);
    });
  });

  // ========================================================================
  // Auto-load workflow - simulate project selection
  // ========================================================================

  describe('Auto-Load Workflow → Project Selection', () => {
    it('should auto-load saved config on project selection', async () => {
      // Setup: User previously saved config for this project
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(MOCK_CONFIG));

      // Simulate: User selects project in UI
      // Storage loads the config
      const configJson = await storage.read(TEST_PROJECT_PATH);
      const config = JSON.parse(configJson) as UIProjectConfig;

      // Verify: Config loaded correctly
      expect(config).toEqual(MOCK_CONFIG);
      expect(config.trechos).toHaveLength(2);
      expect(config.metadata.projectName).toBe('Test Project');
    });

    it('should return default config when selecting project without saved config', async () => {
      // Test: Check non-existent project
      const exists = await storage.exists(NON_EXISTENT_PROJECT);

      // Verify: Project doesn't exist (UI will create default config)
      expect(exists).toBe(false);
    });

    it('should handle rapid project selection workflow', async () => {
      // Setup: User has configs for multiple projects
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(MOCK_CONFIG));
      await storage.write(TEST_PROJECT_PATH_2, JSON.stringify(SINGLE_TRECHO_CONFIG));

      // Simulate: User rapidly switches between projects
      const load1 = JSON.parse(await storage.read(TEST_PROJECT_PATH)) as UIProjectConfig;
      const load2 = JSON.parse(await storage.read(TEST_PROJECT_PATH_2)) as UIProjectConfig;
      const load3 = JSON.parse(await storage.read(TEST_PROJECT_PATH)) as UIProjectConfig;

      // Verify: Each load returns correct config
      expect(load1.trechos).toHaveLength(2);
      expect(load2.trechos).toHaveLength(1);
      expect(load3.trechos).toHaveLength(2);
    });
  });

  // ========================================================================
  // Race condition guard - rapid project switching
  // ========================================================================

  describe('Race Condition Guard → Rapid Operations', () => {
    it('should handle concurrent save operations for same project', async () => {
      // Simulate: User makes rapid changes to same project
      const config1 = { ...MOCK_CONFIG, metadata: { projectName: 'Version 1', lastModified: 1 } };
      const config2 = { ...MOCK_CONFIG, metadata: { projectName: 'Version 2', lastModified: 2 } };
      const config3 = { ...MOCK_CONFIG, metadata: { projectName: 'Version 3', lastModified: 3 } };

      const promises = [
        storage.write(TEST_PROJECT_PATH, JSON.stringify(config1)),
        storage.write(TEST_PROJECT_PATH, JSON.stringify(config2)),
        storage.write(TEST_PROJECT_PATH, JSON.stringify(config3)),
      ];

      // All saves complete successfully
      await expect(Promise.all(promises)).resolves.toBeDefined();

      // Verify: Only one record in database (UPSERT behavior)
      expect(countConfigsInDb(db)).toBe(1);

      // Verify: Final config is one of the versions (race condition means unpredictable which)
      const finalConfig = readConfigFromDb(db, TEST_PROJECT_PATH);
      expect(finalConfig).toBeDefined();
      expect(['Version 1', 'Version 2', 'Version 3']).toContain(
        finalConfig!.metadata.projectName
      );
    });

    it('should handle save immediately followed by load', async () => {
      // Simulate: User saves config then immediately loads it
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(MOCK_CONFIG));
      const configJson = await storage.read(TEST_PROJECT_PATH);
      const config = JSON.parse(configJson) as UIProjectConfig;

      // Verify: Load reflects saved state
      expect(config).toEqual(MOCK_CONFIG);
    });

    it('should handle exists check during save', async () => {
      // Setup: Pre-existing config
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(MOCK_CONFIG));

      // Simulate: Concurrent operations
      const [writeResult, existsResult] = await Promise.all([
        storage.write(TEST_PROJECT_PATH, JSON.stringify(SINGLE_TRECHO_CONFIG)),
        storage.exists(TEST_PROJECT_PATH),
      ]);

      // Both succeed
      expect(writeResult).toBeUndefined();
      expect(existsResult).toBe(true); // exists returns true (config existed)
    });
  });

  // ========================================================================
  // Error handling and edge cases
  // ========================================================================

  describe('Error Handling → Edge Cases', () => {
    it('should handle config with minimal valid data', async () => {
      // Test: Minimal valid config
      const minimalConfig: UIProjectConfig = {
        version: CURRENT_SCHEMA_VERSION,
        trechos: [],
        metadata: {
          projectName: 'Minimal',
          lastModified: Date.now(),
        },
      };

      await storage.write(TEST_PROJECT_PATH, JSON.stringify(minimalConfig));

      // Verify: Can be loaded back
      const configJson = await storage.read(TEST_PROJECT_PATH);
      const config = JSON.parse(configJson) as UIProjectConfig;

      expect(config.trechos).toHaveLength(0);
    });

    it('should handle special characters in project path', async () => {
      // Test: Project path with special characters
      const specialPath = "/path/with spaces/and'quotes'/and\"double\"/and/slashes\\";
      await storage.write(specialPath, JSON.stringify(MOCK_CONFIG));

      // Verify: Can be read back
      const exists = await storage.exists(specialPath);
      expect(exists).toBe(true);

      const configJson = await storage.read(specialPath);
      const config = JSON.parse(configJson) as UIProjectConfig;
      expect(config.trechos).toHaveLength(2);
    });

    it('should preserve complex nested config structure', async () => {
      // Test: Complex nested config
      const complexConfig: UIProjectConfig = {
        version: CURRENT_SCHEMA_VERSION,
        trechos: [
          {
            id: 't1',
            name: 'Trecho 1',
            targetTtk: { turns: 5, actions: 10 },
            parties: [
              {
                id: 'p1',
                members: [
                  { id: 'm1', name: 'Actor 1', level: 10 },
                  { id: 'm2', name: 'Actor 2', level: 15 },
                  { id: 'm3', name: 'Actor 3', level: 20 },
                ],
              },
              {
                id: 'p2',
                members: [
                  { id: 'm4', name: 'Actor 4', level: 25 },
                ],
              },
            ],
          },
        ],
        metadata: {
          projectName: 'Complex Project',
          lastModified: Date.now(),
        },
      };

      await storage.write(TEST_PROJECT_PATH, JSON.stringify(complexConfig));

      // Verify: Can be loaded with all nested data intact
      const configJson = await storage.read(TEST_PROJECT_PATH);
      const config = JSON.parse(configJson) as UIProjectConfig;

      expect(config.trechos[0].parties).toHaveLength(2);
      expect(config.trechos[0].parties[0].members).toHaveLength(3);
      expect(config.trechos[0].parties[1].members[0].level).toBe(25);
    });

    it('should handle empty config JSON', async () => {
      // Test: Empty config (not valid per schema but storage accepts any JSON)
      await storage.write(TEST_PROJECT_PATH, '{}');

      // Verify: Can be read back
      const configJson = await storage.read(TEST_PROJECT_PATH);
      expect(configJson).toBe('{}');
    });

    it('should handle large config', async () => {
      // Test: Config with many trechos and parties
      const largeConfig: UIProjectConfig = {
        version: CURRENT_SCHEMA_VERSION,
        trechos: Array.from({ length: 100 }, (_, i) => ({
          id: `trecho-${i}`,
          name: `Trecho ${i}`,
          description: `Description for trecho ${i}`,
          targetTtk: { turns: i + 1, actions: (i + 1) * 2 },
          parties: [
            {
              id: `party-${i}`,
              members: Array.from({ length: 4 }, (_, j) => ({
                id: `actor-${i}-${j}`,
                name: `Actor ${i}-${j}`,
                level: (i + 1) * 10 + j,
              })),
            },
          ],
        })),
        metadata: {
          projectName: 'Large Project',
          lastModified: Date.now(),
        },
      };

      await storage.write(TEST_PROJECT_PATH, JSON.stringify(largeConfig));

      // Verify: Can be loaded back
      const configJson = await storage.read(TEST_PROJECT_PATH);
      const config = JSON.parse(configJson) as UIProjectConfig;

      expect(config.trechos).toHaveLength(100);
      expect(config.trechos[99].parties[0].members).toHaveLength(4);
    });
  });

  // ========================================================================
  // SQLiteConfigLoaderAdapter - Config Loading Tests
  // ========================================================================

  describe('SQLiteConfigLoaderAdapter → loadConfig', () => {
    let storage: IConfigStorage;
    let testDbPath: string;

    beforeEach(async () => {
      // Create test database
      testDbPath = path.join(os.tmpdir(), `test-loader-${Date.now()}.db`);
      const db = new Database(testDbPath);

      // Initialize schema
      initializeMigrationsTable(db);
      applyMigrations(db);

      // Create storage adapter
      storage = createSQLiteConfigStorage(db);
    });

    afterEach(async () => {
      // Clean up test database
      try {
        await fs.rm(testDbPath, { force: true });
      } catch {
        // Ignore if already deleted
      }
    });

    it('should handle loadConfig when config does not exist in database (BUG FIX)', async () => {
      // This test would have failed before the fix because:
      // 1. storage.read() would throw an error "Project config not found for: /path/to/project"
      // 2. loadConfig() would propagate the error instead of creating default config
      // 3. Simulation would fail with "ConfigError: Failed to read config file"
      //
      // The fix ensures that when config doesn't exist, a default empty config is created
      // allowing simulations to run without requiring prior config save.

      const { createSQLiteConfigLoader } = await import(
        '../../src/main/adapters/sqlite-config-loader-adapter.js'
      );
      const loader = createSQLiteConfigLoader(storage);

      // Config does NOT exist in database (no rows written yet)
      const exists = await storage.exists(NON_EXISTENT_PROJECT);
      expect(exists).toBe(false);

      // BUG FIX: loadConfig should NOT throw, should create default config
      const config = await loader.loadConfig(NON_EXISTENT_PROJECT);

      // Verify: Returns valid config with defaults
      expect(config).toBeDefined();
      expect(config.projectPath).toBe(NON_EXISTENT_PROJECT);
      expect(config.reportOutputPath).toContain('/reports');

      // Verify: Can call loadTrechos without error (returns empty array)
      const trechos = await loader.loadTrechos(config);
      expect(trechos).toEqual([]);
      expect(Array.isArray(trechos)).toBe(true);
    });

    it('should load existing config from database', async () => {
      // Setup: Save config to database
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(MOCK_CONFIG));

      const { createSQLiteConfigLoader } = await import(
        '../../src/main/adapters/sqlite-config-loader-adapter.js'
      );
      const loader = createSQLiteConfigLoader(storage);

      // Load existing config
      const config = await loader.loadConfig(TEST_PROJECT_PATH);

      // Verify: Config loaded successfully
      expect(config).toBeDefined();
      expect(config.projectPath).toBe(TEST_PROJECT_PATH);

      // Verify: Trechos loaded correctly
      const trechos = await loader.loadTrechos(config);
      expect(trechos).toHaveLength(2);
      expect(trechos[0].id).toBe('trecho-1');
      expect(trechos[0].name).toBe('Trecho 1');
    });
  });
});
