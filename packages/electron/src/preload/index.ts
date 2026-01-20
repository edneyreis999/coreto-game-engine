import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

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
   * Executes a TTK battle simulation.
   * @param config - Simulation configuration
   * @returns Simulation result with battle metrics
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
   * @returns Progress percentage
   */
  getSimulationProgress: (): Promise<IPCResult<number>> =>
    ipcRenderer.invoke('simulation:getProgress'),

  /**
   * Cancels the currently running simulation.
   */
  cancelSimulation: (): Promise<IPCResult<void>> =>
    ipcRenderer.invoke('simulation:cancel'),

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
 * Expose APIs to renderer process via contextBridge.
 *
 * The renderer process can access:
 * - window.electron: Standard Electron APIs (via @electron-toolkit/preload)
 * - window.coreto: Coreto-specific IPC APIs
 */
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

/**
 * Export types for TypeScript definitions.
 * These will be referenced in src/renderer/src/types/preload.d.ts
 */
export type {
  ProjectInfo,
  ValidationResult,
  BattleResultData,
  SimulationResult,
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
};
