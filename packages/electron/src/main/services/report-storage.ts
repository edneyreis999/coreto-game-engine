/**
 * Report Storage Service
 *
 * Implements three-tier storage strategy for simulation results:
 * - Tier 1: Summary in SQLite (~1KB) - stored automatically after every simulation
 * - Tier 2: Full report in userData/reports/ (~500KB) - stored only when exported
 *
 * This service provides:
 * - Automatic summary extraction and storage
 * - Optional full report export to JSON files
 * - Query interface for simulation history
 * - Report loading from files
 *
 * @see packages/electron/src/main/services/types.ts
 * @see packages/electron/src/main/database/schema.ts
 */

import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';

import type {
  SimulationSummary,
  SimulationReport,
  TrechoSummary,
  SimulationHistoryEntry,
  SimulationStatus,
} from './types.js';
import type { ReportData, WarningData } from '../ipc/types.js';

// ============================================================================
// Report Storage Service
// ============================================================================

/**
 * Service for storing and retrieving simulation results.
 * Implements three-tier storage strategy for optimal performance.
 */
export class ReportStorageService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Stores simulation summary in SQLite.
   * Summary is lightweight (~1KB) and stored automatically after every simulation.
   *
   * @param simulationId - Unique simulation identifier
   * @param projectPath - Path to RPG Maker MZ project
   * @param result - Full simulation result data
   * @param status - Simulation status
   */
  async storeSimulation(
    simulationId: string,
    projectPath: string,
    result: ReportData,
    status: SimulationStatus = 'SUCCESS'
  ): Promise<void> {
    // Extract lightweight summary
    const summary = this.extractSummary(result, projectPath);

    // Store in SQLite
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO simulation_history_v2
        (id, project_path, timestamp, status, summary_json, report_file_path, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      simulationId,
      projectPath,
      now,
      status,
      JSON.stringify(summary),
      null, // No file by default
      now
    );
  }

  /**
   * Exports full report to JSON file.
   * Creates detailed report (~500KB) and updates database with file reference.
   *
   * @param simulationId - Unique simulation identifier
   * @param result - Full simulation result data
   * @param projectPath - Path to RPG Maker MZ project
   * @returns Absolute path to exported report file
   */
  async exportReport(
    simulationId: string,
    result: ReportData,
    projectPath: string
  ): Promise<string> {
    // Create reports directory
    const reportsDir = path.join(app.getPath('userData'), 'reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const filePath = path.join(reportsDir, `${simulationId}.json`);

    // Build full report
    const report: SimulationReport = {
      metadata: {
        id: simulationId,
        timestamp: Date.now(),
        projectPath,
        version: '1.0',
      },
      summary: this.extractSummary(result, projectPath),
      trechos: this.extractTrechoReports(result),
      warnings: this.extractWarnings(result),
    };

    // Write to file
    await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');

    // Update database with file reference
    const stmt = this.db.prepare(`
      UPDATE simulation_history_v2
      SET report_file_path = ?
      WHERE id = ?
    `);

    stmt.run(filePath, simulationId);

    return filePath;
  }

  /**
   * Loads full report from file (if exists).
   * Returns null if report was not exported.
   *
   * @param simulationId - Unique simulation identifier
   * @returns Full simulation report or null
   */
  async loadReport(simulationId: string): Promise<SimulationReport | null> {
    const stmt = this.db.prepare(`
      SELECT report_file_path FROM simulation_history_v2 WHERE id = ?
    `);

    const row = stmt.get(simulationId) as { report_file_path: string | null } | undefined;

    if (!row?.report_file_path) {
      return null; // No detailed report saved
    }

    try {
      const json = await fs.readFile(row.report_file_path, 'utf-8');
      return JSON.parse(json) as SimulationReport;
    } catch (error) {
      console.error(`[ReportStorage] Failed to load report: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Gets simulation history (summaries only).
   * Returns lightweight data without loading full reports.
   *
   * @param projectPath - Optional project path filter
   * @param limit - Maximum number of entries to return
   * @returns Array of simulation history entries
   */
  async getHistory(
    projectPath?: string,
    limit = 50
  ): Promise<SimulationHistoryEntry[]> {
    let query = `
      SELECT id, project_path, timestamp, status, summary_json, report_file_path
      FROM simulation_history_v2
    `;
    const params: (string | number)[] = [];

    if (projectPath) {
      query += ' WHERE project_path = ?';
      params.push(projectPath);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as Array<{
      id: string;
      project_path: string;
      timestamp: number;
      status: SimulationStatus;
      summary_json: string;
      report_file_path: string | null;
    }>;

    return rows.map((row) => ({
      id: row.id,
      simulationId: row.id,
      projectPath: row.project_path,
      timestamp: row.timestamp,
      status: row.status,
      summaryJson: row.summary_json,
      reportFilePath: row.report_file_path,
      summary: JSON.parse(row.summary_json) as SimulationSummary,
    }));
  }

  /**
   * Deletes a simulation record and its report file.
   *
   * @param simulationId - Unique simulation identifier
   */
  async deleteSimulation(simulationId: string): Promise<void> {
    // Get report file path before deleting record
    const stmt = this.db.prepare(`
      SELECT report_file_path FROM simulation_history_v2 WHERE id = ?
    `);

    const row = stmt.get(simulationId) as { report_file_path: string | null } | undefined;

    // Delete report file if exists
    if (row?.report_file_path) {
      try {
        await fs.unlink(row.report_file_path);
      } catch {
        // Ignore file deletion errors
      }
    }

    // Delete database record
    const deleteStmt = this.db.prepare(`
      DELETE FROM simulation_history_v2 WHERE id = ?
    `);

    deleteStmt.run(simulationId);
  }

  /**
   * Extracts lightweight summary from full result.
   * Reduces ~500KB of data to ~1KB summary.
   *
   * @param result - Full simulation result
   * @param projectPath - Path to RPG Maker MZ project
   * @returns Lightweight summary
   */
  private extractSummary(result: ReportData, _projectPath: string): SimulationSummary {
    // Aggregate metrics across all trechos
    let totalBattles = 0;
    let totalTTK = 0;
    let warningCount = 0;
    let criticalWarningCount = 0;

    const trechos: TrechoSummary[] = result.trechos.map((t) => {
      const battleCount = t.battles.length;
      totalBattles += battleCount;

      const avgTTK = t.avgTtkTurns;
      totalTTK += avgTTK * battleCount;

      // Count warnings from trecho
      t.warnings.forEach((w: WarningData) => {
        warningCount++;
        if (w.severity === 'critical') {
          criticalWarningCount++;
        }
      });

      return {
        id: t.id,
        description: t.name,
        avgTTK,
        maxTTK: t.p95TtkTurns, // Use p95 as max
        minTTK: t.avgTtkTurns - (t.p95TtkTurns - t.avgTtkTurns), // Estimate min
        battleCount,
        status: t.passed ? 'SUCCESS' : 'FAILED',
      };
    });

    const overallTTK = totalBattles > 0 ? totalTTK / totalBattles : 0;

    // Duration is not calculable from ReportData (would need start time)
    const duration = 0;

    return {
      trechos,
      overallTTK,
      totalBattles,
      warningCount,
      criticalWarningCount,
      duration,
      // seed is not available in ReportData, omit it
    } as SimulationSummary;
  }

  /**
   * Extracts detailed trecho reports from result.
   *
   * @param result - Full simulation result
   * @returns Array of detailed trecho reports
   */
  private extractTrechoReports(result: ReportData): Array<{
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
  }> {
    return result.trechos.map((t) => ({
      id: t.id,
      description: t.name,
      battles: t.battles.map((b, index) => ({
        battleId: `${t.id}-${index}`,
        turns: b.ttkTurns,
        ttk: b.ttkTurns,
        winner: b.outcome === 'victory' ? ('heroes' as const) : ('enemies' as const),
        heroes: [], // Would need detailed battle data
        enemies: [], // Would need detailed battle data
      })),
    }));
  }

  /**
   * Extracts warnings from result.
   *
   * @param result - Full simulation result
   * @returns Array of warnings
   */
  private extractWarnings(result: ReportData): Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    context: Record<string, unknown>;
  }> {
    const warnings: Array<{
      type: string;
      severity: 'critical' | 'warning' | 'info';
      message: string;
      context: Record<string, unknown>;
    }> = [];

    result.trechos.forEach((t) => {
      t.warnings.forEach((w: WarningData) => {
        warnings.push({
          type: w.type,
          severity: w.severity,
          message: w.message,
          context: w.context,
        });
      });
    });

    return warnings;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates a unique simulation ID.
 * Uses UUID v4 for uniqueness.
 *
 * @returns Unique simulation identifier
 */
export function generateSimulationId(): string {
  return randomUUID();
}
