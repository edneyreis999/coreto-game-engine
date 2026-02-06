/**
 * FakeBuilder for RecentProject in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/main/database/queries/recent-projects.ts
 */

import Chance from 'chance';
import type { RecentProject } from '../../../src/main/database/queries/recent-projects';

const chance = new Chance();

/**
 * Builder for creating RecentProject in tests.
 */
export class RecentProjectBuilder {
  private data: Partial<RecentProject> = {};

  static create(): RecentProjectBuilder {
    return new RecentProjectBuilder().withDefaults();
  }

  withDefaults(): this {
    const projectName = chance.word({ capitalize: true });
    this.data = {
      path: `/Users/dev/rpgmaker/${projectName}`,
      name: projectName,
      last_opened_at: Date.now() - chance.natural({ min: 0, max: 86400000 }),
    };
    return this;
  }

  withPath(path: string): this {
    this.data.path = path;
    return this;
  }

  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  withLastOpenedAt(timestamp: number): this {
    this.data.last_opened_at = timestamp;
    return this;
  }

  openedNow(): this {
    return this.withLastOpenedAt(Date.now());
  }

  openedYesterday(): this {
    return this.withLastOpenedAt(Date.now() - 86400000);
  }

  openedDaysAgo(days: number): this {
    return this.withLastOpenedAt(Date.now() - days * 86400000);
  }

  build(): RecentProject {
    return this.data as RecentProject;
  }
}
