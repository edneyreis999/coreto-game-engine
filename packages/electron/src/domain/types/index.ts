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
