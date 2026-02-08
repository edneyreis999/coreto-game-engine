/**
 * ExecutionPanel Component
 *
 * Panel for running TTK validation simulations and monitoring real-time progress.
 * Provides one-click simulation execution with progress tracking and cancellation.
 *
 * Features:
 * - Run Validation button to start simulations
 * - Real-time progress indicator with current trecho display
 * - Cancel button to stop running simulations
 * - Status indicators (idle, running, completed, error)
 * - Error messages with user-friendly descriptions
 * - Completion event emission for Results Panel integration
 *
 * @see Task 4bccaf27-8aff-4af9-9f72-686ae85fe60e
 */

import {
  type FC,
  useCallback,
} from 'react';

import { cn } from '@/lib/utils';
import {
  useSimulationProgress,
  type SimulationCompletionResult,
} from '@/hooks/useSimulationProgress';
import {
  ConfigNotReadyState,
  IdleState,
  RunningState,
  CompletedState,
  ErrorState,
} from './ExecutionPanelStates';
import { ExecutionPanelHeader } from './ExecutionPanelHeader';
import {
  isRunningStatus,
  isCompletedStatus,
  isErrorStatus,
  isIdleStatus,
  getStatusMessage,
} from './statusUtils';
import { getCurrentItem } from './renderUtils';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Configuration data passed from Configuration Panel.
 * This type is now defined in the domain layer and re-exported here for backward compatibility.
 *
 * @see @coreto/electron/domain/services/config-mapper
 */
export type { SimulationConfigData } from '@coreto/electron/domain/services';

/**
 * Props for ExecutionPanel component.
 */
export interface ExecutionPanelProps {
  /**
   * Configuration data from Configuration Panel.
   * Panel is disabled until this is provided with valid trechos.
   */
  config: SimulationConfigData | null;

  /**
   * Callback when simulation completes successfully.
   * Passes simulation results for Results Panel to display.
   * @param result - Simulation completion result
   */
  onSimulationComplete?: (result: SimulationCompletionResult) => void;

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ExecutionPanel Component
 *
 * Renders a panel for running TTK validation simulations.
 * Includes:
 * - Run Validation button (disabled until config provided)
 * - Progress bar with percentage display
 * - Current trecho/troop indicator
 * - Cancel button during simulation
 * - Status messages (idle, running, completed, error)
 * - Error display with user-friendly messages
 *
 * @example
 * <ExecutionPanel
 *   config={configData}
 *   onSimulationComplete={(result) => console.log('Complete:', result)}
 * />
 */
export const ExecutionPanel: FC<ExecutionPanelProps> = ({
  config,
  onSimulationComplete,
  className,
}) => {
  const {
    progress,
    status,
    error,
    result,
    runSimulation,
    cancelSimulation,
    reset,
  } = useSimulationProgress();

  /**
   * Handles Run Validation button click.
   * Starts simulation with the first trecho from configuration.
   */
  const handleRunClick = useCallback(async () => {
    if (!config || config.trechos.length === 0) {
      return;
    }

    // For MVP, run the first trecho in the configuration
    const firstTrecho = config.trechos[0];

    if (!firstTrecho) {
      return;
    }

    try {
      // Run simulation - result is returned directly (not via event)
      const result = await runSimulation({
        projectPath: config.projectPath,
        configPath: config.configPath ?? '',
        trechoId: firstTrecho.id,
        seed: config.globalSettings.seed,
        maxTurns: config.globalSettings.maxBattleTurns,
      });

      // Notify parent component that simulation completed successfully
      onSimulationComplete?.(result);
    } catch {
      // Error is already handled by useSimulationProgress hook
      // No need to invoke callback on error
      // The hook sets error state which is displayed in the UI
    }
  }, [config, runSimulation, onSimulationComplete]);

  /**
   * Handles Cancel button click.
   * Cancels the running simulation and resets state.
   */
  const handleCancelClick = useCallback(async () => {
    await cancelSimulation();
    reset();
  }, [cancelSimulation, reset]);

  // ========================================================================
  // Render Helpers
  // ========================================================================

  /**
   * Whether the panel is enabled (valid config provided).
   */
  const isEnabled = config !== null && config.trechos.length > 0;

  /**
   * Whether simulation is currently running.
   */
  const isRunning = isRunningStatus(status);

  /**
   * Whether simulation has completed successfully.
   */
  const isCompleted = isCompletedStatus(status);

  /**
   * Whether simulation has encountered an error.
   */
  const hasError = isErrorStatus(status);

  /**
   * Whether panel is in idle state.
   */
  const isIdle = isIdleStatus(status);


  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div
      className={cn(
        'flex flex-col gap-6 p-6 bg-background rounded-lg border border-border',
        !isEnabled && 'opacity-50',
        className
      )}
    >
      {/* Header */}
      <ExecutionPanelHeader />

      {/* Configuration Not Ready */}
      {!isEnabled && <ConfigNotReadyState />}

      {/* Idle State - Show Run Button */}
      {isEnabled && isIdle && (
        <IdleState
          config={config}
          onRunClick={handleRunClick}
        />
      )}

      {/* Running State - Show Progress */}
      {isRunning && (
        <RunningState
          progress={progress}
          statusMessage={getStatusMessage(status)}
          currentItem={getCurrentItem(result, progress, config)}
          onCancelClick={handleCancelClick}
        />
      )}

      {/* Completed State - Show Success */}
      {isCompleted && (
        <CompletedState
          result={result}
          onRunClick={handleRunClick}
        />
      )}

      {/* Error State - Show Error */}
      {hasError && (
        <ErrorState
          error={error}
          statusMessage={getStatusMessage(status)}
          onRetryClick={handleRunClick}
        />
      )}
    </div>
  );
};

export default ExecutionPanel;
