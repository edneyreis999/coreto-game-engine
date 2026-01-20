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
 * @see packages/electron/src/main/ipc/types.ts
 * @see packages/electron/src/main/ipc/index.ts
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { z } from 'zod';
import * as path from 'path';

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
  PartyConfig,
} from '@coreto/core';
import type { Trecho } from '@coreto/core';
import { DomainError } from '@coreto/core';

import type {
  IPCChannel,
  IPCResponse,
  IPCResult,
  IPCError,
  ProjectInfo,
  ValidationResult,
  SimulationResult,
  SimulationProgress,
  ProjectConfigResponse,
  TroopData,
  ClassData,
  EnemyData,
  TrechoData,
} from './types.js';
import {
  ProjectOpenPayloadSchema,
  ProjectValidatePayloadSchema,
  SimulationRunPayloadSchema,
  ConfigLoadPayloadSchema,
  DataGetTroopsPayloadSchema,
  DataGetClassesPayloadSchema,
  DataGetEnemiesPayloadSchema,
} from './types.js';

// ============================================================================
// Progress State Management
// ============================================================================

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
// eslint-disable-next-line no-undef
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
// Error Serialization
// ============================================================================

/**
 * Converts a DomainError to IPC-safe error format.
 * Stack traces are excluded for security.
 */
