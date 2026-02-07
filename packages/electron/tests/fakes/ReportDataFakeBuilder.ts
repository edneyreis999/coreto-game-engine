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
    return Array.from({ length: trechoCount }, (_, i) => {
      const troopId = this.chance.integer({ min: 1, max: 100 });
      const ttkTurns = this.chance.integer({ min: 3, max: 20 });
      const ttkActions = this.chance.integer({ min: 5, max: 30 });
      return {
        id: `trecho-${this.baseIndex + index}-${i}`,
        name: `Trecho ${i + 1}`,
        passed: this.chance.bool({ likelihood: 80 }),
        battleCount: 150,
        avgTtkTurns: ttkTurns,
        avgTtkActions: ttkActions,
        p95TtkTurns: Math.round(ttkTurns * 1.2),
        p95TtkActions: Math.round(ttkActions * 1.3),
        successRate: this.chance.floating({ min: 0.7, max: 1.0 }),
        battles: Array.from({ length: 3 }, (_, j) => ({
          troopId,
          troopName: `Troop ${troopId}`,
          outcome: 'victory' as const,
          ttkTurns,
          ttkActions,
          durationMs: this.chance.integer({ min: 500, max: 3000 }),
          seed: this.chance.integer({ min: 10000, max: 99999 }),
          expGained: this.chance.integer({ min: 50, max: 200 }),
        })),
        warnings: this.chance.bool({ likelihood: 30 })
          ? [
              {
                type: 'test-warning',
                severity: 'warning' as const,
                message: 'Test warning message',
                context: {},
              },
            ]
          : [],
      };
    });
  }
}

// Type augmentation
declare module '../../src/main/ipc/types.js' {
  export interface ReportData {
    fake?: typeof ReportDataFakeBuilder;
  }
}
