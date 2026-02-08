/**
 * ExecutionPanelHeader Component
 *
 * Header section for the ExecutionPanel.
 * Displays the panel title and description.
 *
 * @see packages/electron/src/renderer/src/components/ExecutionPanel/ExecutionPanel.tsx
 */

import { type FC } from 'react';
import { Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for ExecutionPanelHeader component.
 */
export interface ExecutionPanelHeaderProps {
  /** Additional CSS class names. */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ExecutionPanelHeader Component
 *
 * Renders the header section with icon, title, and description.
 */
export const ExecutionPanelHeader: FC<ExecutionPanelHeaderProps> = ({ className }) => {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-2xl font-semibold tracking-tight">Execution</h2>
      </div>
      <p className="text-sm text-muted-foreground">Run TTK validation simulations</p>
    </div>
  );
};

export default ExecutionPanelHeader;
