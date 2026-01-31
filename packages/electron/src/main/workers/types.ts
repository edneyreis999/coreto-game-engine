/**
 * Worker Communication Type Contracts
 *
 * Type-safe message definitions for UtilityProcess communication
 * between main process and simulation worker.
 *
 * @see planos/005-run-ttk-electron/TECHSPEC-round2.md Section 5
 */

import type { Report } from '@coreto/core';

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
export type MainToWorkerMessage =
  | { type: 'start'; payload: SimulationParams }
  | { type: 'cancel' };

// =============================================================================
// Messages: UtilityProcess → Main
// =============================================================================

/**
 * Progress event stages for simulation lifecycle.
 * Defines the current phase of execution for UI feedback.
 */
export type ProgressStage =
  | 'initialization'    // Loading project, setting up simulation
  | 'trecho'           // Trecho execution started
  | 'battle'           // Battle progress within trecho (batched)
  | 'trecho-complete'  // Trecho execution finished
  | 'finalization';    // Writing results, cleanup

/**
 * Progress update payload from worker to main process.
 * Emitted during simulation execution for real-time UI updates.
 *
 * Batching strategy: battle events emitted every 5% or every 10 battles
 * to prevent IPC overload (TECHSPEC-round2.md Section 3.2).
 */
export interface ProgressPayload {
  /** Current stage of simulation execution */
  stage: ProgressStage;

  /** Trecho context (available during trecho/battle stages) */
  trechoId?: string;
  trechoName?: string;

  /** Progress counters */
  current: number;
  total: number;
  percentage: number;

  /** User-facing message for display */
  message: string;

  /** Timestamp for latency tracking and UI rendering */
  timestamp: number;
}

/**
 * User-friendly error payload from worker to main process.
 * Transforms technical errors into actionable guidance (TECHSPEC.md Section 2.6).
 */
export interface ErrorPayload {
  /** Short, user-facing error title */
  title: string;
  /** Actionable error description */
  description: string;
  /** Optional technical details (stack traces, paths) - collapsed by default in UI */
  details?: string;
  /** Machine-readable error code for logging/analytics */
  code?: string;
}

/**
 * Simulation result payload from worker to main process.
 * Contains complete TTK validation report from @coreto/core.
 */
export interface SimulationResultPayload {
  /** Simulation identifier (matches SimulationParams.simulationId) */
  simulationId: string;
  /** Absolute path to RPG Maker MZ project directory */
  projectPath: string;
  /** Complete report with all trechos, battles, and warnings */
  report: Report;
  /** Total execution time in milliseconds */
  duration: number;
  /** RNG seed used (for reproducibility) */
  seed: number;
}

/**
 * Discriminated union for messages from worker to main process.
 * Type narrowing via 'type' field enables exhaustiveness checks.
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
