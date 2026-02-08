/**
 * IPC Handler Implementations
 *
 * Main process IPC handlers that bridge the renderer process with the Coreto Game Engine core.
 * Each handler validates payloads with Zod, calls core use cases via DI container, and serializes responses.
 *
 * Error handling:
 * - All handlers wrap core calls in try-catch
 * - Domain errors are serialized to IPC-safe format (no stack traces)
 * - Zod validation errors are returned with clear messages
 *
 * Progress tracking:
 * - Long-running simulations store progress in main process state
 * - Progress can be polled via simulation:getProgress
 *
 * Import Convention (CLAUDE-ARCH-CONVENTION):
 * - @coreto/core imports: external package (standard)
 * - @coreto/electron/domain/* imports: cross-layer (domain use cases, ports, types)
 * - Relative imports: same layer (infrastructure - adapters, database, ipc)
 *
 * @see packages/electron/src/main/ipc/types.ts
 * @see packages/electron/src/main/ipc/index.ts
 * @see packages/electron/CLAUDE.md (Import Conventions)
 */

import { ipcMain, IpcMainInvokeEvent, dialog, BrowserWindow, BaseWindow } from 'electron';
import { z } from 'zod';

// External dependencies (@coreto/core)
import type {
  ILogger,
  IFileSystem,
  IConfigLoader,
  IDataLoader,
  IBattleSimulator,
} from '@coreto/core';
import {
  ILoggerToken,
  IFileSystemToken,
  IConfigLoaderToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
  resolve,
} from '@coreto/core';

// Infrastructure layer (same layer - relative imports)
import { createProjectValidator, createGameDataLoader } from '../adapters/index.js';

// Domain layer (cross-layer - module aliases)
import { validateTrecho, runSimulation } from '@coreto/electron/domain/use-cases';

// Infrastructure layer (same layer - relative imports)
import type {
  IPCChannel,
  IPCResult,
  ProjectInfo,
  ValidationResult,
  SimulationResult,
  SimulationProgress,
  ReportData,
  ProjectConfigResponse,
  TroopData,
  ClassData,
  EnemyData,
  TrechoData,
  RecentListResponse,
  RecentAddResponse,
  PreferencesGetResponse,
  PreferencesSetResponse,
  OpenDirectoryResponse,
  ConfigUpdateTrechoResponse,
  ConfigDeleteTrechoResponse,
  ConfigUpdateGlobalSettingsResponse,
} from './types.js';
import {
  ProjectOpenPayloadSchema,
  ProjectValidatePayloadSchema,
  SimulationRunPayloadSchema,
  ConfigLoadPayloadSchema,
  DataGetTroopsPayloadSchema,
  DataGetClassesPayloadSchema,
  DataGetEnemiesPayloadSchema,
  RecentListPayloadSchema,
  RecentAddPayloadSchema,
  PreferencesSetPayloadSchema,
  ConfigUpdateTrechoPayloadSchema,
  ConfigDeleteTrechoPayloadSchema,
  ConfigUpdateGlobalSettingsPayloadSchema,
} from './types.js';
import { getDatabase } from '../database/index.js';
import { getUserPreferences, updateUserPreferences } from '../database/index.js';
import { CONFIG_IPC_HANDLERS } from './config-handlers.js';
import { HISTORY_IPC_HANDLERS } from './history-handlers.js';
import { wrapHandler } from './ipc-response.js';
import { createRecentProjectsRepository } from '../database/repositories/sqlite-recent-projects-repository.js';

// ============================================================================
// Progress State Management
// ============================================================================

/**
 * Module-level repository instances (DI via factory functions).
 * Consistent with the existing getDatabase() pattern.
 */
const recentProjectsRepo = createRecentProjectsRepository();

/**
 * Global progress state for running simulations.
 * Stored in main process for polling-based updates.
 */
let simulationProgress: SimulationProgress = {
  current: 0,
  total: 0,
  percentage: 0,
  isRunning: false,
};

/**
 * AbortController for cancelling running simulations.
 * Used by the simulation:cancel handler.
 */
let currentSimulationController: AbortController | null = null;

/**
 * Updates the simulation progress state.
 */
function updateProgress(progress: Partial<SimulationProgress>): void {
  simulationProgress = { ...simulationProgress, ...progress };
}

/**
 * Resets simulation progress to initial state.
 */
