/**
 * Home Component
 *
 * Main portal navigation page for Coreto Dev Portal.
 * Features Age of Mythology theme with amber/orange gradients and grid layout.
 *
 * Features:
 * - Header with "Coreto Dev Portal" title
 * - Grid layout with 2 portals (TTK Validation + NSD Generator)
 * - PortalButton components for navigation
 * - Age of Mythology theme (amber-900/orange-900 gradients)
 * - useLogger hook for page lifecycle logging
 *
 * @see Task 06
 */

import { type FC, useEffect } from 'react';
import { Sword, FileText } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useLogger } from '@/hooks/useLogger';
import { PortalButton } from './PortalButton';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for Home component.
 */
export interface HomeProps {
  /**
   * Current project path (from router state/context).
   */
  projectPath?: string;

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Home Component
 *
 * Renders the main portal navigation page with:
 * - Header displaying "Coreto Dev Portal" title
 * - Grid layout with 2 portal buttons (TTK Validation + NSD Generator)
 * - Age of Mythology theme with amber/orange gradients
 * - Structured logging for page lifecycle events
 *
 * @example
 * <Home projectPath="/path/to/project" />
 */
export const Home: FC<HomeProps> = ({ projectPath, className }) => {
  const logger = useLogger();

  // Log mount event
  useEffect(() => {
    logger.info('Home page mounted', { projectPath });

    return () => {
      logger.info('Home page unmounted');
    };
  }, [logger, projectPath]);

  return (
    <div
      className={cn(
        // Base layout
        'flex flex-col min-h-screen',
        'w-full',

        // Age of Mythology theme gradient background
        'bg-gradient-to-br from-amber-900 via-orange-900 to-amber-800',
        'dark:from-amber-950 dark:via-orange-950 dark:to-amber-900',

        // Custom class support
        className
      )}
    >
      {/* Header */}
      <header className="w-full p-8 border-b border-amber-700/30">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-amber-100 mb-2">
            Coreto Dev Portal
          </h1>
          {projectPath && (
            <p className="text-amber-200/70 text-sm">
              Project: {projectPath}
            </p>
          )}
        </div>
      </header>

      {/* Main Content - Portal Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          {/* TTK Validation Portal */}
          <div className="h-full min-h-[200px]">
            <PortalButton
              title="TTK Validation"
              description="Battle time validation system for RPG Maker MZ"
              icon={<Sword className="h-8 w-8" />}
              route="/validation"
            />
          </div>

          {/* NSD Generator Portal */}
          <div className="h-full min-h-[200px]">
            <PortalButton
              title="NSD Generator"
              description="Generate LLM-powered scene implementations"
              icon={<FileText className="h-8 w-8" />}
              route="/nsd-generator"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-4 border-t border-amber-700/30">
        <div className="max-w-7xl mx-auto text-center text-amber-200/50 text-sm">
          Coreto Dev Portal v1.0.0
        </div>
      </footer>
    </div>
  );
};
