/**
 * useSimulationResults Hook
 *
 * Custom React hook for fetching simulation results via IPC.
 * Provides type-safe access to the Report data from the main process.
 *
 * @see packages/electron/src/renderer/src/components/ResultsPanel.tsx
 * @see packages/electron/src/main/ipc/handlers.ts - handleSimulationGetResults
 */

import { useCallback } from 'react';

import { useIpc } from './useIpc';
import type { ReportData } from '@/types/preload';

// ============================================================================
// Hook State
// ============================================================================

/**
 * Return value for useSimulationResults hook.
 */
interface SimulationResultsState {
  /**
   * The Report data containing all trecho summaries.
   */
  report: ReportData | null;

  /**
   * Error that occurred during IPC communication.
   */
  error: Error | null;

  /**
   * Whether the IPC call is in progress.
   */
  isLoading: boolean;

  /**
   * Whether results are available (report exists).
   */
  hasResults: boolean;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Custom hook for fetching simulation results.
 *
 * Provides access to the Report data from the most recent simulation.
 * The hook caches results and only refetches when explicitly requested.
 *
 * @returns Simulation results state and control functions
 *
 * @example
 * const { report, error, isLoading, hasResults, refresh } = useSimulationResults();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (!hasResults) return <div>No results available</div>;
 *
 * return (
 *   <ul>
 *     {report.trechos.map(trecho => (
 *       <li key={trecho.id}>{trecho.name}: {trecho.passed ? 'Pass' : 'Fail'}</li>
 *     ))}
 *   </ul>
 * );
 */
export function useSimulationResults(): SimulationResultsState & {
  /**
   * Refetches the simulation results from the main process.
   */
  refresh: () => Promise<void>;
} {
  const { data, error, isLoading, invoke } = useIpc<ReportData>(
    () => window.coreto.getSimulationResults(),
    { invokeOnMount: true }
  );

  /**
   * Refetches the simulation results from the main process.
   * Useful for polling or manual refresh after simulation completes.
   */
  const refresh = useCallback(async () => {
    await invoke();
  }, [invoke]);

  return {
    report: data,
    error,
    isLoading,
    hasResults: data !== null,
    refresh,
  };
}

export default useSimulationResults;
