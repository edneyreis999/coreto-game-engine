import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import type {
  ProgressPayload,
  ErrorPayload,
  SimulationResultPayload
} from '../main/workers/types';

/**
 * Preload Script - IPC Bridge
 *
 * This script runs in an isolated context (sandboxed) and provides
 * a secure bridge between the renderer process and main process via
 * contextBridge and ipcRenderer.
 *
 * Security features:
 * - Context isolation: ENABLED (renderer cannot access Node.js APIs)
 * - Sandbox: ENABLED (preload has limited Node.js access)
 * - Node integration: DISABLED in renderer
 *
 * The @electron-toolkit/preload provides a type-safe electronAPI
 * that exposes common Electron APIs to the renderer process.
 *
 * @see planos/005-run-ttk-electron/TECHSPEC.md Section 2.1
 */

// ============================================================================
// Type Definitions (for internal reference)
// ============================================================================

/**
 * Project info returned by project:open handler.
 */
interface ProjectInfo {
  path: string;
  name: string;
  isValid: boolean;
  troopsCount?: number;
  classesCount?: number;
  enemiesCount?: number;
}

/**
 * Validation result returned by project:validate handler.
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Battle result data structure.
 */
interface BattleResultData {
  troopId: number;
  troopName: string;
  outcome: 'victory' | 'defeat' | 'timeout';
  ttkTurns: number;
  ttkActions: number;
  durationMs: number;
  seed: number;
  expGained: number;
}

/**
 * Simulation result returned by simulation:run handler.
 */
interface SimulationResult {
  trechoId: string;
  troopId: number;
  troopName: string;
  battleResult: BattleResultData;
  passed: boolean;
  warnings: string[];
}

/**
 * Warning data structure.
 */
interface WarningData {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  context: Record<string, unknown>;
}

/**
 * Battle result data in Report format.
 */
interface ReportBattleResult {
  troopId: number;
  troopName: string;
  outcome: 'victory' | 'defeat' | 'timeout';
  ttkTurns: number;
  ttkActions: number;
  durationMs: number;
  seed: number;
  expGained: number;
}

/**
 * Trecho summary data in Report format.
 */
interface TrechoSummaryData {
  id: string;
  name: string;
  passed: boolean;
  battleCount: number;
  avgTtkTurns: number;
  avgTtkActions: number;
  p95TtkTurns: number;
  p95TtkActions: number;
  successRate: number;
  battles: ReportBattleResult[];
  warnings: WarningData[];
}

/**
 * Report data structure returned by simulation:getResults handler.
 */
interface ReportData {
  trechos: TrechoSummaryData[];
  totalBattles: number;
  timestamp: string;
}

/**
 * Project config response returned by config:load handler.
 */
interface ProjectConfigResponse {
  projectPath: string;
  reportOutputPath: string;
  seed: number;
  maxBattleTurns?: number;
  trechos: TrechoData[];
}

/**
 * Trecho data structure.
 */
interface TrechoData {
  id: string;
  name: string;
  anchorLevelMin: number;
  anchorLevelMax: number;
  targetTtkTurns: number;
  targetTtkActions: number;
  tolerancePercent: number;
  troopIds: number[];
  party: {
    members: Array<{ classId: number; level: number }>;
  };
}

/**
 * Troop data structure.
 */
interface TroopData {
  id: number;
  name: string;
  members: Array<{
    enemyId: number;
    x: number;
    y: number;
    hidden: boolean;
  }>;
}

/**
 * Class data structure.
 */
interface ClassData {
  id: number;
  name: string;
  expTable: number[];
}

/**
 * Enemy data structure.
 */
interface EnemyData {
  id: number;
  name: string;
  params: number[];
  dropItems: Array<{ kind: number; dataId: number; denominator: number }>;
}

/**
 * Recent project data structure.
 */
interface RecentProject {
  path: string;
  name: string;
  lastOpened: string;
}

/**
 * User preferences data structure.
 */
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  lastProjectPath: string | null;
}

/**
 * IPC error structure.
 */
