/**
 * FakeBuilder for SimulationResultPayload in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/main/workers/types.ts
 */

import type { SimulationResultPayload } from '../../src/main/workers/types.js';
import type { Report } from '@coreto/core';

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * Minimal Report implementation for testing.
 * In production, this would be an actual Report from @coreto/core.
 */
interface FakeReport extends Report {
  trechos: Array<{
    id: string;
    name: string;
    battles: Array<{
      ttkTurns: number;
      ttkActions: number;
      passed: boolean;
    }>;
  }>;
}

/**
 * Builder for creating SimulationResultPayload in tests.
 */
export class SimulationResultPayloadFakeBuilder {
  private chance: import('chance').Chance.Chance;
  private countObjs: number;
  private baseIndex: number;
  private static globalIndex = 0;

  private _simulationId: PropOrFactory<string> = (index: number) =>
    `sim-${this.baseIndex + index}`;
  private _projectPath: PropOrFactory<string> = (index: number) =>
    `/test/project-${this.baseIndex + index}`;
  private _report: PropOrFactory<Report> = (index: number) =>
    this.generateFakeReport(index);
  private _duration: PropOrFactory<number> = (index: number) => 1000 + index * 100;
  private _seed: PropOrFactory<number> = (index: number) => 12345 + index;

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = require('chance').Chance();
    this.baseIndex = SimulationResultPayloadFakeBuilder.globalIndex * 100;
    SimulationResultPayloadFakeBuilder.globalIndex += 1;
  }

  static anEntity(): SimulationResultPayloadFakeBuilder {
    return new SimulationResultPayloadFakeBuilder(1);
  }

  static theEntities(countObjs: number): SimulationResultPayloadFakeBuilder {
    return new SimulationResultPayloadFakeBuilder(countObjs);
  }

  withSimulationId(valueOrFactory: PropOrFactory<string>): this {
    this._simulationId = valueOrFactory;
    return this;
  }

  withProjectPath(valueOrFactory: PropOrFactory<string>): this {
    this._projectPath = valueOrFactory;
    return this;
  }

  withReport(valueOrFactory: PropOrFactory<Report>): this {
    this._report = valueOrFactory;
    return this;
  }

  withDuration(valueOrFactory: PropOrFactory<number>): this {
    this._duration = valueOrFactory;
    return this;
  }

  withSeed(valueOrFactory: PropOrFactory<number>): this {
    this._seed = valueOrFactory;
    return this;
  }

  build(): SimulationResultPayload | SimulationResultPayload[] {
    const entities = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const simulationId = this.callFactory(this._simulationId, index);
        const projectPath = this.callFactory(this._projectPath, index);
        const report = this.callFactory(this._report, index);
        const duration = this.callFactory(this._duration, index);
        const seed = this.callFactory(this._seed, index);

        return {
          simulationId,
          projectPath,
          report,
          duration,
          seed,
        };
      });

    return this.countObjs === 1 ? entities[0]! : entities;
  }

  private callFactory<T>(factoryOrValue: PropOrFactory<T>, index: number): T {
    return typeof factoryOrValue === 'function'
      ? (factoryOrValue as (index: number) => T)(index)
      : factoryOrValue;
  }

  private generateFakeReport(index: number): FakeReport {
    const trechoCount = (this.baseIndex + index) % 5 + 1;
    const trechos = Array.from({ length: trechoCount }, (_, i) => ({
      id: `trecho-${i}`,
      name: `Trecho ${i + 1}`,
      battles: Array.from({ length: 150 }, (_, j) => ({
        ttkTurns: 10 + j % 20,
        ttkActions: 15 + j % 25,
        passed: true,
      })),
    }));

    return {
      trechos,
      toJSON: () => JSON.stringify({ trechos }),
    } as FakeReport;
  }
}

// Type augmentation
declare module '../../src/main/workers/types.js' {
  export interface SimulationResultPayload {
    fake?: typeof SimulationResultPayloadFakeBuilder;
  }
}
