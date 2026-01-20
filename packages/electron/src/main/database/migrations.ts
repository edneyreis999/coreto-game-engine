/**
 * Database Migration System
 *
 * Manages schema versioning and migrations for the SQLite database.
 * Each migration defines SQL to upgrade from one version to the next.
 *
 * Migrations run automatically when database initializes.
 * Failed migrations are rolled back.
 *
 * @see packages/electron/src/main/database/schema.ts
 * @see packages/electron/src/main/database/index.ts
 */

import type Database from 'better-sqlite3';
import { CURRENT_SCHEMA_VERSION } from './schema.js';

/**
 * Migration definition.
 * Defines the SQL to execute for a specific schema version.
 */
export interface Migration {
  /** Schema version this migration creates */
  version: number;
  /** SQL statements to execute for this migration */
  sql: string;
  /** Description of what this migration does */
  description: string;
}

/**
 * All migrations in order.
 * Add new migrations to the end of this array.
 */
export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    description: 'Initial schema with recent_projects, simulation_history, user_preferences',
    sql: `
      -- Create recent_projects table
      CREATE TABLE IF NOT EXISTS recent_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        last_opened_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      -- Create simulation_history table
      CREATE TABLE IF NOT EXISTS simulation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_path TEXT NOT NULL,
        config_name TEXT,
        trecho_id TEXT NOT NULL,
        troop_id INTEGER NOT NULL,
        troop_name TEXT NOT NULL,
        ttk_turns INTEGER NOT NULL,
        ttk_actions INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL,
        seed INTEGER NOT NULL,
        exp_gained INTEGER NOT NULL,
        outcome TEXT NOT NULL,
        passed INTEGER NOT NULL,
        warnings TEXT,
        executed_at INTEGER NOT NULL
      );

      -- Create user_preferences table
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        theme TEXT NOT NULL DEFAULT 'system',
        window_bounds_x INTEGER,
        window_bounds_y INTEGER,
        window_bounds_width INTEGER,
        window_bounds_height INTEGER,
        last_project_path TEXT,
        updated_at INTEGER NOT NULL
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_recent_projects_last_opened
        ON recent_projects(last_opened_at DESC);

      CREATE INDEX IF NOT EXISTS idx_simulation_history_project_path
        ON simulation_history(project_path);
      CREATE INDEX IF NOT EXISTS idx_simulation_history_executed_at
        ON simulation_history(executed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_simulation_history_trecho_id
        ON simulation_history(trecho_id);

      -- Insert default user preferences
      INSERT INTO user_preferences (theme, updated_at)
      VALUES ('system', strftime('%s', 'now') * 1000);

      -- Record schema version
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL
      );
    `,
  },
  // Add future migrations here
  // {
  //   version: 2,
  //   description: 'Add new feature',
  //   sql: `ALTER TABLE ...`,
  // },
];

/**
 * Gets the current schema version from the database.
 *
 * @param db - Database connection
 * @returns Current schema version, or 0 if no migrations applied
 */
export function getCurrentSchemaVersion(db: Database.Database): number {
  const row = db
    .prepare('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1')
    .get() as { version: number } | undefined;

  return row?.version ?? 0;
}

/**
 * Applies pending migrations to the database.
 * Runs each migration in a transaction with rollback on failure.
 *
 * @param db - Database connection
 * @returns Number of migrations applied
 * @throws {Error} If migration fails
 */
export function applyMigrations(db: Database.Database): number {
  const currentVersion = getCurrentSchemaVersion(db);

  if (currentVersion === CURRENT_SCHEMA_VERSION) {
    // Already at latest version
    return 0;
  }

  if (currentVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Database version ${currentVersion} is newer than application version ${CURRENT_SCHEMA_VERSION}`
    );
  }

  let appliedCount = 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue; // Already applied
    }

    if (migration.version > CURRENT_SCHEMA_VERSION) {
      break; // Future migration, don't apply
    }

    // Run migration in transaction
    const transaction = db.transaction(() => {
      // Execute migration SQL
      db.exec(migration.sql);

      // Record migration
      const timestamp = Date.now();
      db.prepare(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)'
      ).run(migration.version, timestamp);
    });

    try {
      transaction();
      appliedCount++;
    } catch (error) {
      throw new Error(
        `Migration v${migration.version} failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return appliedCount;
}

/**
 * Initializes the schema_migrations table if it doesn't exist.
 * Called during database initialization before migrations run.
 *
 * @param db - Database connection
 */
export function initializeMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL
    );
  `);
}
