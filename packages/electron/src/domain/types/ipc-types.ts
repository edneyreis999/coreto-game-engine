/**
 * Domain DTOs for IPC Serialization
 *
 * Data Transfer Objects (DTOs) used for serializing domain data
 * across IPC boundaries between main and renderer processes.
 *
 * IPC protocol types (IPCResult, IPCError, IPCChannel) have been moved to
 * main/ipc/protocol-types.ts as they are transport-layer concerns.
 *
 * @module domain/types
 * @see main/ipc/protocol-types.ts for IPC protocol types
 */

// Re-export domain entities for IPC contracts
export type { TroopData, ClassData, EnemyData } from '../entities/game-data.js';
export type { ProjectInfo } from '../entities/project.js';
export type { SimulationSummary, SimulationReport } from '../entities/simulation.js';

// ============================================================================
// Configuration DTOs
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
// Application State DTOs
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
 * Simulation history entry data structure (IPC-specific).
 * Note: SimulationSummary is imported from entities/simulation.ts.
 */
export interface HistoryEntry {
  id: string;
  projectPath: string;
  timestamp: number;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  summary: SimulationSummary;
  hasReport: boolean;
}

// ============================================================================
// Oracle MCP - Project Analyzer DTOs
// ============================================================================

/**
 * Quest variable information from CommonEvents.json analysis.
 */
export interface QuestVariableInfo {
  variableId: number;
  name: string;
  type: 'game_progress' | 'state_tracking' | 'counter' | 'flag';
  scope: 'global' | 'scene_specific';
}

/**
 * Available resources in the MZ project.
 */
export interface AvailableResources {
  sprites: string[];
  pictures: string[];
  bgm: string[];
  me: string[];
  se: string[];
  battlebacks: string[];
}

/**
 * Analysis result from MZ project structure inspection.
 */
export interface ProjectAnalysis {
  projectPath: string;
  analyzedAt: string; // ISO 8601 timestamp
  questVariables: QuestVariableInfo[];
  mapCount: number;
  troopCount: number;
  availableResources: AvailableResources;
  recommendedQuestVariable?: QuestVariableInfo;
  recommendedMapId?: number;
  warnings: string[];
}

/**
 * Response type for oracle-mcp:analyze-project endpoint.
 * Contains structured JSON analysis and human-readable markdown.
 */
export interface AnalyzeProjectResponse {
  analysis: ProjectAnalysis;
  markdown: string;
  timestamp: string; // ISO 8601 timestamp
}

/**
 * File paths generated during test analysis.
 */
export interface TestAnalysisFiles {
  json: string; // Relative path to JSON output
  markdown: string; // Relative path to Markdown output
}

/**
 * Response type for oracle-mcp:test-analyze-project endpoint.
 * Contains test execution results and output file locations.
 */
export interface TestAnalyzeProjectResponse {
  success: boolean;
  outputPath: string;
  files: TestAnalysisFiles;
  timestamp: string; // ISO 8601 timestamp
}
