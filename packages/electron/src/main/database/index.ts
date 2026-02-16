/**
 * SQLite Database Initialization and Connection Management
 *
 * Provides the main process with synchronous database access using better-sqlite3.
 * Database file is stored in Electron's userData directory.
 *
 * This module exports:
 * - Database connection singleton
 * - Initialization function
 * - All query functions from submodules
 *
 * @see packages/electron/src/main/database/schema.ts
 * @see packages/electron/src/main/database/migrations.ts
 */

// LOG 13: database/index.ts loaded - CRITICAL POINT
console.log('[NSD-WORKER-LOG-013] database/index.ts - ABOUT TO IMPORT BETTER-SQLITE3!');

import Database from 'better-sqlite3';

// LOG 14: better-sqlite3 import attempted
console.log('[NSD-WORKER-LOG-014] better-sqlite3 import completed (or failed if native module not supported in UtilityProcess)!');
import { z } from 'zod';

import {
  initializeMigrationsTable,
  applyMigrations,
  getCurrentSchemaVersion,
} from './migrations.js';
import { CURRENT_SCHEMA_VERSION } from './schema.js';

// Re-export query functions for convenient importing
export * from './queries/recent-projects.js';
export * from './queries/simulation-history.js';
export * from './queries/user-preferences.js';

// Re-export types
export * from './schema.js';

/**
 * Database connection singleton.
 * Initialized on first call to initDatabase().
 */
let dbInstance: Database.Database | null = null;

/**
 * Database file path for persistent storage.
 * Set by initDatabase() when not using in-memory mode.
 */
let databaseFilePath: string | null = null;

/**
 * Gets the database file path.
 * Returns the previously set path, or ':memory:' for testing.
 *
 * @returns Database file path or ':memory:'
 */
export function getDatabasePath(): string {
  return databaseFilePath ?? ':memory:';
}

/**
 * Sets the database file path for persistent storage.
 * Must be called before initDatabase() when not using in-memory mode.
 *
 * @param filePath - Absolute path to database file
 */
export function setDatabasePath(filePath: string): void {
  databaseFilePath = filePath;
}

/**
 * Resets the database singleton.
 * Closes existing connection and clears state.
 * For testing purposes only.
 */
export function resetDatabaseSingleton(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  databaseFilePath = null;
}

/**
 * Initializes the SQLite database.
 * Creates schema, runs migrations, and enables foreign keys.
 *
 * This function should be called once during app startup.
 * Subsequent calls return the existing connection.
 *
 * @param inMemory - If true, use in-memory database (for testing)
 * @returns Database connection
 * @throws {Error} If database initialization fails
 */
export function initDatabase(inMemory: boolean = false): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = inMemory ? ':memory:' : getDatabasePath();

  // Open database connection
  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Set WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Initialize migrations table
  initializeMigrationsTable(db);

  // Check current version
  const currentVersion = getCurrentSchemaVersion(db);

  // Run migrations if needed
  if (currentVersion < CURRENT_SCHEMA_VERSION) {
    const appliedCount = applyMigrations(db);

    if (appliedCount > 0) {
      // Log migration success if logger available
      // For now, just continue silently
    }
  }

  dbInstance = db;
  return db;
}

/**
 * Gets the database connection.
 * Initializes database if not already initialized.
 *
 * @returns Database connection
 * @throws {Error} If database not initialized
 */
export function getDatabase(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }

  return dbInstance;
}

/**
 * Closes the database connection.
 * Called during app shutdown to ensure data is persisted.
 *
 * Should be called in app.before-quit handler.
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Checks if database is initialized.
 *
 * @returns True if database connection is open
 */
export function isDatabaseInitialized(): boolean {
  return dbInstance !== null;
}

/**
 * Gets the current schema version from the database.
 *
 * @returns Current schema version, or 0 if no migrations applied
 */
export function getSchemaVersion(): number {
  const db = getDatabase();
  return getCurrentSchemaVersion(db);
}

/**
 * Creates a database backup.
 * Uses SQLite's backup API to create a consistent backup.
 *
 * @param backupPath - Path where backup should be saved
 * @throws {Error} If backup fails
 */
export async function backupDatabase(backupPath: string): Promise<void> {
  const db = getDatabase();
  try {
    await db.backup(backupPath);
  } catch (error) {
    throw new Error(
      `Database backup failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Gets database statistics.
 * Returns record counts and file size information.
 *
 * @returns Database statistics
 */
export function getDatabaseStats(): {
  recentProjectsCount: number;
  simulationHistoryCount: number;
  schemaVersion: number;
  filePath: string;
} {
  const db = getDatabase();

  const CountResultSchema = z.object({ count: z.number() });

  const recentProjectsCount = CountResultSchema.parse(
    db.prepare('SELECT COUNT(*) as count FROM recent_projects').get()
  );
  const simulationHistoryCount = CountResultSchema.parse(
    db.prepare('SELECT COUNT(*) as count FROM simulation_history').get()
  );

  return {
    recentProjectsCount: recentProjectsCount.count,
    simulationHistoryCount: simulationHistoryCount.count,
    schemaVersion: getCurrentSchemaVersion(db),
    filePath: db.name,
  };
}
