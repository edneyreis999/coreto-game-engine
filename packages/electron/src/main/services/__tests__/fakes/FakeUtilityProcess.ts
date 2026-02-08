/**
 * Fake UtilityProcess for testing SimulationController.
 *
 * Implements an in-memory worker that simulates Electron's UtilityProcess
 * without requiring actual process spawning. Uses EventEmitter to simulate
 * worker events and tracks all interactions for test assertions.
 *
 * @see packages/electron/src/main/services/simulation-controller.ts
 * @see electron#utilityProcess
 */

import { EventEmitter } from 'events';
import type {
  MainToWorkerMessage,
  WorkerToMainMessage,
  ErrorPayload,
} from '../../../workers/types.js';

/**
 * Fake stdout stream that tracks data writes.
 */
interface FakeStdioStream {
  on: jest.Mock;
  data: Buffer[];
}

/**
 * In-memory implementation of Electron's UtilityProcess.
 *
 * Simulates worker behavior without spawning actual processes.
 * All events are emitted synchronously for predictable testing.
 */
export class FakeUtilityProcess extends EventEmitter {
  public killed = false;
  public stdin: FakeStdioStream;
  public stdout: FakeStdioStream;
  public stderr: FakeStdioStream;
  private messages: MainToWorkerMessage[] = [];

  constructor() {
    super();
    this.stdin = this.createStream();
    this.stdout = this.createStream();
    this.stderr = this.createStream();
  }

  /**
   * Sends a message to the worker process.
   * Tracks all messages for test assertions.
   */
  postMessage(message: MainToWorkerMessage): void {
    if (this.killed) {
      throw new Error('Cannot send message to killed worker');
    }
    this.messages.push(message);

    // Simulate immediate worker processing
    this.processMessage(message);
  }

  /**
   * Registers an event handler for worker events.
   * Compatible with EventEmitter 'on' syntax.
   */
  on(event: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }

  /**
   * Registers a one-time event handler.
   */
  once(event: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.once(event, listener);
  }

  /**
   * Kills the worker process.
   * Emits 'exit' event with code 0.
   */
  kill(): void {
    if (this.killed) {
      return;
    }
    this.killed = true;
    this.emit('exit', 0);
  }

  /**
   * Simulates a worker crash.
   * Emits 'exit' event with non-zero code.
   */
  crash(exitCode: number): void {
    if (this.killed) {
      return;
    }
    this.killed = true;
    this.emit('exit', exitCode);
  }

  /**
   * Simulates receiving a message from the worker.
   * Use this to test controller's message handling.
   */
  receiveMessage(message: WorkerToMainMessage): void {
    this.emit('message', message);
  }

  /**
   * Simulates a progress event from the worker.
   */
  emitProgress(stage: string, current: number, total: number, message: string): void {
    this.receiveMessage({
      type: 'progress',
      payload: {
        stage,
        current,
        total,
        percentage: Math.floor((current / total) * 100),
        message,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Simulates a completion event from the worker.
   */
  emitComplete(simulationId: string, projectPath: string): void {
    this.receiveMessage({
      type: 'complete',
      payload: {
        simulationId,
        projectPath,
        report: {} as ReportData, // Minimal report
        duration: 1000,
        seed: 12345,
      },
    });
  }

  /**
   * Simulates an error event from the worker.
   */
  emitError(title: string, description: string, code?: string): void {
    const payload: ErrorPayload = {
      title,
      description,
      ...(code !== undefined && { code }),
    };
    this.receiveMessage({
      type: 'error',
      payload,
    });
  }

  /**
   * Gets all messages sent to this worker.
   */
  getMessages(): MainToWorkerMessage[] {
    return [...this.messages];
  }

  /**
   * Clears message history.
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Checks if a specific message type was sent.
   */
  hasMessageType(type: MainToWorkerMessage['type']): boolean {
    return this.messages.some((m) => m.type === type);
  }

  /**
   * Processes a message (simulates worker behavior).
   * Override in subclasses for specific test scenarios.
   */
  protected processMessage(_message: MainToWorkerMessage): void {
    // Default: no auto-response
    // Tests call receiveMessage/emit* methods explicitly
  }

  /**
   * Creates a fake stdio stream.
   */
  private createStream(): FakeStdioStream {
    const stream = {
      on: jest.fn(),
      data: [] as Buffer[],
    };
    return stream;
  }
}
