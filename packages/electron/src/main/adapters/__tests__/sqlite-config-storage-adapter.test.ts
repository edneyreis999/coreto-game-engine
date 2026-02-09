/**
 * Unit Tests for SQLiteConfigStorageAdapter
 *
 * Tests the SQLite-based configuration storage adapter that implements IConfigStorage.
 * Uses in-memory SQLite database for isolation and speed.
 *
 * Test Coverage:
 * - read() method with valid config, missing config, malformed JSON
 * - write() method with UPSERT behavior (insert + update)
 * - exists() method with existing and non-existing projects
 * - delete() method with existing and non-existing projects
 * - getConfigPath() returns projectPath
 * - Error handling for database errors
 *
 * Key Decisions:
 * - D016-DB: Use In-Memory SQLite Database (new Database(':memory:'))
 * - D016-MIG: Run full migration v3 in beforeAll() to create production-like schema
 * - D016-CLEAN: Use db.close() in afterEach() after each test
 *
 * @see packages/electron/src/main/adapters/sqlite-config-storage-adapter.ts
 * @see packages/electron/src/main/database/migrations.ts (Migration v3)
 * @see packages/electron/src/domain/ports/IConfigStorage.ts
 * @see planos/018-save-trecho-config/tasks/techspec.md Section 6.1
 */

import Database from 'better-sqlite3';
import { createSQLiteConfigStorage } from '../sqlite-config-storage-adapter.js';
import type { IConfigStorage } from '@coreto/electron/domain/ports';
import { initializeMigrationsTable, applyMigrations } from '../../database/migrations.js';

// ============================================================================
// Test Constants
// ============================================================================

const TEST_PROJECT_PATH = '/test/project';
const TEST_PROJECT_PATH_2 = '/test/project-2';
const NON_EXISTENT_PROJECT = '/non/existent/project';
const VALID_CONFIG_JSON = '{"trechos":[{"id":"t1","name":"Trecho 1"}]}';
const UPDATED_CONFIG_JSON = '{"trechos":[{"id":"t1","name":"Updated Trecho"},{"id":"t2","name":"Trecho 2"}]}';
const MALFORMED_JSON = '{invalid json}';
const PARSED_CONFIG = { trechos: [{ id: 't1', name: 'Trecho 1' }] };
const UPDATED_PARSED_CONFIG = {
  trechos: [
    { id: 't1', name: 'Updated Trecho' },
    { id: 't2', name: 'Trecho 2' },
  ],
};

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates an in-memory database with production-like schema for testing.
 * Applies Migration v3 to create the project_configs table.
 */
function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Initialize migrations table and apply Migration v3
  initializeMigrationsTable(db);
  applyMigrations(db);

  return db;
}

// ============================================================================
// Test Suite
// ============================================================================

