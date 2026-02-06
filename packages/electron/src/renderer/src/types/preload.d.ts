/**
 * Type Definitions for Preload Exposed APIs (Domain-Segregated)
 *
 * This file extends the global Window interface with type definitions
 * for the APIs exposed via contextBridge in the preload script.
 *
 * API is organized by domain concern for better discoverability:
 * - project: Project management (open, validate)
 * - simulation: Simulation execution (start, cancel, progress events)
 * - config: Configuration management (save, load, update)
 * - data: RPG Maker data access (troops, classes, enemies)
 * - history: Simulation history (list, load, export, delete)
 * - preferences: User preferences (get, set)
 * - recent: Recent projects (list, add)
 *
 * @see src/preload/index.ts
 */

import type { IPC } from '@electron-toolkit/preload';

// Import all domain types from canonical source (domain layer)
import type {
  // IPC Types
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
  SimulationSummary,
  HistoryEntry,
  SimulationReport,
  IPCError,
  IPCSuccessResponse,
  IPCErrorResponse,
  IPCResult,
  // Worker Communication Types (now in domain layer)
  ProgressPayload,
  ErrorPayload,
  SimulationResultPayload,
} from '@coreto/electron/domain/types';

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
// Re-exported Types (for convenience in renderer code)
// ============================================================================

/**
 * All types are imported from the canonical domain layer.
 * No re-exports needed - import directly from @coreto/electron/domain/types.
 */

// ============================================================================
// Coreto API - IPC Methods (Domain-Segregated)
// ============================================================================

/**
 * Project Management API Interface
 *
 * Handles RPG Maker MZ project operations.
 */
interface ProjectAPI {
  /**
   * Opens an RPG Maker MZ project and returns basic project info.
   * @param path - Absolute path to the project directory
   * @returns Promise with project information
   *
   * @example
   * const result = await window.coreto.project.open('/path/to/project');
   * if (result.success) {
   *   console.log('Project name:', result.data.name);
   * }
   */
  open(path: string): Promise<IPCResult<ProjectInfo>>;

  /**
   * Validates an RPG Maker MZ project structure and data integrity.
   * @param path - Absolute path to the project directory
   * @returns Promise with validation result
   *
   * @example
   * const result = await window.coreto.project.validate('/path/to/project');
   * if (result.success) {
   *   console.log('Is valid:', result.data.isValid);
   *   console.log('Errors:', result.data.errors);
   * }
   */
  validate(path: string): Promise<IPCResult<ValidationResult>>;
}

/**
 * Simulation Execution API Interface
 *
 * Handles TTK simulation lifecycle using Event Streaming Pattern.
 */
interface SimulationAPI {
  /**
   * Subscribes to simulation progress updates.
   * @param callback - Called with progress payload on each update
   * @returns Cleanup function to remove listener (call on unmount!)
   *
   * @example
   * const cleanup = window.coreto.simulation.onProgress((payload) => {
   *   console.log(`Progress: ${payload.percentage}% - ${payload.message}`);
   * });
   * // Call cleanup() in useEffect cleanup to prevent memory leaks
   */
  onProgress(callback: (payload: ProgressPayload) => void): () => void;

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
  onComplete(callback: (result: SimulationResultPayload) => void): () => void;

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
  onError(callback: (error: ErrorPayload) => void): () => void;

  /**
   * Starts a simulation (command - invoke pattern).
   * Returns immediately with simulationId. Result comes via onComplete event.
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
  start(params: {
    projectPath: string;
    configPath: string;
    seed?: number;
    diagnostic?: boolean;
  }): Promise<IPCResult<{ simulationId: string }>>;

  /**
   * Cancels the currently running simulation.
   * @returns Promise that resolves when cancelled
   *
   * @example
   * await window.coreto.simulation.cancel();
   */
  cancel(): Promise<IPCResult<void>>;

