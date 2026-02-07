/**
 * Data IPC Handlers
 *
 * Handlers for loading RPG Maker MZ game data (troops, classes, enemies).
 * Uses DI container for dependency resolution.
 */

import type { IpcMainInvokeEvent } from 'electron';

import type { IPCResult } from '../protocol-types.js';
import type { TroopData, ClassData, EnemyData } from '../types.js';
import { DataGetTroopsPayloadSchema, DataGetClassesPayloadSchema, DataGetEnemiesPayloadSchema } from '../types.js';
import { wrapHandler } from '../ipc-response.js';
import { resolve } from '../../di/container.js';
import { IGameDataLoaderToken } from '../../di/tokens.js';
import type { IGameDataLoader } from '@coreto/electron/domain/ports';

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
 * Handler: data:getTroops
 *
 * Returns all troops from the RPG Maker MZ project.
 * Thin adapter - delegates to domain use case.
 */
export async function handleDataGetTroops(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<TroopData[]>> {
  return wrapHandler(async () => {
    validatePayload('data:getTroops', payload, DataGetTroopsPayloadSchema);

    const { projectPath } = payload;

    // Resolve IGameDataLoader from DI container
    const dataLoader = resolve<IGameDataLoader>(IGameDataLoaderToken);

    return dataLoader.loadTroops(projectPath);
  });
}

/**
 * Handler: data:getClasses
 *
 * Returns all classes from the RPG Maker MZ project.
 * Thin adapter - delegates to domain use case.
 */
export async function handleDataGetClasses(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ClassData[]>> {
  return wrapHandler(async () => {
    validatePayload('data:getClasses', payload, DataGetClassesPayloadSchema);

    const { projectPath } = payload;

    // Resolve IGameDataLoader from DI container
    const dataLoader = resolve<IGameDataLoader>(IGameDataLoaderToken);

    return dataLoader.loadClasses(projectPath);
  });
}

/**
 * Handler: data:getEnemies
 *
 * Returns all enemies from the RPG Maker MZ project.
 * Thin adapter - delegates to domain use case.
 */
export async function handleDataGetEnemies(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<EnemyData[]>> {
  return wrapHandler(async () => {
    validatePayload('data:getEnemies', payload, DataGetEnemiesPayloadSchema);

    const { projectPath } = payload;

    // Resolve IGameDataLoader from DI container
    const dataLoader = resolve<IGameDataLoader>(IGameDataLoaderToken);

    return dataLoader.loadEnemies(projectPath);
  });
}
