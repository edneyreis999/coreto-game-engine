/**
 * ErrorDisplay Component
 *
 * Shared component for displaying errors and warnings across the application.
 * Provides consistent error display patterns with different variants and severity levels.
 *
 * Features:
 * - Three display variants: inline, alert, banner
 * - Severity levels: error (red), warning (yellow), info (blue), success (green)
 * - Optional dismissible behavior
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
  AlertCircle,
  XCircle,
  CheckCircle2,
  Info,
  X,
  AlertTriangle,
} from 'lucide-react';

import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Error severity levels.
 */
export type ErrorSeverity = 'error' | 'warning' | 'info' | 'success';

/**
 * Display variants for error messages.
 */
export type ErrorDisplayVariant = 'inline' | 'alert' | 'banner';

/**
 * Props for ErrorDisplay component.
 */
export interface ErrorDisplayProps {
  /**
   * Severity level of the message.
   * @default 'error'
   */
  severity?: ErrorSeverity;

  /**
   * Display variant.
   * - inline: Compact inline error message
   * - alert: Full-width alert with icon and background
   * - banner: Full-width banner at the top of content
   * @default 'alert'
   */
  variant?: ErrorDisplayVariant;

  /**
   * Optional title for the error.
   * If not provided, severity name is used.
   */
  title?: string;

  /**
   * The error message to display.
   */
  message: string;

  /**
   * Optional detailed error information.
   * Displayed in a smaller, muted text below the main message.
   */
  details?: string;

  /**
   * Whether the error can be dismissed by the user.
   * @default false
   */
  dismissible?: boolean;

  /**
   * Callback when dismiss button is clicked.
   */
  onDismiss?: () => void;

  /**
   * Additional CSS class names.
   */
  className?: string;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get default title for severity level.
 */
function getDefaultTitle(severity: ErrorSeverity): string {
  switch (severity) {
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Info';
    case 'success':
      return 'Success';
    default:
      return 'Notice';
  }
}

/**
 * Get icon component for severity level.
 */
function getSeverityIcon(severity: ErrorSeverity): FC<{ className?: string }> {
  switch (severity) {
    case 'error':
      return XCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    case 'success':
      return CheckCircle2;
    default:
      return AlertCircle;
  }
}

/**
 * Get color classes for severity level.
 */
function getSeverityClasses(severity: ErrorSeverity) {
  switch (severity) {
    case 'error':
      return {
        bg: 'bg-red-50 dark:bg-red-950',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-500',
        title: 'text-red-800 dark:text-red-200',
        message: 'text-red-700 dark:text-red-300',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-600 dark:text-yellow-500',
        title: 'text-yellow-800 dark:text-yellow-200',
        message: 'text-yellow-700 dark:text-yellow-300',
      };
    case 'info':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-500',
        title: 'text-blue-800 dark:text-blue-200',
        message: 'text-blue-700 dark:text-blue-300',
      };
    case 'success':
      return {
        bg: 'bg-green-50 dark:bg-green-950',
        border: 'border-green-200 dark:border-green-800',
        icon: 'text-green-600 dark:text-green-500',
        title: 'text-green-800 dark:text-green-200',
        message: 'text-green-700 dark:text-green-300',
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-950',
        border: 'border-gray-200 dark:border-gray-800',
        icon: 'text-gray-600 dark:text-gray-500',
        title: 'text-gray-800 dark:text-gray-200',
        message: 'text-gray-700 dark:text-gray-300',
      };
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * ErrorDisplay Component
 *
 * Renders error/warning/info messages with consistent styling.
 *
 * @example
 * <ErrorDisplay
 *   severity="error"
 *   variant="alert"
 *   title="Simulation Failed"
 *   message="Could not load RPG Maker project"
 *   details="Project path does not exist"
 *   dismissible
 *   onDismiss={() => setError(null)}
 * />
 */
export const ErrorDisplay: FC<ErrorDisplayProps> = ({
  severity = 'error',
  variant = 'alert',
  title,
  message,
  details,
  dismissible = false,
  onDismiss,
  className,
}) => {
  const colors = getSeverityClasses(severity);
  const Icon = getSeverityIcon(severity);
  const displayTitle = title ?? getDefaultTitle(severity);

  /**
   * Handle dismiss button click.
   */
  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  // Inline variant - compact, no background
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-start gap-2', className)}>
        <Icon className={cn('h-4 w-4 flex-shrink-0 mt-0.5', colors.icon)} />
        <div className="flex flex-col min-w-0 flex-1">
          <span className={cn('text-sm font-medium', colors.title)}>
            {displayTitle}
          </span>
          {message && (
            <span className={cn('text-xs', colors.message)}>
              {message}
            </span>
          )}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              'flex-shrink-0 p-0.5 rounded-sm',
              'hover:bg-black/5 dark:hover:bg-white/5',
              'focus:outline-none focus:ring-2 focus:ring-ring'
            )}
            aria-label="Dismiss"
          >
            <X className={cn('h-3 w-3', colors.icon)} />
          </button>
        )}
      </div>
    );
  }

  // Alert variant - full width with background
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-md border',
        colors.bg,
        colors.border,
        dismissible && 'pr-12', // Extra padding for dismiss button
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', colors.icon)} />
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <p className={cn('text-sm font-medium', colors.title)}>
          {displayTitle}
        </p>
        {message && (
          <p className={cn('text-sm', colors.message)}>
            {message}
          </p>
        )}
        {details && (
          <p className="text-xs text-muted-foreground mt-1">
            {details}
          </p>
        )}
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            'absolute top-4 right-4 flex-shrink-0 p-1 rounded-sm',
            'hover:bg-black/5 dark:hover:bg-white/5',
            'focus:outline-none focus:ring-2 focus:ring-ring'
          )}
          aria-label="Dismiss"
        >
          <X className={cn('h-4 w-4', colors.icon)} />
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
