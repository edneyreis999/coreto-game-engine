/**
 * Simulation Report Mapper
 *
 * Maps SimulationReport (historical format from storage) to ReportData (UI format).
 * Domain layer - pure transformations without framework dependencies.
 */

import type { ReportData } from '../types/domain-types';
import type { SimulationReport } from '../entities/simulation';

/**
 * Maps a SimulationReport to ReportData format for UI display.
 *
 * This mapper transforms the historical simulation report format stored in files
 * into the ReportData format expected by the ResultsPanel component.
 *
 * @param simulationId - UUID of the simulation (for logging/debugging)
 * @param report - Historical simulation report from storage
 * @returns ReportData formatted for UI consumption
 *
 * @example
 * const reportData = mapSimulationReportToReportData(simulationId, historicalReport);
 * // Returns ReportData with trechos, battles, warnings aggregated
 */
export function mapSimulationReportToReportData(
  simulationId: string,
  report: SimulationReport
): ReportData {
  return {
    trechos: report.trechos.map((trecho) => {
      // Calculate TTK statistics
      const battleCount = trecho.battles.length;
      const totalTurns = trecho.battles.reduce((sum, b) => sum + b.turns, 0);
      const totalTtk = trecho.battles.reduce((sum, b) => sum + b.ttk, 0);
      const victoryCount = trecho.battles.filter((b) => b.winner === 'heroes').length;

      return {
        id: trecho.id,
        name: trecho.description,
        passed: battleCount > 0, // Basic pass/fail logic - has battles
        battleCount,
        avgTtkTurns: battleCount > 0 ? totalTurns / battleCount : 0,
        avgTtkActions: battleCount > 0 ? totalTtk / battleCount : 0,
        p95TtkTurns: 0, // Would need proper percentile calculation
        p95TtkActions: 0, // Would need proper percentile calculation
        successRate: battleCount > 0 ? victoryCount / battleCount : 0,
        battles: trecho.battles.map((battle) => ({
          troopId: 0, // Not available in historical format
          troopName: '',
          outcome: battle.winner === 'heroes' ? 'victory' : 'defeat',
          ttkTurns: battle.turns,
          ttkActions: battle.ttk,
          durationMs: 0,
          seed: 0,
          expGained: 0,
        })),
        warnings: report.warnings
          .filter(
            (w) =>
              // Filter warnings for this trecho if context includes trechoId
              !w.context.trechoId || w.context.trechoId === trecho.id
          )
          .map((w) => ({
            type: w.type,
            severity: w.severity,
            message: w.message,
            context: w.context,
          })),
      };
    }),
    totalBattles: report.summary.totalBattles,
    timestamp: new Date(report.metadata.timestamp).toISOString(),
  };
}
