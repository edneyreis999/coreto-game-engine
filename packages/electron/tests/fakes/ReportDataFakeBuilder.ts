/**
 * FakeBuilder for ReportData in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/main/ipc/types.ts
 */

import type { ReportData } from '../../src/main/ipc/types.js';
import type { TrechoSummaryData } from '../../src/main/ipc/types.js';

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * Builder for creating ReportData in tests.
 */
export class ReportDataFakeBuilder {
  private chance: import('chance').Chance.Chance;
  private countObjs: number;
  private baseIndex: number;
  private static globalIndex = 0;

  private _trechos: PropOrFactory<TrechoSummaryData[]> = (index: number) =>
    this.generateTrechos(index);
  private _totalBattles: PropOrFactory<number> = (index: number) => (index + 1) * 150;
  private _timestamp: PropOrFactory<string> = () => new Date().toISOString();

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = require('chance').Chance();
    this.baseIndex = ReportDataFakeBuilder.globalIndex * 100;
    ReportDataFakeBuilder.globalIndex += 1;
  }

  static anEntity(): ReportDataFakeBuilder {
    return new ReportDataFakeBuilder(1);
  }

  static theEntities(countObjs: number): ReportDataFakeBuilder {
    return new ReportDataFakeBuilder(countObjs);
  }

  withTrechos(valueOrFactory: PropOrFactory<TrechoSummaryData[]>): this {
    this._trechos = valueOrFactory;
    return this;
  }

  withTotalBattles(valueOrFactory: PropOrFactory<number>): this {
    this._totalBattles = valueOrFactory;
    return this;
  }

  withTimestamp(valueOrFactory: PropOrFactory<string>): this {
    this._timestamp = valueOrFactory;
    return this;
  }

  build(): ReportData | ReportData[] {
    const entities = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const trechos = this.callFactory(this._trechos, index);
        const totalBattles = this.callFactory(this._totalBattles, index);
        const timestamp = this.callFactory(this._timestamp, index);

        return {
          trechos,
          totalBattles,
          timestamp,
        };
      });

    return this.countObjs === 1 ? entities[0]! : entities;
  }

  private callFactory<T>(factoryOrValue: PropOrFactory<T>, index: number): T {
    return typeof factoryOrValue === 'function'
      ? (factoryOrValue as (index: number) => T)(index)
      : factoryOrValue;
  }

  private generateTrechos(index: number): TrechoSummaryData[] {
    const trechoCount = (this.baseIndex + index) % 5 + 1; // 1-5 trechos
    return Array.from({ length: trechoCount }, (_, i) => ({
      id: `trecho-${this.baseIndex + index}-${i}`,
      name: `Trecho ${i + 1}`,
      targetTtkTurns: 10 + i * 5,
      targetTtkActions: 15 + i * 10,
      avgTtkTurns: 9 + i * 5,
      avgTtkActions: 14 + i * 10,
      tolerancePercent: 20,
      battleCount: 150,
    }));
  }
}

// Type augmentation
declare module '../../src/main/ipc/types.js' {
  export interface ReportData {
    fake?: typeof ReportDataFakeBuilder;
  }
}
