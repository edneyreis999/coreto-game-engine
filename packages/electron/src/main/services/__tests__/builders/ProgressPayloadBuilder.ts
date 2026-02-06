/**
 * Builder for ProgressPayload in tests.
 * Provides sensible defaults and fluent interface.
 *
 * @see packages/electron/src/main/workers/types.ts
 */

import type { ProgressPayload } from '../../../workers/types.js';

/**
 * Builder for creating ProgressPayload in tests.
 */
export class ProgressPayloadBuilder {
  private stage: ProgressPayload['stage'] = 'initialization';
  private current: number = 0;
  private total: number = 100;
  private message: string = 'Test progress';
  private timestamp: number = Date.now();
  private trechoId?: string;
  private trechoName?: string;

  /**
   * Sets the progress stage.
   */
  withStage(stage: ProgressPayload['stage']): this {
    this.stage = stage;
    return this;
  }

  /**
   * Sets progress counters.
   */
  withProgress(current: number, total: number): this {
    this.current = current;
    this.total = total;
    return this;
  }

  /**
   * Sets the progress message.
   */
  withMessage(message: string): this {
    this.message = message;
    return this;
  }

  /**
   * Sets the timestamp.
   */
  withTimestamp(timestamp: number): this {
    this.timestamp = timestamp;
    return this;
  }

  /**
   * Sets trecho context.
   */
  withTrecho(trechoId: string, trechoName: string): this {
    this.trechoId = trechoId;
    this.trechoName = trechoName;
    return this;
  }

  /**
   * Creates initialization stage progress.
   */
  asInitialization(): this {
    return this.withStage('initialization').withMessage('Initializing simulation...');
  }

  /**
   * Creates battle stage progress.
   */
  asBattle(current: number, total: number): this {
    return this.withStage('battle')
      .withProgress(current, total)
      .withMessage(`Battle ${current}/${total}`);
  }

  /**
   * Creates trecho-complete stage progress.
   */
  asTrechoComplete(): this {
    return this.withStage('trecho-complete').withMessage('Trecho completed');
  }

  /**
   * Creates finalization stage progress.
   */
  asFinalization(): this {
    return this.withStage('finalization').withMessage('Finalizing...');
  }

  /**
   * Builds the ProgressPayload.
   */
  build(): ProgressPayload {
    const percentage = this.total > 0 ? Math.floor((this.current / this.total) * 100) : 0;

    return {
      stage: this.stage,
      current: this.current,
      total: this.total,
      percentage,
      message: this.message,
      timestamp: this.timestamp,
      ...(this.trechoId && { trechoId: this.trechoId }),
      ...(this.trechoName && { trechoName: this.trechoName }),
    };
  }
}
