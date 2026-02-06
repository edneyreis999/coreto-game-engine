/**
 * useConfig Hook
 *
 * Custom React hook for configuration operations.
 * Provides state management for trechos CRUD operations via IPC.
 *
 * @see packages/electron/src/renderer/src/components/ConfigurationPanel
 */

import { useCallback, useState, useEffect } from 'react';

import { useIpcWithArg } from './useIpc';
import type { TrechoData } from '@/types/preload';

// ============================================================================
// Types
// ============================================================================

/**
 * State for config operations.
 */
interface ConfigState {
  trechos: TrechoData[];
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// Hook Return Value
// ============================================================================

interface ConfigReturn extends ConfigState {
  /**
   * Adds or updates a trecho configuration.
   * @param projectPath - Path to the RPG Maker MZ project
   * @param trecho - Trecho data to add or update
   */
  updateTrecho: (
    projectPath: string,
    trecho: TrechoData
  ) => Promise<void>;

  /**
   * Deletes a trecho from the configuration.
   * @param projectPath - Path to the RPG Maker MZ project
   * @param trechoId - ID of the trecho to delete
   */
  deleteTrecho: (projectPath: string, trechoId: string) => Promise<void>;

  /**
   * Refreshes the trechos list from the main process.
   */
  refresh: () => Promise<void>;

  /**
   * Resets the state to initial values.
   */
  reset: () => void;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Custom hook for configuration operations.
 *
 * Provides state management for trechos CRUD operations including:
 * - Loading trechos from main process
 * - Adding/updating trechos via IPC
 * - Deleting trechos via IPC
 * - Error handling and loading states
 *
 * @example
 * const { trechos, isLoading, error, updateTrecho, deleteTrecho } = useConfig();
 *
 * await updateTrecho('/path/to/project', { id: 'ato1', ... });
 */
export function useConfig(): ConfigReturn {
  const [state, setState] = useState<ConfigState>({
    trechos: [],
    isLoading: false,
    error: null,
  });

  // Hook for loading trechos
  const {
    data: trechosData,
    error: trechosError,
    isLoading: isLoadingTrechos,
    invoke: loadTrechos,
    reset: resetTrechos,
  } = useIpcWithArg<TrechoData[]>(() => window.coreto.getTrechos());

  /**
   * Adds or updates a trecho configuration.
   */
  const updateTrecho = useCallback(
    async (projectPath: string, trecho: TrechoData) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await window.coreto.updateTrecho(projectPath, trecho);

        if (result.success) {
          // Update local state with the returned trecho
          setState((prev) => {
            const existingIndex = prev.trechos.findIndex(
              (t) => t.id === trecho.id
            );

            if (existingIndex >= 0) {
              // Update existing trecho
              return {
                ...prev,
                trechos: prev.trechos.map((t, i) =>
                  i === existingIndex ? result.data.trecho : t
                ),
                isLoading: false,
              };
            } else {
              // Add new trecho
              return {
                ...prev,
                trechos: [...prev.trechos, result.data.trecho],
                isLoading: false,
              };
            }
          });
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: new Error(result.error.message),
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error : new Error(String(error)),
        }));
      }
    },
    []
  );

  /**
   * Deletes a trecho from the configuration.
   */
  const deleteTrecho = useCallback(
    async (projectPath: string, trechoId: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await window.coreto.deleteTrecho(
          projectPath,
          trechoId
        );

        if (result.success) {
          // Remove trecho from local state
          setState((prev) => ({
            ...prev,
            trechos: prev.trechos.filter((t) => t.id !== trechoId),
            isLoading: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: new Error(result.error.message),
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error : new Error(String(error)),
        }));
      }
    },
    []
  );

  /**
   * Refreshes the trechos list from the main process.
   */
  const refresh = useCallback(async () => {
    await loadTrechos();
  }, [loadTrechos]);

  /**
   * Resets the state to initial values.
   */
  const reset = useCallback(() => {
    setState({
      trechos: [],
      isLoading: false,
      error: null,
    });
    resetTrechos();
  }, [resetTrechos]);

  // Update state when trechos data changes
  useEffect(() => {
    if (trechosData && state.trechos !== trechosData) {
      setState((prev) => ({
        ...prev,
        trechos: trechosData,
        error: trechosError,
      }));
    }
  }, [trechosData, trechosError, state.trechos]);

  return {
    trechos: state.trechos,
    isLoading: state.isLoading || isLoadingTrechos,
    error: state.error || trechosError,
    updateTrecho,
    deleteTrecho,
    refresh,
    reset,
  };
}

export default useConfig;
