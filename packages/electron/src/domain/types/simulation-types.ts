/**
 * Simulation Type Definitions
 *
 * Types related to battle simulation execution and results.
 * These types are framework-agnostic and can be used in any layer.
 *
 * @module domain/types
 */

import type { BattleResultData } from './domain-types.js';

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

/**
 * Simulation summary for history list.
 * Lightweight data (~1KB) stored in SQLite.
 */
export interface SimulationSummary {
  trechos: Array<{
    id: string;
    description: string;
    avgTTK: number;
    maxTTK: number;
    minTTK: number;
    battleCount: number;
    status: 'SUCCESS' | 'FAILED';
  }>;
  overallTTK: number;
  totalBattles: number;
  warningCount: number;
  criticalWarningCount: number;
  duration: number;
  seed?: number;
}

/**
 * Simulation history entry.
 */
export interface SimulationHistoryEntry {
  id: string;
  projectPath: string;
  timestamp: number;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  summary: SimulationSummary;
  hasReport: boolean;
}

// ============================================================================
// Full Simulation Report
// ============================================================================

/**
 * Full simulation report (detailed, ~500KB).
 * Contains complete battle data for all trechos.
 */
export interface SimulationReport {
  metadata: {
    id: string;
    timestamp: number;
    projectPath: string;
    version: string;
  };
  summary: SimulationSummary;
  trechos: Array<{
    id: string;
    description: string;
    battles: Array<{
      battleId: string;
      turns: number;
      ttk: number;
      winner: 'heroes' | 'enemies';
      heroes: Array<{ actorId: number; hp: number; damage: number }>;
      enemies: Array<{ enemyId: number; hp: number; damage: number }>;
    }>;
  }>;
  warnings: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    context: Record<string, unknown>;
  }>;
}
