/**
 * Simulation Type Definitions
 *
 * Types related to battle simulation execution and results.
 * These types are framework-agnostic and can be used in any layer.
 *
 * @module domain/types
 */

import type { BattleResultData } from './domain-types.js';
// Re-export simulation entities from entities/simulation.ts
export type { SimulationSummary, SimulationHistoryEntry, SimulationReport } from '../entities/simulation.js';

// ============================================================================
// Simulation Configuration & Progress
// ============================================================================

/**
 * Configuration for running a simulation.
 */
export interface SimulationConfig {
  projectPath: string;
  configPath?: string;
  trechoId?: string;
  troopId?: number;
  seed?: number;
  maxTurns?: number;
}

/**
 * Progress state for simulation tracking.
 */
export interface SimulationProgress {
  current: number;
  total: number;
  percentage: number;
  isRunning: boolean;
  currentTrecho?: string;
  currentTroop?: number;
}

// ============================================================================
// Simulation Results
// ============================================================================

/**
 * Response format for simulation:run handler.
 * Contains the result of a single battle simulation.
 */
export interface SimulationResult {
  trechoId: string;
  troopId: number;
  troopName: string;
  battleResult: BattleResultData;
  passed: boolean;
  warnings: string[];
}

// ============================================================================
// Simulation Summary & History
// ============================================================================
// SimulationSummary, SimulationHistoryEntry, and SimulationReport
// are now imported from entities/simulation.ts