function resetProgress(): void {
  simulationProgress = {
    current: 0,
    total: 0,
    percentage: 0,
    isRunning: false,
  };
  currentSimulationController = null;
}

// ============================================================================
// Payload Validation Helper
// ============================================================================

/**
 * Validates an IPC payload against its Zod schema.
 * Throws if validation fails.
 */
function validatePayload<T extends z.ZodTypeAny>(
  channel: IPCChannel,
  payload: unknown,
  schema: T
): asserts payload is z.infer<T> {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new Error(`Invalid payload for ${channel}: ${errorMessages}`);
  }
}

// ============================================================================
// Registry Helper
// ============================================================================

/**
 * Type-safe handler retrieval from external registries.
 * Throws if handler is not found (fail-fast during initialization).
 */
function getRegistryHandler<K extends IPCChannel>(
  registry: Record<string, (event: IpcMainInvokeEvent, payload: unknown) => Promise<IPCResult>>,
  channel: K
): (event: IpcMainInvokeEvent, payload: unknown) => Promise<IPCResult> {
  const handler = registry[channel];
  if (!handler) {
    throw new Error(`Handler not found for channel: ${channel}`);
  }
  return handler;
}

// ============================================================================
// Project Handlers
// ============================================================================

/**
 * Handler: project:open
 *
 * Opens an RPG Maker MZ project and returns basic project info.
 * Thin adapter - delegates to domain use case.
 */
