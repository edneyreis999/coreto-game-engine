/**
 * SQLite Recent Projects Repository
 *
 * Infrastructure implementation of IRecentProjectsRepository using SQLite.
 * Uses the existing better-sqlite3 database and query functions.
 *
 * Import Convention (CLAUDE-ARCH-CONVENTION):
 * - Domain imports use module aliases (@coreto/electron/domain/*)
 * - Infrastructure imports use relative paths
 *
 * @see packages/electron/CLAUDE.md (Import Conventions)
 */

import type { IRecentProjectsRepository, RecentProject } from '@coreto/electron/domain/repositories';
import { getDatabase } from '../index';
import { listRecentProjects, addRecentProject } from '../queries/recent-projects';

/**
 * Creates a new SQLite recent projects repository.
 *
 * @returns Repository instance
 */
export function createRecentProjectsRepository(): IRecentProjectsRepository {
  return {
    list(limit: number): RecentProject[] {
      const db = getDatabase();
      const recentProjectsDb = listRecentProjects(db, limit);

      // Convert database format to domain format
      return recentProjectsDb.map((rp) => ({
        path: rp.path,
        name: rp.name,
        lastOpened: new Date(rp.last_opened_at).toISOString(),
      }));
    },

    add(path: string, name: string): RecentProject {
      const db = getDatabase();
      const recentProjectDb = addRecentProject(db, path, name);

      // Convert database format to domain format
      return {
        path: recentProjectDb.path,
        name: recentProjectDb.name,
        lastOpened: new Date(recentProjectDb.last_opened_at).toISOString(),
      };
    },
  };
}
