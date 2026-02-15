/**
 * PortalButton Component
 *
 * Reusable portal button component for Home page navigation.
 * Features Age of Mythology theme with amber/orange gradients and hover animations.
 *
 * Features:
 * - useNavigate hook for routing
 * - Hover animation: scale-105 + glow effect (Tailwind)
 * - Click handler: navigate(route)
 * - Age of Mythology theme (amber-900/orange-900 gradients)
 * - useLogger hook for logging navigation events
 *
 * Note: Project state is managed globally via React Context (useProject).
 * No need to pass state via router navigation anymore.
 *
 * @see Task 05
 * @see docs/tecnical-debit/001-useproject-global-state.md
 */

import { type FC, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { useLogger } from '@/hooks/useLogger';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for PortalButton component.
 */
export interface PortalButtonProps {
  /**
   * Portal name (title).
   */
  title: string;

  /**
   * Portal description.
   */
  description: string;

  /**
   * Icon component (sword or document icon from lucide-react).
   */
  icon: React.ReactNode;

  /**
   * Navigation target route.
   */
  route: string;

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * PortalButton Component
 *
 * Renders a themed portal button for Home page navigation.
 * Includes:
 * - Age of Mythology theme with amber/orange gradients
 * - Hover animations (scale-105, shadow-lg, glow effect)
 * - Icon display
 * - Title and description
 * - Navigation via react-router-dom
 * - Structured logging via useLogger
 *
 * @example
 * <PortalButton
 *   title="TTK Validation"
 *   description="Battle time validation"
 *   icon={<Sword className="h-8 w-8" />}
 *   route="/validation"
 * />
 */
export const PortalButton: FC<PortalButtonProps> = ({
  title,
  description,
  icon,
  route,
  className,
}) => {
  const logger = useLogger();
  const navigate = useNavigate();

  /**
   * Handles button click events.
   * Logs the click and navigates to the specified route.
   *
   * Note: Project state is managed globally via React Context.
   * No need to pass state via router navigation.
   */
  const handleClick = useCallback(() => {
    logger.info('Portal button clicked', { title, route });
    logger.info('Navigating to route', { route });
    navigate(route);
  }, [logger, navigate, title, route]);

  return (
    <button
      onClick={handleClick}
      className={cn(
        // Base layout
        'group relative flex flex-col items-center justify-center',
        'p-8 rounded-lg',
        'w-full h-full min-h-[200px]',

        // Age of Mythology theme gradient
        'bg-gradient-to-br from-amber-900 via-orange-900 to-amber-800',
        'dark:from-amber-950 dark:via-orange-950 dark:to-amber-900',

        // Border styling
        'border-2 border-amber-700',
        'dark:border-amber-800',

        // Hover animations
        'hover:scale-105',
        'hover:shadow-lg',
        'hover:shadow-amber-900/50',
        'hover:from-amber-800 hover:via-orange-800 hover:to-amber-700',
        'dark:hover:shadow-amber-950/50',
        'dark:hover:from-amber-900 dark:hover:via-orange-900 dark:hover:to-amber-800',

        // Transitions
        'transition-all duration-300 ease-in-out',

        // Text styling
        'text-amber-50',

        // Focus styles for accessibility
        'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
        'focus:ring-offset-gray-900',

        // Custom class support
        className
      )}
    >
      {/* Icon container with glow effect */}
      <div className="mb-4 p-3 rounded-full bg-amber-950/50 group-hover:bg-amber-950/70 transition-colors duration-300">
        <div className="text-amber-300 group-hover:text-amber-200 transition-colors duration-300">
          {icon}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold mb-2 text-amber-100 group-hover:text-amber-50 transition-colors duration-300">
        {title}
      </h3>

      {/* Description */}
      <p className="text-amber-200/80 group-hover:text-amber-200 transition-colors duration-300 text-center">
        {description}
      </p>

      {/* Subtle inner glow effect on hover */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-amber-400/0 via-amber-400/0 to-amber-400/0 group-hover:from-amber-400/5 group-hover:via-amber-400/10 group-hover:to-amber-400/5 transition-all duration-300 pointer-events-none" />
    </button>
  );
};
