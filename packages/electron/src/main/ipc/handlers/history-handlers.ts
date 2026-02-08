/**
 * History IPC Handlers
 *
 * Handlers for simulation history operations.
 * Provides automatic history export after simulation completion.
 *
 * @see packages/electron/src/main/services/report-storage.ts
 */

import type { IpcMainInvokeEvent } from 'electron';
import { randomUUID } from 'node:crypto';

import type { IPCResult } from '../protocol-types.js';
import type { ReportData } from '../types.js';
import { HistoryExportPayloadSchema } from '../types.js';
import { wrapHandler } from '../ipc-response.js';
import { getDatabase } from '../../database/index.js';
import { ReportStorageService } from '../../services/report-storage.js';
import { getLogger } from '../../di/container.js';

/**
 * Validates an IPC payload against its Zod schema.
 */
function validatePayload<T extends unknown>(
  channel: string,
  payload: unknown,
  schema: { safeParse: (data: unknown) => { success: boolean; error?: { errors: Array<{ path: string[]; message: string }> } } }
): asserts payload is T {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new Error(`Invalid payload for ${channel}: ${errorMessages}`);
  }
}

/**
 * Response format for history:export handler.
 */
export interface HistoryExportResponse {
  filePath: string;
}

/**
 * Handler: history:export
 *
 * Exports report to file and updates database.
 * Creates detailed report (~500KB) and stores in userData/reports/.
 * This is called automatically after simulation completion.
 */
export async function handleHistoryExport(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<HistoryExportResponse>> {
  return wrapHandler(async () => {
    validatePayload('history:export', payload, HistoryExportPayloadSchema);

    const { simulationId, result, projectPath } = payload;

    const logger = getLogger();
    const db = getDatabase();
    const service = new ReportStorageService(db);

    logger.info(
      `[History Export] Saving simulation: id=${simulationId}, project=${projectPath}`
    );

    // Store summary in database
    await service.storeSimulation(simulationId, projectPath, result, 'SUCCESS');

    // Export full report to file
    const filePath = await service.exportReport(simulationId, result, projectPath);

    logger.info(`[History Export] Report saved to: ${filePath}`);

    return {
      filePath,
    };
  });
}

/**
 * Generates a unique simulation ID for a new simulation.
 * Uses UUID v4 for uniqueness.
 *
 * @returns Unique simulation identifier
 */
export function generateSimulationId(): string {
  return randomUUID();
}

/**
 * Helper function to save simulation results to history.
 * This is called internally by the simulation handler after completion.
 *
 * Errors are logged but do not throw (history is non-critical).
 *
 * @param simulationId - Unique simulation identifier
 * @param result - Full simulation result data
 * @param projectPath - Path to RPG Maker MZ project
 */
export async function saveSimulationToHistory(
  simulationId: string,
  result: ReportData,
  projectPath: string
): Promise<void> {
  const logger = getLogger();

  try {
    const db = getDatabase();
    const service = new ReportStorageService(db);

    logger.info(
      `[History Export] Saving simulation: id=${simulationId}, project=${projectPath}`
    );

    // Store summary in database
    await service.storeSimulation(simulationId, projectPath, result, 'SUCCESS');

    // Export full report to file
    const filePath = await service.exportReport(simulationId, result, projectPath);

    logger.info(`[History Export] Report saved to: ${filePath}`);
  } catch (error) {
    // Log error but don't throw - history is non-critical
    logger.error(
      `[History Export] Failed to save simulation to history: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
