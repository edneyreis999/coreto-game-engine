/**
 * ExecutionProgress Component
 *
 * Shared component for displaying execution progress across the application.
 * Provides consistent progress indication with different states and visual feedback.
 *
 * Features:
 * - Four states: idle, running, completed, error
 * - Progress bar with percentage display
 * - Current item label with optional custom text
 * - Cancellable with optional cancel button
 * - Accessible with proper ARIA labels
 * - Dark mode support
 *
 * @see Task 07 - Shared Component Library
 */

import {
  type FC,
  useCallback,
} from 'react';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Execution status states.
 */
export type ExecutionStatus = 'idle' | 'running' | 'completed' | 'error' | 'cancelled';

/**
 * Props for ExecutionProgress component.
 */
export interface ExecutionProgressProps {
  /**
   * Current progress value (0 to total).
   */
  current: number;

  /**
   * Total value for progress calculation.
   * @default 100
   */
  total?: number;

  /**
   * Execution status.
   * @default 'idle'
   */
  status?: ExecutionStatus;

  /**
   * Label for the current item being processed.
   * Displayed below the progress bar.
   */
  currentLabel?: string;

  /**
   * Optional message to display above the progress bar.
   * If not provided, a default message based on status is shown.
   */
  message?: string;

  /**
   * Whether the operation can be cancelled.
   * Only applicable when status is 'running'.
   * @default false
   */
  cancellable?: boolean;

  /**
   * Callback when cancel button is clicked.
   */
  onCancel?: () => void;

  /**
   * Additional CSS class names.
   */
  className?: string;
}

// ============================================================================
// Types
// ============================================================================

/**
 * Props for ProgressBar subcomponent.
 */
interface ProgressBarProps {
  /**
   * Progress percentage (0-100).
   */
  percentage: number;

  /**
   * Whether the progress is animated (running state).
   */
  animated?: boolean;

  /**
   * Additional CSS class names.
   */
  className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * ProgressBar Component
 *
 * Visual progress bar with smooth transitions.
 */
const ProgressBar: FC<ProgressBarProps> = ({
  percentage,
  animated = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full bg-primary transition-all duration-300 ease-out',
          animated && 'animate-pulse'
        )}
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  );
};

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get default message for status.
 */
function getDefaultMessage(status: ExecutionStatus): string {
  switch (status) {
    case 'running':
      return 'Processing...';
    case 'completed':
      return 'Complete';
    case 'error':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    case 'idle':
    default:
      return 'Ready';
  }
}

/**
 * Get status icon component.
 */
function getStatusIcon(
  status: ExecutionStatus
): FC<{ className?: string }> | null {
  switch (status) {
    case 'running':
      return Loader2;
    case 'completed':
      return CheckCircle2;
    case 'error':
      return XCircle;
    case 'cancelled':
    case 'idle':
    default:
      return null;
  }
}

/**
 * Get status color classes.
 */
function getStatusClasses(status: ExecutionStatus) {
  switch (status) {
    case 'running':
      return {
        icon: 'text-muted-foreground',
        message: 'text-muted-foreground',
      };
    case 'completed':
      return {
        icon: 'text-green-600 dark:text-green-500',
        message: 'text-green-700 dark:text-green-300',
      };
    case 'error':
      return {
        icon: 'text-red-600 dark:text-red-500',
        message: 'text-red-700 dark:text-red-300',
      };
    case 'cancelled':
      return {
        icon: 'text-muted-foreground',
        message: 'text-muted-foreground',
      };
    case 'idle':
    default:
      return {
        icon: 'text-muted-foreground',
        message: 'text-muted-foreground',
      };
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * ExecutionProgress Component
 *
 * Renders execution progress with consistent styling.
 *
 * @example
 * <ExecutionProgress
 *   current={5}
 *   total={10}
 *   status="running"
 *   currentLabel="Processing: Troop 5"
 *   cancellable
 *   onCancel={() => cancel()}
 * />
 */
export const ExecutionProgress: FC<ExecutionProgressProps> = ({
  current,
  total = 100,
  status = 'idle',
  currentLabel,
  message,
  cancellable = false,
  onCancel,
  className,
}) => {
  const colors = getStatusClasses(status);
  const StatusIcon = getStatusIcon(status);
  const displayMessage = message ?? getDefaultMessage(status);
  const percentage = total > 0 ? (current / total) * 100 : 0;

  /**
   * Handle cancel button click.
   */
  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  // Don't render anything if idle and no current item
  if (status === 'idle' && !currentLabel) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Status Message with Icon */}
      {(displayMessage || StatusIcon) && (
        <div className="flex items-center gap-2 text-sm">
          {StatusIcon && status === 'running' && (
            <Loader2 className={cn('h-4 w-4 animate-spin', colors.icon)} />
          )}
          {StatusIcon && status === 'completed' && (
            <CheckCircle2 className={cn('h-4 w-4', colors.icon)} />
          )}
          {StatusIcon && status === 'error' && (
            <XCircle className={cn('h-4 w-4', colors.icon)} />
          )}
          {displayMessage && (
            <span className={colors.message}>
              {displayMessage}
            </span>
          )}
        </div>
      )}

      {/* Progress Bar - only show for running or completed states */}
      {(status === 'running' || status === 'completed') && (
        <ProgressBar
          percentage={percentage}
          animated={status === 'running'}
        />
      )}

      {/* Current Item Label */}
      {currentLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {currentLabel}
          </span>
          {status === 'running' && (
            <span className="font-medium tabular-nums text-muted-foreground">
              {current} / {total}
            </span>
          )}
        </div>
      )}

      {/* Cancel Button - only show when running and cancellable */}
      {status === 'running' && cancellable && (
        <button
          type="button"
          onClick={handleCancel}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-2',
            'bg-secondary text-secondary-foreground rounded-md',
            'hover:bg-secondary/80 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'font-medium text-sm self-start'
          )}
        >
          <X className="h-4 w-4" />
          <span>Cancel</span>
        </button>
      )}
    </div>
  );
};

export default ExecutionProgress;
