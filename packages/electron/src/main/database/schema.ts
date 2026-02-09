/**
 * Database Schema Definitions
 *
 * SQL schema constants and TypeScript interfaces for the SQLite database.
 * All database entities must have matching TypeScript interfaces.
 *
 * Database tables:
 * - recent_projects: Track recently opened RPG Maker MZ projects
 * - simulation_history: Store simulation execution results
 * - user_preferences: Persist user settings
 * - schema_migrations: Track schema version for migrations
 *
 * @see packages/electron/src/main/database/index.ts
 */

import { z } from 'zod';

// ============================================================================
// SQL Schema Definitions
// ============================================================================

/**
 * Current schema version. Increment when schema changes.
 */
export const CURRENT_SCHEMA_VERSION = 3;

/**
 * SQL for recent_projects table.
 * Stores recently opened RPG Maker MZ projects.
 */
export const RECENT_PROJECTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS recent_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    last_opened_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
`;

/**
 * SQL for simulation_history table.
 * Stores simulation execution results for TTK tracking.
 * @deprecated Use simulation_history_v2 for new simulations
 */
export const SIMULATION_HISTORY_TABLE_SQL = `
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
`;

/**
 * SQL for simulation_history_v2 table.
 * Stores simulation summaries with three-tier storage strategy:
 * - Summary JSON (~1KB) stored in SQLite for quick queries
 * - Optional file path to detailed report (~500KB) stored on export
 */
export const SIMULATION_HISTORY_V2_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS simulation_history_v2 (
    id TEXT PRIMARY KEY,
    project_path TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'FAILED', 'CANCELLED')),
    summary_json TEXT NOT NULL,
    report_file_path TEXT,
    created_at INTEGER NOT NULL
  );
`;

/**
 * SQL for user_preferences table.
 * Stores user settings and preferences.
 */
export const USER_PREFERENCES_TABLE_SQL = `
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
`;

/**
 * SQL for schema_migrations table.
 * Tracks schema version for migration system.
 */
export const SCHEMA_MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER NOT NULL UNIQUE,
    applied_at INTEGER NOT NULL
  );
`;

/**
 * SQL for creating indexes on recent_projects.
 */
export const RECENT_PROJECTS_INDEXES_SQL = `
  CREATE INDEX IF NOT EXISTS idx_recent_projects_last_opened
    ON recent_projects(last_opened_at DESC);
`;

/**
 * SQL for creating indexes on simulation_history.
 */
export const SIMULATION_HISTORY_INDEXES_SQL = `
  CREATE INDEX IF NOT EXISTS idx_simulation_history_project_path
    ON simulation_history(project_path);
  CREATE INDEX IF NOT EXISTS idx_simulation_history_executed_at
    ON simulation_history(executed_at DESC);
  CREATE INDEX IF NOT EXISTS idx_simulation_history_trecho_id
    ON simulation_history(trecho_id);
`;

/**
 * SQL for creating indexes on simulation_history_v2.
 */
export const SIMULATION_HISTORY_V2_INDEXES_SQL = `
  CREATE INDEX IF NOT EXISTS idx_simulation_history_v2_project_path
    ON simulation_history_v2(project_path, timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_simulation_history_v2_timestamp
    ON simulation_history_v2(timestamp DESC);
`;

// ============================================================================
// Zod Schemas for Database Records
// ============================================================================

/**
 * Theme options for user preferences.
 */
export const ThemeSchema = z.enum(['light', 'dark', 'system']);

/**
 * Zod schema for RecentProject database record.
 */
export const RecentProjectDbSchema = z.object({
  id: z.number().int().positive(),
  path: z.string().min(1),
  name: z.string().min(1),
  last_opened_at: z.number().int().nonnegative(),
  created_at: z.number().int().nonnegative(),
});

/**
 * Zod schema for SimulationHistory database record.
 */
export const SimulationHistoryDbSchema = z.object({
  id: z.number().int().positive(),
  project_path: z.string().min(1),
  config_name: z.string().nullable(),
  trecho_id: z.string().min(1),
  troop_id: z.number().int().positive(),
  troop_name: z.string().min(1),
  ttk_turns: z.number().int().nonnegative(),
  ttk_actions: z.number().int().nonnegative(),
  duration_ms: z.number().int().nonnegative(),
  seed: z.number().int().nonnegative(),
  exp_gained: z.number().int().nonnegative(),
  outcome: z.enum(['victory', 'defeat', 'timeout']),
  passed: z.number().int().min(0).max(1),
  warnings: z.string().nullable(),
  executed_at: z.number().int().nonnegative(),
});

/**
 * Zod schema for UserPreferences database record.
 */
export const UserPreferencesDbSchema = z.object({
  id: z.number().int().positive(),
  theme: ThemeSchema,
  window_bounds_x: z.number().int().nullable(),
  window_bounds_y: z.number().int().nullable(),
  window_bounds_width: z.number().int().positive().nullable(),
  window_bounds_height: z.number().int().positive().nullable(),
  last_project_path: z.string().nullable(),
  updated_at: z.number().int().nonnegative(),
});

/**
 * Zod schema for SchemaMigration database record.
 */
export const SchemaMigrationDbSchema = z.object({
  version: z.number().int().positive(),
  applied_at: z.number().int().nonnegative(),
});

/**
 * Zod schema for SimulationHistoryV2 database record.
 */
export const SimulationHistoryV2DbSchema = z.object({
  id: z.string().uuid(),
  project_path: z.string().min(1),
  timestamp: z.number().int().nonnegative(),
  status: z.enum(['SUCCESS', 'FAILED', 'CANCELLED']),
  summary_json: z.string().min(1),
  report_file_path: z.string().nullable(),
  created_at: z.number().int().nonnegative(),
});

// ============================================================================
// TypeScript Type Definitions
// ============================================================================

/**
 * RecentProject database entity.
 */
export type RecentProjectDb = z.infer<typeof RecentProjectDbSchema>;

/**
 * SimulationHistory database entity.
 */
export type SimulationHistoryDb = z.infer<typeof SimulationHistoryDbSchema>;

/**
 * SimulationHistoryV2 database entity.
 */
export type SimulationHistoryV2Db = z.infer<typeof SimulationHistoryV2DbSchema>;

/**
 * UserPreferences database entity.
 */
export type UserPreferencesDb = z.infer<typeof UserPreferencesDbSchema>;

/**
 * SchemaMigration database entity.
 */
export type SchemaMigrationDb = z.infer<typeof SchemaMigrationDbSchema>;

/**
 * Theme type for user preferences.
 */
export type Theme = z.infer<typeof ThemeSchema>;

/**
 * Window bounds for user preferences.
 */
export interface WindowBounds {
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
}

/**
 * Default user preferences values.
 */
export const DEFAULT_USER_PREFERENCES = {
  theme: 'system' as const,
  window_bounds_x: null,
  window_bounds_y: null,
  window_bounds_width: null,
  window_bounds_height: null,
  last_project_path: null,
} as const;
