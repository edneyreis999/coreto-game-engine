/**
 * Domain Types - Logs
 *
 * Structured logging types for capturing and bundling log entries across
 * main and renderer processes. These types enable consistent log capture,
 * transport, and analysis for debugging and monitoring.
 *
 * @module domain/types/logs
 */

/**
 * Log level severity for categorizing log entries.
 *
 * @example
 * const entry: LogEntry = {
 *   timestamp: '2026-02-08T10:30:00.000Z',
 *   level: 'error',
 *   source: 'main',
 *   message: 'Database connection failed',
 *   stack: 'Error: ...'
 * };
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Process source identifier for log entries.
 *
 * Enables distinguishing between logs from different Electron processes.
 *
 * @example
 * const mainLog: LogEntry = { source: 'main', ... };
 * const rendererLog: LogEntry = { source: 'renderer', ... };
 */
export type LogSource = 'main' | 'renderer';

/**
 * Represents a single structured log entry.
 *
 * LogEntries capture individual log events with full context including
 * timestamp, severity level, source process, message, optional metadata,
 * and optional stack trace for error conditions.
 *
 * @example
 * const entry: LogEntry = {
 *   timestamp: new Date().toISOString(),
 *   level: 'info',
 *   source: 'main',
 *   message: 'Project loaded successfully',
 *   meta: { projectId: 'abc-123', path: '/path/to/project' }
 * };
 *
 * @example
 * const errorEntry: LogEntry = {
 *   timestamp: '2026-02-08T10:30:00.000Z',
 *   level: 'error',
 *   source: 'renderer',
 *   message: 'Failed to render component',
 *   stack: 'Error: Invalid prop\n  at Component ...',
 *   meta: { component: 'ExecutionPanel', props: { ... } }
 * };
 */
export interface LogEntry {
  /**
   * ISO 8601 timestamp when the log entry was created.
   *
   * Format: `YYYY-MM-DDTHH:mm:ss.sssZ`
   *
   * @example
   * '2026-02-08T10:30:00.000Z'
   */
  timestamp: string;

  /**
   * Severity level of the log entry.
   *
   * - `debug`: Detailed diagnostic information for troubleshooting
   * - `info`: General informational messages about normal operation
   * - `warn`: Warning messages for potentially harmful situations
   * - `error`: Error messages for critical failures and exceptions
   *
   * @example
   * 'error'
   */
  level: LogLevel;

  /**
   * Process where the log entry originated.
   *
   * - `main`: Node.js main process (database, IPC, workers)
   * - `renderer`: Chromium renderer process (React UI, user interactions)
   *
   * @example
   * 'main'
   */
  source: LogSource;

  /**
   * Human-readable log message describing the event or condition.
   *
   * Should be concise but descriptive enough for debugging and monitoring.
   *
   * @example
   * 'Database connection established'
   * @example
   * 'Failed to load project configuration: Invalid JSON'
   */
  message: string;

  /**
   * Optional structured metadata associated with the log entry.
   *
   * Provides contextual information for debugging and analysis.
   * Common uses include request IDs, user actions, performance metrics,
   * or any relevant domain-specific data.
   *
   * @example
   * { projectId: 'abc-123', action: 'load', duration: 1250 }
   * @example
   * { component: 'ConfigurationPanel', props: { trechoId: 5 } }
   */
  meta?: Record<string, unknown>;

  /**
   * Optional stack trace for error-level log entries.
   *
   * Should be included when `level` is `'error'` to enable debugging
   * of exceptions and failures. For other log levels, this field
   * should typically be omitted.
   *
   * @example
   * 'Error: Database locked\n  at Database.query (db.js:42)\n  ...'
   */
  stack?: string;
}

/**
 * Represents a bundle of log entries for transport and persistence.
 *
 * LogBundles aggregate multiple LogEntries with metadata about the
 * application environment, enabling comprehensive debugging sessions
 * and log export functionality.
 *
 * @example
 * const bundle: LogBundle = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   timestamp: '2026-02-08T10:30:00.000Z',
 *   appVersion: '1.0.0',
 *   electronVersion: '33.0.0',
 *   platform: 'darwin',
 *   projectPath: '/path/to/rmmz/project',
 *   logs: [entry1, entry2, entry3]
 * };
 */
export interface LogBundle {
  /**
   * Unique identifier for this log bundle.
   *
   * Generated as a UUID v4 to ensure uniqueness across all bundles.
   * Used for deduplication, tracking, and referencing specific bundles.
   *
   * @example
   * '550e8400-e29b-41d4-a716-446655440000'
   */
  id: string;

  /**
   * ISO 8601 timestamp when the log bundle was created.
   *
   * Represents the bundle creation time, which may differ from
   * individual log entry timestamps. Format: `YYYY-MM-DDTHH:mm:ss.sssZ`
   *
   * @example
   * '2026-02-08T10:30:00.000Z'
   */
  timestamp: string;

  /**
   * Application version string.
   *
   * Retrieved from package.json or app.getVersion(). Useful for
   * identifying which application version produced the logs.
   *
   * @example
   * '1.0.0'
   * @example
   * '0.5.2-beta'
   */
  appVersion: string;

  /**
   * Electron runtime version.
   *
   * Identifies the Electron version the application was running on,
   * which is critical for diagnosing platform-specific issues.
   *
   * @example
   * '33.0.0'
   */
  electronVersion: string;

  /**
   * Operating system platform identifier.
   *
   * Standard Node.js `process.platform` values: 'darwin', 'linux', 'win32'
   *
   * @example
   * 'darwin'
   * @example
   * 'win32'
   */
  platform: string;

  /**
   * Optional RPG Maker MZ project path associated with the log bundle.
   *
   * Included when logs are generated in the context of a specific project.
   * Useful for filtering logs by project and reproducing issues.
   *
   * @example
   * '/path/to/rmmz/project'
   */
  projectPath?: string;

  /**
   * Array of log entries contained in this bundle.
   *
   * Entries are typically ordered chronologically (newest first or
   * oldest first depending on use case). Each entry includes full
   * context with timestamp, level, source, message, and optional metadata.
   *
   * @example
   * [
   *   { timestamp: '...', level: 'info', source: 'main', message: '...' },
   *   { timestamp: '...', level: 'error', source: 'renderer', message: '...', stack: '...' }
   * ]
   */
  logs: LogEntry[];
}
