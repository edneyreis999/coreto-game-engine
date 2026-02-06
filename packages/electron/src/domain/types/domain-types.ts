/**
 * Domain Type Definitions
 *
 * Core domain types used across the application.
 * These types are framework-agnostic and can be used in any layer.
 *
 * @module domain/types
 */

// ============================================================================
// Battle Types
// ============================================================================

/**
 * Possible outcomes of a battle simulation.
 */
export type BattleOutcome = 'victory' | 'defeat' | 'timeout';

/**
 * Result data for a single battle.
 * Used in SimulationResult responses.
 */
export interface BattleResultData {
  troopId: number;
  troopName: string;
  outcome: BattleOutcome;
  ttkTurns: number;
  ttkActions: number;
  durationMs: number;
  seed: number;
  expGained: number;
}

// ============================================================================
// Report Types
// ============================================================================

/**
 * Battle result data in Report format.
 * Used in TrechoSummaryData.
 */
export interface ReportBattleResult {
  troopId: number;
  troopName: string;
  outcome: BattleOutcome;
  ttkTurns: number;
  ttkActions: number;
  durationMs: number;
  seed: number;
  expGained: number;
}

/**
 * Warning data structure for Reports.
 */
export interface WarningData {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  context: Record<string, unknown>;
}

/**
 * Trecho summary data in Report format.
 * Aggregates battle results and warnings for a single trecho.
 */
export interface TrechoSummaryData {
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
 * Report data structure returned by simulation.
 * Contains all trechos summaries and metadata.
 */
export interface ReportData {
  trechos: TrechoSummaryData[];
  totalBattles: number;
  timestamp: string;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation result format.
 * Used across the application for validation feedback.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
