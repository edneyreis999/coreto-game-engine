/**
 * EmptyState Component
 *
 * Placeholder component displayed when no simulation results are available.
 * Shows a helpful message and icon to guide users.
 *
 * Features:
 * * Centered layout with icon and message
 * * Helpful text indicating what to do next
 * * Consistent styling with other empty states in the app
 *
 * @see Task c963d4a0-5798-48b4-81ff-4ae21a22c57a
 */

import {
  type FC,
  type ReactNode,
} from 'react';
import {
  FileBarChart,
} from 'lucide-react';

import { cn } from '@/lib/utils';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for EmptyState component.
 */
export interface EmptyStateProps {
  /**
   * Additional CSS class names for styling.
   */
  className?: string;

  /**
   * Optional title to display.
   * @default 'No Results'
   */
  title?: string;

  /**
   * Optional message to display.
   * @default 'Run a simulation to see validation results here.'
   */
  message?: string;

  /**
   * Optional icon to display.
   * @default FileBarChart
   */
  icon?: ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * EmptyState Component
 *
 * Renders a centered placeholder when no simulation results are available.
 * Includes an icon, title, and helpful message.
 *
 * @example
 * <EmptyState />
 *
 * @example
 * <EmptyState
 *   title="No simulations yet"
 *   message="Configure your project and run a simulation to see results."
 * />
 */
export const EmptyState: FC<EmptyStateProps> = ({
  className,
  title = 'No Results',
  message = 'Run a simulation to see validation results here.',
  icon = <FileBarChart className="h-12 w-12" />,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        'py-16 px-6',
        'text-center',
        className
      )}
    >
      {/* Icon */}
      <div className="text-muted-foreground/50">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground">
        {title}
      </h3>

      {/* Message */}
      <p className="text-sm text-muted-foreground max-w-md">
        {message}
      </p>
    </div>
  );
};

export default EmptyState;
