/**
 * FakeBuilder for ProjectConfigResponse in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/main/ipc/types.ts
 */

import type { ProjectConfigResponse } from '../../src/main/ipc/types.js';
import type { TrechoData } from '../../src/main/ipc/types.js';

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * Builder for creating ProjectConfigResponse in tests.
 */
export class ProjectConfigResponseFakeBuilder {
  private chance: import('chance').Chance.Chance;
  private countObjs: number;
  private baseIndex: number;
  private static globalIndex = 0;

  private _projectPath: PropOrFactory<string> = (index: number) =>
    `/test/project-${this.baseIndex + index}`;
  private _reportOutputPath: PropOrFactory<string> = (index: number) =>
    `/test/project-${this.baseIndex + index}/temp`;
  private _seed: PropOrFactory<number> = (index: number) => 12345 + index;
  private _maxBattleTurns: PropOrFactory<number | undefined> = () => 50;
  private _trechos: PropOrFactory<TrechoData[]> = (index: number) =>
    this.generateTrechos(index);

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = require('chance').Chance();
    this.baseIndex = ProjectConfigResponseFakeBuilder.globalIndex * 100;
    ProjectConfigResponseFakeBuilder.globalIndex += 1;
  }

  static anEntity(): ProjectConfigResponseFakeBuilder {
    return new ProjectConfigResponseFakeBuilder(1);
  }

  static theEntities(countObjs: number): ProjectConfigResponseFakeBuilder {
    return new ProjectConfigResponseFakeBuilder(countObjs);
  }

  withProjectPath(valueOrFactory: PropOrFactory<string>): this {
    this._projectPath = valueOrFactory;
    return this;
  }

  withReportOutputPath(valueOrFactory: PropOrFactory<string>): this {
    this._reportOutputPath = valueOrFactory;
    return this;
  }

  withSeed(valueOrFactory: PropOrFactory<number>): this {
    this._seed = valueOrFactory;
    return this;
  }

  withMaxBattleTurns(valueOrFactory: PropOrFactory<number | undefined>): this {
    this._maxBattleTurns = valueOrFactory;
    return this;
  }

  withTrechos(valueOrFactory: PropOrFactory<TrechoData[]>): this {
    this._trechos = valueOrFactory;
    return this;
  }

  build(): ProjectConfigResponse | ProjectConfigResponse[] {
    const entities = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const projectPath = this.callFactory(this._projectPath, index);
        const reportOutputPath = this.callFactory(this._reportOutputPath, index);
        const seed = this.callFactory(this._seed, index);
        const maxBattleTurns = this.callFactory(this._maxBattleTurns, index);
        const trechos = this.callFactory(this._trechos, index);

        return {
          projectPath,
          reportOutputPath,
          seed,
          maxBattleTurns,
          trechos,
        };
      });

    return this.countObjs === 1 ? entities[0]! : entities;
  }

  private callFactory<T>(factoryOrValue: PropOrFactory<T>, index: number): T {
    return typeof factoryOrValue === 'function'
      ? (factoryOrValue as (index: number) => T)(index)
      : factoryOrValue;
  }

  private generateTrechos(index: number): TrechoData[] {
    const trechoCount = (this.baseIndex + index) % 5 + 1;
    return Array.from({ length: trechoCount }, (_, i) => ({
      id: `trecho-${this.baseIndex + index}-${i}`,
      name: `Trecho ${i + 1}`,
      anchorLevelMin: 1 + i,
      anchorLevelMax: 50 + i * 10,
      targetTtkTurns: 10 + i * 5,
      targetTtkActions: 15 + i * 10,
      tolerancePercent: 20,
      troopIds: [1, 2, 3],
      party: {
        members: [
          { classId: 1, level: 10 + i },
          { classId: 2, level: 12 + i },
        ],
      },
    }));
  }
}

// Type augmentation
declare module '../../src/main/ipc/types.js' {
  export interface ProjectConfigResponse {
    fake?: typeof ProjectConfigResponseFakeBuilder;
  }
}
