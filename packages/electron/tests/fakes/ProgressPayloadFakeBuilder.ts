/**
 * FakeBuilder for ProgressPayload in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/main/workers/types.ts
 */

import type { ProgressPayload, ProgressStage } from '../../src/main/workers/types.js';

type PropOrFactory<T> = T | ((index: number) => T);

const STAGES: ProgressStage[] = [
  'initialization',
  'validation',
  'loading',
  'simulation',
  'complete',
];

/**
 * Builder for creating ProgressPayload in tests.
 */
export class ProgressPayloadFakeBuilder {
  private chance: import('chance').Chance.Chance;
  private countObjs: number;
  private baseIndex: number;
  private static globalIndex = 0;

  private _stage: PropOrFactory<ProgressStage> = 'simulation';
  private _trechoId: PropOrFactory<string | undefined> = () => undefined;
  private _trechoName: PropOrFactory<string | undefined> = () => undefined;
  private _current: PropOrFactory<number> = (index: number) => index + 1;
  private _total: PropOrFactory<number> = (index: number) => (index + 1) * 10;
  private _percentage: PropOrFactory<number> = (index: number) =>
    Math.min(100, ((index + 1) * 10));
  private _message: PropOrFactory<string> = (index: number) =>
    `Processing trecho ${index + 1}`;
  private _timestamp: PropOrFactory<number> = () => Date.now();

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = require('chance').Chance();
    this.baseIndex = ProgressPayloadFakeBuilder.globalIndex * 100;
    ProgressPayloadFakeBuilder.globalIndex += 1;
  }

  static anEntity(): ProgressPayloadFakeBuilder {
    return new ProgressPayloadFakeBuilder(1);
  }

  static theEntities(countObjs: number): ProgressPayloadFakeBuilder {
    return new ProgressPayloadFakeBuilder(countObjs);
  }

  // Preset methods for common scenarios

  /** Create progress for initialization stage */
  static asInitialization(): ProgressPayloadFakeBuilder {
    return new ProgressPayloadFakeBuilder(1)
      .withStage('initialization')
      .withMessage('Initializing simulation...')
      .withCurrent(0)
      .withTotal(1)
      .withPercentage(0);
  }

  /** Create progress for validation stage */
  static asValidation(): ProgressPayloadFakeBuilder {
    return new ProgressPayloadFakeBuilder(1)
      .withStage('validation')
      .withMessage('Validating configuration...')
      .withCurrent(1)
      .withTotal(3)
      .withPercentage(33);
  }

  /** Create progress for a specific trecho/battle */
  static asBattle(trechoIndex: number, current: number, total: number): ProgressPayloadFakeBuilder {
    return new ProgressPayloadFakeBuilder(1)
      .withStage('simulation')
      .withTrechoId(`trecho-${trechoIndex}`)
      .withTrechoName(`Trecho ${trechoIndex}`)
      .withCurrent(current)
      .withTotal(total)
      .withPercentage(Math.floor((current / total) * 100))
      .withMessage(`Battle ${current} of ${total}`);
  }

  /** Create complete progress */
  static asComplete(totalBattles: number): ProgressPayloadFakeBuilder {
    return new ProgressPayloadFakeBuilder(1)
      .withStage('complete')
      .withCurrent(totalBattles)
      .withTotal(totalBattles)
      .withPercentage(100)
      .withMessage('Simulation complete!');
  }

  withStage(valueOrFactory: PropOrFactory<ProgressStage>): this {
    this._stage = valueOrFactory;
    return this;
  }

  withTrechoId(valueOrFactory: PropOrFactory<string | undefined>): this {
    this._trechoId = valueOrFactory;
    return this;
  }

  withTrechoName(valueOrFactory: PropOrFactory<string | undefined>): this {
    this._trechoName = valueOrFactory;
    return this;
  }

  withCurrent(valueOrFactory: PropOrFactory<number>): this {
    this._current = valueOrFactory;
    return this;
  }

  withTotal(valueOrFactory: PropOrFactory<number>): this {
    this._total = valueOrFactory;
    return this;
  }

  withPercentage(valueOrFactory: PropOrFactory<number>): this {
    this._percentage = valueOrFactory;
    return this;
  }

  withMessage(valueOrFactory: PropOrFactory<string>): this {
    this._message = valueOrFactory;
    return this;
  }

  withTimestamp(valueOrFactory: PropOrFactory<number>): this {
    this._timestamp = valueOrFactory;
    return this;
  }

  build(): ProgressPayload | ProgressPayload[] {
    const entities = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const stage = this.callFactory(this._stage, index);
        const trechoId = this.callFactory(this._trechoId, index);
        const trechoName = this.callFactory(this._trechoName, index);
        const current = this.callFactory(this._current, index);
        const total = this.callFactory(this._total, index);
        const percentage = this.callFactory(this._percentage, index);
        const message = this.callFactory(this._message, index);
        const timestamp = this.callFactory(this._timestamp, index);

        return {
          stage,
          trechoId,
          trechoName,
          current,
          total,
          percentage,
          message,
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
}

// Type augmentation
declare module '../../src/main/workers/types.js' {
  export interface ProgressPayload {
    fake?: typeof ProgressPayloadFakeBuilder;
  }
}