interface IPCError {
  name: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  context: Record<string, unknown>;
  timestamp: string;
}

/**
 * Success response wrapper.
 */
interface IPCSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Error response wrapper.
 */
interface IPCErrorResponse {
  success: false;
  error: IPCError;
}

/**
 * Union type for all IPC responses.
 */
type IPCResult<T> = IPCSuccessResponse<T> | IPCErrorResponse;

// ============================================================================
// Coreto API - Exposed to Renderer
// ============================================================================

/**
 * Coreto-specific IPC API exposed to the renderer process.
 *
 * All methods use ipcRenderer.invoke() for request-response communication.
 * Errors from the main process are re-thrown for proper error handling in React.
 */
const coretoAPI = {
  /**
   * Project Handlers
   */

  /**
   * Opens an RPG Maker MZ project and returns basic project info.
   * @param path - Absolute path to the project directory
   * @returns Project information including validation status
   */
  openProject: (path: string): Promise<IPCResult<ProjectInfo>> =>
    ipcRenderer.invoke('project:open', { path }),

  /**
   * Validates an RPG Maker MZ project structure and data integrity.
   * @param path - Absolute path to the project directory
   * @returns Validation result with errors and warnings
   */
  validateProject: (path: string): Promise<IPCResult<ValidationResult>> =>
    ipcRenderer.invoke('project:validate', { path }),

  /**
   * Simulation Handlers
   */

  /**
   * Simulation Event Listeners (Event Streaming Pattern)
   *
   * These listeners provide real-time updates from the worker process
   * via IPC events. Each listener returns a cleanup function that must
   * be called to remove the listener and prevent memory leaks.
   *
   * @see planos/005-run-ttk-electron/TECHSPEC.md Section 2.1
   */

  /**
   * Subscribes to simulation progress updates.
   * @param callback - Called with progress payload on each update
   * @returns Cleanup function to remove listener
   *
   * @example
   * const cleanup = window.coreto.onProgress((payload) => {
   *   console.log(`Progress: ${payload.percentage}% - ${payload.message}`);
   * });
   * // Call cleanup() when done to prevent memory leaks
   */
  onProgress: (
    callback: (payload: ProgressPayload) => void
  ): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: ProgressPayload): void => {
      callback(payload);
    };
    ipcRenderer.on('simulation:progress', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('simulation:progress', listener);
    };
  },

  /**
   * Subscribes to simulation completion event.
   * @param callback - Called with result when simulation completes
   * @returns Cleanup function to remove listener
   *
   * @example
   * const cleanup = window.coreto.onComplete((result) => {
   *   console.log('Simulation complete:', result.report);
   * });
   */
  onComplete: (
    callback: (result: SimulationResultPayload) => void
  ): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, result: SimulationResultPayload): void => {
      callback(result);
    };
    ipcRenderer.on('simulation:complete', listener);

    return () => {
      ipcRenderer.removeListener('simulation:complete', listener);
    };
  },

  /**
   * Subscribes to simulation error event.
   * @param callback - Called with error payload on failure
   * @returns Cleanup function to remove listener
   *
   * @example
   * const cleanup = window.coreto.onError((error) => {
   *   console.error('Simulation failed:', error.title);
   * });
   */
  onError: (
    callback: (error: ErrorPayload) => void
  ): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, error: ErrorPayload): void => {
      callback(error);
    };
    ipcRenderer.on('simulation:error', listener);

    return () => {
      ipcRenderer.removeListener('simulation:error', listener);
    };
  },

  /**
   * Starts a simulation (command - invoke pattern).
   * Returns immediately with simulationId. Result comes via onComplete event.
   *
   * @param params - Simulation parameters
   * @returns Promise resolving to simulation ID
   *
   * @example
   * const response = await window.coreto.startSimulation({
   *   projectPath: '/path/to/project',
   *   configPath: '/path/to/config.json',
   *   seed: 12345
   * });
   * if (response.success) {
   *   console.log('Simulation ID:', response.data.simulationId);
   * }
   */
  startSimulation: (params: {
    projectPath: string;
    configPath: string;
    seed?: number;
    diagnostic?: boolean;
  }): Promise<IPCResult<{ simulationId: string }>> =>
    ipcRenderer.invoke('simulation:start', params),

  /**
   * Cancels the currently running simulation (command - invoke pattern).
   *
   * @returns Promise that resolves when cancellation is requested
   *
   * @example
   * await window.coreto.cancelSimulation();
   */
  cancelSimulation: (): Promise<IPCResult<void>> =>
    ipcRenderer.invoke('simulation:cancel'),

  /**
   * Legacy simulation handler (deprecated - use startSimulation + event listeners).
   * @deprecated Use startSimulation with onProgress/onComplete/onError event listeners
   */
  runSimulation: (
    config: {
      projectPath: string;
      configPath?: string;
      trechoId?: string;
      troopId?: number;
      seed?: number;
      maxTurns?: number;
    }
  ): Promise<IPCResult<SimulationResult>> =>
    ipcRenderer.invoke('simulation:run', config),

  /**
   * Gets the current simulation progress (0-100).
   * @deprecated Use onProgress event listener instead
   * @returns Progress percentage
   */
  getSimulationProgress: (): Promise<IPCResult<number>> =>
    ipcRenderer.invoke('simulation:getProgress'),

  /**
   * Gets the simulation results Report.
   * @returns Report data containing all trecho summaries
   */
  getSimulationResults: (): Promise<IPCResult<ReportData>> =>
    ipcRenderer.invoke('simulation:getResults'),

  /**
   * Configuration Handlers
   */

  /**
   * Loads a project configuration file.
   * @param configPath - Absolute path to the config file
   * @returns Project configuration with all trechos
   */
  loadConfig: (configPath: string): Promise<IPCResult<ProjectConfigResponse>> =>
    ipcRenderer.invoke('config:load', { configPath }),

  /**
   * Gets all trechos from the currently loaded config.
   * @returns Array of trecho configurations
   */
  getTrechos: (): Promise<IPCResult<TrechoData[]>> =>
    ipcRenderer.invoke('config:getTrechos'),

  /**
   * Adds or updates a trecho configuration.
   * @param projectPath - Absolute path to the project directory
   * @param trecho - Trecho configuration to add or update
   * @returns The added or updated trecho
   */
  updateTrecho: (
    projectPath: string,
    trecho: TrechoData
  ): Promise<IPCResult<{ trecho: TrechoData }>> =>
    ipcRenderer.invoke('config:updateTrecho', { projectPath, trecho }),

  /**
   * Deletes a trecho from the configuration.
   * @param projectPath - Absolute path to the project directory
   * @param trechoId - ID of the trecho to delete
   * @returns The deleted trecho ID
   */
  deleteTrecho: (
    projectPath: string,
    trechoId: string
  ): Promise<IPCResult<{ deletedTrechoId: string }>> =>
    ipcRenderer.invoke('config:deleteTrecho', { projectPath, trechoId }),

  /**
   * Updates global configuration settings.
   * @param projectPath - Absolute path to the project directory
   * @param settings - Global settings to update
   * @returns The updated global settings
   */
  updateGlobalSettings: (
    projectPath: string,
    settings: {
      seed?: number;
      maxBattleTurns?: number;
    }
  ): Promise<
    IPCResult<{
      seed: number;
      maxBattleTurns?: number;
    }>
  > =>
    ipcRenderer.invoke('config:updateGlobalSettings', { projectPath, ...settings }),

  /**
   * Data Handlers
   */

  /**
   * Gets all troops from the RPG Maker MZ project.
   * @param projectPath - Absolute path to the project directory
   * @returns Array of troop data
   */
  getTroops: (projectPath: string): Promise<IPCResult<TroopData[]>> =>
    ipcRenderer.invoke('data:getTroops', { projectPath }),

  /**
   * Gets all classes from the RPG Maker MZ project.
   * @param projectPath - Absolute path to the project directory
   * @returns Array of class data
   */
  getClasses: (projectPath: string): Promise<IPCResult<ClassData[]>> =>
    ipcRenderer.invoke('data:getClasses', { projectPath }),

  /**
   * Gets all enemies from the RPG Maker MZ project.
   * @param projectPath - Absolute path to the project directory
   * @returns Array of enemy data
   */
  getEnemies: (projectPath: string): Promise<IPCResult<EnemyData[]>> =>
    ipcRenderer.invoke('data:getEnemies', { projectPath }),

  /**
   * Recent Projects Handlers
   */

  /**
   * Lists recent projects from the database.
   * @param limit - Maximum number of projects to return (default: 10)
   * @returns Array of recent projects
   */
  listRecent: (limit?: number): Promise<IPCResult<RecentProject[]>> =>
    ipcRenderer.invoke('recent:list', limit ? { limit } : undefined),

  /**
   * Adds or updates a recent project in the database.
   * @param path - Absolute path to the project directory
   * @param name - Project name
   * @returns The added or updated recent project
   */
  addRecent: (path: string, name: string): Promise<IPCResult<RecentProject>> =>
    ipcRenderer.invoke('recent:add', { path, name }),

  /**
   * Preferences Handlers
   */

  /**
   * Gets user preferences from the database.
   * @returns User preferences
   */
  getPreferences: (): Promise<IPCResult<UserPreferences>> =>
    ipcRenderer.invoke('preferences:get'),

  /**
   * Updates user preferences in the database.
   * @param preferences - Preferences to update
   * @returns The updated preferences
   */
  setPreferences: (preferences: {
    theme?: 'light' | 'dark' | 'system';
    lastProjectPath?: string | null;
  }): Promise<IPCResult<UserPreferences>> =>
    ipcRenderer.invoke('preferences:set', preferences),
};

