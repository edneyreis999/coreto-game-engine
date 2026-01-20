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
  useEffect,
} from 'react';
import {
  Play,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  useSimulationProgress,
  type SimulationCompletionResult,
} from '@/hooks/useSimulationProgress';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Configuration data passed from Configuration Panel.
 */
export interface SimulationConfigData {
  /**
   * Absolute path to the RPG Maker MZ project.
   */
  projectPath: string;

  /**
   * Path to the configuration file (optional).
   */
  configPath?: string;

  /**
   * Trechos to validate.
   */
  trechos: Array<{
    id: string;
    name: string;
    troopIds: number[];
  }>;

  /**
   * Global settings.
   */
  globalSettings: {
    seed?: number;
    maxBattleTurns?: number;
  };
}

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
// Status Utilities
// ============================================================================

/**
 * Checks if status is a running state.
 */
function isRunningStatus(status: string): boolean {
  return status === 'running';
}

/**
 * Checks if status is a completed state.
 */
function isCompletedStatus(status: string): boolean {
  return status === 'completed';
}

/**
 * Checks if status is an error state.
 */
function isErrorStatus(status: string): boolean {
  return status === 'error';
}

/**
 * Checks if status is an idle state.
 */
function isIdleStatus(status: string): boolean {
  return status === 'idle' || status === 'cancelled';
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Progress bar component for visual progress indication.
 */
interface ProgressBarProps {
  /**
   * Progress percentage (0-100).
   */
  percentage: number;

  /**
   * Additional CSS class names.
   */
  className?: string;
}

const ProgressBar: FC<ProgressBarProps> = ({ percentage, className }) => {
  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  );
};

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
    startSimulation,
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

    try {
      // For MVP, run the first trecho in the configuration
      const firstTrecho = config.trechos[0];

      if (!firstTrecho) {
        return;
      }

      const simulationResult = await startSimulation({
        projectPath: config.projectPath,
        configPath: config.configPath,
        trechoId: firstTrecho.id,
        seed: config.globalSettings.seed,
        maxTurns: config.globalSettings.maxBattleTurns,
      });

      // Notify parent component of completion
      onSimulationComplete?.(simulationResult);
    } catch (err) {
      // Error is already handled by the hook
      console.error('Simulation failed:', err);
    }
  }, [config, startSimulation, onSimulationComplete]);

  /**
   * Handles Cancel button click.
   * Cancels the running simulation and resets state.
   */
  const handleCancelClick = useCallback(async () => {
    await cancelSimulation();
    reset();
  }, [cancelSimulation, reset]);

  /**
   * Notifies parent component when simulation completes.
   */
  useEffect(() => {
    if (status === 'completed' && result && onSimulationComplete) {
      onSimulationComplete(result);
    }
  }, [status, result, onSimulationComplete]);

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

  /**
   * Status message to display.
   */
  const getStatusMessage = (): string => {
    if (isRunning) {
      return 'Validating TTK balance...';
    }
    if (isCompleted) {
      return 'Validation complete';
    }
    if (hasError) {
      return 'Validation failed';
    }
    return 'Ready to validate';
  };

  /**
   * Current item being processed.
   */
  const getCurrentItem = (): string => {
    if (result) {
      return result.troopName;
    }
    if (progress.currentItem) {
      return progress.currentItem;
    }
    if (config && config.trechos.length > 0) {
      return config.trechos[0]?.name ?? 'Unknown trecho';
    }
    return 'Waiting to start...';
  };

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
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold tracking-tight">
            Execution
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Run TTK validation simulations
        </p>
      </div>

      {/* Configuration Not Ready */}
      {!isEnabled && (
        <div className="flex items-start gap-3 p-4 rounded-md border border-border bg-muted">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              Configuration required
            </p>
            <p className="text-xs text-muted-foreground">
              Add at least one trecho in the Configuration panel to enable validation
            </p>
          </div>
        </div>
      )}

      {/* Idle State - Show Run Button */}
      {isEnabled && isIdle && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleRunClick}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-3',
              'bg-primary text-primary-foreground rounded-md',
              'hover:bg-primary/90 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'font-medium text-sm'
            )}
          >
            <Play className="h-4 w-4" />
            <span>Run Validation</span>
          </button>
          {config && (
            <p className="text-xs text-muted-foreground text-center">
              {config.trechos.length} trecho{config.trechos.length !== 1 ? 's' : ''} configured
            </p>
          )}
        </div>
      )}

      {/* Running State - Show Progress */}
      {isRunning && (
        <div className="flex flex-col gap-4">
          {/* Status Message */}
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">
              {getStatusMessage()}
            </span>
          </div>

          {/* Progress Bar */}
          <ProgressBar percentage={progress.percentage} />

          {/* Current Item */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Validating:
            </span>
            <span className="font-medium">
              {getCurrentItem()}
            </span>
          </div>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={handleCancelClick}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2',
              'bg-secondary text-secondary-foreground rounded-md',
              'hover:bg-secondary/80 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'font-medium text-sm'
            )}
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Completed State - Show Success */}
      {isCompleted && (
        <div className="flex flex-col gap-4">
          <div
            className={cn(
              'flex items-start gap-3 p-4 rounded-md border',
              'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
            )}
          >
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Validation complete
              </p>
              {result && (
                <p className="text-xs text-muted-foreground">
                  {result.troopName} - TTK: {result.battleResult.ttkTurns} turns,{' '}
                  {result.battleResult.ttkActions} actions
                </p>
              )}
            </div>
          </div>

          {/* Run Again Button */}
          <button
            type="button"
            onClick={handleRunClick}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2',
              'bg-primary text-primary-foreground rounded-md',
              'hover:bg-primary/90 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'font-medium text-sm self-start'
            )}
          >
            <Play className="h-4 w-4" />
            <span>Run Again</span>
          </button>
        </div>
      )}

      {/* Error State - Show Error */}
      {hasError && (
        <div className="flex flex-col gap-4">
          <div
            className={cn(
              'flex items-start gap-3 p-4 rounded-md border',
              'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
            )}
          >
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {getStatusMessage()}
              </p>
              {error && (
                <p className="text-xs text-red-700 dark:text-red-300">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Retry Button */}
          <button
            type="button"
            onClick={handleRunClick}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2',
              'bg-primary text-primary-foreground rounded-md',
              'hover:bg-primary/90 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'font-medium text-sm self-start'
            )}
          >
            <Play className="h-4 w-4" />
            <span>Retry</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExecutionPanel;
