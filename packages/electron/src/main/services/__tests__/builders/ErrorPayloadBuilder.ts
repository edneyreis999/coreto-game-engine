/**
 * Builder for ErrorPayload in tests.
 * Provides sensible defaults and fluent interface.
 *
 * @see packages/electron/src/main/workers/types.ts
 */

import type { ErrorPayload } from '../../../workers/types.js';

/**
 * Builder for creating ErrorPayload in tests.
 */
export class ErrorPayloadBuilder {
  private title: string = 'Test Error';
  private description: string = 'Test error description';
  private details?: string;
  private code?: string;

  /**
   * Sets the error title.
   */
  withTitle(title: string): this {
    this.title = title;
    return this;
  }

  /**
   * Sets the error description.
   */
  withDescription(description: string): this {
    this.description = description;
    return this;
  }

  /**
   * Sets technical details.
   */
  withDetails(details: string): this {
    this.details = details;
    return this;
  }

  /**
   * Sets the error code.
   */
  withCode(code: string): this {
    this.code = code;
    return this;
  }

  /**
   * Creates a file not found error.
   */
  asFileNotFound(path: string): this {
    return this.withTitle('File Not Found')
      .withDescription(`The file ${path} could not be found.`)
      .withCode('ERR_FILE_NOT_FOUND');
  }

  /**
   * Creates a validation error.
   */
  asValidationError(message: string): this {
    return this.withTitle('Validation Error').withDescription(message).withCode('ERR_VALIDATION');
  }

  /**
   * Creates a worker crash error.
   */
  asWorkerCrash(exitCode: number): this {
    return this.withTitle('Worker Process Crashed')
      .withDescription('The simulation process unexpectedly terminated.')
      .withDetails(`Exit code: ${exitCode}`)
      .withCode('ERR_WORKER_CRASH');
  }

  /**
   * Builds the ErrorPayload.
   */
  build(): ErrorPayload {
    const payload: ErrorPayload = {
      title: this.title,
      description: this.description,
    };

    if (this.details) {
      payload.details = this.details;
    }

    if (this.code) {
      payload.code = this.code;
    }

    return payload;
  }
}
