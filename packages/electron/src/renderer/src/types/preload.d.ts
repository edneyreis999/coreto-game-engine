/**
 * Type Definitions for Preload Exposed APIs
 *
 * This file extends the global Window interface with type definitions
 * for the APIs exposed via contextBridge in the preload script.
 *
 * @see src/preload/index.ts
 */

import type { IPC } from '@electron-toolkit/preload';

// ============================================================================
// Standard Electron API
// ============================================================================

/**
 * Standard Electron API exposed via @electron-toolkit/preload
 *
 * Provides type-safe access to common Electron APIs from the renderer process.
 */
interface ElectronAPI {
  ipcRenderer: IPC;
}

// ============================================================================
// Domain Types
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
// Coreto API - IPC Methods
// ============================================================================

/**
 * Coreto-specific IPC API
 *
 * Provides type-safe access to Coreto Game Engine functionality
 * from the renderer process via IPC communication.
 */
interface CoretoAPI {
  /**
   * Project Handlers
   */

  /**
   * Opens an RPG Maker MZ project and returns basic project info.
   * @param path - Absolute path to the project directory
   * @returns Promise with project information
   *
   * @example
   * const result = await window.coreto.openProject('/path/to/project');
   * if (result.success) {
   *   console.log('Project name:', result.data.name);
   * }
   */
  openProject(path: string): Promise<IPCResult<ProjectInfo>>;

  /**
   * Validates an RPG Maker MZ project structure and data integrity.
   * @param path - Absolute path to the project directory
   * @returns Promise with validation result
   *
   * @example
   * const result = await window.coreto.validateProject('/path/to/project');
   * if (result.success) {
   *   console.log('Is valid:', result.data.isValid);
   *   console.log('Errors:', result.data.errors);
   * }
   */
  validateProject(path: string): Promise<IPCResult<ValidationResult>>;

  /**
   * Simulation Handlers
   */

  /**
   * Executes a TTK battle simulation.
   * @param config - Simulation configuration
   * @returns Promise with simulation result
   *
   * @example
   * const result = await window.coreto.runSimulation({
   *   projectPath: '/path/to/project',
   *   troopId: 1,
   *   seed: 12345
   * });
   * if (result.success) {
   *   console.log('TTK:', result.data.battleResult.ttkTurns);
   * }
   */
  runSimulation(config: {
    projectPath: string;
    configPath?: string;
    trechoId?: string;
    troopId?: number;
    seed?: number;
    maxTurns?: number;
  }): Promise<IPCResult<SimulationResult>>;

  /**
   * Gets the current simulation progress (0-100).
   * @returns Promise with progress percentage
   *
   * @example
   * const result = await window.coreto.getSimulationProgress();
   * if (result.success) {
   *   console.log('Progress:', result.data, '%');
   * }
   */
  getSimulationProgress(): Promise<IPCResult<number>>;

  /**
   * Cancels the currently running simulation.
   * @returns Promise that resolves when cancelled
   *
   * @example
   * await window.coreto.cancelSimulation();
   */
  cancelSimulation(): Promise<IPCResult<void>>;

  /**
   * Gets the simulation results Report.
   * @returns Promise with Report data containing all trecho summaries
   *
   * @example
   * const result = await window.coreto.getSimulationResults();
   * if (result.success) {
   *   console.log('Trechos:', result.data.trechos.length);
   * }
   */
  getSimulationResults(): Promise<IPCResult<ReportData>>;

  /**
   * Configuration Handlers
   */

  /**
   * Loads a project configuration file.
   * @param configPath - Absolute path to the config file
   * @returns Promise with project configuration
   *
   * @example
   * const result = await window.coreto.loadConfig('/path/to/config.json');
   * if (result.success) {
   *   console.log('Trechos:', result.data.trechos.length);
   * }
   */
  loadConfig(configPath: string): Promise<IPCResult<ProjectConfigResponse>>;

  /**
   * Gets all trechos from the currently loaded config.
   * @returns Promise with array of trecho configurations
   *
   * @example
   * const result = await window.coreto.getTrechos();
   * if (result.success) {
   *   result.data.forEach(trecho => console.log(trecho.name));
   * }
   */
  getTrechos(): Promise<IPCResult<TrechoData[]>>;

