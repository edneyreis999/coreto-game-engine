/**
 * Test Utilities
 *
 * Provides common utilities for E2E and integration tests:
 * - Unique ID generation to prevent conflicts
 * - Database truncation for test isolation
 * - Test data cleanup helpers
 *
 * @see packages/electron/tests/integration/simulation-flow.test.ts
 * @see packages/electron/tests/integration/simulation-history-persistence.test.ts
 */

import { initDatabase } from '../../src/main/database/index.js';

/**
 * Generates a unique test ID using timestamp and random component.
 * Prevents 409 conflicts when tests insert records with same IDs.
 *
 * @returns A unique string identifier (e.g., "test-1707891234567-abc123")
 */
export function generateTestId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-${timestamp}-${random}`;
}

/**
 * Generates a unique project path for testing.
 * Uses the test ID to ensure no collisions between test runs.
 *
 * @returns A unique project path (e.g., "/tmp/test-project-1707891234567-abc123")
 */
export function generateTestProjectPath(): string {
  return `/tmp/test-project-${generateTestId()}`;
}

/**
 * Truncates all test data from database tables.
 * Preserves schema structure but removes all records.
 *
 * This should be called in afterEach hooks to ensure test isolation.
 *
 * Tables truncated:
 * - simulation_history_v2 (primary test data)
 * - simulation_history (legacy, rarely used)
 * - recent_projects (test project entries)
 * - user_preferences (test settings)
 *
 * @see packages/electron/src/main/database/schema.ts
 */
export function truncateDatabaseTables(): void {
  const db = initDatabase(true);

  // Truncate in order of dependencies (child tables first)
  db.exec('DELETE FROM simulation_history_v2;');
  db.exec('DELETE FROM simulation_history;');
  db.exec('DELETE FROM recent_projects;');
  db.exec('DELETE FROM user_preferences;');
}

/**
 * Counts records in a database table.
 * Useful for verifying test isolation and data cleanup.
 *
 * @param tableName - The name of the table to count records in
 * @returns The number of records in the table
 */
export function countTableRecords(tableName: string): number {
  const db = initDatabase(true);
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`);
  const row = stmt.get() as { count: number };
  return row.count;
}

/**
 * Verifies that all test tables are empty (or have only default data).
 * Useful in afterAll hooks to detect orphaned data.
 *
 * Note: user_preferences may have 1 record (default preferences inserted by migration).
 *
 * @returns An object with record counts for each table
 */
export function verifyEmptyDatabase(): {
  simulationHistoryV2: number;
  simulationHistory: number;
  recentProjects: number;
  userPreferences: number;
} {
  return {
    simulationHistoryV2: countTableRecords('simulation_history_v2'),
    simulationHistory: countTableRecords('simulation_history'),
    recentProjects: countTableRecords('recent_projects'),
    userPreferences: countTableRecords('user_preferences'),
  };
}

/**
 * Checks if the database has only expected default data.
 *
 * @returns true if database is clean (only default data present)
 */
export function isDatabaseClean(): boolean {
  const counts = verifyEmptyDatabase();
  // user_preferences may have 1 default record from migration
  const hasTestRecords =
    counts.simulationHistoryV2 > 0 ||
    counts.simulationHistory > 0 ||
    counts.recentProjects > 0 ||
    counts.userPreferences > 1;

  return !hasTestRecords;
}
