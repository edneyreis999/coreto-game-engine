/**
 * Configuration IPC Handlers
 *
 * Handlers for loading and managing project configurations.
 */

import type { IpcMainInvokeEvent } from 'electron';
import type { ILogger, IConfigLoader } from '@coreto/core';
import { ILoggerToken, IConfigLoaderToken, resolve } from '@coreto/core';

import type { IPCResult } from '../protocol-types.js';
import type {
  ProjectConfigResponse,
  TrechoData,
  ConfigUpdateTrechoResponse,
  ConfigDeleteTrechoResponse,
  ConfigUpdateGlobalSettingsResponse,
} from '../types.js';
import {
  ConfigLoadPayloadSchema,
  ConfigUpdateTrechoPayloadSchema,
  ConfigDeleteTrechoPayloadSchema,
  ConfigUpdateGlobalSettingsPayloadSchema,
} from '../types.js';
import { wrapHandler } from '../ipc-response.js';
import { validateTrecho } from '@coreto/electron/domain/use-cases';

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
 * Handler: config:load
 *
 * Loads a project configuration file.
 */
export async function handleConfigLoad(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ProjectConfigResponse>> {
  return wrapHandler(async () => {
    validatePayload('config:load', payload, ConfigLoadPayloadSchema);

    const { configPath } = payload;
    const logger = resolve<ILogger>(ILoggerToken);
    const configLoader = resolve<IConfigLoader>(IConfigLoaderToken);

    logger.info(`[IPC] Loading config: ${configPath}`);

    const config = await configLoader.loadConfig(configPath);
    const trechos = await configLoader.loadTrechos(config);

    const response: ProjectConfigResponse = {
      projectPath: config.projectPath,
      reportOutputPath: config.reportOutputPath,
      seed: config.seed ?? 12345,
      trechos: trechos.map((t) => ({
        id: t.id,
        name: t.name,
        anchorLevelMin: t.anchorLevelMin,
        anchorLevelMax: t.anchorLevelMax,
        targetTtkTurns: t.targetTtkTurns,
        targetTtkActions: t.targetTtkActions,
        tolerancePercent: t.tolerancePercent,
        troopIds: [...t.troopIds],
        party: {
          members: t.party.members.map((m) => ({
            classId: m.classId,
            level: m.level,
          })),
        },
      })),
    };

    // Only include maxBattleTurns if defined
    if (config.maxBattleTurns !== undefined) {
      response.maxBattleTurns = config.maxBattleTurns;
    }

    return response;
  });
}

/**
 * Handler: config:getTrechos
 *
 * Returns all trechos from the currently loaded config.
 * For MVP, returns empty array - will be integrated with database later.
 */
export async function handleConfigGetTrechos(
  _event: IpcMainInvokeEvent,
  _payload: unknown
): Promise<IPCResult<TrechoData[]>> {
  return wrapHandler(async () => {
    // For MVP, return empty array
    // Full implementation will load from database or last loaded config
    return [];
  });
}

/**
 * Handler: config:updateTrecho
 *
 * Adds or updates a trecho configuration.
 * For MVP, validates and returns the trecho - will persist to database later.
 */
export async function handleConfigUpdateTrecho(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ConfigUpdateTrechoResponse>> {
  return wrapHandler(async () => {
    validatePayload('config:updateTrecho', payload, ConfigUpdateTrechoPayloadSchema);

    const { trecho } = payload;
    const logger = resolve<ILogger>(ILoggerToken);

    logger.info(`[IPC] Updating trecho: ${trecho.id}`);

    // Validate using the domain use case
    const result = validateTrecho(trecho);

    // TODO: Persist to database in future iteration
    // For MVP, just return the validated trecho
    return result;
  });
}

/**
 * Handler: config:deleteTrecho
 *
 * Removes a trecho from the configuration.
 * For MVP, validates and returns the deleted ID - will update database later.
 */
export async function handleConfigDeleteTrecho(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ConfigDeleteTrechoResponse>> {
  return wrapHandler(async () => {
    validatePayload('config:deleteTrecho', payload, ConfigDeleteTrechoPayloadSchema);

    const { trechoId } = payload;
    const logger = resolve<ILogger>(ILoggerToken);

    logger.info(`[IPC] Deleting trecho: ${trechoId}`);

    // TODO: Remove from database in future iteration
    // For MVP, just return the deleted ID
    return {
      deletedTrechoId: trechoId,
    };
  });
}

/**
 * Handler: config:updateGlobalSettings
 *
 * Updates global configuration settings.
 * For MVP, validates and returns the settings - will persist to database later.
 */
export async function handleConfigUpdateGlobalSettings(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ConfigUpdateGlobalSettingsResponse>> {
  return wrapHandler(async () => {
    validatePayload(
      'config:updateGlobalSettings',
      payload,
      ConfigUpdateGlobalSettingsPayloadSchema
    );

    const { seed, maxBattleTurns } = payload;
    const logger = resolve<ILogger>(ILoggerToken);

    logger.info(`[IPC] Updating global settings: seed=${seed}`);

    // TODO: Persist to database in future iteration
    // For MVP, just return the validated settings
    const response: ConfigUpdateGlobalSettingsResponse = {
      seed: seed ?? 12345,
    };

    if (maxBattleTurns !== undefined) {
      response.maxBattleTurns = maxBattleTurns;
    }

    return response;
  });
}
