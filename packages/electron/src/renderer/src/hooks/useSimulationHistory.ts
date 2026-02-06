/**
 * useSimulationHistory Hook
 *
 * Custom React hook for managing simulation history.
 * Provides access to stored simulation records with loading/error states.
 *
 * Features:
 * - List simulation history with optional project filter
 * - Load detailed reports from history
 * - Delete history entries
 * - Export reports to files
 * - Reactive loading and error states
 *
 * @see Task 11 - Simulation History & Report Export
 */

import { useCallback, useEffect, useState } from 'react';

import type { HistoryEntry, SimulationReport } from '@/types/preload';

// ============================================================================
// Types
// ============================================================================

/**
 * Return type for useSimulationHistory hook.
 */
export interface UseSimulationHistoryReturn {
  /**
   * Array of history entries.
   */
  history: HistoryEntry[];

  /**
   * Currently loading history.
   */
  isLoading: boolean;

  /**
   * Error from last operation.
   */
  error: Error | null;

  /**
   * Whether history has entries.
   */
  hasHistory: boolean;

  /**
   * Refresh history list from database.
   */
  refresh: () => Promise<void>;

  /**
   * Load detailed report for a history entry.
   * @param simulationId - UUID of the simulation
   * @returns Report data or null if not found
   */
  loadReport: (simulationId: string) => Promise<SimulationReport | null>;

  /**
   * Delete a history entry.
   * @param simulationId - UUID of the simulation to delete
   */
  deleteEntry: (simulationId: string) => Promise<void>;

  /**
   * Export a report to file.
   * @param simulationId - UUID of the simulation
   * @param result - Report data to export
   * @param projectPath - Project path for file organization
   * @returns File path of exported report
   */
  exportReport: (
    simulationId: string,
    result: Parameters<typeof window.coreto.exportHistoryReport>[1],
    projectPath: string
  ) => Promise<string>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook options.
 */
export interface UseSimulationHistoryOptions {
  /**
   * Optional filter by project path.
   */
  projectPath?: string;

  /**
   * Maximum number of entries to fetch.
   * @default 50
   */
  limit?: number;

  /**
   * Whether to auto-load history on mount.
   * @default true
   */
  autoLoad?: boolean;
}

/**
 * useSimulationHistory Hook
 *
 * Manages simulation history state and operations.
 *
 * @example
 * const { history, isLoading, error, refresh, deleteEntry } = useSimulationHistory({
 *   limit: 20,
 *   autoLoad: true
 * });
 */
export function useSimulationHistory(
  options: UseSimulationHistoryOptions = {}
): UseSimulationHistoryReturn {
  const { projectPath, limit = 50, autoLoad = true } = options;

  // State
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Refresh history list from database.
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await window.coreto.listHistory(projectPath, limit);

      if (response.success) {
        setHistory(response.data.simulations);
      } else {
        setError(new Error(response.error.message));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load history'));
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, limit]);

  /**
   * Load detailed report for a history entry.
   */
  const loadReport = useCallback(async (simulationId: string): Promise<SimulationReport | null> => {
    try {
      const response = await window.coreto.loadHistoryReport(simulationId);

      if (response.success) {
        return response.data.report;
      } else {
        setError(new Error(response.error.message));
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load report'));
      return null;
    }
  }, []);

  /**
   * Delete a history entry.
   */
  const deleteEntry = useCallback(async (simulationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await window.coreto.deleteHistoryEntry(simulationId);

      if (response.success) {
        // Remove from local state
        setHistory((prev) => prev.filter((entry) => entry.id !== simulationId));
      } else {
        setError(new Error(response.error.message));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete entry'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Export a report to file.
   */
  const exportReport = useCallback(
    async (
      simulationId: string,
      result: Parameters<typeof window.coreto.exportHistoryReport>[1],
      projectPath: string
    ): Promise<string> => {
      try {
        const response = await window.coreto.exportHistoryReport(simulationId, result, projectPath);

        if (response.success) {
          return response.data.filePath;
        } else {
          setError(new Error(response.error.message));
          throw new Error(response.error.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to export report'));
        throw err;
      }
    },
    []
  );

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [autoLoad, refresh]);

  // Derived state
  const hasHistory = history.length > 0;

  return {
    history,
    isLoading,
    error,
    hasHistory,
    refresh,
    loadReport,
    deleteEntry,
    exportReport,
  };
}

export default useSimulationHistory;
