/**
 * RecentProject Query Tests
 *
 * Tests CRUD operations for the recent_projects table.
 *
 * @see packages/electron/src/main/database/queries/recent-projects.ts
 */

import { initDatabase, closeDatabase } from '../../../../src/main/database/index.js';
import type { RecentProject } from '../../../../src/main/database/queries/recent-projects.js';
import {
  addRecentProject,
  listRecentProjects,
  updateLastOpened,
  deleteRecentProject,
  deleteAllRecentProjects,
  getRecentProject,
} from '../../../../src/main/database/queries/recent-projects.js';

describe('RecentProject Queries', () => {
  beforeEach(() => {
    initDatabase(true);
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('addRecentProject', () => {
    it('should create new record with current timestamp', () => {
      const result = addRecentProject(
        '/path/to/project',
        'Test Project'
      );

      expect(result).toEqual({
        path: '/path/to/project',
        name: 'Test Project',
        last_opened_at: expect.any(Number),
      });

      expect(result.last_opened_at).toBeLessThanOrEqual(Date.now());
      expect(result.last_opened_at).toBeGreaterThan(Date.now() - 1000);
    });

    it('should store record in database', () => {
      addRecentProject('/path/to/project', 'Test Project');

      const result = getRecentProject('/path/to/project');

      expect(result).toEqual({
        path: '/path/to/project',
        name: 'Test Project',
        last_opened_at: expect.any(Number),
      });
    });

    it('should handle multiple projects', () => {
      addRecentProject('/path/to/project1', 'Project 1');
      addRecentProject('/path/to/project2', 'Project 2');

      const projects = listRecentProjects();

      expect(projects).toHaveLength(2);
    });
  });

  describe('listRecentProjects', () => {
    beforeEach(() => {
      // Add test data
      const now = Date.now();
      addRecentProject('/path/to/project1', 'Project 1');
      addRecentProject('/path/to/project2', 'Project 2');
      addRecentProject('/path/to/project3', 'Project 3');

      // Update timestamps to control ordering
      const db = initDatabase();
      db.prepare('UPDATE recent_projects SET last_opened_at = ? WHERE path = ?').run(now - 3000, '/path/to/project1');
      db.prepare('UPDATE recent_projects SET last_opened_at = ? WHERE path = ?').run(now - 2000, '/path/to/project2');
      db.prepare('UPDATE recent_projects SET last_opened_at = ? WHERE path = ?').run(now - 1000, '/path/to/project3');
    });

    it('should return projects ordered by lastOpened DESC', () => {
      const projects = listRecentProjects();

      expect(projects).toHaveLength(3);
      expect(projects[0].path).toBe('/path/to/project3');
      expect(projects[1].path).toBe('/path/to/project2');
      expect(projects[2].path).toBe('/path/to/project1');
    });

    it('should limit results to specified count', () => {
      const projects = listRecentProjects(2);

      expect(projects).toHaveLength(2);
      expect(projects[0].path).toBe('/path/to/project3');
      expect(projects[1].path).toBe('/path/to/project2');
    });

    it('should default to limit of 10', () => {
      // Add more than 10 projects
      for (let i = 0; i < 15; i++) {
        addRecentProject(`/path/to/project${i}`, `Project ${i}`);
      }

      const projects = listRecentProjects();

      expect(projects.length).toBeLessThanOrEqual(10);
    });

    it('should return empty array when no projects exist', () => {
      const db = initDatabase();
      db.prepare('DELETE FROM recent_projects').run();

      const projects = listRecentProjects();

      expect(projects).toEqual([]);
    });
  });

  describe('updateLastOpened', () => {
    it('should update timestamp for existing project', () => {
      addRecentProject('/path/to/project', 'Test Project');

      const before = Date.now();
      const result = updateLastOpened('/path/to/project');
      const after = Date.now();

      expect(result).toEqual({
        path: '/path/to/project',
        name: 'Test Project',
        last_opened_at: expect.any(Number),
      });

      expect(result.last_opened_at).toBeGreaterThanOrEqual(before);
      expect(result.last_opened_at).toBeLessThanOrEqual(after);
    });

    it('should update order in listRecentProjects', async () => {
      addRecentProject('/path/to/project1', 'Project 1');
      addRecentProject('/path/to/project2', 'Project 2');

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      updateLastOpened('/path/to/project1');

      const projects = listRecentProjects();

      expect(projects[0].path).toBe('/path/to/project1');
      expect(projects[1].path).toBe('/path/to/project2');
    });

    it('should throw error when project not found', () => {
      expect(() => updateLastOpened('/nonexistent/path')).toThrow('Recent project not found');
    });
  });

  describe('deleteRecentProject', () => {
    it('should remove specific project record', () => {
      addRecentProject('/path/to/project1', 'Project 1');
      addRecentProject('/path/to/project2', 'Project 2');

      const deleted = deleteRecentProject('/path/to/project1');

      expect(deleted).toBe(true);

      const projects = listRecentProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0].path).toBe('/path/to/project2');
    });

    it('should return false when project not found', () => {
      const deleted = deleteRecentProject('/nonexistent/path');

      expect(deleted).toBe(false);
    });
  });

  describe('deleteAllRecentProjects', () => {
    it('should clear all recent projects', () => {
      addRecentProject('/path/to/project1', 'Project 1');
      addRecentProject('/path/to/project2', 'Project 2');
      addRecentProject('/path/to/project3', 'Project 3');

      const deletedCount = deleteAllRecentProjects();

      expect(deletedCount).toBe(3);

      const projects = listRecentProjects();

      expect(projects).toEqual([]);
    });

    it('should return 0 when no projects exist', () => {
      const deletedCount = deleteAllRecentProjects();

      expect(deletedCount).toBe(0);
    });
  });

  describe('getRecentProject', () => {
    it('should return project by path', () => {
      addRecentProject('/path/to/project', 'Test Project');

      const result = getRecentProject('/path/to/project');

      expect(result).toEqual({
        path: '/path/to/project',
        name: 'Test Project',
        last_opened_at: expect.any(Number),
      });
    });

    it('should return null when project not found', () => {
      const result = getRecentProject('/nonexistent/path');

      expect(result).toBeNull();
    });
  });

  describe('Duplicate path handling', () => {
    it('should update existing record instead of creating new', async () => {
      addRecentProject('/path/to/project', 'Original Name');

      const before = getRecentProject('/path/to/project');

      await new Promise(resolve => setTimeout(resolve, 10));

      addRecentProject('/path/to/project', 'Updated Name');

      const after = getRecentProject('/path/to/project');
      const projects = listRecentProjects();

      expect(after.name).toBe('Updated Name');
      expect(after.last_opened_at).toBeGreaterThan(before.last_opened_at);
      expect(projects).toHaveLength(1);
    });
  });
});
