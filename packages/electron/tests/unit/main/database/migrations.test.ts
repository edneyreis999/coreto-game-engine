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

      expect(tables).toBeDefined(); // schema_migrations table should be created for version tracking
      expect(tables?.name).toBe('schema_migrations'); // Table name should be schema_migrations for migration history
    });

    it('should be idempotent', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);
      initializeMigrationsTable(db);

      const count = db.prepare('SELECT COUNT(*) as count FROM schema_migrations').get() as { count: number };

      expect(count.count).toBe(0); // schema_migrations table should be empty after initialization (no migrations applied yet)
    });
  });

  describe('getCurrentSchemaVersion', () => {
    it('should return 0 when no migrations applied', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      const version = getCurrentSchemaVersion(db);

      expect(version).toBe(0); // Schema version should be 0 when no migrations have been applied
    });

    it('should return highest version applied', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      const now = Date.now();
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(1, now);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(2, now + 1);

      const version = getCurrentSchemaVersion(db);

      expect(version).toBe(2); // Current schema version should be the highest migration version applied (2 in this case)
    });
  });

  describe('applyMigrations', () => {
    it('should run all pending migrations', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      const appliedCount = applyMigrations(db);

      expect(appliedCount).toBeGreaterThan(0); // At least one migration should be applied on fresh database

      const version = getCurrentSchemaVersion(db);
      expect(version).toBe(CURRENT_SCHEMA_VERSION); // After applying all migrations, version should match CURRENT_SCHEMA_VERSION
    });

    it('should create all tables defined in migrations', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);
      applyMigrations(db);

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as Array<{ name: string }>;

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain('recent_projects'); // recent_projects table should be created for project history
      expect(tableNames).toContain('simulation_history'); // simulation_history table should be created for battle results
      expect(tableNames).toContain('user_preferences'); // user_preferences table should be created for settings persistence
      expect(tableNames).toContain('schema_migrations'); // schema_migrations table should be created for version tracking
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

      expect(prefs).toBeDefined(); // Default user preferences row should be created
      expect(prefs?.theme).toBe('system'); // Default theme should be "system" (follow OS preference)
      expect(prefs?.window_bounds_x).toBeNull(); // Window bounds should be null initially (no saved position)
      expect(prefs?.last_project_path).toBeNull(); // Last project path should be null initially (no recent project)
    });

    it('should skip migrations already applied', () => {
      const db = new Database(':memory:');

      initializeMigrationsTable(db);

      // Apply migrations once
      const appliedCount1 = applyMigrations(db);

      // Try to apply again
      const appliedCount2 = applyMigrations(db);

      expect(appliedCount1).toBeGreaterThan(0); // First run should apply all pending migrations
      expect(appliedCount2).toBe(0); // Second run should apply 0 migrations (already applied - idempotent)
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

      expect(migrations).toHaveLength(MIGRATIONS.length); // Each migration should be recorded in schema_migrations table

      migrations.forEach((migration) => {
        expect(migration.version).toBeGreaterThanOrEqual(1); // Migration version ${migration.version} should be >= 1
        expect(migration.version).toBeLessThanOrEqual(CURRENT_SCHEMA_VERSION); // Migration version ${migration.version} should not exceed current schema version
        expect(migration.applied_at).toBeGreaterThanOrEqual(before); // Migration ${migration.version} applied_at should be after test start
        expect(migration.applied_at).toBeLessThanOrEqual(after); // Migration ${migration.version} applied_at should be before test end
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
        expect(migrations[i]!.version).toBe(i + 1); // Migration at position ${i} should have version ${i + 1} (sequential from 1)
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
      ); // Should throw when database is newer than app (prevents data corruption)
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

        expect(brokenMigration).toBeUndefined(); // Failed migration should not be recorded in schema_migrations (transaction rolled back)
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
      expect(appliedCount).toBe(MIGRATIONS.length - 1); // Should skip migration 1 (already applied) and apply remaining migrations

      const version = getCurrentSchemaVersion(db);
      expect(version).toBe(CURRENT_SCHEMA_VERSION); // Final version should match current schema version after partial migration
    });
  });

  describe('Migrations structure', () => {
    it('should have migrations array with all required fields', () => {
      expect(MIGRATIONS).toBeDefined(); // MIGRATIONS array should be exported for version management
      expect(MIGRATIONS.length).toBeGreaterThan(0); // At least one migration should be defined

      MIGRATIONS.forEach((migration, index) => {
        expect(migration).toHaveProperty('version'); // Migration ${index} should have version property
        expect(migration).toHaveProperty('description'); // Migration ${index} should have description for documentation
        expect(migration).toHaveProperty('sql'); // Migration ${index} should have SQL to execute

        expect(typeof migration.version).toBe('number'); // Migration ${index} version should be a number
        expect(typeof migration.description).toBe('string'); // Migration ${index} description should be a string
        expect(typeof migration.sql).toBe('string'); // Migration ${index} SQL should be a string

        expect(migration.version).toBeGreaterThan(0); // Migration ${index} version should be positive
        expect(migration.description.length).toBeGreaterThan(0); // Migration ${index} description should not be empty
        expect(migration.sql.length).toBeGreaterThan(0); // Migration ${index} SQL should not be empty
      });
    });

    it('should have sequential version numbers starting from 1', () => {
      for (let i = 0; i < MIGRATIONS.length; i++) {
        expect(MIGRATIONS[i]!.version).toBe(i + 1); // Migration ${i} should have sequential version ${i + 1} (no gaps)
      }
    });
  });

  describe('CURRENT_SCHEMA_VERSION', () => {
    it('should match highest migration version', () => {
      const highestMigrationVersion = MIGRATIONS[MIGRATIONS.length - 1]!.version;

      expect(CURRENT_SCHEMA_VERSION).toBe(highestMigrationVersion); // CURRENT_SCHEMA_VERSION should match the highest migration version (version consistency)
    });
  });
});
