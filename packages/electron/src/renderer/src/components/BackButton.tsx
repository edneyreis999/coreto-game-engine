/**
 * BackButton Component
 *
 * Reusable back navigation button for returning to Home page.
 * Preserves project selection context via router state.
 *
 * Features:
 * - ArrowLeft icon from lucide-react
 * - Ghost variant for subtle appearance
 * - useNavigate for routing
 * - useLogger for navigation logging
 * - Preserves projectPath state when navigating back
 *
 * @example
 * <BackButton projectPath="/path/to/project" />
 */

import { type FC, useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { useLogger } from '@/hooks'

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for BackButton component.
 */
export interface BackButtonProps {
  /**
   * Optional project path to preserve in navigation state when returning home.
   * This maintains the selected project context when navigating back to Home.
   */
  projectPath?: string

  /**
   * Additional CSS class names for styling.
   */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

/**
 * BackButton Component
 *
 * Renders a back button that navigates to the Home page while preserving
 * the project selection context via router state.
 *
 * Uses explicit navigation to '/home' instead of browser back button
 * for predictable behavior regardless of navigation history.
 *
 * @example
 * // In TTKValidationFlow or NSDGeneratorPlaceholder
 * <BackButton projectPath={selectedProjectPath} />
 */
export const BackButton: FC<BackButtonProps> = ({ projectPath, className }) => {
  const navigate = useNavigate()
  const logger = useLogger()

  const handleBack = useCallback((): void => {
    logger.info('Navigating back to home', { projectPath })
    navigate('/home', { state: { projectPath } })
  }, [navigate, logger, projectPath])

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        'flex items-center gap-2',
        'px-3 py-1.5 rounded-md',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-colors',
        'font-medium text-sm',
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar
    </button>
  )
}

export default BackButton
