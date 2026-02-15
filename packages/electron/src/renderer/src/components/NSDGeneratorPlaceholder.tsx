/**
 * NSDGeneratorPlaceholder Component
 *
 * Temporary placeholder component for NSD Generator feature.
 * Displays a "Coming Soon" message until Sprint 2 implementation.
 *
 * Features:
 * - Centered layout with title and message
 * - Consistent styling with app theme (shadcn/ui)
 * - useLogger hook for component lifecycle logging
 *
 * @see Task 07 - Sprint 2 Placeholder
 */

import { type FC, useEffect } from 'react';
import { FileCode } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useLogger } from '@/hooks/useLogger';
import { BackButton } from './BackButton';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for NSDGeneratorPlaceholder component.
 */
export interface NSDGeneratorPlaceholderProps {
  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * NSDGeneratorPlaceholder Component
 *
 * Renders a centered placeholder for the NSD Generator feature.
 * Includes an icon, title, and "Coming Soon" message.
 * Logs component lifecycle events via useLogger.
 *
 * @example
 * <NSDGeneratorPlaceholder />
 */
export const NSDGeneratorPlaceholder: FC<NSDGeneratorPlaceholderProps> = ({
  className,
}) => {
  const logger = useLogger();

  // Log component mount
  useEffect(() => {
    logger.info('NSD Generator placeholder mounted');

    return () => {
      logger.info('NSD Generator placeholder unmounted');
    };
  }, [logger]);

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-4',
        'py-16 px-6',
        'text-center',
        className
      )}
    >
      {/* Back Button */}
      <div className="absolute left-6 top-6">
        <BackButton />
      </div>

      {/* Icon */}
      <div className="text-muted-foreground/50">
        <FileCode className="h-12 w-12" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-foreground">
        NSD Generator
      </h2>

      {/* Message */}
      <p className="text-sm text-muted-foreground max-w-md">
        Coming soon in Sprint 2...
      </p>
    </div>
  );
};

export default NSDGeneratorPlaceholder;
