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
import type { LogBundle } from '@coreto/electron/domain/types';
import { wrapHandler } from '../ipc-response.js';
import { getLogger } from '../../di/container.js';
import { logAggregator } from '../../services/log-capture.js';

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response format for logs:export handler.
 *
 * Success response includes the complete log bundle and download path.
 * Error response includes error code and message.
 */
export interface LogsExportResponse {
  bundle: LogBundle;
  downloadPath: string;
}

// ============================================================================
// Handler: logs:export
// ============================================================================

/**
 * Handler: logs:export
 *
 * Exports aggregated logs from both main and renderer processes.
 * Creates LogBundle with metadata and saves to temp directory.
 *
 * Flow:
 * 1. Call logAggregator.createBundle() to get merged logs
 * 2. Generate filename: coreto-logs-{timestamp}.json
 * 3. Write to temp directory using electron.app.getPath('temp')
 * 4. Return IPCResult success with bundle + downloadPath
 *
 * Error Handling:
 * - Log aggregation failures return success=false with error code
 * - File write failures return success=false with error code
 * - All errors are logged via ILogger
 *
 * @returns IPCResult<LogsExportResponse> with bundle and download path
 */
export async function handleLogsExport(
  _event: IpcMainInvokeEvent,
  _payload: unknown
): Promise<IPCResult<LogsExportResponse>> {
  return wrapHandler(async () => {
    const logger = getLogger();

    logger.info('[IPC] Starting logs export');

    // Step 1: Aggregate logs from both processes
    // Uses real LogAggregator from log-capture service
    const bundle = logAggregator.createBundle();

    logger.info(
      `[IPC] Log bundle created: id=${bundle.id}, entries=${bundle.logs.length}`
    );

    // Step 2: Generate filename with timestamp
    const timestamp = Date.now();
    const filename = `coreto-logs-${timestamp}.json`;

    // Step 3: Write to project reports directory
    // Save to project directory for easy access
    const reportsDir = path.join(process.cwd(), 'reports', 'application-logs');
    const downloadPath = path.join(reportsDir, filename);

    // Ensure directory exists
    await fs.mkdir(reportsDir, { recursive: true });

    logger.info(`[IPC] Writing log bundle to: ${downloadPath}`);

    // Step 4: Write file with pretty-printed JSON
    await fs.writeFile(downloadPath, JSON.stringify(bundle, null, 2), 'utf-8');

    logger.info(`[IPC] Logs export completed: ${downloadPath}`);

    // Step 5: Return success response with bundle and path
    return {
      bundle,
      downloadPath,
    };
  });
}
