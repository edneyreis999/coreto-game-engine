/**
 * UserPreferences Query Functions
 *
 * CRUD operations for the user_preferences table.
 * Manages user settings including theme, window bounds, and last project.
 *
 * @see packages/electron/src/main/database/schema.ts
 */

import type Database from 'better-sqlite3';
import type { Theme, WindowBounds } from '../schema.js';
import { UserPreferencesDbSchema, ThemeSchema, DEFAULT_USER_PREFERENCES } from '../schema.js';

/**
 * User preferences value object.
 */
export interface UserPreferences {
  theme: Theme;
  window_bounds?: WindowBounds;
  last_project_path?: string | null;
}

/**
 * Gets user preferences.
 * Returns default values if no preferences are set.
 *
 * @param db - Database connection
 * @returns User preferences
 */
export function getUserPreferences(db: Database.Database): UserPreferences {
  const stmt = db.prepare(`
    SELECT theme, window_bounds_x, window_bounds_y, window_bounds_width, window_bounds_height, last_project_path
    FROM user_preferences
    LIMIT 1
  `);

  const row = stmt.get() as unknown | undefined;

  if (!row) {
    // Return defaults if no record exists
    return {
      theme: DEFAULT_USER_PREFERENCES.theme,
      window_bounds: undefined,
      last_project_path: DEFAULT_USER_PREFERENCES.last_project_path,
    };
  }

  const parsed = UserPreferencesDbSchema.pick({
    theme: true,
    window_bounds_x: true,
    window_bounds_y: true,
    window_bounds_width: true,
    window_bounds_height: true,
    last_project_path: true,
  }).parse(row);

  const preferences: UserPreferences = {
    theme: parsed.theme,
    last_project_path: parsed.last_project_path,
  };

  // Only include window_bounds if at least one value is set
  if (
    parsed.window_bounds_x !== null ||
    parsed.window_bounds_y !== null ||
    parsed.window_bounds_width !== null ||
    parsed.window_bounds_height !== null
  ) {
    preferences.window_bounds = {
      x: parsed.window_bounds_x,
      y: parsed.window_bounds_y,
      width: parsed.window_bounds_width,
      height: parsed.window_bounds_height,
    };
  }

  return preferences;
}

/**
 * Sets all user preferences.
 * Creates or replaces the single preferences record.
 *
 * @param db - Database connection
 * @param preferences - Preferences to set
 * @returns The updated preferences
 */
export function setUserPreferences(
  db: Database.Database,
  preferences: UserPreferences
): UserPreferences {
  const now = Date.now();

  // Validate theme
  const theme = ThemeSchema.parse(preferences.theme);

  // Extract window bounds
  const wb = preferences.window_bounds;
  const window_bounds_x = wb?.x ?? null;
  const window_bounds_y = wb?.y ?? null;
  const window_bounds_width = wb?.width ?? null;
  const window_bounds_height = wb?.height ?? null;

  // Delete existing record and insert new one
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM user_preferences').run();

    db.prepare(`
      INSERT INTO user_preferences (
        theme, window_bounds_x, window_bounds_y, window_bounds_width,
        window_bounds_height, last_project_path, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      theme,
      window_bounds_x,
      window_bounds_y,
      window_bounds_width,
      window_bounds_height,
      preferences.last_project_path ?? null,
      now
    );
  });

  transaction();

  return preferences;
}

/**
 * Updates partial user preferences.
 * Merges provided values with existing preferences.
 *
 * @param db - Database connection
 * @param updates - Preferences to update
 * @returns The updated preferences
 */
export function updateUserPreferences(
  db: Database.Database,
  updates: Partial<UserPreferences>
): UserPreferences {
  const current = getUserPreferences(db);
  const merged: UserPreferences = {
    theme: updates.theme ?? current.theme,
    window_bounds: updates.window_bounds ?? current.window_bounds,
    last_project_path: updates.last_project_path ?? current.last_project_path,
  };

  return setUserPreferences(db, merged);
}

/**
 * Resets user preferences to default values.
 *
 * @param db - Database connection
 * @returns The default preferences
 */
export function resetUserPreferences(db: Database.Database): UserPreferences {
  const defaults: UserPreferences = {
    theme: DEFAULT_USER_PREFERENCES.theme,
    window_bounds: undefined,
    last_project_path: DEFAULT_USER_PREFERENCES.last_project_path,
  };

  return setUserPreferences(db, defaults);
}

/**
 * Gets the current theme preference.
 *
 * @param db - Database connection
 * @returns Current theme ('light', 'dark', or 'system')
 */
export function getTheme(db: Database.Database): Theme {
  const stmt = db.prepare('SELECT theme FROM user_preferences LIMIT 1');
  const row = stmt.get() as { theme: string } | undefined;

  if (!row) {
    return DEFAULT_USER_PREFERENCES.theme;
  }

  return ThemeSchema.parse(row.theme);
}

/**
 * Sets the theme preference.
 *
 * @param db - Database connection
 * @param theme - Theme to set ('light', 'dark', or 'system')
 */
export function setTheme(db: Database.Database, theme: Theme): void {
  const validatedTheme = ThemeSchema.parse(theme);
  const now = Date.now();

  db.prepare('UPDATE user_preferences SET theme = ?, updated_at = ?').run(validatedTheme, now);
}

/**
 * Gets the last opened project path.
 *
 * @param db - Database connection
 * @returns Last project path, or null if not set
 */
export function getLastProjectPath(db: Database.Database): string | null {
  const stmt = db.prepare('SELECT last_project_path FROM user_preferences LIMIT 1');
  const row = stmt.get() as { last_project_path: string | null } | undefined;

  return row?.last_project_path ?? null;
}

/**
 * Sets the last opened project path.
 *
 * @param db - Database connection
 * @param projectPath - Absolute path to the project directory
 */
export function setLastProjectPath(db: Database.Database, projectPath: string | null): void {
  const now = Date.now();

  db.prepare('UPDATE user_preferences SET last_project_path = ?, updated_at = ?').run(
    projectPath,
    now
  );
}

/**
 * Gets the window bounds preference.
 *
 * @param db - Database connection
 * @returns Window bounds, or undefined if not set
 */
export function getWindowBounds(db: Database.Database): WindowBounds | undefined {
  const stmt = db.prepare(`
    SELECT window_bounds_x, window_bounds_y, window_bounds_width, window_bounds_height
    FROM user_preferences
    LIMIT 1
  `);
  const row = stmt.get() as {
    window_bounds_x: number | null;
    window_bounds_y: number | null;
    window_bounds_width: number | null;
    window_bounds_height: number | null;
  } | undefined;

  if (!row) {
    return undefined;
  }

  // Return undefined if all values are null
  if (
    row.window_bounds_x === null &&
    row.window_bounds_y === null &&
    row.window_bounds_width === null &&
    row.window_bounds_height === null
  ) {
    return undefined;
  }

  return {
    x: row.window_bounds_x,
    y: row.window_bounds_y,
    width: row.window_bounds_width,
    height: row.window_bounds_height,
  };
}

/**
 * Sets the window bounds preference.
 *
 * @param db - Database connection
 * @param bounds - Window bounds to set
 */
export function setWindowBounds(db: Database.Database, bounds: WindowBounds): void {
  const now = Date.now();

  db.prepare(`
    UPDATE user_preferences
    SET window_bounds_x = ?, window_bounds_y = ?,
        window_bounds_width = ?, window_bounds_height = ?, updated_at = ?
  `).run(bounds.x ?? null, bounds.y ?? null, bounds.width ?? null, bounds.height ?? null, now);
}
