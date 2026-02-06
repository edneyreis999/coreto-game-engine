/**
 * useRecentProjects Hook
 *
 * Custom React hook for managing recent projects from the SQLite database.
 * Provides state management for fetching and adding recent projects.
 *
 * @see packages/electron/src/main/database/queries/recent-projects.ts
 */

import { useCallback, useEffect, useState } from 'react';

import type { RecentProject } from '@coreto/electron/preload/index.js';

// ============================================================================
// Hook State
// ============================================================================

/**
 * State for recent projects operations.
 */
interface RecentProjectsState {
  recentProjects: RecentProject[];
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// Hook Return Value
// ============================================================================

/**
 * Return value for useRecentProjects hook.
 */
interface RecentProjectsReturn extends RecentProjectsState {
  /**
   * Refreshes the recent projects list from the database.
   */
  refresh: () => Promise<void>;

  /**
   * Adds a project to recent projects or updates its last opened timestamp.
   * @param path - Absolute path to the project directory
   * @param name - Project name
   */
  addRecent: (path: string, name: string) => Promise<void>;

  /**
   * Resets the state to initial values.
   */
  reset: () => void;
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Creates an error object from an IPC error response.
 */
function createIpcError(ipcError: {
  name: string;
  message: string;
  severity: string;
  context: Record<string, unknown>;
  timestamp: string;
}): Error {
  const error = new Error(ipcError.message);
  error.name = ipcError.name;
  return error;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Custom hook for managing recent projects.
 *
 * Fetches recent projects on mount and provides functions to
 * refresh the list and add new projects.
 *
 * @param limit - Maximum number of recent projects to fetch (default: 10)
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * @returns Recent projects state and control functions
 *
 * @example
 * const { recentProjects, isLoading, error, refresh, addRecent } = useRecentProjects(5);
 *
 * // Add a project to recent
 * await addRecent('/path/to/project', 'My Game');
 *
 * // Refresh the list
 * await refresh();
 */
export function useRecentProjects(
  limit: number = 10,
  autoFetch: boolean = true
): RecentProjectsReturn {
  const [state, setState] = useState<RecentProjectsState>({
    recentProjects: [],
    isLoading: autoFetch,
    error: null,
  });

  /**
   * Fetches recent projects from the database.
   */
  const fetchRecentProjects = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await window.coreto.listRecent(limit);

      if (result.success) {
        setState({
          recentProjects: result.data,
          isLoading: false,
          error: null,
        });
      } else {
        setState({
          recentProjects: [],
          isLoading: false,
          error: createIpcError(result.error),
        });
      }
    } catch (error) {
      setState({
        recentProjects: [],
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [limit]);

  /**
   * Adds a project to recent projects or updates its last opened timestamp.
   */
  const addRecent = useCallback(
    async (path: string, name: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await window.coreto.addRecent(path, name);

        if (result.success) {
          // Refresh the list after adding
          await fetchRecentProjects();
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: createIpcError(result.error),
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      }
    },
    [fetchRecentProjects]
  );

  /**
   * Resets the state to initial values.
   */
  const reset = useCallback(() => {
    setState({
      recentProjects: [],
      isLoading: false,
      error: null,
    });
  }, []);

  /**
   * Refreshes the recent projects list.
   */
  const refresh = useCallback(async () => {
    await fetchRecentProjects();
  }, [fetchRecentProjects]);

  // Fetch on mount if auto-fetch is enabled
  useEffect(() => {
    if (autoFetch) {
      fetchRecentProjects();
    }
  }, [autoFetch, fetchRecentProjects]);

  return {
    ...state,
    refresh,
    addRecent,
    reset,
  };
}

// ============================================================================
// Validation Status
// ============================================================================

/**
 * Gets the validation status of a recent project.
 * Returns 'unknown' if the project hasn't been validated yet.
 *
 * @param project - Recent project to check
 * @returns Validation status
 */
export function getProjectValidationStatus(
  _project: RecentProject
): 'valid' | 'invalid' | 'unknown' {
  // Validation status is not stored in the database yet
  // This will be implemented when validation results are persisted
  return 'unknown';
}
