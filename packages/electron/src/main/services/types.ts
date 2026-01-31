/**
 * Report Storage Service Types
 *
 * Type definitions for simulation summary and report storage.
 * Implements three-tier storage strategy:
 * - Summary: ~1KB lightweight data stored in SQLite
 * - Full Report: ~500KB detailed data stored in files (optional export)
 *
 * @see packages/electron/src/main/services/report-storage.ts
 */

// ============================================================================
// Simulation Summary (Lightweight - Stored in SQLite)
// ============================================================================

/**
 * Lightweight trecho summary (~1KB).
 * Contains aggregated metrics without detailed battle data.
 */
export interface TrechoSummary {
  /** Trecho identifier */
  id: string;
  /** Trecho description */
  description: string;
  /** Average TTK in turns */
  avgTTK: number;
  /** Maximum TTK in turns */
  maxTTK: number;
  /** Minimum TTK in turns */
  minTTK: number;
  /** Number of battles simulated */
  battleCount: number;
  /** Overall trecho status */
  status: 'SUCCESS' | 'FAILED';
}

/**
 * Lightweight simulation summary (~1KB).
 * Stored in SQLite for quick list/search operations.
 */
export interface SimulationSummary {
  /** Trecho summaries with aggregated metrics */
  trechos: TrechoSummary[];
  /** Overall average TTK across all trechos */
  overallTTK: number;
  /** Total number of battles simulated */
  totalBattles: number;
  /** Total number of warnings (all severities) */
  warningCount: number;
  /** Number of critical warnings */
  criticalWarningCount: number;
  /** Simulation duration in milliseconds */
  duration: number;
  /** RNG seed used for simulation */
  seed?: number;
}

// ============================================================================
// Simulation Report (Full Detail - Stored in Files)
// ============================================================================

/**
 * Detailed battle result.
 * Contains full battle data including actor/enemy states.
 */
export interface BattleReport {
  /** Unique battle identifier */
  battleId: string;
  /** Number of turns executed */
  turns: number;
  /** TTK in turns */
  ttk: number;
  /** Battle outcome */
  winner: 'heroes' | 'enemies';
  /** Heroes final states */
  heroes: Array<{
    /** Actor ID from RPG Maker MZ database */
    actorId: number;
    /** Final HP after battle */
    hp: number;
    /** Total damage dealt */
    damage: number;
  }>;
  /** Enemies final states */
  enemies: Array<{
    /** Enemy ID from RPG Maker MZ database */
    enemyId: number;
    /** Final HP after battle */
    hp: number;
    /** Total damage dealt */
    damage: number;
  }>;
}

/**
 * Detailed trecho report.
 * Contains all battle data for a trecho.
 */
export interface TrechoReport {
  /** Trecho identifier */
  id: string;
  /** Trecho description */
  description: string;
  /** All battle results */
  battles: BattleReport[];
}

/**
 * Warning with full context.
 * Contains detailed warning information for debugging.
 */
export interface Warning {
  /** Warning type category */
  type: string;
  /** Warning severity level */
  severity: 'critical' | 'warning' | 'info';
  /** Human-readable warning message */
  message: string;
  /** Additional context for debugging */
  context: Record<string, unknown>;
}

/**
 * Full simulation report (~500KB).
 * Stored in JSON files only when explicitly exported.
 */
export interface SimulationReport {
  /** Report metadata */
  metadata: {
    /** Unique simulation identifier */
    id: string;
    /** Simulation timestamp (Unix ms) */
    timestamp: number;
    /** Path to RPG Maker MZ project */
    projectPath: string;
    /** Report format version */
    version: string;
  };
  /** Lightweight summary (also in SQLite) */
  summary: SimulationSummary;
  /** Detailed trecho data with all battles */
  trechos: TrechoReport[];
  /** Full warnings with context */
  warnings: Warning[];
}

// ============================================================================
// Storage Metadata
// ============================================================================

/**
 * Simulation status for database tracking.
 */
export type SimulationStatus = 'SUCCESS' | 'FAILED' | 'CANCELLED';

/**
 * Database record for simulation history (v2 schema).
 */
export interface SimulationHistoryRecord {
  /** Unique simulation identifier (UUID) - PRIMARY KEY in v2 schema */
  id: string;
  /** Alias for id (for backwards compatibility) */
  simulationId: string;
  /** Path to RPG Maker MZ project */
  projectPath: string;
  /** Simulation timestamp (Unix ms) */
  timestamp: number;
  /** Simulation status */
  status: SimulationStatus;
  /** JSON-serialized summary (~1KB) */
  summaryJson: string;
  /** Path to detailed report file (null if not exported) */
  reportFilePath: string | null;
}

/**
 * Simulation history entry with parsed summary.
 */
export interface SimulationHistoryEntry extends SimulationHistoryRecord {
  /** Parsed summary object */
  summary: SimulationSummary;
}
