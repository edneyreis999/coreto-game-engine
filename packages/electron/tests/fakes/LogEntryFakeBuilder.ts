/**
 * LogEntryFakeBuilder
 *
 * FakeBuilder pattern for creating LogEntry test data.
 * Provides fluent interface for building test fixtures with sensible defaults.
 *
 * @see packages/electron/test-health-action-plan.md Task 8
 * @see DDD FakeBuilder Pattern
 */

import type { LogEntry } from '@coreto/electron/domain/types';

/**
 * Builder for creating LogEntry instances in tests.
 *
 * @example
 * const entry = logEntryFake()
 *   .withLevel('error')
 *   .withMessage('Test error')
 *   .build();
 */
export class LogEntryFakeBuilder {
  private timestamp = new Date().toISOString();
  private level: LogEntry['level'] = 'info';
  private message = 'Test log message';
  private meta: Record<string, unknown> = {};
  private hasStack = false;
  private stack = '';

  /**
   * Sets a specific timestamp for the entry.
   * @param timestamp - ISO 8601 timestamp string
   */
  withTimestamp(timestamp: string): this {
    this.timestamp = timestamp;
    return this;
  }

  /**
   * Sets the log level for the entry.
   * @param level - Log level (debug, info, warn, error)
   */
  withLevel(level: LogEntry['level']): this {
    this.level = level;
    return this;
  }

  /**
   * Sets the message for the entry.
   * @param message - Log message string
   */
  withMessage(message: string): this {
    this.message = message;
    return this;
  }

  /**
   * Sets metadata for the entry.
   * @param meta - Metadata object
   */
  withMeta(meta: Record<string, unknown>): this {
    this.meta = meta;
    return this;
  }

  /**
   * Adds a single metadata field.
   * @param key - Metadata key
   * @param value - Metadata value
   */
  addMeta(key: string, value: unknown): this {
    this.meta[key] = value;
    return this;
  }

  /**
   * Sets a stack trace for the entry (typically for error level).
   * @param stack - Stack trace string
   */
  withStack(stack: string): this {
    this.stack = stack;
    this.hasStack = true;
    return this;
  }

  /**
   * Builds the LogEntry instance.
   * @returns A complete LogEntry object
   */
  build(): LogEntry {
    const entry: LogEntry = {
      timestamp: this.timestamp,
      level: this.level,
      message: this.message,
    };

    // Only include meta if it has properties
    if (Object.keys(this.meta).length > 0) {
      entry.meta = this.meta;
    }

    // Only include stack if it was set
    if (this.hasStack) {
      entry.stack = this.stack;
    }

    return entry;
  }
}

/**
 * Factory function for creating a new LogEntryFakeBuilder.
 *
 * @example
 * const entry = logEntryFake().build();
 * const errorEntry = logEntryFake().withLevel('error').withStack('Error...').build();
 *
 * @returns A new LogEntryFakeBuilder instance
 */
export const logEntryFake = (): LogEntryFakeBuilder => new LogEntryFakeBuilder();
