/**
 * Worker Communication Protocol Types (Infrastructure Layer)
 *
 * Type-safe message definitions for UtilityProcess communication.
 * These types are infrastructure concerns, not domain concepts.
 *
 * Originally located in domain/types/worker-types.ts but moved because:
 * - Imports from @coreto/core (external dependency)
 * - Defines transport protocol between processes
 * - Not a core domain business concept
 *
 * @see planos/014-arrumando-testes/electron/codebase/PLAN.md Task 2.2
 */

import type { Report } from '@coreto/core';

/**
 * Progress event stages for simulation lifecycle.
 * Defines the current phase of execution for UI feedback.
 */
export type ProgressStage =
  | 'initialization' // Loading project, setting up simulation
  | 'trecho' // Trecho execution started
  | 'battle' // Battle progress within trecho (batched)
  | 'trecho-complete' // Trecho execution finished
  | 'finalization'; // Writing results, cleanup

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
