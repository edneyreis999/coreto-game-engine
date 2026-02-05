/**
 * Recent Projects Repository Interface
 *
 * Defines the contract for recent projects storage.
 * This interface is part of the domain layer and can be implemented
 * by different infrastructure adapters (SQLite, file system, etc.).
 */

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: string; // ISO date string
}

export interface IRecentProjectsRepository {
  /**
   * Lists recent projects.
   *
   * @param limit - Maximum number of projects to return
   * @returns Array of recent projects
   */
  list(limit: number): RecentProject[];

  /**
   * Adds or updates a recent project.
   *
   * @param path - Project path
   * @param name - Project name
   * @returns Added or updated recent project
   */
  add(path: string, name: string): RecentProject;
}
