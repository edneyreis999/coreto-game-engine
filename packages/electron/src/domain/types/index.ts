/**
 * Domain Types Index
 *
 * Re-exports all domain types for convenient importing.
 *
 * @example
 * import type { BattleOutcome, ReportData } from '@/domain/types';
 * import type { SimulationConfig, SimulationResult } from '@/domain/types';
 */

export type {
  // Battle Types
  BattleOutcome,
  BattleResultData,
  // Report Types
  ReportBattleResult,
  WarningData,
  TrechoSummaryData,
  ReportData,
  // Validation Types
  ValidationResult,
} from './domain-types.js';

export type {
  // Simulation Configuration & Progress
  SimulationConfig,
  SimulationProgress,
  // Simulation Results
  SimulationResult,
  // Simulation Summary & History
  SimulationSummary,
  SimulationHistoryEntry,
  // Full Simulation Report
  SimulationReport,
} from './simulation-types.js';

export type {
  // Form Types
  TrechoFormData,
  GlobalSettingsFormData,
  PartyFormData,
  PartyMemberFormData,
} from './form-types.js';

export type {
  // Project Types
  ProjectInfo,
  // Configuration Types
  PartyMemberData,
  PartyConfigData,
  TrechoData,
  ProjectConfigResponse,
  // RPG Maker Data Types
  TroopData,
  ClassData,
  EnemyData,
  // Application State Types
  RecentProject,
  UserPreferences,
  SimulationSummary,
  HistoryEntry,
  SimulationReport,
  // IPC Error & Response Types
  IPCError,
  IPCSuccessResponse,
  IPCErrorResponse,
  IPCResult,
} from './ipc-types.js';

export type {
  // Worker Communication Types
  ProgressStage,
  ProgressPayload,
  ErrorPayload,
  SimulationResultPayload,
} from './worker-types.js';
