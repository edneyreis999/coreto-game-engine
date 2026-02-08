/**
 * Simulation Result Mapper
 *
 * Converts SimulationResult (single battle, flat warnings) to ReportData
 * (aggregate report with TrechoSummaryData[] and structured WarningData[]).
 *
 * @module main/ipc/mappers
 */

import type {
  ReportData,
  ReportBattleResult,
  TrechoSummaryData,
  WarningData,
} from '@coreto/electron/domain/types';
import type { SimulationResult } from '@coreto/electron/domain/types';

/**
 * Builds a ReportData from a single SimulationResult.
 *
 * This mapper transforms a single battle simulation result into the aggregate
 * report format expected by the UI. For a single battle:
 * - avgTtkTurns = p95TtkTurns = battleResult.ttkTurns
 * - successRate = 1.0 if passed, else 0.0
 * - battleCount = 1
 *
 * @param result - The simulation result to convert
 * @param trechoName - The display name for the trecho
 * @returns A ReportData structure with the single battle wrapped in aggregate format
 */
export function buildReportFromSimulationResult(
  result: SimulationResult,
  trechoName: string
): ReportData {
  const { trechoId, troopId, troopName, battleResult, passed, warnings } = result;

  // Map battleResult to ReportBattleResult (direct field copy)
  const reportBattle: ReportBattleResult = {
    troopId,
    troopName,
    outcome: battleResult.outcome,
    ttkTurns: battleResult.ttkTurns,
    ttkActions: battleResult.ttkActions,
    durationMs: battleResult.durationMs,
    seed: battleResult.seed,
    expGained: battleResult.expGained,
  };

  // Convert warnings from string[] to WarningData[]
  const warningData: WarningData[] = warnings.map((message) => ({
    type: 'tolerance',
    severity: 'warning',
    message,
    context: {
      trechoId,
      troopId,
    },
  }));

  // Build TrechoSummaryData with single-battle aggregates
  const trechoSummary: TrechoSummaryData = {
    id: trechoId,
    name: trechoName,
    passed,
    battleCount: 1,
    avgTtkTurns: battleResult.ttkTurns,
    avgTtkActions: battleResult.ttkActions,
    p95TtkTurns: battleResult.ttkTurns,
    p95TtkActions: battleResult.ttkActions,
    successRate: passed ? 1.0 : 0.0,
    battles: [reportBattle],
    warnings: warningData,
  };

  // Build final ReportData
  const reportData: ReportData = {
    trechos: [trechoSummary],
    totalBattles: 1,
    timestamp: new Date().toISOString(),
  };

  return reportData;
}
