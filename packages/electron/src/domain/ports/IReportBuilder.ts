/**
 * Report Builder Port
 *
 * Domain port for building simulation reports from simulation results.
 * This port defines the contract for report building logic that was
 * previously embedded in the IPC handler layer.
 *
 * Following Clean Architecture principles, this port:
 * - Defines the business logic contract
 * - Is framework-agnostic
 * - Can be implemented by infrastructure adapters
 *
 * @module domain/ports
 */

import type {
  ReportData,
  SimulationResult,
} from '../types/index.js';

/**
 * Input for building a simulation report.
 */
export interface BuildReportInput {
  /**
   * The simulation result to convert to a report.
   */
  simulationResult: SimulationResult;

  /**
   * The display name for the trecho.
   * Used for the report summary display.
   */
  trechoName: string;
}

/**
 * Report Builder Port Interface
 *
 * Defines the contract for building simulation reports.
 * Implementations should transform SimulationResult into ReportData
 * format suitable for UI display and history persistence.
 */
export interface IReportBuilder {
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
  buildReport(input: BuildReportInput): ReportData;
}
