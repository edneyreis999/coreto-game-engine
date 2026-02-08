/**
 * ProgressBar Component
 *
 * A visual progress indicator for displaying completion percentage.
 * Used in ExecutionPanel to show simulation progress.
 *
 * Features:
 * - Smooth width transitions (300ms ease-out)
 * - Clamped percentage (0-100)
 * - Customizable styling via className
 *
 * @see packages/electron/src/renderer/src/components/ExecutionPanel/ExecutionPanel.tsx
 */

import { type FC } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for ProgressBar component.
 */
export interface ProgressBarProps {
  /**
   * Progress percentage (0-100).
   * Values outside this range are clamped.
   */
  percentage: number;

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProgressBar Component
 *
 * Renders a horizontal progress bar with smooth animations.
 * The fill width is automatically clamped to 0-100% range.
 *
 * @example
 * <ProgressBar percentage={45} />
 * <ProgressBar percentage={120} className="h-4" /> { // Clamped to 100% }
 */
export const ProgressBar: FC<ProgressBarProps> = ({ percentage, className }) => {
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

export default ProgressBar;
