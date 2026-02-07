/**
 * Recent Projects IPC Handlers
 *
 * Handlers for managing recent projects list.
 */

import type { IpcMainInvokeEvent } from 'electron';

import type { IPCResult } from '../protocol-types.js';
import type { RecentListResponse, RecentAddResponse } from '../types.js';
import { RecentListPayloadSchema, RecentAddPayloadSchema } from '../types.js';
import { wrapHandler } from '../ipc-response.js';
import { createRecentProjectsRepository } from '../../database/repositories/sqlite-recent-projects-repository.js';

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
 * Module-level repository instance (DI via factory function).
 * Consistent with the existing getDatabase() pattern.
 */
const recentProjectsRepo = createRecentProjectsRepository();

/**
 * Handler: recent:list
 *
 * Lists recent projects from the database.
 */
export async function handleRecentList(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<RecentListResponse>> {
  return wrapHandler(async () => {
    validatePayload('recent:list', payload, RecentListPayloadSchema);

    const limit = payload?.limit ?? 10;
    return recentProjectsRepo.list(limit);
  });
}

/**
 * Handler: recent:add
 *
 * Adds or updates a recent project in the database.
 */
export async function handleRecentAdd(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<RecentAddResponse>> {
  return wrapHandler(async () => {
    validatePayload('recent:add', payload, RecentAddPayloadSchema);

    const { path, name } = payload;
    return recentProjectsRepo.add(path, name);
  });
}
