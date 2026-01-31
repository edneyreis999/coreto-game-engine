/**
 * useSimulationProgress Hook (Event Streaming Pattern)
 *
 * Custom React hook for real-time simulation progress via IPC event streaming.
 * Replaces polling pattern with event-based updates for zero latency.
 *
 * Features:
 * - Event streaming (0ms latency vs 0-500ms polling)
 * - Automatic cleanup on unmount (prevents memory leaks)
 * - Type-safe event payloads
 * - Supports both legacy (runSimulation) and new (startSimulation + events) APIs
 *
 * @see planos/005-run-ttk-electron/TECHSPEC.md Section 2.5
 * @see planos/005-run-ttk-electron/tasks/02_task.md
 * @see planos/005-run-ttk-electron/technical-debt.md DT-001
 */

import { useCallback, useEffect, useState } from 'react';
import type {
  ProgressPayload,
  ErrorPayload,
  SimulationResultPayload
} from '@coreto/electron/preload/index.js';

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

  /**
   * Current stage of simulation.
   */
  stage?: ProgressPayload['stage'];

  /**
   * User-facing progress message.
   */
  message?: string;
}

/**
 * Legacy simulation result format (for backward compatibility).
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
   * Detailed progress payload from worker (for advanced usage).
   */
  progressDetail: ProgressPayload | null;

  /**
   * Status of the simulation.
   */
  status: SimulationStatus;

  /**
   * Error message if simulation failed.
   */
  error: ErrorPayload | null;

  /**
   * Simulation result if simulation completed successfully.
   */
  result: SimulationResultPayload | null;

  /**
   * Starts a simulation with the given configuration (new event-based API).
   * @param params - Simulation parameters
   * @returns Promise that resolves when simulation starts (result comes via onComplete event)
   */
  startSimulation: (params: {
    projectPath: string;
    configPath: string;
    seed?: number;
    diagnostic?: boolean;
  }) => Promise<void>;

  /**
   * Legacy simulation start (for backward compatibility).
   * @deprecated Use startSimulation with event listeners instead
   * @param config - Simulation configuration
   * @returns Promise that resolves when simulation completes
   */
  runSimulation: (config: {
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
 * Custom hook for real-time simulation progress via event streaming.
 *
 * Uses IPC event listeners (onProgress, onComplete, onError) instead of polling.
 * Automatically cleans up listeners on unmount to prevent memory leaks.
 *
 * @returns Simulation progress state and control functions
 *
 * @example
 * const { progress, status, startSimulation, cancelSimulation } = useSimulationProgress();
 *
 * await startSimulation({
 *   projectPath: '/path/to/project',
 *   configPath: '/path/to/config.json',
 * });
 */
export function useSimulationProgress(): UseSimulationProgressReturn {
  // State for progress tracking
  const [progress, setProgressState] = useState<SimulationProgressState>(initialProgress);
  const [progressDetail, setProgressDetail] = useState<ProgressPayload | null>(null);
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [error, setError] = useState<ErrorPayload | null>(null);
  const [result, setResult] = useState<SimulationResultPayload | null>(null);

  /**
   * Setup event listeners on mount.
   * CRITICAL: Cleanup listeners on unmount to prevent memory leaks.
   */
  useEffect(() => {
    // Progress events
    const cleanupProgress = window.coreto.onProgress((payload: ProgressPayload) => {
      setProgressState({
        percentage: payload.percentage,
        current: payload.current,
        currentIndex: payload.current,
        totalItems: payload.total,
        isRunning: true,
        stage: payload.stage,
        message: payload.message,
        currentItem: payload.trechoName,
      });
      setProgressDetail(payload);
      setStatus('running');
    });

    // Completion events
    const cleanupComplete = window.coreto.onComplete((simulationResult: SimulationResultPayload) => {
      setResult(simulationResult);
      setStatus('completed');
      setProgressState((prev) => ({
        ...prev,
        percentage: 100,
        isRunning: false,
      }));
      setProgressDetail(null);
    });

    // Error events
    const cleanupError = window.coreto.onError((errorPayload: ErrorPayload) => {
      setError(errorPayload);
      setStatus('error');
      setProgressState((prev) => ({
        ...prev,
        isRunning: false,
      }));
      setProgressDetail(null);
    });

    // Cleanup on unmount
    return () => {
      cleanupProgress();
      cleanupComplete();
      cleanupError();
    };
  }, []);

  /**
   * Resets the state to initial values.
   */
  const reset = useCallback(() => {
    setProgressState({ ...initialProgress });
    setProgressDetail(null);
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  /**
   * Starts a simulation (new event-based API).
   * Returns immediately - result comes via onComplete event.
   */
  const startSimulation = useCallback(async (params: {
    projectPath: string;
    configPath: string;
    seed?: number;
    diagnostic?: boolean;
  }): Promise<void> => {
    // Reset state
    reset();
    setStatus('running');
    setProgressState({ ...initialProgress, isRunning: true });

    try {
      const coretoAPI = window.coreto;
      const response = await coretoAPI.startSimulation(params);

      if (!response.success) {
        setStatus('error');
        setError({
          title: 'Failed to Start Simulation',
          description: response.error.message,
          code: 'ERR_START_FAILED'
        });
      }
      // If success, wait for onComplete event
    } catch (err) {
      setStatus('error');
      setError({
        title: 'Failed to Start Simulation',
        description: err instanceof Error ? err.message : 'Unknown error',
        code: 'ERR_START_FAILED'
      });
    }
  }, [reset]);

  /**
   * Legacy simulation run (for backward compatibility).
   * @deprecated Use startSimulation with event listeners instead
   */
  const runSimulation = useCallback(async (config: {
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
    setProgressState({ ...initialProgress, isRunning: true });

    try {
      const coretoAPI = window.coreto;
      const response = await coretoAPI.runSimulation(config);

      if (response.success) {
        const simulationResult = response.data;

        // Update state with result
        setStatus('completed');
        setProgressState({
          isRunning: false,
          percentage: 100,
          currentIndex: simulationResult.battleResult.ttkTurns,
          totalItems: simulationResult.battleResult.ttkTurns,
          currentItem: simulationResult.troopName,
        });
        setError(null);

        return simulationResult;
      } else {
        // Simulation failed
        setStatus('error');
        setProgressState({ ...initialProgress, isRunning: false });
        setError({
          title: 'Simulation Failed',
          description: response.error.message ?? 'Unknown error',
          code: 'ERR_SIMULATION_FAILED'
        });

        throw new Error(response.error.message ?? 'Simulation failed');
      }
    } catch (err) {
      // Update error state
      setStatus('error');
      setProgressState({ ...initialProgress, isRunning: false });
      setError({
        title: 'Simulation Failed',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        code: 'ERR_SIMULATION_FAILED'
      });

      throw err;
    }
  }, [reset]);

  /**
   * Cancels the currently running simulation.
   */
  const cancelSimulation = useCallback(async (): Promise<void> => {
    try {
      const coretoAPI = window.coreto;
      await coretoAPI.cancelSimulation();
      setStatus('cancelled');
      setProgressState({ ...initialProgress, isRunning: false });
      setProgressDetail(null);
    } catch (err) {
      console.error('Error cancelling simulation:', err);
      setError({
        title: 'Cancellation Failed',
        description: err instanceof Error ? err.message : 'Failed to cancel simulation',
        code: 'ERR_CANCEL_FAILED'
      });
    }
  }, []);

  return {
    progress,
    progressDetail,
    status,
    error,
    result,
    startSimulation,
    runSimulation,
    cancelSimulation,
    reset,
  };
}

export default useSimulationProgress;
