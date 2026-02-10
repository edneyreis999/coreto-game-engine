/**
 * Log Entry Types
 *
 * Type definitions for the logging system.
 * Separated from implementation for better organization.
 */

/**
 * Single log entry stored in the circular buffer.
 */
export interface LogEntry {
  /** ISO 8601 timestamp */
  timestamp: string;

  /** Log level */
  level: 'info' | 'warn' | 'error' | 'debug';

  /** Process source (always 'renderer' for renderer logs) */
  source: 'renderer';

  /** Formatted log message */
  message: string;

  /** Optional metadata context */
  meta?: Record<string, unknown>;
}

/**
 * Logger interface for React components.
 * Provides structured logging with automatic buffer storage.
 */
export interface Logger {
  /** Log info message (development only) */
  info: (message: string, meta?: Record<string, unknown>) => void;

  /** Log warning message (development only) */
  warn: (message: string, meta?: Record<string, unknown>) => void;

  /** Log error message (always logged, even in production) */
  error: (message: string, meta?: Record<string, unknown>) => void;

  /** Log debug message (development only) */
  debug: (message: string, meta?: Record<string, unknown>) => void;

  /** Retrieve all logs from the circular buffer */
  getLogs: () => LogEntry[];
}
