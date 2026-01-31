/**
 * Database Migration Tests
 *
 * Tests schema versioning and migration system.
 *
 * @see packages/electron/src/main/database/migrations.ts
 */

import Database from 'better-sqlite3';
import {
  initializeMigrationsTable,
  applyMigrations,
  getCurrentSchemaVersion,
  MIGRATIONS,
} from '../../../../src/main/database/migrations.js';
import { CURRENT_SCHEMA_VERSION } from '../../../../src/main/database/schema.js';

describe('Database Migrations', () => {
  describe('initializeMigrationsTable', () => {
    it('should create schema_migrations table', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'")
        .get() as { name: string } | undefined;

      expect(tables).toBeDefined();
      expect(tables?.name).toBe('schema_migrations');
    });

    it('should be idempotent', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);
      initializeMigrationsTable(db);

      const count = db.prepare('SELECT COUNT(*) as count FROM schema_migrations').get() as { count: number };

      expect(count.count).toBe(0);
    });
  });

  describe('getCurrentSchemaVersion', () => {
    it('should return 0 when no migrations applied', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      const version = getCurrentSchemaVersion(db);

      expect(version).toBe(0);
    });

    it('should return highest version applied', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      const now = Date.now();
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(1, now);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(2, now + 1);

      const version = getCurrentSchemaVersion(db);

      expect(version).toBe(2);
    });
  });

  describe('applyMigrations', () => {
    it('should run all pending migrations', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      const appliedCount = applyMigrations(db);

      expect(appliedCount).toBeGreaterThan(0);

      const version = getCurrentSchemaVersion(db);
      expect(version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should create all tables defined in migrations', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);
      applyMigrations(db);

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as Array<{ name: string }>;

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain('recent_projects');
      expect(tableNames).toContain('simulation_history');
      expect(tableNames).toContain('user_preferences');
      expect(tableNames).toContain('schema_migrations');
    });

    it('should create default user preferences', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);
      applyMigrations(db);

      const prefs = db.prepare('SELECT * FROM user_preferences LIMIT 1').get() as {
        theme: string;
        window_bounds_x: number | null;
        last_project_path: string | null;
      } | undefined;

      expect(prefs).toBeDefined();
      expect(prefs?.theme).toBe('system');
      expect(prefs?.window_bounds_x).toBeNull();
      expect(prefs?.last_project_path).toBeNull();
    });

    it('should skip migrations already applied', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      // Apply migrations once
      const appliedCount1 = applyMigrations(db);

      // Try to apply again
      const appliedCount2 = applyMigrations(db);

      expect(appliedCount1).toBeGreaterThan(0);
      expect(appliedCount2).toBe(0);
    });

    it('should record migration version and timestamp', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      const before = Date.now();
      applyMigrations(db);
      const after = Date.now();

      const migrations = db
        .prepare('SELECT version, applied_at FROM schema_migrations ORDER BY version')
        .all() as Array<{ version: number; applied_at: number }>;

      expect(migrations).toHaveLength(MIGRATIONS.length);

      migrations.forEach((migration) => {
        expect(migration.version).toBeGreaterThanOrEqual(1);
        expect(migration.version).toBeLessThanOrEqual(CURRENT_SCHEMA_VERSION);
        expect(migration.applied_at).toBeGreaterThanOrEqual(before);
        expect(migration.applied_at).toBeLessThanOrEqual(after);
      });
    });

    it('should run migrations in sequence', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      applyMigrations(db);

      const migrations = db
        .prepare('SELECT version FROM schema_migrations ORDER BY version')
        .all() as Array<{ version: number }>;

      for (let i = 0; i < migrations.length; i++) {
        expect(migrations[i]!.version).toBe(i + 1);
      }
    });

    it('should throw error when database version is newer than application', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      // Simulate future schema version
      const futureVersion = CURRENT_SCHEMA_VERSION + 1;
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
        futureVersion,
        Date.now()
      );

      expect(() => applyMigrations(db)).toThrow(
        `Database version ${futureVersion} is newer than application version ${CURRENT_SCHEMA_VERSION}`
      );
    });

    it('should rollback failed migrations', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      // Create a broken migration by temporarily modifying MIGRATIONS
      // Use a version between current and max to ensure it gets applied
      const originalMigrations = [...MIGRATIONS];

      try {
        // Replace the first migration with a broken one
        (MIGRATIONS as any)[0] = {
          version: 1,
          description: 'Broken migration',
          sql: 'INVALID SQL STATEMENT',
        };

        expect(() => applyMigrations(db)).toThrow();

        // Verify migration was not recorded
        const brokenMigration = db
          .prepare('SELECT * FROM schema_migrations WHERE version = 1')
          .get() as { version: number } | undefined;

        expect(brokenMigration).toBeUndefined();
      } finally {
        // Restore original migrations
        originalMigrations.forEach((m, i) => {
          (MIGRATIONS as any)[i] = m;
        });
      }
    });

    it('should apply only migrations up to current version', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      // Manually apply first migration
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
        1,
        Date.now()
      );

      // Also create the tables that migration 1 would have created
      db.exec(MIGRATIONS[0]!.sql);

      // Apply remaining migrations
      const appliedCount = applyMigrations(db);

      // Should have applied remaining migrations only
      expect(appliedCount).toBe(MIGRATIONS.length - 1);

      const version = getCurrentSchemaVersion(db);
      expect(version).toBe(CURRENT_SCHEMA_VERSION);
    });
  });

  describe('Migrations structure', () => {
    it('should have migrations array with all required fields', () => {
      expect(MIGRATIONS).toBeDefined();
      expect(MIGRATIONS.length).toBeGreaterThan(0);

      MIGRATIONS.forEach((migration) => {
        expect(migration).toHaveProperty('version');
        expect(migration).toHaveProperty('description');
        expect(migration).toHaveProperty('sql');

        expect(typeof migration.version).toBe('number');
        expect(typeof migration.description).toBe('string');
        expect(typeof migration.sql).toBe('string');

        expect(migration.version).toBeGreaterThan(0);
        expect(migration.description.length).toBeGreaterThan(0);
        expect(migration.sql.length).toBeGreaterThan(0);
      });
    });

    it('should have sequential version numbers starting from 1', () => {
      for (let i = 0; i < MIGRATIONS.length; i++) {
        expect(MIGRATIONS[i]!.version).toBe(i + 1);
      }
    });
  });

  describe('CURRENT_SCHEMA_VERSION', () => {
    it('should match highest migration version', () => {
      const highestMigrationVersion = MIGRATIONS[MIGRATIONS.length - 1]!.version;

      expect(CURRENT_SCHEMA_VERSION).toBe(highestMigrationVersion);
    });
  });
});
