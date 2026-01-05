/**
 * UI Component Types
 *
 * Type definitions for CLI UI components (progress bar, formatters)
 * Ensures testability and type safety for UI logic
 */

/**
 * Performance metrics tracked during execution
 */
export interface PerformanceMetrics {
  totalDurationMs: number;
  averageBattleDurationMs: number;
  peakMemoryMb: number;
  currentMemoryMb: number;
  totalBattles: number;
}

/**
 * Battle execution summary for terminal display
 */
export interface BattleSummary {
  totalBattles: number;
  totalTrechos: number;
  successRate: number;
  totalWarnings: number;
  averageTtkTurns?: number;
  averageTtkActions?: number;
}

/**
 * Progress bar update data
 */
export interface ProgressUpdate {
  current: number;
  total: number;
  trechoId: string;
  troopId?: number;
}

/**
 * Diagnostic log entry
 */
export interface DiagnosticEntry {
  timestamp: Date;
  stage: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Output formatting options
 */
export interface OutputOptions {
  verbose: boolean;
  diagnostic: boolean;
  useProgressBar: boolean;
}
