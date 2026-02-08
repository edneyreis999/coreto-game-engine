/**
 * Fake ReportStorageService for testing SimulationController.
 *
 * Implements an in-memory storage service that simulates SQLite
 * database operations without actual file I/O. Uses Map storage
 * for fast, predictable test execution.
 *
 * @see packages/electron/src/main/services/report-storage.ts
 */

import type { ReportData } from '../../../ipc/types.js';
import type { SimulationHistoryEntry, SimulationStatus, SimulationReport } from '../../types.js';

/**
 * In-memory record of a stored simulation.
 */
interface StoredSimulation {
  simulationId: string;
  projectPath: string;
  result: ReportData;
  status: SimulationStatus;
  timestamp: number;
}

/**
 * In-memory implementation of ReportStorageService.
 *
 * Simulates all storage operations using JavaScript Map.
 * Provides query methods for test assertions.
 */
export class FakeReportStorageService {
  private simulations: Map<string, StoredSimulation> = new Map();
  private reports: Map<string, SimulationReport> = new Map();
  private storeCallCount = 0;
  private exportCallCount = 0;

  /**
   * Stores simulation summary in memory.
   * Simulates SQLite INSERT operation.
   */
  async storeSimulation(
    simulationId: string,
    projectPath: string,
    result: ReportData,
    status: SimulationStatus = 'SUCCESS'
  ): Promise<void> {
    this.storeCallCount++;
    this.simulations.set(simulationId, {
      simulationId,
      projectPath,
      result,
      status,
      timestamp: Date.now(),
    });
  }

  /**
   * Exports full report to in-memory storage.
   * Simulates file write operation.
   */
  async exportReport(
    simulationId: string,
    result: ReportData,
    projectPath: string
  ): Promise<string> {
    this.exportCallCount++;

    const filePath = `/mock/userdata/reports/${simulationId}.json`;

    const report: SimulationReport = {
      metadata: {
        id: simulationId,
        timestamp: Date.now(),
        projectPath,
        version: '1.0',
      },
      summary: this.extractSummary(result),
      trechos: this.extractTrechoReports(result),
      warnings: this.extractWarnings(result),
    };

    this.reports.set(simulationId, report);

    // Update the simulation record with file path
    const sim = this.simulations.get(simulationId);
    if (sim) {
      // In real implementation, this would update report_file_path in DB
      // For fake, we track it separately via hasReportFile()
    }

    return filePath;
  }

  /**
   * Loads full report from in-memory storage.
   */
  async loadReport(simulationId: string): Promise<SimulationReport | null> {
    return this.reports.get(simulationId) || null;
  }

  /**
   * Gets simulation history from memory.
   */
  async getHistory(projectPath?: string, limit = 50): Promise<SimulationHistoryEntry[]> {
    let entries = Array.from(this.simulations.values()).map((sim) => ({
      id: sim.simulationId,
      simulationId: sim.simulationId,
      projectPath: sim.projectPath,
      timestamp: sim.timestamp,
      status: sim.status,
      summaryJson: JSON.stringify(this.extractSummary(sim.result)),
      reportFilePath: this.reports.has(sim.simulationId)
        ? `/mock/userdata/reports/${sim.simulationId}.json`
        : null,
      summary: this.extractSummary(sim.result),
    }));

    if (projectPath) {
      entries = entries.filter((e) => e.projectPath === projectPath);
    }

    entries.sort((a, b) => b.timestamp - a.timestamp);

    return entries.slice(0, limit);
  }

  /**
   * Deletes a simulation record from memory.
   */
  async deleteSimulation(simulationId: string): Promise<void> {
    this.simulations.delete(simulationId);
    this.reports.delete(simulationId);
  }

  // ==========================================================================
  // Test Query Methods
  // ==========================================================================

  /**
   * Gets the number of times storeSimulation was called.
   */
  getStoreCallCount(): number {
    return this.storeCallCount;
  }

  /**
   * Gets the number of times exportReport was called.
   */
  getExportCallCount(): number {
    return this.exportCallCount;
  }

  /**
   * Gets a stored simulation by ID.
   */
  getSimulation(simulationId: string): StoredSimulation | undefined {
    return this.simulations.get(simulationId);
  }

  /**
   * Gets all stored simulations.
   */
  getAllSimulations(): StoredSimulation[] {
    return Array.from(this.simulations.values());
  }

  /**
   * Checks if a simulation was stored.
   */
  hasSimulation(simulationId: string): boolean {
    return this.simulations.has(simulationId);
  }

  /**
   * Checks if a report file exists for a simulation.
   */
  hasReportFile(simulationId: string): boolean {
    return this.reports.has(simulationId);
  }

  /**
   * Clears all stored data.
   */
  clear(): void {
    this.simulations.clear();
    this.reports.clear();
    this.storeCallCount = 0;
    this.exportCallCount = 0;
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Lightweight summary for test assertions
   */
  private extractSummary(result: ReportData): {
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
  } {
    let totalBattles = 0;
    let totalTTK = 0;
    let warningCount = 0;
    let criticalWarningCount = 0;

    const trechos = result.trechos.map((t) => {
      const battleCount = t.battles.length;
      totalBattles += battleCount;

      const avgTTK = t.avgTtkTurns;
      totalTTK += avgTTK * battleCount;

      t.warnings.forEach((w) => {
        warningCount++;
        if (w.severity === 'critical') {
          criticalWarningCount++;
        }
      });

      return {
        id: t.id,
        description: t.name,
        avgTTK,
        maxTTK: t.p95TtkTurns,
        minTTK: t.avgTtkTurns - (t.p95TtkTurns - t.avgTtkTurns),
        battleCount,
        status: t.passed ? 'SUCCESS' : 'FAILED',
      };
    });

    const overallTTK = totalBattles > 0 ? totalTTK / totalBattles : 0;

    return {
      trechos,
      overallTTK,
      totalBattles,
      warningCount,
      criticalWarningCount,
      duration: 0,
    };
  }

  /**
   * Extracts trecho reports from result.
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
        heroes: [],
        enemies: [],
      })),
    }));
  }

  /**
   * Extracts warnings from result.
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
      t.warnings.forEach((w) => {
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
