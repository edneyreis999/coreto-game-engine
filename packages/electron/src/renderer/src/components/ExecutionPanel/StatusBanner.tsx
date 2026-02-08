/**
 * StatusBanner Component
 *
 * A status banner for displaying simulation results or errors.
 * Used in ExecutionPanel to show completion and error states.
 *
 * Features:
 * - Success (green) and error (red) variants
 * - Icon rendering based on variant
 * - Optional subtitle for additional context
 * - Accessible color contrast
 *
 * @see packages/electron/src/renderer/src/components/ExecutionPanel/ExecutionPanel.tsx
 */

import { type FC } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Status banner variant type.
 */
export type StatusBannerVariant = 'success' | 'error';

/**
 * Props for StatusBanner component.
 */
export interface StatusBannerProps {
  /**
   * Banner variant - determines color and icon.
   */
  variant: StatusBannerVariant;

  /**
   * Primary message to display.
   */
  message: string;

  /**
   * Optional subtitle for additional context.
   * Displayed below the primary message in smaller text.
   */
  subtitle?: string;

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * StatusBanner Component
 *
 * Renders a colored status banner with icon and text.
 * Automatically selects appropriate icon and colors based on variant.
 *
 * @example
 * <StatusBanner variant="success" message="Validation complete" />
 * <StatusBanner
 *   variant="error"
 *   message="Validation failed"
 *   subtitle="Invalid project path"
 * />
 */
export const StatusBanner: FC<StatusBannerProps> = ({
  variant,
  message,
  subtitle,
  className,
}) => {
  // Select icon and colors based on variant
  const isError = variant === 'error';

  const Icon = isError ? XCircle : CheckCircle2;

  const bannerClasses = cn(
    'flex items-start gap-3 p-4 rounded-md border',
    isError
      ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
      : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    className
  );

  const iconClasses = cn(
    'mt-0.5 flex-shrink-0',
    isError
      ? 'h-5 w-5 text-red-600 dark:text-red-500'
      : 'h-5 w-5 text-green-600 dark:text-green-500'
  );

  const messageClasses = cn(
    'text-sm font-medium',
    isError
      ? 'text-red-800 dark:text-red-200'
      : 'text-green-800 dark:text-green-200'
  );

  const subtitleClasses = cn(
    'text-xs',
    isError
      ? 'text-red-700 dark:text-red-300'
      : 'text-muted-foreground'
  );

  return (
    <div className={bannerClasses}>
      <Icon className={iconClasses} />
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <p className={messageClasses}>{message}</p>
        {subtitle && <p className={subtitleClasses}>{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatusBanner;
