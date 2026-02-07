/**
 * History IPC Handlers
 *
 * IPC handlers for simulation history operations.
 * Provides access to stored simulation summaries and reports.
 *
 * @see packages/electron/src/main/services/report-storage.ts
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { z } from 'zod';

import type { IPCError, IPCResult } from './protocol-types.js';
import type { IPCResponse } from './types.js';
import { getDatabase } from '../database/index.js';
import { ReportStorageService, generateSimulationId } from '../services/report-storage.js';
import type { SimulationReport, SimulationSummary } from '../services/types.js';

// ============================================================================
// Error Serialization
// ============================================================================

/**
 * Converts an error to IPC-safe error format.
 */
function serializeError(error: unknown): IPCError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      severity: 'critical',
      context: {},
      timestamp: new Date().toISOString(),
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
    severity: 'critical',
    context: {},
    timestamp: new Date().toISOString(),
  };
}

/**
 * Wraps a handler function with error handling and response formatting.
 */
function withErrorHandling<T extends IPCResponse>(
  handler: () => Promise<T>
): Promise<IPCResult<T>> {
  return handler()
    .then((data) => ({ success: true, data }) as IPCResult<T>)
    .catch(
      (error: unknown) =>
        ({
          success: false,
          error: serializeError(error),
        }) as IPCResult<T>
    );
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response format for history:list handler.
 */
export interface HistoryListResponse {
  simulations: Array<{
    id: string;
    projectPath: string;
    timestamp: number;
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
    summary: SimulationSummary;
    hasReport: boolean;
  }>;
}

/**
 * Response format for history:loadReport handler.
 */
export interface HistoryLoadReportResponse {
  report: SimulationReport | null;
}

/**
 * Response format for history:export handler.
 */
export interface HistoryExportResponse {
  filePath: string;
}

/**
 * Response format for history:delete handler.
 */
export interface HistoryDeleteResponse {
  deletedId: string;
}

/**
 * Response format for history:generateId handler.
 */
export interface HistoryGenerateIdResponse {
  simulationId: string;
}

// ============================================================================
// Payload Schemas
// ============================================================================

/**
 * Zod schema for history:list payload.
 */
export const HistoryListPayloadSchema = z.object({
  projectPath: z.string().optional(),
  limit: z.number().int().positive().optional(),
});

/**
 * Zod schema for history:loadReport payload.
 */
export const HistoryLoadReportPayloadSchema = z.object({
  simulationId: z.string().uuid(),
});

/**
 * Zod schema for history:export payload.
 */
export const HistoryExportPayloadSchema = z.object({
  simulationId: z.string().uuid(),
  result: z.any(), // ReportData from ipc/types.ts
  projectPath: z.string().min(1),
});

/**
 * Zod schema for history:delete payload.
 */
export const HistoryDeletePayloadSchema = z.object({
  simulationId: z.string().uuid(),
});

// ============================================================================
// Handler Functions
// ============================================================================

/**
 * Handler: history:list
 *
 * Gets simulation history list (summaries only).
 * Returns lightweight data without loading full reports.
 */
async function handleHistoryList(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<HistoryListResponse>> {
  return withErrorHandling(async () => {
    const validated = HistoryListPayloadSchema.parse(payload ?? {});
    const { projectPath, limit = 50 } = validated;

    const db = getDatabase();
    const service = new ReportStorageService(db);

    const history = await service.getHistory(projectPath, limit);

    return {
      simulations: history.map((entry) => ({
        id: entry.simulationId,
        projectPath: entry.projectPath,
        timestamp: entry.timestamp,
        status: entry.status,
        summary: entry.summary,
        hasReport: entry.reportFilePath !== null,
      })),
    };
  });
}

/**
 * Handler: history:loadReport
 *
 * Loads detailed report from file (if exists).
 * Returns null if report was not exported.
 */
async function handleHistoryLoadReport(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<HistoryLoadReportResponse>> {
  return withErrorHandling(async () => {
    const validated = HistoryLoadReportPayloadSchema.parse(payload);
    const { simulationId } = validated;

    const db = getDatabase();
    const service = new ReportStorageService(db);

    const report = await service.loadReport(simulationId);

    return {
      report,
    };
  });
}

/**
 * Handler: history:export
 *
 * Exports report to file and updates database.
 * Creates detailed report (~500KB) and stores in userData/reports/.
 */
async function handleHistoryExport(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<HistoryExportResponse>> {
  return withErrorHandling(async () => {
    const validated = HistoryExportPayloadSchema.parse(payload);
    const { simulationId, result, projectPath } = validated;

    const db = getDatabase();
    const service = new ReportStorageService(db);

    const filePath = await service.exportReport(simulationId, result, projectPath);

    return {
      filePath,
    };
  });
}

/**
 * Handler: history:delete
 *
 * Deletes a simulation record and its report file.
 */
async function handleHistoryDelete(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<HistoryDeleteResponse>> {
  return withErrorHandling(async () => {
    const validated = HistoryDeletePayloadSchema.parse(payload);
    const { simulationId } = validated;

    const db = getDatabase();
    const service = new ReportStorageService(db);

    await service.deleteSimulation(simulationId);

    return {
      deletedId: simulationId,
    };
  });
}

/**
 * Handler: history:generateId
 *
 * Generates a unique simulation ID for a new simulation.
 * Called before starting a simulation to get a unique identifier.
 */
async function handleHistoryGenerateId(
  _event: IpcMainInvokeEvent,
  _payload: unknown
): Promise<IPCResult<HistoryGenerateIdResponse>> {
  return withErrorHandling(async () => {
    const simulationId = generateSimulationId();

    return {
      simulationId,
    };
  });
}

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * Map of history IPC channel names to their handler functions.
 */
export const HISTORY_IPC_HANDLERS: Record<
  string,
  (event: IpcMainInvokeEvent, payload: unknown) => Promise<IPCResult>
> = {
  'history:list': handleHistoryList,
  'history:loadReport': handleHistoryLoadReport,
  'history:export': handleHistoryExport,
  'history:delete': handleHistoryDelete,
  'history:generateId': handleHistoryGenerateId,
};

/**
 * Registers all history IPC handlers with ipcMain.
 * Called during main process initialization.
 */
export function registerHistoryHandlers(): void {
  Object.entries(HISTORY_IPC_HANDLERS).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler);
  });
}
