/**
 * SimulationHistory Query Functions
 *
 * CRUD operations for the simulation_history table.
 * Stores simulation execution results for TTK tracking.
 *
 * @see packages/electron/src/main/database/schema.ts
 */

import type Database from 'better-sqlite3';
import type { SimulationHistoryDb } from '../schema.js';
import { SimulationHistoryDbSchema } from '../schema.js';

/**
 * Input data for adding a simulation record.
 */
export interface SimulationHistoryInput {
  project_path: string;
  config_name: string | null;
  trecho_id: string;
  troop_id: number;
  troop_name: string;
  ttk_turns: number;
  ttk_actions: number;
  duration_ms: number;
  seed: number;
  exp_gained: number;
  outcome: 'victory' | 'defeat' | 'timeout';
  passed: boolean;
  warnings: string[];
}

/**
 * Result type for SimulationHistory queries.
 */
export type SimulationHistory = Pick<
  SimulationHistoryDb,
  | 'id'
  | 'project_path'
  | 'config_name'
  | 'trecho_id'
  | 'troop_id'
  | 'troop_name'
  | 'ttk_turns'
  | 'ttk_actions'
  | 'duration_ms'
  | 'seed'
  | 'exp_gained'
  | 'outcome'
  | 'passed'
  | 'executed_at'
> & { warnings: string[] };

/**
 * Adds a simulation result to history.
 *
 * @param db - Database connection
 * @param input - Simulation data to store
 * @returns The created simulation record
 */
export function addSimulationHistory(
  db: Database.Database,
  input: SimulationHistoryInput
): SimulationHistory {
  const now = Date.now();
  const warningsJson = JSON.stringify(input.warnings);

  const stmt = db.prepare(`
    INSERT INTO simulation_history (
      project_path, config_name, trecho_id, troop_id, troop_name,
      ttk_turns, ttk_actions, duration_ms, seed, exp_gained,
      outcome, passed, warnings, executed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    input.project_path,
    input.config_name,
    input.trecho_id,
    input.troop_id,
    input.troop_name,
    input.ttk_turns,
    input.ttk_actions,
    input.duration_ms,
    input.seed,
    input.exp_gained,
    input.outcome,
    input.passed ? 1 : 0,
    warningsJson,
    now
  );

  const id = result.lastInsertRowid as number;

  return {
    id,
    ...input,
    executed_at: now,
  };
}

/**
 * Lists simulation history for a project.
 *
 * @param db - Database connection
 * @param projectPath - Absolute path to the project directory
 * @param limit - Maximum number of records to return (default: 100)
 * @returns Array of simulation records, ordered by executed_at DESC
 */
export function listSimulationHistoryByProject(
  db: Database.Database,
  projectPath: string,
  limit: number = 100
): SimulationHistory[] {
  const stmt = db.prepare(`
    SELECT id, project_path, config_name, trecho_id, troop_id, troop_name,
           ttk_turns, ttk_actions, duration_ms, seed, exp_gained,
           outcome, passed, warnings, executed_at
    FROM simulation_history
    WHERE project_path = ?
    ORDER BY executed_at DESC
    LIMIT ?
  `);

  const rows = stmt.all(projectPath, limit) as unknown[];
  return rows.map(parseSimulationHistoryRow);
}

/**
 * Lists simulation history for a specific trecho.
 *
 * @param db - Database connection
 * @param trechoId - Trecho identifier
 * @param limit - Maximum number of records to return (default: 100)
 * @returns Array of simulation records, ordered by executed_at DESC
 */
export function listSimulationHistoryByTrecho(
  db: Database.Database,
  trechoId: string,
  limit: number = 100
): SimulationHistory[] {
  const stmt = db.prepare(`
    SELECT id, project_path, config_name, trecho_id, troop_id, troop_name,
           ttk_turns, ttk_actions, duration_ms, seed, exp_gained,
           outcome, passed, warnings, executed_at
    FROM simulation_history
    WHERE trecho_id = ?
    ORDER BY executed_at DESC
    LIMIT ?
  `);

  const rows = stmt.all(trechoId, limit) as unknown[];
  return rows.map(parseSimulationHistoryRow);
}

/**
 * Deletes old simulation records.
 *
 * @param db - Database connection
 * @param olderThanDays - Delete records older than this many days
 * @returns Number of records deleted
 */
export function deleteOldSimulationHistory(
  db: Database.Database,
  olderThanDays: number
): number {
  const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

  const stmt = db.prepare('DELETE FROM simulation_history WHERE executed_at < ?');
  const result = stmt.run(cutoffTime);

  return result.changes;
}

/**
 * Gets a simulation record by ID.
 *
 * @param db - Database connection
 * @param id - Simulation record ID
 * @returns The simulation record, or null if not found
 */
export function getSimulationHistory(db: Database.Database, id: number): SimulationHistory | null {
  const stmt = db.prepare(`
    SELECT id, project_path, config_name, trecho_id, troop_id, troop_name,
           ttk_turns, ttk_actions, duration_ms, seed, exp_gained,
           outcome, passed, warnings, executed_at
    FROM simulation_history
    WHERE id = ?
  `);

  const row = stmt.get(id) as unknown | undefined;

  if (!row) {
    return null;
  }

  return parseSimulationHistoryRow(row);
}

/**
 * Deletes all simulation history for a project.
 *
 * @param db - Database connection
 * @param projectPath - Absolute path to the project directory
 * @returns Number of records deleted
 */
export function deleteSimulationHistoryByProject(
  db: Database.Database,
  projectPath: string
): number {
  const stmt = db.prepare('DELETE FROM simulation_history WHERE project_path = ?');
  const result = stmt.run(projectPath);
  return result.changes;
}

/**
 * Counts total simulation records.
 *
 * @param db - Database connection
 * @returns Total number of simulation records
 */
export function countSimulationHistory(db: Database.Database): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM simulation_history');
  const row = stmt.get() as { count: number };
  return row.count;
}

/**
 * Parses a database row to SimulationHistory type.
 * Converts stored JSON back to array for warnings.
 *
 * @param row - Database row
 * @returns Parsed simulation history record
 */
function parseSimulationHistoryRow(row: unknown): SimulationHistory {
  const parsed = SimulationHistoryDbSchema.parse(row);

  return {
    id: parsed.id,
    project_path: parsed.project_path,
    config_name: parsed.config_name,
    trecho_id: parsed.trecho_id,
    troop_id: parsed.troop_id,
    troop_name: parsed.troop_name,
    ttk_turns: parsed.ttk_turns,
    ttk_actions: parsed.ttk_actions,
    duration_ms: parsed.duration_ms,
    seed: parsed.seed,
    exp_gained: parsed.exp_gained,
    outcome: parsed.outcome,
    passed: parsed.passed === 1,
    warnings: parsed.warnings ? JSON.parse(parsed.warnings) : [],
    executed_at: parsed.executed_at,
  };
}
