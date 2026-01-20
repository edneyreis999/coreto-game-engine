/**
 * useSimulationProgress Hook
 *
 * Custom React hook for polling simulation progress via IPC.
 * Provides real-time progress updates during long-running simulations.
 *
 * Features:
 * - Polls simulation:getProgress at 500ms intervals during simulation
 * - Automatically stops polling when simulation completes
 * - Proper cleanup on unmount to prevent memory leaks
 * - Error handling for failed IPC calls
 *
 * @see Task 4bccaf27-8aff-4af9-9f72-686ae85fe60e
 */

import { useCallback, useEffect, useState, useRef } from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Simulation progress state returned by the hook.
 */
export interface SimulationProgressState {
  /**
   * Current progress percentage (0-100).
   */
  percentage: number;

  /**
   * Current item being processed (trecho ID or troop ID).
   */
  currentItem?: string;

  /**
   * Total number of items to process.
   */
  totalItems: number;

  /**
   * Current item index (1-based).
   */
  currentIndex: number;

  /**
   * Whether a simulation is currently running.
   */
  isRunning: boolean;
}

/**
 * Simulation result returned when simulation completes.
 */
export interface SimulationCompletionResult {
  /**
   * ID of the trecho that was validated.
   */
  trechoId: string;

  /**
   * ID of the troop that was simulated.
   */
  troopId: number;

  /**
   * Name of the troop.
   */
  troopName: string;

  /**
   * Battle result data.
   */
  battleResult: {
    troopId: number;
    troopName: string;
    outcome: 'victory' | 'defeat' | 'timeout';
    ttkTurns: number;
    ttkActions: number;
    durationMs: number;
    seed: number;
    expGained: number;
  };

  /**
   * Whether the TTK was within tolerance.
   */
  passed: boolean;

  /**
   * Warning messages (if any).
   */
  warnings: string[];
}

/**
 * Status of the simulation.
 */
export type SimulationStatus =
  | 'idle'
  | 'running'
  | 'completed'
  | 'error'
  | 'cancelled';

/**
 * Return value for useSimulationProgress hook.
 */
export interface UseSimulationProgressReturn {
  /**
   * Current simulation progress state.
   */
  progress: SimulationProgressState;

  /**
   * Status of the simulation.
   */
  status: SimulationStatus;

  /**
   * Error message if simulation failed.
   */
  error: string | null;

  /**
   * Simulation result if simulation completed successfully.
   */
  result: SimulationCompletionResult | null;

  /**
   * Starts a simulation with the given configuration.
   * @param config - Simulation configuration
   * @returns Promise that resolves when simulation completes
   */
  startSimulation: (config: {
    projectPath: string;
    configPath?: string;
    trechoId?: string;
    troopId?: number;
    seed?: number;
    maxTurns?: number;
  }) => Promise<SimulationCompletionResult>;

  /**
   * Cancels the currently running simulation.
   */
  cancelSimulation: () => Promise<void>;

