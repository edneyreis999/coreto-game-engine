/**
 * IPC Type Definitions
 *
 * Types specific to IPC communication between main and renderer processes.
 * These types are not core domain types but are used for serialization and
 * data transfer across process boundaries.
 *
 * @module domain/types
 */

// ============================================================================
// Project Types
// ============================================================================

/**
 * Project info returned by project:open handler.
 */
export interface ProjectInfo {
  path: string;
  name: string;
  isValid: boolean;
  troopsCount?: number;
  classesCount?: number;
  enemiesCount?: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Party member configuration.
 */
export interface PartyMemberData {
  classId: number;
  level: number;
}

/**
 * Party configuration.
 */
export interface PartyConfigData {
  members: PartyMemberData[];
}

/**
 * Trecho data structure.
 */
export interface TrechoData {
  id: string;
  name: string;
  anchorLevelMin: number;
  anchorLevelMax: number;
  targetTtkTurns: number;
  targetTtkActions: number;
  tolerancePercent: number;
  troopIds: number[];
  party: PartyConfigData;
}

/**
 * Project config response returned by config:load handler.
 */
export interface ProjectConfigResponse {
  projectPath: string;
  reportOutputPath: string;
  seed: number;
  maxBattleTurns?: number;
  trechos: TrechoData[];
}

// ============================================================================
// RPG Maker Data Types
// ============================================================================

/**
 * Troop data structure.
 */
export interface TroopData {
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
export interface ClassData {
  id: number;
  name: string;
  expTable: number[];
}

/**
 * Enemy data structure.
 */
export interface EnemyData {
  id: number;
  name: string;
  params: number[];
  dropItems: Array<{ kind: number; dataId: number; denominator: number }>;
}

// ============================================================================
// Application State Types
// ============================================================================

/**
 * Recent project data structure.
 */
export interface RecentProject {
  path: string;
  name: string;
  lastOpened: string;
}

/**
 * User preferences data structure.
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  lastProjectPath: string | null;
}

/**
 * Simulation summary data for history entries.
 */
export interface SimulationSummary {
  totalBattles: number;
  trechosCount: number;
  passedCount: number;
  failedCount: number;
  timestamp: string;
}

/**
 * History entry data structure.
 */
export interface HistoryEntry {
  id: string;
  projectPath: string;
  timestamp: number;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  summary: SimulationSummary;
  hasReport: boolean;
}

/**
 * Detailed simulation report data structure.
 */
export interface SimulationReport {
  simulationId: string;
  projectPath: string;
  timestamp: number;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  summary: SimulationSummary;
  reportData: import('./domain-types.js').ReportData;
}

// ============================================================================
// IPC Error & Response Types
// ============================================================================

/**
 * IPC error structure.
 */
export interface IPCError {
  name: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  context: Record<string, unknown>;
  timestamp: string;
}

/**
 * Success response wrapper.
 */
export interface IPCSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Error response wrapper.
 */
export interface IPCErrorResponse {
  success: false;
  error: IPCError;
}

/**
 * Union type for all IPC responses.
 */
export type IPCResult<T> = IPCSuccessResponse<T> | IPCErrorResponse;
