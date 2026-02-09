/**
 * SQLite Config Storage Adapter
 *
 * Production adapter implementing IConfigStorage using better-sqlite3.
 * Replaces filesystem-based storage with SQLite database persistence.
 *
 * Key Features:
 * - Stores configs in project_configs table (SQLite)
 * - Uses prepared statements for SQL injection safety
 * - UPSERT support via INSERT OR REPLACE
 * - Automatic timestamp updates via trigger
 *
 * Import Convention (CLAUDE-ARCH-CONVENTION):
 * - Domain imports use module aliases (@coreto/electron/domain/*)
 * - Infrastructure imports use relative paths
 *
 * @see packages/electron/src/domain/ports/IConfigStorage.ts
 * @see packages/electron/src/main/database/migrations.ts (Migration v3)
 * @see packages/electron/CLAUDE.md (Import Conventions)
 */

import type Database from 'better-sqlite3';
import type { IConfigStorage } from '@coreto/electron/domain/ports';

/**
 * Creates a SQLite-based configuration storage adapter.
 *
 * This adapter implements IConfigStorage using better-sqlite3.
 * It stores configs in the project_configs table created by migration v3.
 *
 * Table Schema:
 * - project_path TEXT PRIMARY KEY
 * - config_json TEXT NOT NULL
 * - last_modified INTEGER NOT NULL (auto-updated by trigger)
 * - created_at INTEGER NOT NULL
 *
 * @param db - better-sqlite3 Database instance
 * @returns IConfigStorage implementation for SQLite operations
 *
 * @example
 * ```typescript
 * const storage = createSQLiteConfigStorage(database);
 * const json = await storage.read('/path/to/project');
 * await storage.write('/path/to/project', updatedJson);
 * ```
 */
export function createSQLiteConfigStorage(db: Database.Database): IConfigStorage {
  return {
    /**
     * Reads configuration JSON from SQLite database.
     *
     * @throws {Error} If config doesn't exist for project_path
     */
    async read(projectPath: string): Promise<string> {
      const stmt = db.prepare(
        'SELECT config_json FROM project_configs WHERE project_path = ?'
      );
      const row = stmt.get(projectPath) as { config_json: string } | undefined;

      if (!row) {
        throw new Error(`Project config not found for: ${projectPath}`);
      }

      return row.config_json;
    },

    /**
     * Writes configuration JSON to SQLite database.
     *
     * Uses INSERT OR REPLACE for UPSERT behavior.
     * Automatically updates last_modified timestamp via trigger.
     */
    async write(projectPath: string, content: string): Promise<void> {
      const stmt = db.prepare(
        `INSERT OR REPLACE INTO project_configs (project_path, config_json, last_modified, created_at)
         VALUES (?, ?, ?, ?)`
      );

      const now = Date.now();
      stmt.run(projectPath, content, now, now);
    },

    /**
     * Checks if configuration exists for a project.
     *
     * Uses COUNT(*) for efficient existence check.
     */
    async exists(projectPath: string): Promise<boolean> {
      const stmt = db.prepare(
        'SELECT COUNT(*) as count FROM project_configs WHERE project_path = ?'
      );
      const row = stmt.get(projectPath) as { count: number };
      return row.count > 0;
    },

    /**
     * Deletes configuration from SQLite database.
     *
     * Idempotent - doesn't throw if config doesn't exist.
     * SQLite DELETE ignores non-matching rows (no error).
     */
    async delete(projectPath: string): Promise<void> {
      const stmt = db.prepare(
        'DELETE FROM project_configs WHERE project_path = ?'
      );
      stmt.run(projectPath);
    },

    /**
     * Returns project path as the config identifier.
     *
     * In SQLite context, there's no file path concept.
     * The project_path serves as the primary key.
     */
    getConfigPath(projectPath: string): string {
      return projectPath;
    },
  };
}