  /**
   * Gets the simulation results Report.
   * @returns Promise with Report data containing all trecho summaries
   *
   * @example
   * const result = await window.coreto.simulation.getResults();
   * if (result.success) {
   *   console.log('Trechos:', result.data.trechos.length);
   * }
   */
  getResults(): Promise<IPCResult<ReportData>>;

  /**
   * Gets the current simulation progress (0-100).
   * @deprecated Use onProgress event listener instead
   * @returns Promise with progress percentage
   */
  getProgress(): Promise<IPCResult<number>>;

  /**
   * Legacy simulation handler (deprecated - use start + event listeners).
   * @deprecated Use start with onProgress/onComplete/onError event listeners
   */
  run(config: {
    projectPath: string;
    configPath?: string;
    trechoId?: string;
    troopId?: number;
    seed?: number;
    maxTurns?: number;
  }): Promise<IPCResult<SimulationResult>>;
}

/**
 * Configuration Management API Interface
 *
 * Handles project configuration CRUD operations.
 */
interface ConfigAPI {
  /**
   * Saves a project configuration.
   * @param projectPath - Absolute path to the project directory
   * @param config - Configuration with trechos and global settings
   * @returns Promise with success status and config file path
   *
   * @example
   * const result = await window.coreto.config.save('/path/to/project', {
   *   version: '1.0',
   *   trechos: [{...}],
   *   globalSettings: { seed: 12345 }
   * });
   */
  save(
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
  ): Promise<IPCResult<{ success: boolean; configPath: string }>>;

  /**
   * Loads a project configuration file.
   * @param configPath - Absolute path to the config file
   * @returns Promise with project configuration
   *
   * @example
   * const result = await window.coreto.config.load('/path/to/config.json');
   * if (result.success) {
   *   console.log('Trechos:', result.data.trechos.length);
   * }
   */
  load(configPath: string): Promise<IPCResult<ProjectConfigResponse>>;

  /**
   * Gets all trechos from the currently loaded config.
   * @returns Promise with array of trecho configurations
   */
  getTrechos(): Promise<IPCResult<TrechoData[]>>;

  /**
   * Adds or updates a trecho configuration.
   * @param projectPath - Absolute path to the project directory
   * @param trecho - Trecho configuration to add or update
   * @returns The added or updated trecho
   */
  updateTrecho(projectPath: string, trecho: TrechoData): Promise<IPCResult<{ trecho: TrechoData }>>;

  /**
   * Deletes a trecho from the configuration.
   * @param projectPath - Absolute path to the project directory
   * @param trechoId - ID of the trecho to delete
   * @returns The deleted trecho ID
   */
  deleteTrecho(
    projectPath: string,
    trechoId: string
  ): Promise<IPCResult<{ deletedTrechoId: string }>>;

  /**
   * Updates global configuration settings.
   * @param projectPath - Absolute path to the project directory
   * @param settings - Global settings to update
   * @returns The updated global settings
   */
  updateGlobalSettings(
    projectPath: string,
    settings: {
      seed?: number;
      maxBattleTurns?: number;
    }
  ): Promise<IPCResult<{ seed: number; maxBattleTurns?: number }>>;
}

/**
 * RPG Maker Data Access API Interface
 *
 * Provides read access to RPG Maker MZ project data.
 */
interface DataAPI {
  /**
   * Gets all troops from the RPG Maker MZ project.
   * @param projectPath - Absolute path to the project directory
   * @returns Promise with array of troop data
   */
  getTroops(projectPath: string): Promise<IPCResult<TroopData[]>>;

  /**
   * Gets all classes from the RPG Maker MZ project.
   * @param projectPath - Absolute path to the project directory
   * @returns Promise with array of class data
   */
  getClasses(projectPath: string): Promise<IPCResult<ClassData[]>>;

  /**
   * Gets all enemies from the RPG Maker MZ project.
   * @param projectPath - Absolute path to the project directory
   * @returns Promise with array of enemy data
   */
  getEnemies(projectPath: string): Promise<IPCResult<EnemyData[]>>;
}

/**
 * Simulation History API Interface
 *
 * Manages simulation history persistence.
 */