  /**
   * Resets the state to initial values.
   */
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

/**
 * Initial progress state.
 */
const initialProgress: SimulationProgressState = {
  percentage: 0,
  totalItems: 0,
  currentIndex: 0,
  isRunning: false,
};

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Custom hook for polling simulation progress via IPC.
 *
 * Polls `simulation:getProgress` every 500ms while simulation is running.
 * Automatically stops polling when simulation completes or is cancelled.
 *
 * @param pollInterval - Polling interval in milliseconds (default: 500)
 * @returns Simulation progress state and control functions
 *
 * @example
 * const { progress, status, startSimulation, cancelSimulation } = useSimulationProgress();
 *
 * await startSimulation({
 *   projectPath: '/path/to/project',
 *   trechoId: 'ato1-nivel1-10',
 * });
 */
export function useSimulationProgress(
  pollInterval: number = 500
): UseSimulationProgressReturn {
  // Use useState for values that need to trigger re-renders
  const [progress, setProgressState] = useState<SimulationProgressState>(initialProgress);
  const [status, setStatusState] = useState<SimulationStatus>('idle');
  const [error, setErrorState] = useState<string | null>(null);
  const [result, setResultState] = useState<SimulationCompletionResult | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Updates the progress state and triggers re-render.
   */
  const setProgress = useCallback((progress: Partial<SimulationProgressState>) => {
    setProgressState((prev) => ({ ...prev, ...progress }));
  }, []);

  /**
   * Updates the status state.
   */
  const setStatus = useCallback((status: SimulationStatus) => {
    setStatusState(status);
  }, []);

  /**
   * Updates the error state.
   */
  const setError = useCallback((error: string | null) => {
    setErrorState(error);
  }, []);

  /**
   * Updates the result state.
   */
  const setResult = useCallback((result: SimulationCompletionResult | null) => {
    setResultState(result);
  }, []);

  /**
   * Stops progress polling.
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Polls simulation progress via IPC.
   */
  const pollProgress = useCallback(async () => {
    try {
      const response = await window.coreto.getSimulationProgress();

      if (response.success) {
        const progressPercentage = response.data;

        setProgress({
          percentage: progressPercentage,
        });

        // Stop polling if simulation is complete (100%)
        if (progressPercentage >= 100) {
          stopPolling();
        }
      } else {
        // Error polling progress - stop polling
        console.error('Failed to poll progress:', response.error);
        stopPolling();
      }
    } catch (error) {
      console.error('Error polling progress:', error);
      stopPolling();
    }
  }, [setProgress, stopPolling]);

  /**
   * Starts progress polling.
   */
  const startPolling = useCallback(() => {
    // Clear any existing interval
    stopPolling();

    // Start new polling interval
    pollingIntervalRef.current = setInterval(() => {
      void pollProgress();
    }, pollInterval);
  }, [pollInterval, stopPolling, pollProgress]);

  /**
   * Resets the state to initial values.
   * Defined before startSimulation to avoid circular dependency.
   */
  const reset = useCallback(() => {
    stopPolling();
    setProgressState({ ...initialProgress });
    setStatusState('idle');
    setErrorState(null);
    setResultState(null);
  }, [stopPolling]);

  /**
   * Starts a simulation with the given configuration.
   */
  const startSimulation = useCallback(
    async (config: {
      projectPath: string;
      configPath?: string;
      trechoId?: string;
      troopId?: number;
      seed?: number;
      maxTurns?: number;
    }): Promise<SimulationCompletionResult> => {
      // Reset state
      reset();
      setStatus('running');
      setProgress({ isRunning: true, percentage: 0 });

      try {
        // Start progress polling
        startPolling();

        // Invoke simulation:run IPC handler
        const response = await window.coreto.runSimulation(config);

        // Stop polling when simulation completes
        stopPolling();

        if (response.success) {
          const simulationResult = response.data;

          // Update state with result
          setStatus('completed');
          setProgress({
            isRunning: false,
            percentage: 100,
            currentIndex: simulationResult.battleResult.ttkTurns,
            totalItems: simulationResult.battleResult.ttkTurns,
            currentItem: simulationResult.troopName,
          });
          setResult(simulationResult);
          setError(null);

          return simulationResult;
        } else {
          // Simulation failed
          setStatus('error');
          setProgress({ isRunning: false, percentage: 0 });
          setError(response.error.message ?? 'Simulation failed');
          setResult(null);

          throw new Error(response.error.message ?? 'Simulation failed');
        }
      } catch (error) {
        // Stop polling on error
        stopPolling();

        // Update error state
        setStatus('error');
        setProgress({ isRunning: false, percentage: 0 });
        setError(
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
        setResult(null);

        throw error;
      }
    },
    [reset, setStatus, setProgress, startPolling, stopPolling, setResult, setError]
  );

  /**
   * Cancels the currently running simulation.
   */
  const cancelSimulation = useCallback(async (): Promise<void> => {
    try {
      // Stop polling
      stopPolling();

      // Invoke simulation:cancel IPC handler
      await window.coreto.cancelSimulation();

      // Update state
      setStatus('cancelled');
      setProgress({ isRunning: false, percentage: 0 });
      setError(null);
      setResult(null);
    } catch (error) {
      console.error('Error cancelling simulation:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to cancel simulation'
      );
    }
  }, [stopPolling, setStatus, setProgress, setError]);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    progress,
    status,
    error,
    result,
    startSimulation,
    cancelSimulation,
    reset,
  };
}

export default useSimulationProgress;