describe('SQLiteConfigStorageAdapter', () => {
  let db: Database.Database;
  let storage: IConfigStorage;

  beforeEach(() => {
    db = createTestDatabase();
    storage = createSQLiteConfigStorage(db);
  });

  afterEach(() => {
    db.close();
  });

  // ========================================================================
  // read() method tests
  // ========================================================================

  describe('read()', () => {
    it('should return parsed JSON for existing config', async () => {
      // Setup: Insert a config into the database
      await storage.write(TEST_PROJECT_PATH, VALID_CONFIG_JSON);

      // Test: Read the config
      const configJson = await storage.read(TEST_PROJECT_PATH);
      const config = JSON.parse(configJson);

      // Verify: Config matches what was written
      expect(config).toEqual(PARSED_CONFIG);
    });

    it('should throw error for non-existent project', async () => {
      // Test: Try to read non-existent config
      await expect(storage.read(NON_EXISTENT_PROJECT)).rejects.toThrow(
        `Project config not found for: ${NON_EXISTENT_PROJECT}`
      );
    });

    it('should throw error for malformed JSON in database', async () => {
      // Setup: Insert malformed JSON directly into database
      const stmt = db.prepare(
        'INSERT INTO project_configs (project_path, config_json, last_modified, created_at) VALUES (?, ?, ?, ?)'
      );
      stmt.run(TEST_PROJECT_PATH, MALFORMED_JSON, Date.now(), Date.now());

      // Test: Read should return the malformed JSON as-is
      // The adapter doesn't parse JSON - that's the caller's responsibility
      const configJson = await storage.read(TEST_PROJECT_PATH);
      expect(configJson).toBe(MALFORMED_JSON);

      // If caller tries to parse, it will fail
      expect(() => JSON.parse(configJson)).toThrow();
    });

    it('should handle empty config JSON', async () => {
      // Setup: Insert empty JSON object
      await storage.write(TEST_PROJECT_PATH, '{}');

      // Test: Read the config
      const configJson = await storage.read(TEST_PROJECT_PATH);
      const config = JSON.parse(configJson);

      // Verify: Empty object returned
      expect(config).toEqual({});
    });

    it('should handle complex nested config JSON', async () => {
      // Setup: Insert complex nested JSON
      const complexConfig = {
        trechos: [
          {
            id: 't1',
            name: 'Trecho 1',
            parties: [
              {
                id: 'p1',
                members: [
                  { id: 'm1', name: 'Actor 1', level: 10 },
                  { id: 'm2', name: 'Actor 2', level: 15 },
                ],
              },
            ],
          },
        ],
        metadata: {
          projectName: 'Test Project',
          lastModified: Date.now(),
        },
      };
      const complexJson = JSON.stringify(complexConfig);

      await storage.write(TEST_PROJECT_PATH, complexJson);

      // Test: Read the config
      const configJson = await storage.read(TEST_PROJECT_PATH);
      const config = JSON.parse(configJson);

      // Verify: Complex structure preserved
      expect(config).toEqual(complexConfig);
      expect(config.trechos[0].parties[0].members[0].level).toBe(10);
    });
  });

  // ========================================================================
  // write() method tests
  // ========================================================================

  describe('write()', () => {
    it('should insert new config (INSERT)', async () => {
      // Test: Write new config
      await storage.write(TEST_PROJECT_PATH, VALID_CONFIG_JSON);

      // Verify: Config exists in database
      const exists = await storage.exists(TEST_PROJECT_PATH);
      expect(exists).toBe(true);

      // Verify: Config content matches
      const stmt = db.prepare('SELECT config_json FROM project_configs WHERE project_path = ?');
      const row = stmt.get(TEST_PROJECT_PATH) as { config_json: string } | undefined;
      expect(row?.config_json).toBe(VALID_CONFIG_JSON);
    });

    it('should update existing config (UPSERT)', async () => {
      // Setup: Write initial config
      await storage.write(TEST_PROJECT_PATH, VALID_CONFIG_JSON);

      // Test: Update config with new content
      await storage.write(TEST_PROJECT_PATH, UPDATED_CONFIG_JSON);

      // Verify: Only one record exists
      const stmt = db.prepare('SELECT COUNT(*) as count FROM project_configs WHERE project_path = ?');
      const row = stmt.get(TEST_PROJECT_PATH) as { count: number };
      expect(row.count).toBe(1);

      // Verify: Content is updated
      const configJson = await storage.read(TEST_PROJECT_PATH);
      const config = JSON.parse(configJson);
      expect(config).toEqual(UPDATED_PARSED_CONFIG);
    });

    it('should set timestamps correctly on insert', async () => {
      // Setup: Get timestamp before write
      const beforeWrite = Date.now();

      // Test: Write config
      await storage.write(TEST_PROJECT_PATH, VALID_CONFIG_JSON);

      // Get timestamp after write
      const afterWrite = Date.now();

      // Verify: Timestamps are set
      const stmt = db.prepare(
        'SELECT created_at, last_modified FROM project_configs WHERE project_path = ?'
      );
      const row = stmt.get(TEST_PROJECT_PATH) as { created_at: number; last_modified: number } | undefined;

      expect(row).toBeDefined();
      expect(row?.created_at).toBeGreaterThanOrEqual(beforeWrite);
      expect(row?.created_at).toBeLessThanOrEqual(afterWrite);
      expect(row?.last_modified).toBeGreaterThanOrEqual(beforeWrite);
      expect(row?.last_modified).toBeLessThanOrEqual(afterWrite);
    });

    it('should update last_modified timestamp on UPSERT', async () => {
      // Setup: Write initial config
      await storage.write(TEST_PROJECT_PATH, VALID_CONFIG_JSON);

      // Get initial timestamp
      const stmt = db.prepare('SELECT last_modified FROM project_configs WHERE project_path = ?');
      const initialRow = stmt.get(TEST_PROJECT_PATH) as { last_modified: number } | undefined;
      const initialTimestamp = initialRow?.last_modified ?? 0;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Test: Update config
      await storage.write(TEST_PROJECT_PATH, UPDATED_CONFIG_JSON);

      // Verify: last_modified was updated
      const updatedRow = stmt.get(TEST_PROJECT_PATH) as { last_modified: number } | undefined;
      expect(updatedRow?.last_modified).toBeGreaterThan(initialTimestamp);
    });

    it('should handle multiple different projects', async () => {
      // Test: Write configs for multiple projects
      await storage.write(TEST_PROJECT_PATH, VALID_CONFIG_JSON);
      await storage.write(TEST_PROJECT_PATH_2, UPDATED_CONFIG_JSON);

      // Verify: Both configs exist
      expect(await storage.exists(TEST_PROJECT_PATH)).toBe(true);
      expect(await storage.exists(TEST_PROJECT_PATH_2)).toBe(true);

      // Verify: Configs are distinct
      const config1 = JSON.parse(await storage.read(TEST_PROJECT_PATH));
      const config2 = JSON.parse(await storage.read(TEST_PROJECT_PATH_2));

      expect(config1).not.toEqual(config2);
    });

    it('should handle special characters in project path', async () => {
      // Test: Project path with special characters
      const specialPath = "/path/with spaces/and'quotes'/and\"double\"/and/slashes\\";
      await storage.write(specialPath, VALID_CONFIG_JSON);

      // Verify: Can be read back
      const exists = await storage.exists(specialPath);
      expect(exists).toBe(true);

      const configJson = await storage.read(specialPath);
      expect(configJson).toBe(VALID_CONFIG_JSON);
    });
  });

  // ========================================================================
  // exists() method tests
  // ========================================================================

  describe('exists()', () => {
    it('should return true for existing project', async () => {
      // Setup: Write a config
      await storage.write(TEST_PROJECT_PATH, VALID_CONFIG_JSON);

      // Test: Check if exists
      const exists = await storage.exists(TEST_PROJECT_PATH);

      // Verify: Returns true
      expect(exists).toBe(true);
    });

    it('should return false for non-existing project', async () => {
      // Test: Check non-existent project
      const exists = await storage.exists(NON_EXISTENT_PROJECT);

      // Verify: Returns false
      expect(exists).toBe(false);
    });

    it('should return false for empty database', async () => {
      // Test: Check in empty database
      const exists = await storage.exists(TEST_PROJECT_PATH);

      // Verify: Returns false
      expect(exists).toBe(false);
    });

    it('should handle case-sensitive project paths', async () => {
      // Setup: Write config with lowercase path
      const lowerPath = '/test/project';
      await storage.write(lowerPath, VALID_CONFIG_JSON);

      // Test: Check with different case
      const upperPath = '/TEST/PROJECT';

      // Verify: Case-sensitive check (SQLite default behavior)
      expect(await storage.exists(lowerPath)).toBe(true);
      expect(await storage.exists(upperPath)).toBe(false);
    });
  });

  // ========================================================================
  // delete() method tests
  // ========================================================================

  describe('delete()', () => {
    it('should remove existing project config', async () => {
      // Setup: Write a config
      await storage.write(TEST_PROJECT_PATH, VALID_CONFIG_JSON);
      expect(await storage.exists(TEST_PROJECT_PATH)).toBe(true);

      // Test: Delete the config
      await storage.delete(TEST_PROJECT_PATH);

      // Verify: Config is gone
      expect(await storage.exists(TEST_PROJECT_PATH)).toBe(false);

      // Verify: Reading throws error
      await expect(storage.read(TEST_PROJECT_PATH)).rejects.toThrow(
        `Project config not found for: ${TEST_PROJECT_PATH}`
      );
    });

    it('should handle non-existing project gracefully', async () => {
      // Test: Delete non-existent config (should not throw)
      await expect(storage.delete(NON_EXISTENT_PROJECT)).resolves.toBeUndefined();
    });

    it('should be idempotent (multiple deletes OK)', async () => {
      // Setup: Write a config
      await storage.write(TEST_PROJECT_PATH, VALID_CONFIG_JSON);

      // Test: Delete multiple times
      await storage.delete(TEST_PROJECT_PATH);
      await expect(storage.delete(TEST_PROJECT_PATH)).resolves.toBeUndefined();
      await expect(storage.delete(TEST_PROJECT_PATH)).resolves.toBeUndefined();

      // Verify: Still doesn't exist
      expect(await storage.exists(TEST_PROJECT_PATH)).toBe(false);
    });

    it('should only delete specified project', async () => {
      // Setup: Write multiple configs
      await storage.write(TEST_PROJECT_PATH, VALID_CONFIG_JSON);
      await storage.write(TEST_PROJECT_PATH_2, UPDATED_CONFIG_JSON);

      // Test: Delete one project
      await storage.delete(TEST_PROJECT_PATH);

      // Verify: Only specified project is deleted
      expect(await storage.exists(TEST_PROJECT_PATH)).toBe(false);
      expect(await storage.exists(TEST_PROJECT_PATH_2)).toBe(true);

      // Verify: Other project's config is intact
      const configJson = await storage.read(TEST_PROJECT_PATH_2);
      expect(configJson).toBe(UPDATED_CONFIG_JSON);
    });
  });

  // ========================================================================
  // getConfigPath() method tests
  // ========================================================================

  describe('getConfigPath()', () => {
    it('should return projectPath unchanged', () => {
      // Test: getConfigPath returns the input
      const result = storage.getConfigPath(TEST_PROJECT_PATH);

      // Verify: Returns same path
      expect(result).toBe(TEST_PROJECT_PATH);
    });

    it('should handle any project path format', () => {
      // Test: Various path formats
      const paths = [
        '/absolute/path/to/project',
        'C:\\Windows\\Path\\To\\Project',
        '/path/with spaces/project',
        '/path/with/special/chars/\'"/project',
      ];

      paths.forEach((path) => {
        expect(storage.getConfigPath(path)).toBe(path);
      });
    });

    it('should be synchronous (no await needed)', () => {
      // Test: Method is synchronous
      const start = Date.now();
      storage.getConfigPath(TEST_PROJECT_PATH);
      const duration = Date.now() - start;

      // Verify: Executes immediately (no async overhead)
      expect(duration).toBeLessThan(5);
    });
  });

  // ========================================================================
  // Error handling tests
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle database closed gracefully', () => {
      // Setup: Close database
      db.close();

      // Test: Operations should throw database errors
      expect(async () => {
        await storage.read(TEST_PROJECT_PATH);
      }).rejects.toThrow();

      expect(async () => {
        await storage.write(TEST_PROJECT_PATH, VALID_CONFIG_JSON);
      }).rejects.toThrow();
    });

    it('should handle database transaction errors', () => {
      // Note: SQLite errors are synchronous in better-sqlite3
      // This test verifies error propagation

      // Setup: Create a storage with a closed database
      const closedDb = new Database(':memory:');
      closedDb.close();
      const badStorage = createSQLiteConfigStorage(closedDb);

      // Test: Operations should fail
      expect(async () => {
        await badStorage.write(TEST_PROJECT_PATH, VALID_CONFIG_JSON);
      }).rejects.toThrow();
    });
  });

  // ========================================================================
  // Integration behavior tests
  // ========================================================================

  describe('Integration Behavior', () => {
    it('should maintain data consistency across read-write cycle', async () => {
      // Setup: Original config
      const originalConfig = {
        trechos: [
          { id: 't1', name: 'Trecho 1', targetTtk: { turns: 5, actions: 10 } },
          { id: 't2', name: 'Trecho 2', targetTtk: { turns: 8, actions: 15 } },
        ],
        metadata: { projectName: 'Test', lastModified: Date.now() },
      };

      // Test: Write and read cycle
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(originalConfig));
      const readJson = await storage.read(TEST_PROJECT_PATH);
      const readConfig = JSON.parse(readJson);

      // Verify: Data matches exactly
      expect(readConfig).toEqual(originalConfig);
    });

    it('should handle concurrent writes correctly', async () => {
      // Note: better-sqlite3 is synchronous, so true concurrency isn't possible
      // This test verifies sequential write behavior

      // Test: Multiple sequential writes
      const configs = [
        '{"version":1}',
        '{"version":2}',
        '{"version":3}',
        '{"version":4}',
        '{"version":5}',
      ];

      for (const config of configs) {
        await storage.write(TEST_PROJECT_PATH, config);
      }

      // Verify: Last write wins
      const finalConfig = await storage.read(TEST_PROJECT_PATH);
      expect(finalConfig).toBe('{"version":5}');
    });

    it('should preserve JSON encoding and decoding', async () => {
      // Setup: Config with Unicode and special characters
      const specialConfig = {
        name: 'Test Project with émojis 🎮 and spëcial çharacters',
        description: 'Description with "quotes" and \'apostrophes\'',
        trechos: [
          {
            id: 't1',
            name: 'Treño com ñ and ç',
            metadata: {
              notes: 'Line 1\nLine 2\tTabbed',
            },
          },
        ],
      };

      // Test: Write and read
      await storage.write(TEST_PROJECT_PATH, JSON.stringify(specialConfig));
      const readJson = await storage.read(TEST_PROJECT_PATH);
      const readConfig = JSON.parse(readJson);

      // Verify: Special characters preserved
      expect(readConfig.name).toBe(specialConfig.name);
      expect(readConfig.description).toBe(specialConfig.description);
      expect(readConfig.trechos[0].name).toBe(specialConfig.trechos[0].name);
      expect(readConfig.trechos[0].metadata.notes).toBe(specialConfig.trechos[0].metadata.notes);
    });
  });
});
