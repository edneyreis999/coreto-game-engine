import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import type {
  // IPC Types
  ProjectInfo,
  ValidationResult,
  SimulationResult,
  ReportData,
  ProjectConfigResponse,
  TrechoData,
  TroopData,
  ClassData,
  EnemyData,
  RecentProject,
  UserPreferences,
  HistoryEntry,
  SimulationReport,
  IPCResult,
  // Worker Communication Types
  ProgressPayload,
  ErrorPayload,
  SimulationResultPayload,
} from '@coreto/electron/domain/types';

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
// Type Definitions
// ============================================================================

/**
 * All IPC types are imported from the domain layer.
 * @see packages/electron/src/domain/types
 */

// ============================================================================
// Coreto API - Exposed to Renderer (Domain-Segregated)
// ============================================================================

/**
 * Project Management API
 *
 * Handles RPG Maker MZ project operations (open, validate).
 */
const projectAPI = {
  /**
   * Opens an RPG Maker MZ project and returns basic project info.
   * @param path - Absolute path to the project directory
   * @returns Project information including validation status
   */
  open: (path: string): Promise<IPCResult<ProjectInfo>> =>
    ipcRenderer.invoke('project:open', { path }),

  /**
   * Validates an RPG Maker MZ project structure and data integrity.
   * @param path - Absolute path to the project directory
   * @returns Validation result with errors and warnings
   */
  validate: (path: string): Promise<IPCResult<ValidationResult>> =>
    ipcRenderer.invoke('project:validate', { path }),
};

/**
 * Simulation Execution API
 *
 * Handles TTK simulation lifecycle (start, cancel, progress, results).
 * Uses Event Streaming Pattern for real-time updates.
 *
 * @see planos/005-run-ttk-electron/TECHSPEC.md Section 2.1
 */