// ============================================================================
// Context Bridge Exposure
// ============================================================================

/**
 * Initializes the preload script by exposing APIs to the renderer process.
 *
 * This function can be called directly in tests to verify API exposure
 * without relying on module-level side effects.
 *
 * The renderer process can access:
 * - window.electron: Standard Electron APIs (via @electron-toolkit/preload)
 * - window.coreto: Coreto-specific IPC APIs
 *
 * @example
 * ```typescript
 * // In production, called automatically at module load time
 * initializePreload()
 *
 * // In tests, can be called after mocks are set up
 * import { initializePreload } from './preload/index'
 * jest.mock('electron', () => ({ contextBridge: { ... } }))
 * initializePreload()
 * ```
 */
export function initializePreload(): void {
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld('electron', electronAPI);
      contextBridge.exposeInMainWorld('coreto', coretoAPI);
    } catch (error) {
      console.error('Failed to expose context bridge APIs:', error);
    }
  } else {
    // Fallback for non-isolated context (should not happen with proper config)
    console.warn('Context isolation is not enabled. This is a security risk.');
  }
}

/**
 * Auto-initialize the preload script when imported.
 *
 * In production, this runs immediately when Electron loads the preload script.
 * In tests, the module can be imported without triggering initialization,
 * allowing tests to control when initialization happens.
 */
if (process.env.NODE_ENV !== 'test') {
  initializePreload();
}

/**
 * CoretoAPI type - The complete API interface exposed to renderer.
 * Exported for type-safe testing and TypeScript definitions.
 */
export type CoretoAPI = typeof coretoAPI;

/**
 * Export types for TypeScript definitions.
 * These will be referenced in src/renderer/src/types/preload.d.ts
 */
export type {
  ProjectInfo,
  ValidationResult,
  BattleResultData,
  SimulationResult,
  WarningData,
  ReportBattleResult,
  TrechoSummaryData,
  ReportData,
  ProjectConfigResponse,
  TrechoData,
  TroopData,
  ClassData,
  EnemyData,
  RecentProject,
  UserPreferences,
  IPCError,
  IPCSuccessResponse,
  IPCErrorResponse,
  IPCResult,
  // Worker types (re-exported for renderer)
  ProgressPayload,
  ErrorPayload,
  SimulationResultPayload,
};
