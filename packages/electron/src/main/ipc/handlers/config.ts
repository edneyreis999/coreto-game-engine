/**
 * Configuration IPC Handlers
 *
 * Handlers for loading and managing project configurations.
 */

import type { IpcMainInvokeEvent } from 'electron';
import type { ILogger } from '@coreto/core';
import { ILoggerToken, resolve } from '@coreto/core';
import type { IConfigStorage } from '@coreto/electron/domain/ports';
import { IConfigStorageToken } from '../../di/tokens.js';
import { ProjectConfigSchema, type UIProjectConfig } from '@coreto/electron/domain/schemas';
import { normalizeSchema } from '@coreto/electron/domain/services';

import type { IPCResult } from '../protocol-types.js';
import type {
  TrechoData,
  ConfigUpdateTrechoResponse,
  ConfigDeleteTrechoResponse,
  ConfigUpdateGlobalSettingsResponse,
} from '../types.js';
import {
  ConfigExistsPayloadSchema,
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
 * Loads a project configuration from SQLite database.
 * Uses IConfigStorage port to read from project_configs table.
 * Returns complete UIProjectConfig with all trecho data for ConfigurationPanel.
 *
 * Returns null gracefully if no saved config exists for the project.
 */
export async function handleConfigLoad(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<UIProjectConfig | null>> {
  return wrapHandler(async () => {
    validatePayload('config:load', payload, ConfigExistsPayloadSchema);

    const { projectPath } = payload;
    const logger = resolve<ILogger>(ILoggerToken);
    const storage = resolve<IConfigStorage>(IConfigStorageToken);

    logger.info(`[IPC] Loading config for project: ${projectPath}`);

    // Check if config exists before attempting to read
    const configExists = await storage.exists(projectPath);
    if (!configExists) {
      logger.info(`[IPC] No saved config found for project: ${projectPath}`);
      return null;
    }

    try {
      // Read config JSON from SQLite
      const configJson = await storage.read(projectPath);
      const rawConfig = JSON.parse(configJson);

      // Normalize schema (handle legacy formats) and validate with Zod
      const normalizedConfig = normalizeSchema(rawConfig);
      const config: UIProjectConfig = ProjectConfigSchema.parse(normalizedConfig);

      logger.info(`[IPC] Successfully loaded config with ${config.trechos.length} trechos`);

      // Return complete config with full trecho data for ConfigurationPanel
      return config;
    } catch (error) {
      // Check if this is a Zod validation error (incomplete/corrupt data)
      if (error && typeof error === 'object' && 'issues' in error) {
        logger.warn(`[IPC] Config validation failed for ${projectPath} - data may be incomplete. Returning null.`);
        return null;
      }
      // For other errors (JSON parse, storage read), still throw
      logger.error(`[IPC] Failed to load config for project ${projectPath}: ${error}`);
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`);
    }
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
 * Adds or updates a trecho configuration with immediate SQLite persistence.
 * Uses read-modify-write pattern (UPSERT) via IConfigStorage port.
 *
 * Implementation: Loads existing config from SQLite, updates specified trecho,
 * validates updated config, writes back to database via IConfigStorage.write().
 *
 * @see IConfigStorage port for database operations
 * @see Migration v3 for project_configs table schema
 */
export async function handleConfigUpdateTrecho(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ConfigUpdateTrechoResponse>> {
  return wrapHandler(async () => {
    validatePayload('config:updateTrecho', payload, ConfigUpdateTrechoPayloadSchema);

    const { projectPath, trecho } = payload;
    const logger = resolve<ILogger>(ILoggerToken);
    const storage = resolve<IConfigStorage>(IConfigStorageToken);

    logger.info(`[IPC] Updating trecho: ${trecho.id}`, { projectPath, trechoId: trecho.id });

    // Validate using the domain use case first
    const validationResult = validateTrecho(trecho);

    try {
      // Load existing config from SQLite database (read phase)
      const existingConfigJson = await storage.read(projectPath);
      const existingConfig = JSON.parse(existingConfigJson);

      // Find and update the specified trecho (modify phase)
      const trechoIndex = existingConfig.trechos?.findIndex((t: { id: string }) => t.id === trecho.id) ?? -1;

      if (trechoIndex >= 0) {
        // Update existing trecho
        existingConfig.trechos[trechoIndex] = validationResult.trecho;
      } else {
        // Add new trecho if not found
        if (!existingConfig.trechos) {
          existingConfig.trechos = [];
        }
        existingConfig.trechos.push(validationResult.trecho);
      }

      // Update metadata timestamp
      if (!existingConfig.metadata) {
        existingConfig.metadata = {};
      }
      existingConfig.metadata.lastModified = Date.now();

      // Validate updated config with Zod schema
      const validatedConfig = ProjectConfigSchema.parse(existingConfig);

      // Write back to SQLite database (write phase - UPSERT via INSERT OR REPLACE)
      const updatedConfigJson = JSON.stringify(validatedConfig, null, 2);
      await storage.write(projectPath, updatedConfigJson);

      logger.info(`[IPC] Trecho updated successfully: ${trecho.id}`, {
        projectPath,
        trechoId: trecho.id,
        action: trechoIndex >= 0 ? 'updated' : 'created',
      });

      return validationResult;
    } catch (error) {
      // Handle storage-specific errors
      if (error instanceof Error && error.message.includes('Project config not found')) {
        // Config doesn't exist yet - create new config with just this trecho
        logger.info(`[IPC] Creating new config for project: ${projectPath}`);

        const newConfig = {
          version: '1.0',
          trechos: [validationResult.trecho],
          metadata: {
            projectName: projectPath.split('/').pop() ?? 'Unknown Project',
            lastModified: Date.now(),
          },
        };

        const newConfigJson = JSON.stringify(newConfig, null, 2);
        await storage.write(projectPath, newConfigJson);

        logger.info(`[IPC] New config created with trecho: ${trecho.id}`, {
          projectPath,
          trechoId: trecho.id,
        });

        return validationResult;
      }

      // Re-throw other errors for wrapHandler to handle
      logger.error(`[IPC] Failed to update trecho: ${error}`);
      throw new Error(`Failed to update trecho: ${error instanceof Error ? error.message : String(error)}`);
    }
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
