/**
 * Worker Communication Type Contracts (Infrastructure Adapter)
 *
 * Type-safe message definitions for UtilityProcess communication
 * between main process and simulation worker.
 *
 * This module re-exports protocol types and defines infrastructure-specific
 * message types for IPC communication.
 *
 * @see planos/005-run-ttk-electron/TECHSPEC-round2.md Section 5
 */

// Re-export worker protocol types from protocol-types.ts
export type {
  ProgressStage,
  ProgressPayload,
  ErrorPayload,
  SimulationResultPayload,
} from './protocol-types.js';

// =============================================================================
// Messages: Main → UtilityProcess
// =============================================================================

/**
 * Simulation parameters sent from main process to worker.
 * Contains all configuration needed to run a TTK validation.
 */
export interface SimulationParams {
  /** Unique simulation identifier (UUID v4) */
  simulationId: string;
  /** Absolute path to RPG Maker MZ project directory */
  projectPath: string;
  /** Absolute path to project.config.json (usually temp/project.config.json) */
  configPath: string;
  /** Optional RNG seed override for reproducible results */
  seed?: number;
  /** Enable diagnostic mode (performance profiling, verbose logging) */
  diagnostic?: boolean;
}

/**
 * Discriminated union for messages from main process to worker.
 * Type narrowing via 'type' field enables exhaustiveness checks.
 */
export type MainToWorkerMessage = { type: 'start'; payload: SimulationParams } | { type: 'cancel' };

// =============================================================================
// Messages: UtilityProcess → Main
// =============================================================================

/**
 * Discriminated union for messages from worker to main process.
 * Type narrowing via 'type' field enables exhaustiveness checks.
 *
 * Uses protocol types for payload contracts.
 */
export type WorkerToMainMessage =
  | { type: 'progress'; payload: ProgressPayload }
  | { type: 'complete'; payload: SimulationResultPayload }
  | { type: 'error'; payload: ErrorPayload };

// =============================================================================
// Helper Types
// =============================================================================

/**
 * Trecho progress event data from simulation.
 * Used for progress event emission during trecho execution.
 */
export interface TrechoProgress {
  /** Trecho unique identifier */
  id: string;
  /** Human-readable trecho name */
  description: string;
  /** Current trecho index (1-based) */
  index: number;
  /** Total number of trechos in simulation */
  totalTrechos: number;
}

/**
 * Battle progress event data from simulation.
 * Used for progress event emission during battle execution.
 */
export interface BattleProgress {
  /** Associated trecho identifier */
  trechoId: string;
  /** Associated trecho name */
  trechoName: string;
  /** Current battle index (1-based) */
  current: number;
  /** Total number of battles in trecho */
  total: number;
}
