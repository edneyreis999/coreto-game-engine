/**
 * FakeBuilder for ErrorPayload in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/main/workers/types.ts
 */

import type { ErrorPayload } from '../../src/main/workers/types.js';

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * Builder for creating ErrorPayload in tests.
 */
export class ErrorPayloadFakeBuilder {
  private chance: import('chance').Chance.Chance;
  private countObjs: number;
  private baseIndex: number;
  private static globalIndex = 0;

  private _title: PropOrFactory<string> = 'Simulation Error';
  private _description: PropOrFactory<string> =
    'An error occurred during simulation execution';
  private _details: PropOrFactory<string | undefined> = () => undefined;
  private _code: PropOrFactory<string | undefined> = () => undefined;

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = require('chance').Chance();
    this.baseIndex = ErrorPayloadFakeBuilder.globalIndex * 100;
    ErrorPayloadFakeBuilder.globalIndex += 1;
  }

  static anEntity(): ErrorPayloadFakeBuilder {
    return new ErrorPayloadFakeBuilder(1);
  }

  static theEntities(countObjs: number): ErrorPayloadFakeBuilder {
    return new ErrorPayloadFakeBuilder(countObjs);
  }

  // Preset methods for common error scenarios

  /** Create a validation error */
  static asValidationError(message: string): ErrorPayloadFakeBuilder {
    return new ErrorPayloadFakeBuilder(1)
      .withTitle('Validation Error')
      .withDescription(message)
      .withCode('VALIDATION_ERROR');
  }

  /** Create a worker crash error */
  static asWorkerCrash(details?: string): ErrorPayloadFakeBuilder {
    return new ErrorPayloadFakeBuilder(1)
      .withTitle('Worker Process Crashed')
      .withDescription('The simulation worker process terminated unexpectedly')
      .withDetails(details || 'Exit code: 1')
      .withCode('WORKER_CRASH');
  }

  /** Create a configuration error */
  static asConfigError(message: string): ErrorPayloadFakeBuilder {
    return new ErrorPayloadFakeBuilder(1)
      .withTitle('Configuration Error')
      .withDescription(message)
      .withCode('CONFIG_ERROR');
  }

  /** Create a file not found error */
  static asFileNotFound(path: string): ErrorPayloadFakeBuilder {
    return new ErrorPayloadFakeBuilder(1)
      .withTitle('File Not Found')
      .withDescription(`Required file could not be located: ${path}`)
      .withCode('FILE_NOT_FOUND');
  }

  withTitle(valueOrFactory: PropOrFactory<string>): this {
    this._title = valueOrFactory;
    return this;
  }

  withDescription(valueOrFactory: PropOrFactory<string>): this {
    this._description = valueOrFactory;
    return this;
  }

  withDetails(valueOrFactory: PropOrFactory<string | undefined>): this {
    this._details = valueOrFactory;
    return this;
  }

  withCode(valueOrFactory: PropOrFactory<string | undefined>): this {
    this._code = valueOrFactory;
    return this;
  }

  build(): ErrorPayload | ErrorPayload[] {
    const entities = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const title = this.callFactory(this._title, index);
        const description = this.callFactory(this._description, index);
        const details = this.callFactory(this._details, index);
        const code = this.callFactory(this._code, index);

        return {
          title,
          description,
          details,
          code,
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
  export interface ErrorPayload {
    fake?: typeof ErrorPayloadFakeBuilder;
  }
}
