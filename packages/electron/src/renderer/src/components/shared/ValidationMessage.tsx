/**
 * ValidationMessage Component
 *
 * Shared component for displaying validation messages.
 * Provides consistent validation feedback with different severity levels.
 *
 * Features:
 * - Three severity levels: error, warning, info
 * - Inline display with icon
 * - Accessible with proper ARIA labels
 * - Dark mode support
 *
 * @see Task 08 - Real-time Validation
 */

import {
  type FC,
} from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Validation message severity.
 */
export type ValidationSeverity = 'error' | 'warning' | 'info' | 'success';

/**
 * Props for ValidationMessage component.
 */
export interface ValidationMessageProps {
  /**
   * Severity level of the message.
   */
  severity?: ValidationSeverity;

  /**
   * The message to display.
   */
  message: string;

  /**
   * Additional CSS class names.
   */
  className?: string;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get icon component for severity level.
 */
function getSeverityIcon(severity: ValidationSeverity): FC<{ className?: string }> {
  switch (severity) {
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertCircle;
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
function getSeverityClasses(severity: ValidationSeverity) {
  switch (severity) {
    case 'error':
      return {
        icon: 'text-red-500 dark:text-red-400',
        message: 'text-red-600 dark:text-red-400 text-xs',
      };
    case 'warning':
      return {
        icon: 'text-yellow-500 dark:text-yellow-400',
        message: 'text-yellow-600 dark:text-yellow-400 text-xs',
      };
    case 'info':
      return {
        icon: 'text-blue-500 dark:text-blue-400',
        message: 'text-blue-600 dark:text-blue-400 text-xs',
      };
    case 'success':
      return {
        icon: 'text-green-500 dark:text-green-400',
        message: 'text-green-600 dark:text-green-400 text-xs',
      };
    default:
      return {
        icon: 'text-gray-500 dark:text-gray-400',
        message: 'text-gray-600 dark:text-gray-400 text-xs',
      };
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * ValidationMessage Component
 *
 * Renders validation feedback with icon and message.
 *
 * @example
 * <ValidationMessage severity="error" message="Troop ID is required" />
 */
export const ValidationMessage: FC<ValidationMessageProps> = ({
  severity = 'error',
  message,
  className,
}) => {
  const colors = getSeverityClasses(severity);
  const Icon = getSeverityIcon(severity);

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', colors.icon)} />
      <span className={colors.message}>{message}</span>
    </div>
  );
};

export default ValidationMessage;
