/**
 * BackButton Component
 *
 * Reusable back navigation button for returning to Home page.
 * Project context is automatically preserved via React Context (useProject).
 *
 * Features:
 * - ArrowLeft icon from lucide-react
 * - Ghost variant for subtle appearance
 * - useNavigate for routing
 * - useLogger for navigation logging
 * - No props needed - project state from global context
 *
 * @example
 * <BackButton />
 *
 * Note: Project state is managed globally via React Context.
 * No need to pass projectPath as prop anymore.
 *
 * @see docs/tecnical-debit/001-useproject-global-state.md
 */

import { type FC, useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { useLogger } from '@/hooks/useLogger'
import { useProject } from '@/hooks/useProject'

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for BackButton component.
 */
export interface BackButtonProps {
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
 * Renders a back button that navigates to the Home page.
 * Project context is automatically preserved via global React Context.
 *
 * Uses explicit navigation to '/home' instead of browser back button
 * for predictable behavior regardless of navigation history.
 *
 * @example
 * // In TTKValidationFlow or NSDGeneratorPlaceholder
 * <BackButton />
 *
 * Note: Project state is managed globally via React Context.
 * No need to pass projectPath as prop.
 */
export const BackButton: FC<BackButtonProps> = ({ className }) => {
  const navigate = useNavigate()
  const logger = useLogger()
  const { projectInfo } = useProject()

  const handleBack = useCallback((): void => {
    const projectPath = projectInfo?.path
    logger.info('Navigating back to home', { projectPath })
    navigate('/home')
  }, [navigate, logger, projectInfo])

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