function serializeError(error: unknown): IPCError {
  if (error instanceof DomainError) {
    return {
      name: error.name,
      message: error.message,
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp.toISOString(),
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
function withErrorHandling<T extends IPCResponse>(
  handler: () => Promise<T>
): Promise<IPCResult<T>> {
  return handler()
    .then((data) => ({ success: true, data }))
    .catch((error: unknown) => ({
      success: false,
      error: serializeError(error),
    }));
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
// Project Handlers
// ============================================================================

/**
 * Handler: project:open
 *
 * Opens an RPG Maker MZ project and returns basic project info.
 * Validates that the project directory exists and contains required files.
 */
async function handleProjectOpen(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ProjectInfo>> {
  return withErrorHandling(async () => {
    validatePayload('project:open', payload, ProjectOpenPayloadSchema);

    const { path: projectPath } = payload;
    const logger = resolve<ILogger>(ILoggerToken);
    const fs = resolve<IFileSystem>(IFileSystemToken);

    logger.info(`[IPC] Opening project: ${projectPath}`);

    // Validate project path using IFileSystem.validateProjectPath
    try {
      fs.validateProjectPath(projectPath);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid RPG Maker MZ project: ${error.message}`);
      }
      throw error;
    }

    // Check if project directory exists
    if (!fs.exists(projectPath)) {
      throw new Error(`Project directory does not exist: ${projectPath}`);
    }

    // Check for game.rmmzproject marker file
    const markerPath = path.join(projectPath, 'game.rmmzproject');
    if (!fs.exists(markerPath)) {
      throw new Error(
        'Invalid RPG Maker MZ project: game.rmmzproject not found'
      );
    }

    // Check for data directory
    const dataDir = path.join(projectPath, 'data');
    if (!fs.exists(dataDir)) {
      throw new Error('Invalid RPG Maker MZ project: data directory not found');
    }

    // Get project name from directory name
    const name = path.basename(projectPath);

    // Count data files if possible
    let troopsCount = 0;
    let classesCount = 0;
    let enemiesCount = 0;

    try {
      const troopsPath = path.join(dataDir, 'Troops.json');
      const classesPath = path.join(dataDir, 'Classes.json');
      const enemiesPath = path.join(dataDir, 'Enemies.json');

      if (fs.exists(troopsPath)) {
        const troopsData = JSON.parse(fs.readFileSync(troopsPath));
        troopsCount = troopsData.length ?? 0;
      }

      if (fs.exists(classesPath)) {
        const classesData = JSON.parse(fs.readFileSync(classesPath));
        classesCount = classesData.length ?? 0;
      }

      if (fs.exists(enemiesPath)) {
        const enemiesData = JSON.parse(fs.readFileSync(enemiesPath));
        enemiesCount = enemiesData.length ?? 0;
      }
    } catch {
      // File reading failed, but project is still valid
    }

    return {
      path: projectPath,
      name,
      isValid: true,
      troopsCount,
      classesCount,
      enemiesCount,
    };
  });
}

/**
 * Handler: project:validate
 *
 * Validates an RPG Maker MZ project structure and data integrity.
 * Returns validation errors and warnings.
 */
async function handleProjectValidate(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ValidationResult>> {
  return withErrorHandling(async () => {
    validatePayload('project:validate', payload, ProjectValidatePayloadSchema);

    const { path: projectPath } = payload;
    const logger = resolve<ILogger>(ILoggerToken);
    const fs = resolve<IFileSystem>(IFileSystemToken);
    const dataLoader = resolve<IDataLoader>(IDataLoaderToken);

    logger.info(`[IPC] Validating project: ${projectPath}`);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check project directory
    if (!fs.exists(projectPath)) {
      errors.push('Project directory does not exist');
      return { isValid: false, errors, warnings };
    }

    // Check for marker file
    const markerPath = path.join(projectPath, 'game.rmmzproject');
    if (!fs.exists(markerPath)) {
      errors.push('game.rmmzproject not found - not a valid RPG Maker MZ project');
    }

    // Check data directory
    const dataDir = path.join(projectPath, 'data');
    if (!fs.exists(dataDir)) {
      errors.push('data directory not found');
    } else {
      // Validate required data files
      const requiredFiles = [
        'System.json',
        'Actors.json',
        'Classes.json',
        'Skills.json',
        'Items.json',
        'Weapons.json',
        'Armors.json',
        'Enemies.json',
        'Troops.json',
        'States.json',
        'Animations.json',
        'Troops.json',
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(dataDir, file);
        if (!fs.exists(filePath)) {
          errors.push(`Required data file missing: ${file}`);
        }
      }
    }

    // Try to load data to validate integrity
    if (errors.length === 0) {
      try {
        await dataLoader.loadDatabase(projectPath);
      } catch (error) {
        if (error instanceof Error) {
          warnings.push(`Data validation warning: ${error.message}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  });
}

// ============================================================================
// Simulation Handlers
// ============================================================================

/**
 * Handler: simulation:run
 *
 * Executes a TTK battle simulation.
 * Runs a single battle or all trechos based on payload.
 */
async function handleSimulationRun(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<SimulationResult>> {
  return withErrorHandling(async () => {
    validatePayload('simulation:run', payload, SimulationRunPayloadSchema);

    const {
      projectPath,
      configPath,
      trechoId,
      troopId,
      seed = 12345,
      maxTurns = 100,
    } = payload;

    const logger = resolve<ILogger>(ILoggerToken);
    const configLoader = resolve<IConfigLoader>(IConfigLoaderToken);
    const dataLoader = resolve<IDataLoader>(IDataLoaderToken);
    const simulator = resolve<IBattleSimulator>(IBattleSimulatorToken);

    logger.info(`[IPC] Running simulation: project=${projectPath}, trecho=${trechoId}, troop=${troopId}`);

    // Check if simulation is already running
    if (simulationProgress.isRunning) {
      throw new Error('Simulation is already running. Cancel or wait for completion.');
    }

    // Create AbortController for cancellation support
    // eslint-disable-next-line no-undef
    currentSimulationController = new AbortController();

    // Load project data
    updateProgress({ isRunning: true, current: 0, total: 1 });

    try {
      // Load RPG Maker MZ data
      await dataLoader.loadDatabase(projectPath);

      // Load config if provided
      let configTrechos: Trecho[] = [];
      if (configPath) {
        const config = await configLoader.loadConfig(configPath);
        configTrechos = await configLoader.loadTrechos(config);
      }

      // If specific troopId provided, run single battle
      if (troopId !== undefined) {
        updateProgress({ current: 0, total: 1, currentTroop: troopId });

        // Default party for single troop simulation
        const party = new PartyConfig([{ classId: 1, level: 1 }]);

        const result = await simulator.executeBattle({
          troopId,
          party,
          seed,
          maxTurns,
        });

        updateProgress({ current: 1, total: 1, percentage: 100 });

        return {
          trechoId: trechoId ?? 'single-troop',
          troopId,
          troopName: `Troop ${troopId}`,
          battleResult: {
            troopId: result.troopId,
            troopName: result.troopName,
            outcome: result.outcome,
            ttkTurns: result.ttkTurns,
            ttkActions: result.ttkActions,
            durationMs: result.durationMs,
            seed: result.seed,
            expGained: result.expGained,
          },
          passed: result.outcome === 'victory',
          warnings: [],
        };
      }

      // If trechoId provided, run all troops in that trecho
      if (!trechoId) {
        throw new Error('trechoId is required when troopId is not provided');
      }

      const trecho = configTrechos.find((t) => t.id === trechoId);
      if (!trecho) {
        throw new Error(`Trecho not found: ${trechoId}`);
      }

      updateProgress({
        current: 0,
        total: trecho.troopIds.length,
        currentTrecho: trechoId,
      });

      // Run first troop in trecho (simplified for MVP)
      const firstTroopId = trecho.troopIds[0];
      if (firstTroopId === undefined) {
        throw new Error(`Trecho has no troops: ${trechoId}`);
      }

      const result = await simulator.executeBattle({
        troopId: firstTroopId,
        party: trecho.party,
        seed,
        maxTurns,
      });

      updateProgress({ current: 1, total: trecho.troopIds.length });

      const passed = trecho.isWithinTolerance(result.ttkTurns, result.ttkActions);

      return {
        trechoId: trecho.id,
        troopId: firstTroopId,
        troopName: result.troopName,
        battleResult: {
          troopId: result.troopId,
          troopName: result.troopName,
          outcome: result.outcome,
          ttkTurns: result.ttkTurns,
          ttkActions: result.ttkActions,
          durationMs: result.durationMs,
          seed: result.seed,
          expGained: result.expGained,
        },
        passed,
        warnings: passed ? [] : ['TTK outside tolerance range'],
      };
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
  return withErrorHandling(async () => {
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
  return withErrorHandling(async () => {
    if (currentSimulationController) {
      currentSimulationController.abort();
      resetProgress();
    }
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
  return withErrorHandling(async () => {
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
  return withErrorHandling(async () => {
    // For MVP, return empty array
    // Full implementation will load from database or last loaded config
    return [];
  });
}

// ============================================================================
// Data Handlers
// ============================================================================

/**
 * Handler: data:getTroops
 *
 * Returns all troops from the RPG Maker MZ project.
 */
async function handleDataGetTroops(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<TroopData[]>> {
  return withErrorHandling(async () => {
    validatePayload('data:getTroops', payload, DataGetTroopsPayloadSchema);

    const { projectPath } = payload;
    const logger = resolve<ILogger>(ILoggerToken);
    const fs = resolve<IFileSystem>(IFileSystemToken);

    logger.info(`[IPC] Getting troops data from: ${projectPath}`);

    const troopsPath = path.join(projectPath, 'data', 'Troops.json');
    const troopsJson = fs.readFileSync(troopsPath);
    const troopsData = JSON.parse(troopsJson) as Array<{
      id: number;
      name: string;
      members: Array<{
        enemyId: number;
        x: number;
        y: number;
        hidden: boolean;
      }>;
    }>;

    return troopsData.map((t) => ({
      id: t.id,
      name: t.name,
      members: t.members,
    }));
  });
}

/**
 * Handler: data:getClasses
 *
 * Returns all classes from the RPG Maker MZ project.
 */
async function handleDataGetClasses(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<ClassData[]>> {
  return withErrorHandling(async () => {
    validatePayload('data:getClasses', payload, DataGetClassesPayloadSchema);

    const { projectPath } = payload;
    const logger = resolve<ILogger>(ILoggerToken);
    const fs = resolve<IFileSystem>(IFileSystemToken);

    logger.info(`[IPC] Getting classes data from: ${projectPath}`);

    const classesPath = path.join(projectPath, 'data', 'Classes.json');
    const classesJson = fs.readFileSync(classesPath);
    const classesData = JSON.parse(classesJson) as Array<{
      id: number;
      name: string;
      expTable: number[];
    }>;

    return classesData.map((c) => ({
      id: c.id,
      name: c.name,
      expTable: c.expTable,
    }));
  });
}

/**
 * Handler: data:getEnemies
 *
 * Returns all enemies from the RPG Maker MZ project.
 */
async function handleDataGetEnemies(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<EnemyData[]>> {
  return withErrorHandling(async () => {
    validatePayload('data:getEnemies', payload, DataGetEnemiesPayloadSchema);

    const { projectPath } = payload;
    const logger = resolve<ILogger>(ILoggerToken);
    const fs = resolve<IFileSystem>(IFileSystemToken);

    logger.info(`[IPC] Getting enemies data from: ${projectPath}`);

    const enemiesPath = path.join(projectPath, 'data', 'Enemies.json');
    const enemiesJson = fs.readFileSync(enemiesPath);
    const enemiesData = JSON.parse(enemiesJson) as Array<{
      id: number;
      name: string;
      params: number[];
      dropItems: Array<{ kind: number; dataId: number; denominator: number }>;
    }>;

    return enemiesData.map((e) => ({
      id: e.id,
      name: e.name,
      params: e.params,
      dropItems: e.dropItems,
    }));
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
  'config:load': handleConfigLoad,
  'config:getTrechos': handleConfigGetTrechos,
  'data:getTroops': handleDataGetTroops,
  'data:getClasses': handleDataGetClasses,
  'data:getEnemies': handleDataGetEnemies,
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
