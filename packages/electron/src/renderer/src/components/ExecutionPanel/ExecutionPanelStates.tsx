/**
 * ExecutionPanel State Components
 *
 * Sub-components for rendering different states of the ExecutionPanel.
 * Extracted to reduce main component complexity and improve testability.
 *
 * Components:
 * - ConfigNotReadyState: Shown when no valid config is provided
 * - IdleState: Shown when panel is ready to run
 * - RunningState: Shown during simulation execution
 * - CompletedState: Shown after successful completion
 * - ErrorState: Shown when simulation fails
 *
 * @see packages/electron/src/renderer/src/components/ExecutionPanel/ExecutionPanel.tsx
 */

import { type FC } from 'react';
import { Play, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressBar } from './ProgressBar';
import { StatusBanner } from './StatusBanner';

// ============================================================================
// Types
// ============================================================================

/**
 * Simulation progress data.
 */
export interface ProgressData {
  /** Current progress percentage (0-100). */
  percentage: number;
  /** Name of the current item being processed. */
  currentItem?: string;
}

/**
 * Simulation result data.
 */
export interface ResultData {
  /** Name of the troop that was simulated. */
  troopName: string;
  /** Battle result containing TTK metrics. */
  battleResult: {
    ttkTurns: number;
    ttkActions: number;
  };
}

/**
 * Error data from failed simulation.
 */
export interface ErrorData {
  /** Error title. */
  title: string;
  /** Detailed error description. */
  description?: string;
}

/**
 * Configuration data.
 */
export interface ConfigData {
  /** Array of configured trechos. */
  trechos: Array<{
    id: string;
    name: string;
  }>;
}

// ============================================================================
// Props Interfaces
// ============================================================================

/**
 * Props for ConfigNotReadyState component.
 */
export interface ConfigNotReadyStateProps {
  /** Additional CSS class names. */
  className?: string;
}

/**
 * Props for IdleState component.
 */
export interface IdleStateProps {
  /** Configuration data. */
  config: ConfigData;
  /** Handler for run button click. */
  onRunClick: () => void;
  /** Additional CSS class names. */
  className?: string;
}

/**
 * Props for RunningState component.
 */
export interface RunningStateProps {
  /** Current progress data. */
  progress: ProgressData;
  /** Status message to display. */
  statusMessage: string;
  /** Current item being processed. */
  currentItem: string;
  /** Handler for cancel button click. */
  onCancelClick: () => void;
  /** Additional CSS class names. */
  className?: string;
}

/**
 * Props for CompletedState component.
 */
export interface CompletedStateProps {
  /** Simulation result data. */
  result: ResultData | null;
  /** Handler for run again button click. */
  onRunClick: () => void;
  /** Additional CSS class names. */
  className?: string;
}

/**
 * Props for ErrorState component.
 */
export interface ErrorStateProps {
  /** Error data from failed simulation. */
  error: ErrorData | null;
  /** Status message to display. */
  statusMessage: string;
  /** Handler for retry button click. */
  onRetryClick: () => void;
  /** Additional CSS class names. */
  className?: string;
}

// ============================================================================
// State Components
// ============================================================================

/**
 * ConfigNotReadyState Component
 *
 * Shown when no valid configuration is provided.
 * Displays a message prompting the user to configure trechos.
 */
export const ConfigNotReadyState: FC<ConfigNotReadyStateProps> = ({ className }) => {
  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-md border border-border bg-muted', className)}>
      <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Configuration required</p>
        <p className="text-xs text-muted-foreground">
          Add at least one trecho in the Configuration panel to enable validation
        </p>
      </div>
    </div>
  );
};

/**
 * IdleState Component
 *
 * Shown when the panel is ready to run a simulation.
 * Displays the "Run Validation" button with trecho count.
 */
export const IdleState: FC<IdleStateProps> = ({ config, onRunClick, className }) => {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <button
        type="button"
        onClick={onRunClick}
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
      <p className="text-xs text-muted-foreground text-center">
        {config.trechos.length} trecho{config.trechos.length !== 1 ? 's' : ''} configured
      </p>
    </div>
  );
};

/**
 * RunningState Component
 *
 * Shown during simulation execution.
 * Displays progress bar, current item, and cancel button.
 */
export const RunningState: FC<RunningStateProps> = ({
  progress,
  statusMessage,
  currentItem,
  onCancelClick,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Status Message */}
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">{statusMessage}</span>
      </div>

      {/* Progress Bar */}
      <ProgressBar percentage={progress.percentage} />

      {/* Current Item */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Validating:</span>
        <span className="font-medium">{currentItem}</span>
      </div>

      {/* Cancel Button */}
      <button
        type="button"
        onClick={onCancelClick}
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
  );
};

/**
 * CompletedState Component
 *
 * Shown after successful simulation completion.
 * Displays success banner and "Run Again" button.
 */
export const CompletedState: FC<CompletedStateProps> = ({ result, onRunClick, className }) => {
  const subtitle = result
    ? `${result.troopName} - TTK: ${result.battleResult.ttkTurns} turns, ${result.battleResult.ttkActions} actions`
    : undefined;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <StatusBanner variant="success" message="Validation complete" subtitle={subtitle} />

      {/* Run Again Button */}
      <button
        type="button"
        onClick={onRunClick}
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
  );
};

/**
 * ErrorState Component
 *
 * Shown when simulation fails.
 * Displays error banner and "Retry" button.
 */
export const ErrorState: FC<ErrorStateProps> = ({ error, statusMessage, onRetryClick, className }) => {
  const subtitle = error ? (error.description || error.title) : undefined;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <StatusBanner variant="error" message={statusMessage} subtitle={subtitle} />

      {/* Retry Button */}
      <button
        type="button"
        onClick={onRetryClick}
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
  );
};
