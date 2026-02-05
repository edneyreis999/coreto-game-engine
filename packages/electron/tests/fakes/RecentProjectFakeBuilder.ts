/**
 * FakeBuilder for RecentProject in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/main/ipc/types.ts
 */

import type { RecentProject } from '../../src/main/ipc/types.js';

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * Builder for creating RecentProject in tests.
 */
export class RecentProjectFakeBuilder {
  private chance: import('chance').Chance.Chance;
  private countObjs: number;
  private baseIndex: number;
  private static globalIndex = 0;

  private _path: PropOrFactory<string> = (index: number) =>
    `/Users/test/game-${this.baseIndex + index}`;
  private _name: PropOrFactory<string> = (index: number) =>
    `Game Project ${this.baseIndex + index + 1}`;
  private _lastOpened: PropOrFactory<string> = (index: number) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return date.toISOString();
  };

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = require('chance').Chance();
    this.baseIndex = RecentProjectFakeBuilder.globalIndex * 100;
    RecentProjectFakeBuilder.globalIndex += 1;
  }

  static anEntity(): RecentProjectFakeBuilder {
    return new RecentProjectFakeBuilder(1);
  }

  static theEntities(countObjs: number): RecentProjectFakeBuilder {
    return new RecentProjectFakeBuilder(countObjs);
  }

  withPath(valueOrFactory: PropOrFactory<string>): this {
    this._path = valueOrFactory;
    return this;
  }

  withName(valueOrFactory: PropOrFactory<string>): this {
    this._name = valueOrFactory;
    return this;
  }

  withLastOpened(valueOrFactory: PropOrFactory<string>): this {
    this._lastOpened = valueOrFactory;
    return this;
  }

  build(): RecentProject | RecentProject[] {
    const entities = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const path = this.callFactory(this._path, index);
        const name = this.callFactory(this._name, index);
        const lastOpened = this.callFactory(this._lastOpened, index);

        return {
          path,
          name,
          lastOpened,
        };
      });

    return this.countObjs === 1 ? entities[0]! : entities;
  }

  private callFactory<T>(factoryOrValue: PropOrFactory<T>, index: number): T {
    return typeof factoryOrValue === 'function'
      ? (factoryOrValue as (index: number) => T)(index)
      : factoryOrValue;
  }
}

// Type augmentation
declare module '../../src/main/ipc/types.js' {
  export interface RecentProject {
    fake?: typeof RecentProjectFakeBuilder;
  }
}