const simulationAPI = {
  /**
   * Event Listeners (Event Streaming Pattern)
   *
   * These listeners provide real-time updates from the worker process
   * via IPC events. Each listener returns a cleanup function that must
   * be called to remove the listener and prevent memory leaks.
   */

  /**
   * Subscribes to simulation progress updates.
   * @param callback - Called with progress payload on each update
   * @returns Cleanup function to remove listener
   *
   * @example
   * const cleanup = window.coreto.simulation.onProgress((payload) => {
   *   console.log(`Progress: ${payload.percentage}% - ${payload.message}`);
   * });
   * // Call cleanup() when done to prevent memory leaks
   */
  onProgress: (callback: (payload: ProgressPayload) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: ProgressPayload): void => {
      callback(payload);
    };
    ipcRenderer.on('simulation:progress', listener);

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
   * const cleanup = window.coreto.simulation.onComplete((result) => {
   *   console.log('Simulation complete:', result.report);
   * });
   */
  onComplete: (callback: (result: SimulationResultPayload) => void): (() => void) => {
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
   * const cleanup = window.coreto.simulation.onError((error) => {
   *   console.error('Simulation failed:', error.title);
   * });
   */
  onError: (callback: (error: ErrorPayload) => void): (() => void) => {
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
   * const response = await window.coreto.simulation.start({
   *   projectPath: '/path/to/project',
   *   configPath: '/path/to/config.json',
   *   seed: 12345
   * });
   * if (response.success) {
   *   console.log('Simulation ID:', response.data.simulationId);
   * }
   */
  start: (params: {
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
   * await window.coreto.simulation.cancel();
   */
  cancel: (): Promise<IPCResult<void>> => ipcRenderer.invoke('simulation:cancel'),

  /**
   * Gets the simulation results Report.
   * @returns Report data containing all trecho summaries
   */
  getResults: (): Promise<IPCResult<ReportData>> =>
    ipcRenderer.invoke('simulation:getResults'),

  /**
   * Gets the current simulation progress (0-100).
   * @deprecated Use onProgress event listener instead
   * @returns Progress percentage
   */
  getProgress: (): Promise<IPCResult<number>> =>
    ipcRenderer.invoke('simulation:getProgress'),

  /**
   * Legacy simulation handler (deprecated - use start + event listeners).
   * @deprecated Use start with onProgress/onComplete/onError event listeners
   */
  run: (config: {
    projectPath: string;
    configPath?: string;
    trechoId?: string;
    troopId?: number;
    seed?: number;
    maxTurns?: number;
  }): Promise<IPCResult<SimulationResult>> => ipcRenderer.invoke('simulation:run', config),
};

/**
 * Configuration Management API
 *
 * Handles project configuration CRUD operations (save, load, update trechos).
 */
const configAPI = {
  /**
   * Saves a project configuration.
   * Accepts ConfigurationPanel format (TrechoFormData).
   * @param projectPath - Absolute path to the project directory
   * @param config - Configuration with trechos and global settings
   * @returns Success status and config file path
   *
   * @example
   * const response = await window.coreto.config.save('/path/to/project', {
   *   trechos: [...],
   *   globalSettings: { seed: 12345, maxBattleTurns: 50 }
   * });
   */
  save: (
    projectPath: string,
    config: {
      version?: string;
      trechos: Array<{
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
      }>;
      globalSettings?: {
        seed: number;
        maxBattleTurns?: number;
      };
      metadata?: {
        projectName?: string;
        lastModified?: number;
      };
    }
  ): Promise<IPCResult<{ success: boolean; configPath: string }>> =>
    ipcRenderer.invoke('config:save', { projectPath, config }),

  /**
   * Loads a project configuration file.
   * @param configPath - Absolute path to the config file
   * @returns Project configuration with all trechos
   */
  load: (configPath: string): Promise<IPCResult<ProjectConfigResponse>> =>
    ipcRenderer.invoke('config:load', { configPath }),

  /**
   * Gets all trechos from the currently loaded config.
   * @returns Array of trecho configurations
   */
  getTrechos: (): Promise<IPCResult<TrechoData[]>> => ipcRenderer.invoke('config:getTrechos'),

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
  > => ipcRenderer.invoke('config:updateGlobalSettings', { projectPath, ...settings }),
};

/**
 * RPG Maker Data Access API
 *
 * Provides read access to RPG Maker MZ project data (troops, classes, enemies).
 */
const dataAPI = {
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
};

/**
 * Recent Projects API
 *
 * Manages recent project history (list, add).
 */
const recentAPI = {
  /**
   * Lists recent projects from the database.
   * @param limit - Maximum number of projects to return (default: 10)
   * @returns Array of recent projects
   */
  list: (limit?: number): Promise<IPCResult<RecentProject[]>> =>
    ipcRenderer.invoke('recent:list', limit ? { limit } : undefined),

  /**
   * Adds or updates a recent project in the database.
   * @param path - Absolute path to the project directory
   * @param name - Project name
   * @returns The added or updated recent project
   */
  add: (path: string, name: string): Promise<IPCResult<RecentProject>> =>
    ipcRenderer.invoke('recent:add', { path, name }),
};

/**
 * User Preferences API
 *
 * Manages user application preferences (theme, last project).
 */
const preferencesAPI = {
  /**
   * Gets user preferences from the database.
   * @returns User preferences
   */
  get: (): Promise<IPCResult<UserPreferences>> => ipcRenderer.invoke('preferences:get'),

  /**
   * Updates user preferences in the database.
   * @param preferences - Preferences to update
   * @returns The updated preferences
   */
  set: (preferences: {
    theme?: 'light' | 'dark' | 'system';
    lastProjectPath?: string | null;
  }): Promise<IPCResult<UserPreferences>> => ipcRenderer.invoke('preferences:set', preferences),
};

/**
 * Simulation History API
 *
 * Manages simulation history persistence (list, load report, export, delete).
 */
const historyAPI = {
  /**
   * Lists simulation history from the database.
   * @param projectPath - Optional filter by project path
   * @param limit - Maximum number of entries to return (default: 50)
   * @returns Array of history entries
   */
  list: (
    projectPath?: string,
    limit?: number
  ): Promise<IPCResult<{ simulations: HistoryEntry[] }>> =>
    ipcRenderer.invoke('history:list', projectPath ? { projectPath, limit } : { limit }),

  /**
   * Loads a detailed simulation report from file.
   * @param simulationId - UUID of the simulation
   * @returns Simulation report or null if not found
   */
  loadReport: (simulationId: string): Promise<IPCResult<{ report: SimulationReport | null }>> =>
    ipcRenderer.invoke('history:loadReport', { simulationId }),

  /**
   * Exports a simulation report to file.
   * @param simulationId - UUID of the simulation
   * @param result - Report data to export
   * @param projectPath - Project path for file organization
   * @returns File path of exported report
   */
  exportReport: (
    simulationId: string,
    result: ReportData,
    projectPath: string
  ): Promise<IPCResult<{ filePath: string }>> =>
    ipcRenderer.invoke('history:export', { simulationId, result, projectPath }),

  /**
   * Deletes a simulation record and its report file.
   * @param simulationId - UUID of the simulation to delete
   * @returns The deleted simulation ID
   */
  delete: (simulationId: string): Promise<IPCResult<{ deletedId: string }>> =>
    ipcRenderer.invoke('history:delete', { simulationId }),

  /**
   * Generates a unique simulation ID for a new simulation.
   * @returns Unique simulation UUID
   */
  generateId: (): Promise<IPCResult<{ simulationId: string }>> =>
    ipcRenderer.invoke('history:generateId', undefined),
};

// ============================================================================
// Context Bridge Exposure
// ============================================================================

/**
 * Coreto API - Domain-Segregated Interface
 *
 * Organizes API methods by domain concern for better discoverability and maintainability.
 * Each API group represents a cohesive set of operations.
 *
 * @example
 * // Project operations
 * await window.coreto.project.open('/path/to/project');
 *
 * // Simulation operations
 * await window.coreto.simulation.start({ projectPath, configPath });
 * window.coreto.simulation.onProgress((progress) => { ... });
 *
 * // Configuration management
 * await window.coreto.config.save(projectPath, config);
 *
 * // Data access
 * const troops = await window.coreto.data.getTroops(projectPath);
 *
 * // History operations
 * await window.coreto.history.list();
 *
 * // User preferences
 * await window.coreto.preferences.set({ theme: 'dark' });
 *
 * // Recent projects
 * await window.coreto.recent.add(path, name);
 */
const coretoAPI = {
  project: projectAPI,
  simulation: simulationAPI,
  config: configAPI,
  data: dataAPI,
  history: historyAPI,
  preferences: preferencesAPI,
  recent: recentAPI,
};

/**
 * Initializes the preload script by exposing APIs to the renderer process.
 *
 * This function can be called directly in tests to verify API exposure
 * without relying on module-level side effects.
 *
 * The renderer process can access:
 * - window.electron: Standard Electron APIs (via @electron-toolkit/preload)
 * - window.coreto: Coreto-specific IPC APIs (domain-segregated)
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
      console.error('[Preload] Failed to expose context bridge APIs:', error);
    }
  } else {
    // Fallback for non-isolated context (should not happen with proper config)
    console.warn('[Preload] Context isolation is not enabled. This is a security risk.');
  }
}

/**
 * Auto-initialize the preload script when imported.
 *
 * In production, this runs immediately when Electron loads the preload script.
 * In tests, the module can be imported without triggering initialization,
 * allowing tests to control when initialization happens.
 *
 * NOTE: Always initialize in Electron context (when contextBridge exists)
 */
if (typeof contextBridge !== 'undefined') {
  initializePreload();
} else {
  console.error('[Preload] contextBridge is undefined! API will not be available.');
}

/**
 * CoretoAPI type - The complete API interface exposed to renderer.
 * Exported for type-safe testing and TypeScript definitions.
 */
export type CoretoAPI = typeof coretoAPI;
