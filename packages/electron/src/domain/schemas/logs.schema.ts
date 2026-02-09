/**
 * Log Schemas - Zod Validation Schemas for Log Export Feature
 *
 * Provides runtime type safety for IPC communication of log data between
 * main and renderer processes.
 *
 * @see planos/017-botao-export-logs/tasks/techspec.md Section 2.1
 * @see main/ipc/protocol-types.ts for IPCResult pattern
 */

import { z } from 'zod';

// ============================================================================
// LogEntry Schema
// ============================================================================

/**
 * Zod schema for a single log entry.
 *
 * Validates log entries with strict type checking for:
 * - timestamp: ISO 8601 format
 * - level: Only valid log levels (debug, info, warn, error)
 * - source: Process origin (main, renderer)
 * - message: Non-empty string
 * - meta: Optional metadata object
 * - stack: Optional stack trace for errors
 */
export const LogEntrySchema = z.object({
  /**
   * ISO 8601 timestamp string.
   * Example: "2026-02-08T14:30:00.000Z"
   */
  timestamp: z.string().datetime({
    message: 'Timestamp must be a valid ISO 8601 datetime string',
  }),

  /**
   * Log level - must be one of the four supported levels.
   * Rejects invalid levels like 'critical', 'trace', etc.
   */
  level: z.enum(['debug', 'info', 'warn', 'error'], {
    errorMap: () => ({ message: 'Level must be one of: debug, info, warn, error' }),
  }),

  /**
   * Source process that generated the log.
   */
  source: z.enum(['main', 'renderer'], {
    errorMap: () => ({ message: 'Source must be either "main" or "renderer"' }),
  }),

  /**
   * Log message - must be non-empty.
   */
  message: z.string().min(1, 'Message is required'),

  /**
   * Optional metadata associated with the log entry.
   * Can contain any JSON-serializable data.
   */
  meta: z.record(z.string(), z.unknown()).optional(),

  /**
   * Optional stack trace for error-level logs.
   */
  stack: z.string().optional(),
});

/**
 * TypeScript type inferred from LogEntrySchema.
 */
export type LogEntryDTO = z.infer<typeof LogEntrySchema>;

// ============================================================================
// LogBundle Schema
// ============================================================================

/**
 * Zod schema for a complete log bundle.
 *
 * Validates log bundles exported from the application containing
 * metadata and an array of log entries.
 */
export const LogBundleSchema = z.object({
  /**
   * Unique identifier for this log bundle (UUID v4 format).
   * Used for tracking and deduplication.
   */
  id: z.string().uuid({
    message: 'ID must be a valid UUID v4',
  }),

  /**
   * ISO 8601 timestamp when the bundle was created.
   */
  timestamp: z.string().datetime({
    message: 'Timestamp must be a valid ISO 8601 datetime string',
  }),

  /**
   * Application version string (from package.json).
   * Example: "1.0.0"
   */
  appVersion: z.string().min(1, 'App version is required'),

  /**
   * Electron version string.
   * Example: "33.0.0"
   */
  electronVersion: z.string().min(1, 'Electron version is required'),

  /**
   * Platform identifier (darwin, win32, linux).
   */
  platform: z.enum(['darwin', 'win32', 'linux'], {
    errorMap: () => ({ message: 'Platform must be one of: darwin, win32, linux' }),
  }),

  /**
   * Optional project path if a project is currently open.
   * Helps identify which project the logs are associated with.
   */
  projectPath: z.string().optional(),

  /**
   * Array of log entries included in this bundle.
   * Must be present but can be empty (no logs captured).
   */
  logs: z.array(LogEntrySchema),

  /**
   * Optional array of user action breadcrumbs (Phase 2 feature).
   * Currently reserved for future use.
   */
  userActions: z.array(z.string()).optional(),

  /**
   * Optional state snapshot for debugging (Phase 2 feature).
   * Currently reserved for future use.
   */
  stateSnapshot: z.unknown().optional(),
});

/**
 * TypeScript type inferred from LogBundleSchema.
 */
export type LogBundleDTO = z.infer<typeof LogBundleSchema>;

// ============================================================================
// LogsExportResponse Schema (IPCResult Pattern)
// ============================================================================

/**
 * Zod schema for the logs export IPC response.
 *
 * Follows the IPCResult discriminated union pattern with a boolean success field.
 * This ensures type-safe response handling in IPC communication.
 *
 * Success response includes bundle and download path.
 * Error response includes error code and message.
 */
export const LogsExportResponseSchema = z.discriminatedUnion('success', [
  // Success response variant
  z.object({
    success: z.literal(true),
    data: z.object({
      bundle: LogBundleSchema,
      downloadPath: z.string().min(1, 'Download path is required'),
    }),
  }),
  // Error response variant
  z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string().min(1, 'Error code is required'),
      message: z.string().min(1, 'Error message is required'),
    }),
  }),
]);

/**
 * TypeScript type inferred from LogsExportResponseSchema.
 */
export type LogsExportResponseDTO = z.infer<typeof LogsExportResponseSchema>;
