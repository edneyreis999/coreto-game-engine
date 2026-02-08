/**
 * Build Simulation Report Use Case
 *
 * Pure domain use case for building simulation reports from simulation results.
 * Follows Clean Architecture - no direct infrastructure dependencies.
 *
 * This use case extracts the report building logic that was previously
 * embedded in the IPC handler layer, making it testable and reusable.
 *
 * Process:
 * 1. Transform SimulationResult to ReportBattleResult
 * 2. Convert warnings from string[] to WarningData[]
 * 3. Build TrechoSummaryData with single-battle aggregates
 * 4. Return complete ReportData structure
 *
 * @see packages/electron/src/domain/types/simulation-types.ts
 * @see packages/electron/src/domain/ports/IReportBuilder.ts
 */

import type {
  ReportData,
  ReportBattleResult,
  TrechoSummaryData,
  WarningData,
  SimulationResult,
} from '../types/index.js';
import type {
  IReportBuilder,
  BuildReportInput,
} from '../ports/index.js';

// ============================================================================
// Implementation
// ============================================================================

/**
 * Simulation Report Builder Implementation
 *
 * Implements the IReportBuilder port to transform simulation results
 * into the aggregate report format expected by the UI.
 *
 * This class contains pure business logic with no side effects,
 * making it fully testable in isolation.
 */
export class SimulationReportBuilder implements IReportBuilder {
  /**
   * Builds a ReportData from a SimulationResult.
   *
   * This method transforms a single battle simulation result into the
   * aggregate report format expected by the UI. For a single battle:
   * - avgTtkTurns = p95TtkTurns = battleResult.ttkTurns
   * - successRate = 1.0 if passed, else 0.0
   * - battleCount = 1
   *
   * @param input - The input containing simulation result and trecho name
   * @returns A ReportData structure with the single battle wrapped in aggregate format
   */
  buildReport(input: BuildReportInput): ReportData {
    const { simulationResult, trechoName } = input;
    const { trechoId, troopId, troopName, battleResult, passed, warnings } = simulationResult;

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
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for creating SimulationReportBuilder instances.
 *
 * This factory follows the functional dependency injection pattern
 * used across the codebase for consistency.
 *
 * @returns A new SimulationReportBuilder instance
 */
export function createSimulationReportBuilder(): IReportBuilder {
  return new SimulationReportBuilder();
}

// ============================================================================
// Convenience Export
// ============================================================================

/**
 * Convenience function for building reports without DI.
 *
 * This function provides a simple functional API for report building
 * when dependency injection is not needed (e.g., in simple scripts).
 *
 * @param simulationResult - The simulation result to convert
 * @param trechoName - The display name for the trecho
 * @returns A ReportData structure
 *
 * @example
 * ```typescript
 * const reportData = buildSimulationReport(simulationResult, 'Trecho 1');
 * ```
 */
export function buildSimulationReport(
  simulationResult: SimulationResult,
  trechoName: string
): ReportData {
  const builder = createSimulationReportBuilder();
  return builder.buildReport({ simulationResult, trechoName });
}