async function handleProjectOpen(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ProjectInfo>> {
  return wrapHandler(async () => {
    validatePayload('project:open', payload, ProjectOpenPayloadSchema);

    const { path: projectPath } = payload;
    const logger = resolve<ILogger>(ILoggerToken);
    const fs = resolve<IFileSystem>(IFileSystemToken);
    const dataLoader = resolve<IDataLoader>(IDataLoaderToken);

    logger.info(`[IPC] Opening project: ${projectPath}`);

    // Delegate to adapter
    const validator = createProjectValidator(fs, dataLoader, logger);
    return validator.getProjectInfo(projectPath);
  });
}

/**
 * Handler: project:validate
 *
 * Validates an RPG Maker MZ project structure and data integrity.
 * Thin adapter - delegates to domain use case.
 */
async function handleProjectValidate(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ValidationResult>> {
  return wrapHandler(async () => {
    validatePayload('project:validate', payload, ProjectValidatePayloadSchema);

    const { path: projectPath } = payload;
    const logger = resolve<ILogger>(ILoggerToken);
    const fs = resolve<IFileSystem>(IFileSystemToken);
    const dataLoader = resolve<IDataLoader>(IDataLoaderToken);

    logger.info(`[IPC] Validating project: ${projectPath}`);

    // Delegate to adapter
    const validator = createProjectValidator(fs, dataLoader, logger);
    return validator.validate({ projectPath });
  });
}

// ============================================================================
// Simulation Handlers
// ============================================================================

/**
 * Handler: simulation:run
 *
 * Executes a TTK battle simulation.
 * Thin adapter - delegates to domain use case.
 */
async function handleSimulationRun(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<SimulationResult>> {
  return wrapHandler(async () => {
    validatePayload('simulation:run', payload, SimulationRunPayloadSchema);

    const { projectPath, configPath, trechoId, troopId, seed = 12345, maxTurns = 100 } = payload;

    const logger = resolve<ILogger>(ILoggerToken);
    const configLoader = resolve<IConfigLoader>(IConfigLoaderToken);
    const dataLoader = resolve<IDataLoader>(IDataLoaderToken);
    const simulator = resolve<IBattleSimulator>(IBattleSimulatorToken);

    logger.info(
      `[IPC] Running simulation: project=${projectPath}, trecho=${trechoId}, troop=${troopId}`
    );

    // Check if simulation is already running
    if (simulationProgress.isRunning) {
      throw new Error('Simulation is already running. Cancel or wait for completion.');
    }

    // Create AbortController for cancellation support
    currentSimulationController = new AbortController();

    updateProgress({ isRunning: true, current: 0, total: 1 });

    try {
      // Delegate to domain use case
      const { result } = await runSimulation(
        {
          projectPath,
          configPath,
          trechoId,
          troopId,
          seed,
          maxTurns,
        },
        {
          dataLoader,
          simulator,
          configLoader,
          logger,
        },
        {
          onStart: () => {
            logger.info('[IPC] Simulation started');
          },
          onProgress: (progress) => {
            updateProgress(progress);
          },
          onEnd: () => {
            logger.info('[IPC] Simulation completed');
          },
        }
      );

      return result;
    } finally {
      resetProgress();
    }
  });
}

/**
 * Handler: simulation:getProgress
 *
 * Returns the current simulation progress.
 */
async function handleSimulationGetProgress(
  _event: IpcMainInvokeEvent,
  _payload: unknown
): Promise<IPCResult<number>> {
  return wrapHandler(async () => {
    return simulationProgress.percentage;
  });
}

/**
 * Handler: simulation:cancel
 *
 * Cancels the currently running simulation.
 */
async function handleSimulationCancel(
  _event: IpcMainInvokeEvent,
  _payload: unknown
): Promise<IPCResult<void>> {
  return wrapHandler(async () => {
    if (currentSimulationController) {
      currentSimulationController.abort();
      resetProgress();
    }
  });
}

/**
 * In-memory storage for the last simulation results.
 * Stores results from the most recent simulation run.
 */
let lastSimulationResults: ReportData | null = null;

/**
 * Sets the simulation results from a completed simulation.
 * Called by simulation:run handler when simulation completes.
 */
export function setSimulationResults(results: ReportData): void {
  lastSimulationResults = results;
}

/**
 * Clears the stored simulation results.
 */
export function clearSimulationResults(): void {
  lastSimulationResults = null;
}

/**
 * Handler: simulation:getResults
 *
 * Returns the simulation results Report from the most recent simulation.
 */
async function handleSimulationGetResults(
  _event: IpcMainInvokeEvent,
  _payload: unknown
): Promise<IPCResult<ReportData>> {
  return wrapHandler(async () => {
    if (!lastSimulationResults) {
      throw new Error('No simulation results available. Run a simulation first.');
    }
    return lastSimulationResults;
  });
}

// ============================================================================
// Configuration Handlers
// ============================================================================

/**
 * Handler: config:load
 *
 * Loads a project configuration file.
 */
async function handleConfigLoad(
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
async function handleConfigGetTrechos(
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
async function handleConfigUpdateTrecho(
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
async function handleConfigDeleteTrecho(
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
async function handleConfigUpdateGlobalSettings(
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

// ============================================================================
// Data Handlers
// ============================================================================

/**
 * Handler: data:getTroops
 *
 * Returns all troops from the RPG Maker MZ project.
 * Thin adapter - delegates to domain use case.
 */
async function handleDataGetTroops(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<TroopData[]>> {
  return wrapHandler(async () => {
    validatePayload('data:getTroops', payload, DataGetTroopsPayloadSchema);

    const { projectPath } = payload;
    const logger = resolve<ILogger>(ILoggerToken);
    const fs = resolve<IFileSystem>(IFileSystemToken);

    logger.info(`[IPC] Getting troops data from: ${projectPath}`);

    // Delegate to adapter
    const dataLoader = createGameDataLoader(fs, logger);
    return dataLoader.loadTroops(projectPath);
  });
}

/**
 * Handler: data:getClasses
 *
 * Returns all classes from the RPG Maker MZ project.
 * Thin adapter - delegates to domain use case.
 */
async function handleDataGetClasses(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ClassData[]>> {
  return wrapHandler(async () => {
    validatePayload('data:getClasses', payload, DataGetClassesPayloadSchema);

    const { projectPath } = payload;
    const logger = resolve<ILogger>(ILoggerToken);
    const fs = resolve<IFileSystem>(IFileSystemToken);

    logger.info(`[IPC] Getting classes data from: ${projectPath}`);

    // Delegate to adapter
    const dataLoader = createGameDataLoader(fs, logger);
    return dataLoader.loadClasses(projectPath);
  });
}

/**
 * Handler: data:getEnemies
 *
 * Returns all enemies from the RPG Maker MZ project.
 * Thin adapter - delegates to domain use case.
 */
async function handleDataGetEnemies(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<EnemyData[]>> {
  return wrapHandler(async () => {
    validatePayload('data:getEnemies', payload, DataGetEnemiesPayloadSchema);

    const { projectPath } = payload;
    const logger = resolve<ILogger>(ILoggerToken);
    const fs = resolve<IFileSystem>(IFileSystemToken);

    logger.info(`[IPC] Getting enemies data from: ${projectPath}`);

    // Delegate to adapter
    const dataLoader = createGameDataLoader(fs, logger);
    return dataLoader.loadEnemies(projectPath);
  });
}

// ============================================================================
// Recent Projects Handlers
// ============================================================================

/**
 * Handler: recent:list
 *
 * Lists recent projects from the database.
 */
async function handleRecentList(
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
async function handleRecentAdd(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<RecentAddResponse>> {
  return wrapHandler(async () => {
    validatePayload('recent:add', payload, RecentAddPayloadSchema);

    const { path, name } = payload;
    return recentProjectsRepo.add(path, name);
  });
}

// ============================================================================
// Preferences Handlers
// ============================================================================

/**
 * Handler: preferences:get
 *
 * Gets user preferences from the database.
 */
async function handlePreferencesGet(
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
async function handlePreferencesSet(
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

// ============================================================================
// Dialog Handlers
// ============================================================================

/**
 * Handler: dialog:openDirectory
 *
 * Opens a native directory selection dialog.
 * Returns the selected directory path or cancellation status.
 */
async function handleDialogOpenDirectory(
  _event: IpcMainInvokeEvent,
  _payload: unknown
): Promise<IPCResult<OpenDirectoryResponse>> {
  return wrapHandler(async () => {
    // Get the focused window using getFocusedWindow() (more efficient)
    // If no window is focused, fall back to checking isFocused()
    const focusedWindow =
      BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows().find((w) => w.isFocused());

    // dialog.showOpenDialog can accept undefined (per Electron docs), but TS types don't reflect this
    // Type assertion needed because BaseWindow type doesn't include undefined
    const result = await dialog.showOpenDialog(
      (focusedWindow ?? undefined) as unknown as BaseWindow,
      {
        properties: ['openDirectory'],
        title: 'Select RPG Maker MZ Project Folder',
      }
    );

    return {
      canceled: result.canceled,
      filePaths: result.filePaths,
    };
  });
}

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * Map of IPC channel names to their handler functions.
 */
export const IPC_HANDLERS: Record<
  IPCChannel,
  (event: IpcMainInvokeEvent, payload: unknown) => Promise<IPCResult>
> = {
  'project:open': handleProjectOpen,
  'project:validate': handleProjectValidate,
  'simulation:run': handleSimulationRun,
  'simulation:getProgress': handleSimulationGetProgress,
  'simulation:cancel': handleSimulationCancel,
  'simulation:getResults': handleSimulationGetResults,
  'config:load': handleConfigLoad,
  // Config handlers (from registry)
  'config:save': getRegistryHandler(CONFIG_IPC_HANDLERS, 'config:save'),
  'config:exists': getRegistryHandler(CONFIG_IPC_HANDLERS, 'config:exists'),
  'config:getTrechos': handleConfigGetTrechos,
  'config:updateTrecho': handleConfigUpdateTrecho,
  'config:deleteTrecho': handleConfigDeleteTrecho,
  'config:updateGlobalSettings': handleConfigUpdateGlobalSettings,
  'data:getTroops': handleDataGetTroops,
  'data:getClasses': handleDataGetClasses,
  'data:getEnemies': handleDataGetEnemies,
  'recent:list': handleRecentList,
  'recent:add': handleRecentAdd,
  'preferences:get': handlePreferencesGet,
  'preferences:set': handlePreferencesSet,
  'dialog:openDirectory': handleDialogOpenDirectory,
  // History handlers (from registry)
  'history:list': getRegistryHandler(HISTORY_IPC_HANDLERS, 'history:list'),
  'history:loadReport': getRegistryHandler(HISTORY_IPC_HANDLERS, 'history:loadReport'),
  'history:export': getRegistryHandler(HISTORY_IPC_HANDLERS, 'history:export'),
  'history:delete': getRegistryHandler(HISTORY_IPC_HANDLERS, 'history:delete'),
  'history:generateId': getRegistryHandler(HISTORY_IPC_HANDLERS, 'history:generateId'),
};

/**
 * Registers all IPC handlers with ipcMain.
 * Called during main process initialization.
 */
export function registerIpcHandlers(): void {
  Object.entries(IPC_HANDLERS).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler);
  });
}
