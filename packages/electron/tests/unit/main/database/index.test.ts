/**
 * Database Initialization Tests
 *
 * Tests database initialization, schema creation, and connection management.
 * Uses in-memory SQLite for isolation.
 *
 * @see packages/electron/src/main/database/index.ts
 */

import { resetDatabaseSingleton, initDatabase, closeDatabase, isDatabaseInitialized, getSchemaVersion, getDatabaseStats } from '../../../../src/main/database/index.js';
import { CURRENT_SCHEMA_VERSION } from '../../../../src/main/database/schema.js';

describe('Database Initialization', () => {
  beforeEach(() => {
    // Reset singleton state before each test
    resetDatabaseSingleton();
  });

  afterEach(() => {
    // Close database connection after each test
    if (isDatabaseInitialized()) {
      closeDatabase();
    }
  });

  describe('initDatabase', () => {
    it('should create schema with empty database', () => {
      const db = initDatabase(true);

      expect(db).toBeDefined();
      expect(db.name).toBe(':memory:');

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as Array<{ name: string }>;

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain('recent_projects');
      expect(tableNames).toContain('simulation_history');
      expect(tableNames).toContain('user_preferences');
      expect(tableNames).toContain('schema_migrations');
    });

    it('should populate schema version table', () => {
      initDatabase(true);
      const db = initDatabase(true); // Should return same instance

      const version = getSchemaVersion();

      expect(version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should create tables with correct columns and constraints', () => {
      const db = initDatabase(true);

      // Check recent_projects table structure
      const recentProjectsInfo = db
        .prepare('PRAGMA table_info(recent_projects)')
        .all() as Array<{
          name: string;
          type: string;
          notnull: number;
          pk: number;
        }>;

      const recentProjectsColumns = recentProjectsInfo.map((c) => c.name);
      expect(recentProjectsColumns).toContain('id');
      expect(recentProjectsColumns).toContain('path');
      expect(recentProjectsColumns).toContain('name');
      expect(recentProjectsColumns).toContain('last_opened_at');
      expect(recentProjectsColumns).toContain('created_at');

      // Check simulation_history table structure
      const simulationHistoryInfo = db
        .prepare('PRAGMA table_info(simulation_history)')
        .all() as Array<{ name: string }>;

      const simulationHistoryColumns = simulationHistoryInfo.map((c) => c.name);
      expect(simulationHistoryColumns).toContain('id');
      expect(simulationHistoryColumns).toContain('project_path');
      expect(simulationHistoryColumns).toContain('trecho_id');
      expect(simulationHistoryColumns).toContain('troop_id');
      expect(simulationHistoryColumns).toContain('ttk_turns');
      expect(simulationHistoryColumns).toContain('passed');
    });

    it('should return same instance on subsequent calls', () => {
      const db1 = initDatabase(true);
      const db2 = initDatabase(true);

      expect(db1).toBe(db2);
    });

    it('should enable foreign keys', () => {
      const db = initDatabase(true);

      const result = db.pragma('foreign_keys', { simple: true });

      expect(result).toBe(1);
    });

    it('should enable WAL mode', () => {
      const db = initDatabase(true);

      const result = db.pragma('journal_mode', { simple: true });

      expect(result).toBe('wal');
    });
  });

  describe('closeDatabase', () => {
    it('should close database connection', () => {
      initDatabase(true);

      expect(isDatabaseInitialized()).toBe(true);

      closeDatabase();

      expect(isDatabaseInitialized()).toBe(false);
    });

    it('should be safe to call when database not initialized', () => {
      expect(() => closeDatabase()).not.toThrow();
    });

    it('should allow re-initialization after closing', () => {
      const db1 = initDatabase(true);
      closeDatabase();

      const db2 = initDatabase(true);

      expect(db2).toBeDefined();
      expect(db2).not.toBe(db1);
    });
  });

  describe('isDatabaseInitialized', () => {
    it('should return false before initialization', () => {
      expect(isDatabaseInitialized()).toBe(false);
    });

    it('should return true after initialization', () => {
      initDatabase(true);

      expect(isDatabaseInitialized()).toBe(true);
    });

    it('should return false after closing', () => {
      initDatabase(true);
      closeDatabase();

      expect(isDatabaseInitialized()).toBe(false);
    });
  });

  describe('getSchemaVersion', () => {
    it('should return current schema version after initialization', () => {
      initDatabase(true);

      const version = getSchemaVersion();

      expect(version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should throw error when database not initialized', () => {
      expect(() => getSchemaVersion()).toThrow('Database not initialized');
    });
  });

  describe('getDatabaseStats', () => {
    it('should return database statistics', () => {
      initDatabase(true);

      const stats = getDatabaseStats();

      expect(stats).toEqual({
        recentProjectsCount: 0,
        simulationHistoryCount: 0,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        filePath: ':memory:',
      });
    });

    it('should reflect record counts after inserting data', () => {
      const db = initDatabase(true);

      // Insert a recent project
      db.prepare('INSERT INTO recent_projects (path, name, last_opened_at, created_at) VALUES (?, ?, ?, ?)').run(
        '/path/to/project',
        'Test Project',
        Date.now(),
        Date.now()
      );

      const stats = getDatabaseStats();

      expect(stats.recentProjectsCount).toBe(1);
    });
  });
});