interface HistoryAPI {
  /**
   * Lists simulation history from the database.
   * @param projectPath - Optional filter by project path
   * @param limit - Maximum number of entries to return (default: 50)
   * @returns Promise with array of history entries
   */
  list(
    projectPath?: string,
    limit?: number
  ): Promise<IPCResult<{ simulations: HistoryEntry[] }>>;

  /**
   * Loads a detailed simulation report from file.
   * @param simulationId - UUID of the simulation
   * @returns Promise with simulation report or null if not found
   */
  loadReport(simulationId: string): Promise<IPCResult<{ report: SimulationReport | null }>>;

  /**
   * Exports a simulation report to file.
   * @param simulationId - UUID of the simulation
   * @param result - Report data to export
   * @param projectPath - Project path for file organization
   * @returns Promise with file path of exported report
   */
  exportReport(
    simulationId: string,
    result: ReportData,
    projectPath: string
  ): Promise<IPCResult<{ filePath: string }>>;

  /**
   * Deletes a simulation record and its report file.
   * @param simulationId - UUID of the simulation to delete
   * @returns Promise with the deleted simulation ID
   */
  delete(simulationId: string): Promise<IPCResult<{ deletedId: string }>>;

  /**
   * Generates a unique simulation ID for a new simulation.
   * @returns Promise with unique simulation UUID
   */
  generateId(): Promise<IPCResult<{ simulationId: string }>>;
}

/**
 * User Preferences API Interface
 *
 * Manages user application preferences.
 */
interface PreferencesAPI {
  /**
   * Gets user preferences from the database.
   * @returns Promise with user preferences
   */
  get(): Promise<IPCResult<UserPreferences>>;

  /**
   * Updates user preferences in the database.
   * @param preferences - Preferences to update
   * @returns Promise with the updated preferences
   */
  set(preferences: {
    theme?: 'light' | 'dark' | 'system';
    lastProjectPath?: string | null;
  }): Promise<IPCResult<UserPreferences>>;
}

/**
 * Recent Projects API Interface
 *
 * Manages recent project history.
 */
interface RecentAPI {
  /**
   * Lists recent projects from the database.
   * @param limit - Maximum number of projects to return (default: 10)
   * @returns Promise with array of recent projects
   */
  list(limit?: number): Promise<IPCResult<RecentProject[]>>;

  /**
   * Adds or updates a recent project in the database.
   * @param path - Absolute path to the project directory
   * @param name - Project name
   * @returns Promise with the added or updated recent project
   */
  add(path: string, name: string): Promise<IPCResult<RecentProject>>;
}

/**
 * Coreto-specific IPC API (Domain-Segregated)
 *
 * Organizes API methods by domain concern for better discoverability and maintainability.
 */
interface CoretoAPI {
  /** Project management operations */
  project: ProjectAPI;
  /** Simulation execution and progress tracking */
  simulation: SimulationAPI;
  /** Configuration management */
  config: ConfigAPI;
  /** RPG Maker data access */
  data: DataAPI;
  /** Simulation history persistence */
  history: HistoryAPI;
  /** User preferences */
  preferences: PreferencesAPI;
  /** Recent projects tracking */
  recent: RecentAPI;
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
     * Coreto-specific IPC APIs (domain-segregated)
     *
     * @example
     * // Project operations
     * const project = await window.coreto.project.open('/path/to/project')
     *
     * // Simulation operations
     * await window.coreto.simulation.start({ projectPath, configPath })
     * window.coreto.simulation.onProgress((progress) => { ... })
     *
     * // Configuration management
     * await window.coreto.config.save(projectPath, config)
     *
     * // Data access
     * const troops = await window.coreto.data.getTroops(projectPath)
     */
    coreto: CoretoAPI;
  }
}

// Export API interfaces for use in components
export type { ElectronAPI, CoretoAPI };

// Note: Domain types should be imported directly from @coreto/electron/domain/types
// This avoids re-export chains and makes dependencies explicit
