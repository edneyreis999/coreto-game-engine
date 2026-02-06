/**
 * FakeBuilder for UserPreferences in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/main/database/queries/user-preferences.ts
 */

import Chance from 'chance';
import type { UserPreferences } from '../../../src/main/database/queries/user-preferences';

const chance = new Chance();

/**
 * Builder for creating UserPreferences in tests.
 */
export class UserPreferencesBuilder {
  private data: Partial<UserPreferences> = {};

  static create(): UserPreferencesBuilder {
    return new UserPreferencesBuilder().withDefaults();
  }

  withDefaults(): this {
    this.data = {
      theme: chance.pickone(['light', 'dark', 'system']),
      window_bounds: {
        x: chance.natural({ min: 0, max: 500 }),
        y: chance.natural({ min: 0, max: 300 }),
        width: chance.natural({ min: 800, max: 1920 }),
        height: chance.natural({ min: 600, max: 1080 }),
      },
      last_project_path: `/Users/dev/rpgmaker/${chance.word()}`,
    };
    return this;
  }

  withTheme(theme: 'light' | 'dark' | 'system'): this {
    this.data.theme = theme;
    return this;
  }

  withWindowBounds(bounds: { x: number | null; y: number | null; width: number | null; height: number | null }): this {
    this.data.window_bounds = bounds;
    return this;
  }

  withLastProjectPath(path: string | null): this {
    this.data.last_project_path = path;
    return this;
  }

  withDarkTheme(): this {
    return this.withTheme('dark');
  }

  withLightTheme(): this {
    return this.withTheme('light');
  }

  withSystemTheme(): this {
    return this.withTheme('system');
  }

  withoutWindowBounds(): this {
    delete (this.data as Partial<UserPreferences>).window_bounds;
    return this;
  }

  withPartialWindowBounds(partial: Partial<{ x: number | null; y: number | null; width: number | null; height: number | null }>): this {
    this.data.window_bounds = {
      x: null,
      y: null,
      width: null,
      height: null,
      ...partial,
    };
    return this;
  }

  build(): UserPreferences {
    return this.data as UserPreferences;
  }
}
