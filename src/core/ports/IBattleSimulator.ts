import type { PartyConfig } from '../domain/PartyConfig.js';
import type { BattleResult } from '../domain/BattleResult.js';
import type { TtkMetrics } from '../domain/TtkMetrics.js';
import type { RmmzDatabase } from './IDataLoader.js';

/**
 * Battle setup configuration for a single battle simulation.
 */
export interface BattleSetup {
  /** Troop ID from Troops.json (1-based) */
  troopId: number;
  /** Party configuration with member classes and levels */
  party: PartyConfig;
  /** RNG seed for deterministic execution (ADR-018) */
  seed: number;
  /** Maximum number of turns before battle timeout (default: 100) */
  maxTurns?: number;
}

/**
 * BattleSimulator port interface.
 * Executes real battles using RPG Maker MZ BattleManager in headless mode (ADR-003).
 * Uses deterministic RNG seeding (ADR-018) for reproducible results.
 */
export interface IBattleSimulator {
  /**
   * Initialize the battle simulator with loaded RPG Maker MZ database.
   * Must be called before executeBattle().
   * @param database - Loaded RPG Maker MZ database with all required data
   * @param projectPath - Absolute path to RPG Maker MZ project root
   * @throws {BattleError} If database is invalid or incomplete
   */
  initialize(database: RmmzDatabase, projectPath: string): Promise<void>;

  /**
   * Execute a single battle simulation for a specific troop.
   * Measures TTK in both turns and actions (ADR-020).
   * @param setup - Battle configuration with troop, party, and seed
   * @returns Battle result with TTK metrics and victory status
   * @throws {BattleTimeoutError} If battle exceeds maxTurns (ADR-025)
   * @throws {BattleError} If battle execution fails
   */
  executeBattle(setup: BattleSetup): Promise<BattleResult>;

  /**
   * Get TTK metrics from the last executed battle.
   * Useful for diagnostic purposes (ADR-025).
   * @returns TTK metrics (turns and actions) from last battle
   * @throws {Error} If no battle has been executed yet
   */
  getLastMetrics(): TtkMetrics;

  /**
   * Cleanup resources and reset simulator state.
   * Should be called after all battles are complete.
   */
  cleanup(): Promise<void>;
}
