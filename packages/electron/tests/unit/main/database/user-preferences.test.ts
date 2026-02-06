/**
 * UserPreferences Query Tests
 *
 * Tests CRUD operations for the user_preferences table.
 *
 * @see packages/electron/src/main/database/queries/user-preferences.ts
 */

import { initDatabase, closeDatabase } from '../../../../src/main/database/index.js';
import {
  getUserPreferences,
  setUserPreferences,
  updateUserPreferences,
  resetUserPreferences,
  getTheme,
  setTheme,
  getLastProjectPath,
  setLastProjectPath,
  getWindowBounds,
  setWindowBounds,
} from '../../../../src/main/database/queries/user-preferences.js';
import { UserPreferencesBuilder } from '../../../helpers/builders';

describe('UserPreferences Queries', () => {
  beforeEach(() => {
    initDatabase(true);
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('getUserPreferences', () => {
    it('should return default preferences if none set', () => {
      const db = initDatabase();
      db.prepare('DELETE FROM user_preferences').run();

      const result = getUserPreferences(db);

      expect(result).toEqual({
        theme: 'system',
        window_bounds: undefined,
        last_project_path: null,
      });
    });

    it('should return stored preferences', () => {
      const db = initDatabase();
      setTheme(db, 'dark');

      const result = getUserPreferences(db);

      expect(result.theme).toBe('dark');
    });

    it('should include window_bounds when values are set', () => {
      const db = initDatabase();
      setWindowBounds(db, { x: 100, y: 200, width: 800, height: 600 });

      const result = getUserPreferences(db);

      expect(result.window_bounds).toEqual({
        x: 100,
        y: 200,
        width: 800,
        height: 600,
      });
    });

    it('should not include window_bounds when all values are null', () => {
      const result = getUserPreferences(initDatabase());

      expect(result.window_bounds).toBeUndefined();
    });

    it('should include partial window_bounds', () => {
      const db = initDatabase();
      setWindowBounds(db, { width: 800, height: 600 });

      const result = getUserPreferences(db);

      expect(result.window_bounds).toEqual({
        x: null,
        y: null,
        width: 800,
        height: 600,
      });
    });
  });

  describe('setUserPreferences', () => {
    it('should create or replace preferences record', () => {
      const db = initDatabase();

      const prefs = UserPreferencesBuilder.create()
        .withDarkTheme()
        .withWindowBounds({ x: 100, y: 200, width: 800, height: 600 })
        .withLastProjectPath('/path/to/project')
        .build();

      const result = setUserPreferences(db, prefs);

      expect(result).toEqual(prefs);

      const retrieved = getUserPreferences(db);
      expect(retrieved).toEqual(prefs);
    });

    it('should update existing preferences', () => {
      const db = initDatabase();

      setUserPreferences(db, { theme: 'light' });

      const result = setUserPreferences(db, { theme: 'dark' });

      expect(result.theme).toBe('dark');

      const retrieved = getUserPreferences(db);
      expect(retrieved.theme).toBe('dark');
    });

    it('should validate theme value', () => {
      const db = initDatabase();

      expect(() => setUserPreferences(db, { theme: 'invalid' as any })).toThrow();
    });

    it('should handle null last_project_path', () => {
      const db = initDatabase();

      const prefs = UserPreferencesBuilder.create()
        .withSystemTheme()
        .withLastProjectPath(null)
        .build();

      setUserPreferences(db, prefs);

      const retrieved = getUserPreferences(db);
      expect(retrieved.last_project_path).toBeNull();
    });

    it('should handle undefined window_bounds', () => {
      const db = initDatabase();

      const prefs = UserPreferencesBuilder.create()
        .withSystemTheme()
        .withoutWindowBounds()
        .build();

      setUserPreferences(db, prefs);

      const retrieved = getUserPreferences(db);
      expect(retrieved.window_bounds).toBeUndefined();
    });
  });

  describe('updateUserPreferences', () => {
    it('should merge partial updates with existing preferences', () => {
      const db = initDatabase();

      setUserPreferences(db, {
        theme: 'light',
        window_bounds: { x: 100, y: 100, width: 800, height: 600 },
        last_project_path: '/path/to/project',
      });

      const result = updateUserPreferences(db, { theme: 'dark' });

      expect(result).toEqual({
        theme: 'dark',
        window_bounds: { x: 100, y: 100, width: 800, height: 600 },
        last_project_path: '/path/to/project',
      });
    });

    it('should update only specified fields', () => {
      const db = initDatabase();

      setUserPreferences(db, {
        theme: 'light',
        last_project_path: '/path/to/project',
      });

      updateUserPreferences(db, { last_project_path: '/new/path' });

      const retrieved = getUserPreferences(db);
      expect(retrieved.theme).toBe('light');
      expect(retrieved.last_project_path).toBe('/new/path');
    });

    it('should create preferences if none exist', () => {
      const db = initDatabase();
      db.prepare('DELETE FROM user_preferences').run();

      const result = updateUserPreferences(db, { theme: 'dark' });

      expect(result.theme).toBe('dark');
    });
  });

  describe('resetUserPreferences', () => {
    it('should clear all preferences to defaults', () => {
      const db = initDatabase();

      setUserPreferences(db, {
        theme: 'dark',
        window_bounds: { x: 100, y: 200, width: 800, height: 600 },
        last_project_path: '/path/to/project',
      });

      const result = resetUserPreferences(db);

      expect(result).toEqual({
        theme: 'system',
        window_bounds: undefined,
        last_project_path: null,
      });
    });
  });

  describe('getTheme', () => {
    it('should return current theme', () => {
      const db = initDatabase();

      setTheme(db, 'dark');

      expect(getTheme(db)).toBe('dark');
    });

    it('should return default theme if not set', () => {
      const db = initDatabase();
      db.prepare('DELETE FROM user_preferences').run();

      expect(getTheme(db)).toBe('system');
    });
  });

  describe('setTheme', () => {
    it('should set theme to light', () => {
      const db = initDatabase();

      setTheme(db, 'light');

      expect(getTheme(db)).toBe('light');
    });

    it('should set theme to dark', () => {
      const db = initDatabase();

      setTheme(db, 'dark');

      expect(getTheme(db)).toBe('dark');
    });

    it('should set theme to system', () => {
      const db = initDatabase();

      setTheme(db, 'system');

      expect(getTheme(db)).toBe('system');
    });

    it('should validate theme value', () => {
      const db = initDatabase();

      expect(() => setTheme(db, 'invalid' as any)).toThrow();
    });

    it('should update timestamp', () => {
      const db = initDatabase();

      const before = Date.now();
      setTheme(db, 'dark');

      const row = db.prepare('SELECT updated_at FROM user_preferences').get() as { updated_at: number };

      expect(row.updated_at).toBeGreaterThanOrEqual(before);
      expect(row.updated_at).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('getLastProjectPath', () => {
    it('should return last project path', () => {
      const db = initDatabase();

      setLastProjectPath(db, '/path/to/project');

      expect(getLastProjectPath(db)).toBe('/path/to/project');
    });

    it('should return null if not set', () => {
      const db = initDatabase();

      expect(getLastProjectPath(db)).toBeNull();
    });

    it('should update to null', () => {
      const db = initDatabase();

      setLastProjectPath(db, '/path/to/project');
      setLastProjectPath(db, null);

      expect(getLastProjectPath(db)).toBeNull();
    });
  });

  describe('setLastProjectPath', () => {
    it('should set last project path', () => {
      const db = initDatabase();

      setLastProjectPath(db, '/path/to/project');

      expect(getLastProjectPath(db)).toBe('/path/to/project');
    });

    it('should update existing value', () => {
      const db = initDatabase();

      setLastProjectPath(db, '/path/to/project1');
      setLastProjectPath(db, '/path/to/project2');

      expect(getLastProjectPath(db)).toBe('/path/to/project2');
    });
  });

  describe('getWindowBounds', () => {
    it('should return window bounds when set', () => {
      const db = initDatabase();

      setWindowBounds(db, { x: 100, y: 200, width: 800, height: 600 });

      expect(getWindowBounds(db)).toEqual({
        x: 100,
        y: 200,
        width: 800,
        height: 600,
      });
    });

    it('should return undefined when not set', () => {
      const db = initDatabase();

      expect(getWindowBounds(db)).toBeUndefined();
    });

    it('should return partial bounds', () => {
      const db = initDatabase();

      setWindowBounds(db, { width: 800, height: 600 });

      expect(getWindowBounds(db)).toEqual({
        x: null,
        y: null,
        width: 800,
        height: 600,
      });
    });

    it('should handle null values in bounds', () => {
      const db = initDatabase();

      setWindowBounds(db, { x: null, y: null, width: 800, height: 600 });

      expect(getWindowBounds(db)).toEqual({
        x: null,
        y: null,
        width: 800,
        height: 600,
      });
    });
  });

  describe('setWindowBounds', () => {
    it('should set all window bounds', () => {
      const db = initDatabase();

      setWindowBounds(db, { x: 100, y: 200, width: 800, height: 600 });

      expect(getWindowBounds(db)).toEqual({
        x: 100,
        y: 200,
        width: 800,
        height: 600,
      });
    });

    it('should update existing bounds', () => {
      const db = initDatabase();

      setWindowBounds(db, { x: 100, y: 200, width: 800, height: 600 });
      setWindowBounds(db, { x: 150, y: 250, width: 900, height: 700 });

      expect(getWindowBounds(db)).toEqual({
        x: 150,
        y: 250,
        width: 900,
        height: 700,
      });
    });

    it('should handle partial bounds', () => {
      const db = initDatabase();

      setWindowBounds(db, { width: 800, height: 600 });

      expect(getWindowBounds(db)).toEqual({
        x: null,
        y: null,
        width: 800,
        height: 600,
      });
    });

    it('should clear bounds when all null', () => {
      const db = initDatabase();

      setWindowBounds(db, { x: 100, y: 200, width: 800, height: 600 });
      setWindowBounds(db, { x: null, y: null, width: null, height: null });

      expect(getWindowBounds(db)).toBeUndefined();
    });
  });

  describe('Integration tests', () => {
    it('should persist across multiple operations', () => {
      const db = initDatabase();

      setUserPreferences(db, {
        theme: 'dark',
        window_bounds: { x: 100, y: 100, width: 800, height: 600 },
        last_project_path: '/path/to/project',
      });

      expect(getTheme(db)).toBe('dark');
      expect(getLastProjectPath(db)).toBe('/path/to/project');
      expect(getWindowBounds(db)).toEqual({
        x: 100,
        y: 100,
        width: 800,
        height: 600,
      });
    });

    it('should handle mixed updates', () => {
      const db = initDatabase();

      setUserPreferences(db, {
        theme: 'light',
        last_project_path: '/path1',
      });

      setTheme(db, 'dark');
      setLastProjectPath(db, '/path2');
      setWindowBounds(db, { width: 800, height: 600 });

      const result = getUserPreferences(db);

      expect(result).toEqual({
        theme: 'dark',
        last_project_path: '/path2',
        window_bounds: { x: null, y: null, width: 800, height: 600 },
      });
    });
  });
});
