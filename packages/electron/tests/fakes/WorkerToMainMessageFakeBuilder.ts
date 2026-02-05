/**
 * FakeBuilder for WorkerToMainMessage in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/main/workers/types.ts
 */

import type { WorkerToMainMessage } from '../../src/main/workers/types.js';
import type { ProgressPayload, ErrorPayload, SimulationResultPayload } from '../../src/main/workers/types.js';
import { ProgressPayloadFakeBuilder } from './ProgressPayloadFakeBuilder.js';
import { ErrorPayloadFakeBuilder } from './ErrorPayloadFakeBuilder.js';
import { SimulationResultPayloadFakeBuilder } from './SimulationResultPayloadFakeBuilder.js';

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * Builder for creating WorkerToMainMessage in tests.
 */
export class WorkerToMainMessageFakeBuilder {
  private chance: import('chance').Chance.Chance;
  private countObjs: number;
  private baseIndex: number;
  private static globalIndex = 0;

  private _type: PropOrFactory<'progress' | 'complete' | 'error'> = 'progress';
  private _payload?: ProgressPayload | ErrorPayload | SimulationResultPayload;

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = require('chance').Chance();
    this.baseIndex = WorkerToMainMessageFakeBuilder.globalIndex * 100;
    WorkerToMainMessageFakeBuilder.globalIndex += 1;
  }

  static anEntity(): WorkerToMainMessageFakeBuilder {
    return new WorkerToMainMessageFakeBuilder(1);
  }

  static theEntities(countObjs: number): WorkerToMainMessageFakeBuilder {
    return new WorkerToMainMessageFakeBuilder(countObjs);
  }

  // Preset methods for common message types

  /** Create a progress message */
  static asProgress(payload?: ProgressPayload): WorkerToMainMessageFakeBuilder {
    const builder = new WorkerToMainMessageFakeBuilder(1).withType('progress');
    if (payload) {
      builder._payload = payload;
    } else {
      builder._payload = ProgressPayloadFakeBuilder.anEntity().build();
    }
    return builder;
  }

  /** Create a complete message */
  static asComplete(payload?: SimulationResultPayload): WorkerToMainMessageFakeBuilder {
    const builder = new WorkerToMainMessageFakeBuilder(1).withType('complete');
    if (payload) {
      builder._payload = payload;
    } else {
      builder._payload = SimulationResultPayloadFakeBuilder.anEntity().build();
    }
    return builder;
  }

  /** Create an error message */
  static asError(payload?: ErrorPayload): WorkerToMainMessageFakeBuilder {
    const builder = new WorkerToMainMessageFakeBuilder(1).withType('error');
    if (payload) {
      builder._payload = payload;
    } else {
      builder._payload = ErrorPayloadFakeBuilder.anEntity().build();
    }
    return builder;
  }

  withType(valueOrFactory: PropOrFactory<'progress' | 'complete' | 'error'>): this {
    this._type = valueOrFactory;
    return this;
  }

  withPayload(payload: ProgressPayload | ErrorPayload | SimulationResultPayload): this {
    this._payload = payload;
    return this;
  }

  build(): WorkerToMainMessage | WorkerToMainMessage[] {
    const entities = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const type = this.callFactory(this._type, index);

        // If no payload was set, use builder to create one
        let payload: ProgressPayload | ErrorPayload | SimulationResultPayload;

        if (this._payload) {
          payload = this._payload;
        } else {
          switch (type) {
            case 'progress':
              payload = ProgressPayloadFakeBuilder.anEntity().build();
              break;
            case 'complete':
              payload = SimulationResultPayloadFakeBuilder.anEntity().build();
              break;
            case 'error':
              payload = ErrorPayloadFakeBuilder.anEntity().build();
              break;
          }
        }

        return { type, payload } as WorkerToMainMessage;
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
  export interface WorkerToMainMessage {
    fake?: typeof WorkerToMainMessageFakeBuilder;
  }
}
