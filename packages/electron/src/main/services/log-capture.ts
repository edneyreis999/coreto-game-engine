/**
 * Log Capture Service for Main Process
 *
 * Provides circular buffer-based log capture with console override.
 * Captures all console output (log, warn, error, debug) for later export.
 *
 * @module log-capture
 */

/**
 * Log entry structure matching techspec specification.
 */
export interface LogEntry {
  timestamp: string; // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error';
  source: 'main' | 'renderer';
  message: string;
  meta?: Record<string, unknown>;
  stack?: string; // For errors
}

/**
 * Log bundle structure for export.
 */
export interface LogBundle {
  id: string; // UUID
  timestamp: string; // ISO 8601
  appVersion: string;
  electronVersion: string;
  platform: string;
  projectPath?: string;
  logs: LogEntry[];
  userActions?: string[]; // Phase 2
  stateSnapshot?: unknown; // Phase 2
}

/**
 * Circular buffer with FIFO eviction policy.
 *
 * @template T - Type of elements stored in the buffer
 */
class CircularBuffer<T> {
  private buffer: T[] = [];
  private readonly maxSize: number;

  /**
   * Creates a new circular buffer.
   *
   * @param maxSize - Maximum number of entries before FIFO eviction (default: 1000)
   */
  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * Adds an entry to the buffer, evicting the oldest entry if at capacity.
   *
   * @param entry - Entry to add
   */
  push(entry: T): void {
    this.buffer.push(entry);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift(); // FIFO eviction
    }
  }

  /**
   * Returns all entries currently in the buffer.
   *
   * @returns Copy of the buffer array
   */
  getAll(): T[] {
    return [...this.buffer];
  }

  /**
   * Clears all entries from the buffer.
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Returns the current number of entries in the buffer.
   *
   * @returns Current buffer size
   */
  size(): number {
    return this.buffer.length;
  }
}

/**
 * Log capture service with console override.
 *
 * Extends CircularBuffer to store LogEntry objects and intercepts
 * console calls to capture all output.
 */
class LogCapture extends CircularBuffer<LogEntry> {
  private originalConsole: Partial<typeof console> = {};
  private initialized = false;

  /**
   * Initializes console override to capture all logs.
   *
   * Preserves original console methods for forwarding calls.
   * Must be called once at application startup.
   */
  initialize(): void {
    if (this.initialized) {
      return; // Prevent double initialization
    }

    // Preserve original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };

    // Override console.log
    const self = this;
    console.log = (...args: unknown[]) => {
      self.addEntry({
        timestamp: new Date().toISOString(),
        level: 'info',
        source: 'main',
        message: self.formatMessage(args),
      });
      self.originalConsole.log(...args);
    };

    // Override console.warn
    console.warn = (...args: unknown[]) => {
      self.addEntry({
        timestamp: new Date().toISOString(),
        level: 'warn',
        source: 'main',
        message: self.formatMessage(args),
      });
      self.originalConsole.warn(...args);
    };

    // Override console.error
    console.error = (...args: unknown[]) => {
      const message = self.formatMessage(args);
      const stack = self.extractStack(args);
      self.addEntry({
        timestamp: new Date().toISOString(),
        level: 'error',
        source: 'main',
        message,
        stack,
      });
      self.originalConsole.error(...args);
    };

    // Override console.debug
    console.debug = (...args: unknown[]) => {
      self.addEntry({
        timestamp: new Date().toISOString(),
        level: 'debug',
        source: 'main',
        message: self.formatMessage(args),
      });
      self.originalConsole.debug(...args);
    };

    this.initialized = true;
  }

  /**
   * Adds a log entry to the buffer.
   *
   * @param entry - Log entry to add
   */
  addEntry(entry: LogEntry): void {
    this.push(entry);
  }

  /**
   * Formats console arguments into a string message.
   *
   * @param args - Console arguments
   * @returns Formatted message string
   */
  private formatMessage(args: unknown[]): string {
    return args
      .map((arg) => {
        if (arg instanceof Error) {
          return arg.message;
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
  }

  /**
   * Extracts stack trace from error arguments if present.
   *
   * @param args - Console arguments
   * @returns Stack trace string or undefined
   */
  private extractStack(args: unknown[]): string | undefined {
    for (const arg of args) {
      if (arg instanceof Error && arg.stack) {
        return arg.stack;
      }
    }
    return undefined;
  }

  /**
   * Returns whether console override has been initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Log aggregator for creating export bundles.
 *
 * Aggregates logs from both main and renderer processes
 * into a unified LogBundle with application metadata.
 */
class LogAggregator {
  private rendererLogs: LogEntry[] = [];

  /**
   * Adds renderer process logs to the aggregator.
   *
   * Called via IPC when renderer sends its buffered logs.
   *
   * @param logs - Array of log entries from renderer
   */
  addRendererLogs(logs: LogEntry[]): void {
    this.rendererLogs = logs;
  }

  /**
   * Clears renderer logs buffer.
   */
  clearRendererLogs(): void {
    this.rendererLogs = [];
  }

  /**
   * Creates a LogBundle with aggregated logs and metadata.
   *
   * @param projectPath - Optional project path for context
   * @returns Complete LogBundle ready for export
   */
  createBundle(projectPath?: string): LogBundle {
    const mainCapture = logCapture;
    const mainLogs = mainCapture.getAll();

    // Merge logs by timestamp
    const allLogs = [...mainLogs, ...this.rendererLogs].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );

    return {
      id: this.generateUUID(),
      timestamp: new Date().toISOString(),
      appVersion: this.getAppVersion(),
      electronVersion: process.versions.electron || 'unknown',
      platform: process.platform,
      projectPath,
      logs: allLogs,
    };
  }

  /**
   * Generates a random UUID v4.
   *
   * @returns UUID string
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Gets the application version from package.json.
   *
   * @returns Version string or 'unknown'
   */
  private getAppVersion(): string {
    try {
      // Try to read from package.json
      const packagePath = require.resolve('../../../../package.json');
      const pkg = require(packagePath);
      return pkg.version || 'unknown';
    } catch {
      return 'unknown';
    }
  }
}

// Singleton instances
export const logCapture = new LogCapture();
export const logAggregator = new LogAggregator();

/**
 * Initializes log capture in the main process.
 *
 * This function should be called once at application startup
 * (before app.whenReady()) to ensure all logs are captured.
 *
 * @example
 * ```typescript
 * import { initializeLogCapture } from './services/log-capture';
 *
 * // Call early in main/index.ts
 * initializeLogCapture();
 * await app.whenReady();
 * ```
 */
export function initializeLogCapture(): void {
  logCapture.initialize();
}
