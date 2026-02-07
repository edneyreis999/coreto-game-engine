/**
 * Preferences IPC Handlers
 *
 * Handlers for managing user preferences.
 */

import type { IpcMainInvokeEvent } from 'electron';

import type { IPCResult } from '../protocol-types.js';
import type { PreferencesGetResponse, PreferencesSetResponse } from '../types.js';
import { PreferencesSetPayloadSchema } from '../types.js';
import { wrapHandler } from '../ipc-response.js';
import { getDatabase, getUserPreferences, updateUserPreferences } from '../../database/index.js';

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
 * Handler: preferences:get
 *
 * Gets user preferences from the database.
 */
export async function handlePreferencesGet(
  _event: IpcMainInvokeEvent,
  _payload: unknown
): Promise<IPCResult<PreferencesGetResponse>> {
  return wrapHandler(async () => {
    const db = getDatabase();
    const userPrefs = getUserPreferences(db);

    return {
      theme: userPrefs.theme,
      lastProjectPath: userPrefs.last_project_path ?? null,
    };
  });
}

/**
 * Handler: preferences:set
 *
 * Updates user preferences in the database.
 */
export async function handlePreferencesSet(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<PreferencesSetResponse>> {
  return wrapHandler(async () => {
    validatePayload('preferences:set', payload, PreferencesSetPayloadSchema);

    const db = getDatabase();
    const _currentPrefs = getUserPreferences(db);

    const updates: Partial<typeof _currentPrefs> = {};
    if (payload.theme !== undefined) {
      updates.theme = payload.theme;
    }
    if (payload.lastProjectPath !== undefined) {
      updates.last_project_path = payload.lastProjectPath;
    }

    const updatedPrefs = updateUserPreferences(db, updates);

    return {
      theme: updatedPrefs.theme,
      lastProjectPath: updatedPrefs.last_project_path ?? null,
    };
  });
}
