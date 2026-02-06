/**
 * RecentProject Query Functions
 *
 * CRUD operations for the recent_projects table.
 * All queries use prepared statements for SQL injection prevention.
 *
 * @see packages/electron/src/main/database/schema.ts
 */

import type Database from 'better-sqlite3';
import type { RecentProjectDb } from '../schema.js';
import { RecentProjectDbSchema } from '../schema.js';

/**
 * Result type for RecentProject queries.
 */
export type RecentProject = Pick<RecentProjectDb, 'path' | 'name' | 'last_opened_at'>;

/**
 * Adds a project to recent projects.
 * If the project path already exists, updates the last_opened_at timestamp.
 *
 * @param db - Database connection
 * @param path - Absolute path to the project directory
 * @param name - Project name
 * @returns The added or updated recent project
 */
export function addRecentProject(db: Database.Database, path: string, name: string): RecentProject {
  const now = Date.now();

  // First, try to get existing record
  const existing = getRecentProject(db, path);

  if (existing) {
    // Update existing record's timestamp
    return updateLastOpened(db, path);
  }

  // Insert new record
  const insertStmt = db.prepare(`
    INSERT INTO recent_projects (path, name, last_opened_at, created_at)
    VALUES (?, ?, ?, ?)
  `);

  insertStmt.run(path, name, now, now);

  return { path, name, last_opened_at: now };
}

/**
 * Lists all recent projects ordered by last_opened_at DESC.
 *
 * @param db - Database connection
 * @param limit - Maximum number of projects to return (default: 10)
 * @returns Array of recent projects
 */
export function listRecentProjects(db: Database.Database, limit: number = 10): RecentProject[] {
  const stmt = db.prepare(`
    SELECT path, name, last_opened_at
    FROM recent_projects
    ORDER BY last_opened_at DESC
    LIMIT ?
  `);

  const rows = stmt.all(limit) as unknown[];
  return rows.map((row) =>
    RecentProjectDbSchema.pick({ path: true, name: true, last_opened_at: true }).parse(row)
  );
}

/**
 * Updates the last_opened_at timestamp for a project.
 * Throws if project path not found.
 *
 * @param db - Database connection
 * @param path - Absolute path to the project directory
 * @returns The updated recent project
 * @throws {Error} If project path not found
 */
export function updateLastOpened(db: Database.Database, path: string): RecentProject {
  const now = Date.now();

  const stmt = db.prepare(`
    UPDATE recent_projects
    SET last_opened_at = ?
    WHERE path = ?
  `);

  const result = stmt.run(now, path);

  if (result.changes === 0) {
    throw new Error(`Recent project not found: ${path}`);
  }

  // Fetch and return updated record
  const selectStmt = db.prepare(`
    SELECT path, name, last_opened_at
    FROM recent_projects
    WHERE path = ?
  `);

  const row = selectStmt.get(path) as unknown;
  return RecentProjectDbSchema.pick({ path: true, name: true, last_opened_at: true }).parse(row);
}

/**
 * Deletes a recent project by path.
 *
 * @param db - Database connection
 * @param path - Absolute path to the project directory
 * @returns True if a record was deleted, false otherwise
 */
export function deleteRecentProject(db: Database.Database, path: string): boolean {
  const stmt = db.prepare('DELETE FROM recent_projects WHERE path = ?');
  const result = stmt.run(path);
  return result.changes > 0;
}

/**
 * Deletes all recent projects.
 *
 * @param db - Database connection
 * @returns Number of records deleted
 */
export function deleteAllRecentProjects(db: Database.Database): number {
  const stmt = db.prepare('DELETE FROM recent_projects');
  const result = stmt.run();
  return result.changes;
}

/**
 * Gets a recent project by path.
 *
 * @param db - Database connection
 * @param path - Absolute path to the project directory
 * @returns The recent project, or null if not found
 */
export function getRecentProject(db: Database.Database, path: string): RecentProject | null {
  const stmt = db.prepare(`
    SELECT path, name, last_opened_at
    FROM recent_projects
    WHERE path = ?
  `);

  const row = stmt.get(path) as unknown | undefined;

  if (!row) {
    return null;
  }

  return RecentProjectDbSchema.pick({ path: true, name: true, last_opened_at: true }).parse(row);
}
