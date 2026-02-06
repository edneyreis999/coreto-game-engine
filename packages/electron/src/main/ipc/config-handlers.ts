/**
 * Config-Specific IPC Handlers
 *
 * IPC handlers for project configuration management.
 * Uses ConfigService for loading/saving configs with schema normalization.
 *
 * Handlers:
 * - config:save - Save project config to temp/project.config.json
 * - config:exists - Check if config file exists
 *
 * @see planos/005-run-ttk-electron/tasks/04_task.md
 * @see packages/electron/src/main/services/config-service.ts
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  configService,
  ConfigNotFoundError,
  ConfigValidationError,
} from '../services/config-service.js';
import type { IPCResponse, IPCResult, ConfigSaveResponse, ConfigExistsResponse } from './types.js';
import type { IPCError } from './types.js';
import type { ConfigSavePayload, ConfigExistsPayload } from './types.js';
import { ConfigSavePayloadSchema, ConfigExistsPayloadSchema } from './types.js';

// ============================================================================
// Error Serialization
// ============================================================================

/**
 * Converts a ConfigService error to IPC-safe error format.
 */
function serializeConfigError(error: unknown): IPCError {
  if (error instanceof ConfigNotFoundError) {
    return {
      name: 'ConfigNotFoundError',
      message: error.message,
      severity: 'critical',
      context: {},
      timestamp: new Date().toISOString(),
    };
  }

  if (error instanceof ConfigValidationError) {
    return {
      name: 'ConfigValidationError',
      message: error.message,
      severity: 'critical',
      context: {},
      timestamp: new Date().toISOString(),
    };
  }

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
function withConfigErrorHandling<T extends IPCResponse>(
  handler: () => Promise<T>
): Promise<IPCResult<T>> {
  return handler()
    .then((data) => ({ success: true, data }) as IPCResult<T>)
    .catch(
      (error: unknown) =>
        ({
          success: false,
          error: serializeConfigError(error),
        }) as IPCResult<T>
    );
}

// ============================================================================
// Payload Validation Helper
// ============================================================================

/**
 * Validates an IPC payload against its Zod schema and returns the validated payload.
 * Throws an error with detailed messages if validation fails.
 */
function validateConfigPayload<T>(
  channel: string,
  payload: unknown,
  schema: {
    safeParse: (data: unknown) => {
      success: boolean;
      data?: T;
      error?: { errors: Array<{ path: (string | number)[]; message: string }> };
    };
  }
): T {
  const result = schema.safeParse(payload);

  if (!result.success) {
    // Type narrowing: when success is false, error is guaranteed to exist
    const parseError = result.error;
    if (!parseError) {
      throw new Error(`Invalid payload for ${channel}: Unknown error`);
    }
    const errorMessages = parseError.errors
      .map(
        (e: { path: (string | number)[]; message: string }) => `${e.path.join('.')}: ${e.message}`
      )
      .join(', ');
    throw new Error(`Invalid payload for ${channel}: ${errorMessages}`);
  }

  // Return validated payload
  return result.data as T;
}

// ============================================================================
// Config Handlers
// ============================================================================

/**
 * Helper to convert tolerance percent to decimal (15% -> 0.15)
 */
function tolerancePercentToDecimal(percent: number): number {
  return Math.max(0, Math.min(1, percent / 100));
}

/**
 * Handler: config:save
 *
 * Saves a project configuration to temp/project.config.json.
 * Transforms ConfigurationPanel format to Core package ProjectConfig format.
 */
async function handleConfigSave(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ConfigSaveResponse>> {
  return withConfigErrorHandling(async () => {
    const validated = validateConfigPayload<ConfigSavePayload>(
      'config:save',
      payload,
      ConfigSavePayloadSchema
    );

    const { projectPath, config } = validated;

    console.log('[config:save] Saving config:', {
      projectPath,
      trechosCount: config.trechos.length,
    });

    // Transform ConfigurationPanel format to Core ProjectConfig format
    // Core schema uses: anchorLevelRange {min, max}, ttkTarget {turns, actions, tolerance}
    const trechos = config.trechos.map((t) => ({
      id: t.id,
      name: t.name,
      anchorLevelRange: {
        min: t.anchorLevelMin,
        max: t.anchorLevelMax,
      },
      ttkTarget: {
        turns: t.targetTtkTurns,
        actions: t.targetTtkActions,
        tolerance: tolerancePercentToDecimal(t.tolerancePercent),
      },
      troopIds: t.troopIds,
      party: t.party,
    }));

    const projectConfig = {
      projectPath,
      reportOutputPath: 'temp/reports',
      seed: config.globalSettings?.seed ?? 12345,
      maxBattleTurns: config.globalSettings?.maxBattleTurns,
      trechos,
    };

    console.log('[config:save] Project config to save:', JSON.stringify(projectConfig, null, 2));

    // Save config directly to filesystem in Core format
    // Bypasses ConfigService UI schema validation since Core needs different format
    const configPath = path.join(projectPath, 'temp', 'project.config.json');
    const tempDir = path.dirname(configPath);

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(projectConfig, null, 2), 'utf-8');

    console.log('[config:save] Config saved successfully to:', configPath);

    return {
      success: true,
      configPath,
    };
  });
}

/**
 * Handler: config:exists
 *
 * Checks if a project config file exists.
 * Returns true if temp/project.config.json exists.
 */
async function handleConfigExists(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ConfigExistsResponse>> {
  return withConfigErrorHandling(async () => {
    const validated = validateConfigPayload<ConfigExistsPayload>(
      'config:exists',
      payload,
      ConfigExistsPayloadSchema
    );

    const { projectPath } = validated;

    const exists = await configService.configExists(projectPath);

    return {
      exists,
      configPath: `${projectPath}/temp/project.config.json`,
    };
  });
}

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * Map of config-specific IPC channel names to their handler functions.
 */
export const CONFIG_IPC_HANDLERS: Record<
  string,
  (event: IpcMainInvokeEvent, payload: unknown) => Promise<IPCResult>
> = {
  'config:save': handleConfigSave,
  'config:exists': handleConfigExists,
};

/**
 * Registers all config-specific IPC handlers with ipcMain.
 *
 * This function should be called during main process initialization
 * after the general handlers are registered.
 *
 * @example
 * ```typescript
 * import { registerConfigHandlers } from './ipc/config-handlers.js';
 *
 * app.whenReady().then(() => {
 *   registerConfigHandlers();
 *   createWindow();
 * });
 * ```
 */
export function registerConfigHandlers(): void {
  Object.entries(CONFIG_IPC_HANDLERS).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler);
  });
}
