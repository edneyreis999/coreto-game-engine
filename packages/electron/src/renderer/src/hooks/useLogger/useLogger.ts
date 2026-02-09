/**
 * useLogger Hook
 *
 * Provides structured logging interface for React components.
 * In development mode, logs go to browser console.
 * In production, only errors are logged to avoid console pollution.
 *
 * Logs are stored in a circular buffer for local retrieval and debugging.
 *
 * Usage:
 * ```tsx
 * const logger = useLogger();
 * logger.info('Component mounted');
 * logger.error('Failed to load data');
 * const logs = logger.getLogs();
 * ```
 */

import { useMemo } from 'react';
import type { LogEntry, Logger } from './types.js';

// Re-export types for convenience
export type { LogEntry, Logger } from './types.js';

/**
 * CircularBuffer - Fixed-size buffer with FIFO eviction.
 * Thread-safe for single-threaded JavaScript environment.
 */
class CircularBuffer {
  private buffer: LogEntry[];
  private capacity: number;
  private size: number;
  private head: number;
  private tail: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
    this.size = 0;
    this.head = 0;
    this.tail = 0;
  }

  /**
   * Add entry to buffer. Evicts oldest entry if full.
   */
  push(entry: LogEntry): void {
    this.buffer[this.tail] = entry;
    this.tail = (this.tail + 1) % this.capacity;

    if (this.size < this.capacity) {
      this.size++;
    } else {
      // Buffer full, evict oldest entry
      this.head = (this.head + 1) % this.capacity;
    }
  }

  /**
   * Get all entries in order (oldest to newest).
   */
  getAll(): LogEntry[] {
    const result: LogEntry[] = [];

    for (let i = 0; i < this.size; i++) {
      const index = (this.head + i) % this.capacity;
      const entry = this.buffer[index];
      if (entry) {
        result.push(entry);
      }
    }

    return result;
  }

  /**
   * Clear all entries.
   */
  clear(): void {
    this.size = 0;
    this.head = 0;
    this.tail = 0;
  }

  /**
   * Get current buffer size.
   */
  getSize(): number {
    return this.size;
  }
}

/**
 * Singleton circular buffer for log storage.
 * Max 1000 entries with FIFO eviction.
 * Exported for console override in renderer entry point.
 */
export const logBuffer = new CircularBuffer(1000);

/**
 * Create log entry with timestamp.
 * Exported for console override in renderer entry point.
 */
export function createLogEntry(
  level: LogEntry['level'],
  message: string,
  meta?: Record<string, unknown>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta,
  };
}

/**
 * Checks if running in development mode.
 * Uses process.env.NODE_ENV which works in both Vite and Jest.
 * Vite automatically defines process.env in the browser bundle.
 */
const isDev = (): boolean => {
  return process.env.NODE_ENV !== 'production';
};

/**
 * Custom hook for structured logging in React components.
 *
 * @returns Logger instance with info, warn, error, debug methods and getLogs
 */
export function useLogger(): Logger {
  return useMemo(
    () => ({
      info: (message: string, meta?: Record<string, unknown>) => {
        const entry = createLogEntry('info', message, meta);
        logBuffer.push(entry);

        if (isDev()) {
          if (meta && Object.keys(meta).length > 0) {
            console.log(`[INFO] ${message}`, meta);
          } else {
            console.log(`[INFO] ${message}`);
          }
        }
      },

      warn: (message: string, meta?: Record<string, unknown>) => {
        const entry = createLogEntry('warn', message, meta);
        logBuffer.push(entry);

        if (isDev()) {
          if (meta && Object.keys(meta).length > 0) {
            console.warn(`[WARN] ${message}`, meta);
          } else {
            console.warn(`[WARN] ${message}`);
          }
        }
      },

      error: (message: string, meta?: Record<string, unknown>) => {
        const entry = createLogEntry('error', message, meta);
        logBuffer.push(entry);

        // Always log errors, even in production
        if (meta && Object.keys(meta).length > 0) {
          console.error(`[ERROR] ${message}`, meta);
        } else {
          console.error(`[ERROR] ${message}`);
        }
      },

      debug: (message: string, meta?: Record<string, unknown>) => {
        const entry = createLogEntry('debug', message, meta);
        logBuffer.push(entry);

        if (isDev()) {
          if (meta && Object.keys(meta).length > 0) {
            console.log(`[DEBUG] ${message}`, meta);
          } else {
            console.log(`[DEBUG] ${message}`);
          }
        }
      },

      getLogs: () => {
        return logBuffer.getAll();
      },
    }),
    []
  );
}