  /**
   * Data Handlers
   */

  /**
   * Gets all troops from the RPG Maker MZ project.
   * @param projectPath - Absolute path to the project directory
   * @returns Promise with array of troop data
   *
   * @example
   * const result = await window.coreto.getTroops('/path/to/project');
   * if (result.success) {
   *   console.log('Troops:', result.data.length);
   * }
   */
  getTroops(projectPath: string): Promise<IPCResult<TroopData[]>>;

  /**
   * Gets all classes from the RPG Maker MZ project.
   * @param projectPath - Absolute path to the project directory
   * @returns Promise with array of class data
   *
   * @example
   * const result = await window.coreto.getClasses('/path/to/project');
   * if (result.success) {
   *   console.log('Classes:', result.data.length);
   * }
   */
  getClasses(projectPath: string): Promise<IPCResult<ClassData[]>>;

  /**
   * Gets all enemies from the RPG Maker MZ project.
   * @param projectPath - Absolute path to the project directory
   * @returns Promise with array of enemy data
   *
   * @example
   * const result = await window.coreto.getEnemies('/path/to/project');
   * if (result.success) {
   *   console.log('Enemies:', result.data.length);
   * }
   */
  getEnemies(projectPath: string): Promise<IPCResult<EnemyData[]>>;

  /**
   * Recent Projects Handlers
   */

  /**
   * Lists recent projects from the database.
   * @param limit - Maximum number of projects to return (default: 10)
   * @returns Promise with array of recent projects
   *
   * @example
   * const result = await window.coreto.listRecent(5);
   * if (result.success) {
   *   result.data.forEach(p => console.log(p.name));
   * }
   */
  listRecent(limit?: number): Promise<IPCResult<RecentProject[]>>;

  /**
   * Adds or updates a recent project in the database.
   * @param path - Absolute path to the project directory
   * @param name - Project name
   * @returns Promise with the added or updated recent project
   *
   * @example
   * const result = await window.coreto.addRecent('/path/to/project', 'My Game');
   * if (result.success) {
   *   console.log('Added to recent:', result.data.name);
   * }
   */
  addRecent(path: string, name: string): Promise<IPCResult<RecentProject>>;

  /**
   * Preferences Handlers
   */

  /**
   * Gets user preferences from the database.
   * @returns Promise with user preferences
   *
   * @example
   * const result = await window.coreto.getPreferences();
   * if (result.success) {
   *   console.log('Theme:', result.data.theme);
   * }
   */
  getPreferences(): Promise<IPCResult<UserPreferences>>;

  /**
   * Updates user preferences in the database.
   * @param preferences - Preferences to update
   * @returns Promise with the updated preferences
   *
   * @example
   * const result = await window.coreto.setPreferences({ lastProjectPath: '/path/to/project' });
   * if (result.success) {
   *   console.log('Preferences updated');
   * }
   */
  setPreferences(preferences: {
    theme?: 'light' | 'dark' | 'system';
    lastProjectPath?: string | null;
  }): Promise<IPCResult<UserPreferences>>;
}

// ============================================================================
// Global Window Interface Extension
// ============================================================================

/**
 * Extend Window interface with exposed preload APIs
 *
 * This allows TypeScript to recognize window.electron and window.coreto
 * in the renderer process.
 */
declare global {
  interface Window {
    /**
     * Standard Electron APIs exposed via @electron-toolkit/preload
     *
     * @example
     * window.electron.ipcRenderer.send('channel', data)
     * const result = await window.electron.ipcRenderer.invoke('channel')
     */
    electron: ElectronAPI;

    /**
     * Coreto-specific IPC APIs
     *
     * @example
     * const project = await window.coreto.openProject('/path/to/project')
     * const results = await window.coreto.runSimulation(config)
     */
    coreto: CoretoAPI;
  }
}

// Export types for use in components
export type {
  ElectronAPI,
  CoretoAPI,
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
};
