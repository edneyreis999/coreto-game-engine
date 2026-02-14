/**
 * Logs IPC Handlers
 *
 * Handlers for exporting application logs from both main and renderer processes.
 * Aggregates logs into LogBundle format and triggers file download.
 *
 * @see planos/017-botao-export-logs/tasks/techspec.md Section 2.3
 * @see main/ipc/handlers/simulation.ts for handler pattern reference
 */

import type { IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';

import type { IPCResult } from '../protocol-types.js';
import { wrapHandler } from '../ipc-response.js';
import { getLogger } from '../../di/container.js';
import { logAggregator } from '../../services/log-capture.js';

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response format for logs:export handler.
 *
 * Success response includes download path and stats.
 * Error response includes error code and message.
 */
export interface LogsExportResponse {
  downloadPath: string;
  mainLogCount: number;
  rendererLogCount: number;
  totalCount: number;
}

// ============================================================================
// Handler: logs:flushRendererLogs
// ============================================================================

/**
 * Handler: logs:flushRendererLogs
 *
 * Receives renderer process logs via IPC and stores them in aggregator.
 * Called by renderer before export to ensure logs are included in bundle.
 *
 * Flow:
 * 1. Parse and validate payload schema
 * 2. Sanitize log entries (defense in depth)
 * 3. Add logs to aggregator via logAggregator.addRendererLogs()
 * 4. Return success confirmation
 *
 * Error Handling:
 * - Invalid schema returns error with validation details
 * - Sanitization failures are logged but don't block operation
 *
 * @returns IPCResult<void> on success
 */
export async function handleLogsFlushRenderer(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<void>> {
  return wrapHandler(async () => {
    const logger = getLogger();

    // Validate payload structure (basic validation)
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload: must be an object');
    }

    const { logs } = payload as { logs?: unknown[] };

    if (!Array.isArray(logs)) {
      throw new Error('Invalid payload: logs must be an array');
    }

    // Sanitize logs (defense in depth - prevent serialization failures)
    const sanitized = logs.map((entry) => ({
      ...entry,
      message: String(entry?.message ?? ''),
    }));

    // Add to aggregator
    logAggregator.addRendererLogs(sanitized);

    logger.info(`[IPC] Received ${sanitized.length} renderer logs`);
  });
}

// ============================================================================
// Handler: logs:export
// ============================================================================

/**
 * Handler: logs:export
 *
 * Exports aggregated logs from both main and renderer processes.
 * Creates LogBundle with metadata and saves to temp directory.
 * Logs are separated by source (mainLogs, rendererLogs) for easier analysis.
 *
 * Flow:
 * 1. Call logAggregator.createBundle() to get separated logs
 * 2. Generate filename: coreto-logs-{timestamp}.json
 * 3. Write to project reports directory
 * 4. Return IPCResult success with stats and download path
 *
 * Error Handling:
 * - Log aggregation failures return success=false with error code
 * - File write failures return success=false with error code
 * - All errors are logged via ILogger
 *
 * @returns IPCResult<LogsExportResponse> with stats and download path
 */
export async function handleLogsExport(
  _event: IpcMainInvokeEvent,
  _payload: unknown
): Promise<IPCResult<LogsExportResponse>> {
  return wrapHandler(async () => {
    const logger = getLogger();

    logger.info('[IPC] Starting logs export');

    // Step 1: Aggregate logs from both processes (separated by source)
    const bundle = logAggregator.createBundle();

    const mainLogCount = bundle.mainLogs.length;
    const rendererLogCount = bundle.rendererLogs.length;
    const totalCount = mainLogCount + rendererLogCount;

    logger.info(
      `[IPC] Log bundle created: id=${bundle.id}, main=${mainLogCount}, renderer=${rendererLogCount}, total=${totalCount}`
    );

    // Step 2: Generate filename with timestamp
    const timestamp = Date.now();
    const filename = `coreto-logs-${timestamp}.json`;

    // Step 3: Write to project reports directory
    // In production: use monorepo root reports directory
    // In tests: detect test environment and use appropriate path
    const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
    const reportsDir = isTest
      ? path.resolve(process.cwd(), 'reports', 'application-logs')
      : path.resolve(__dirname, '..', '..', '..', '..', '..', 'reports', 'application-logs');
    const downloadPath = path.join(reportsDir, filename);

    // Ensure directory exists
    await fs.mkdir(reportsDir, { recursive: true });

    logger.info(`[IPC] Writing log bundle to: ${downloadPath}`);

    // Step 4: Write file with pretty-printed JSON
    await fs.writeFile(downloadPath, JSON.stringify(bundle, null, 2), 'utf-8');

    logger.info(`[IPC] Logs export completed: ${downloadPath}`);

    // Step 5: Return success response with stats and path
    return {
      downloadPath,
      mainLogCount,
      rendererLogCount,
      totalCount,
    };
  });
}
