/**
 * Domain Types Index
 *
 * Re-exports all domain types for convenient importing.
 *
 * @example
 * import type { BattleOutcome, ReportData } from '@/domain/types';
 * import type { SimulationConfig, SimulationResult } from '@/domain/types';
 */

// Entity types from domain/entities
export type {
  TroopData,
  ClassData,
  EnemyData,
} from '../entities/game-data.js';

export type {
  ProjectInfo,
} from '../entities/project.js';

export type {
  SimulationSummary,
  SimulationHistoryEntry,
  SimulationReport,
} from '../entities/simulation.js';

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
} from './simulation-types.js';

export type {
  // Form Types
  TrechoFormData,
  GlobalSettingsFormData,
  PartyFormData,
  PartyMemberFormData,
} from './form-types.js';

export type {
  // Configuration Types
  PartyMemberData,
  PartyConfigData,
  TrechoData,
  ProjectConfigResponse,
  // Application State Types
  RecentProject,
  UserPreferences,
  HistoryEntry,
} from './ipc-types.js';

// Note: Worker communication types (ProgressStage, ProgressPayload, ErrorPayload, SimulationResultPayload)
// have been moved to main/workers/protocol-types.ts as they are infrastructure concerns.
