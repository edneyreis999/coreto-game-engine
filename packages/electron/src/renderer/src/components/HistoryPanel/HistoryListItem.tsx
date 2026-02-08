/**
 * HistoryListItem Component
 *
 * Displays a single history entry in the simulation history list.
 * Shows summary information with action buttons for view, export, and delete.
 *
 * Features:
 * - Color-coded status indicators (success/failed/cancelled)
 * - Relative date formatting (Today, Yesterday, or date)
 * - Summary statistics (battles, passed/failed)
 * - Action buttons for load, export, delete
 * - Dark mode support
 *
 * @see Task 11 - Simulation History & Report Export
 */

import {
  type FC,
  type ComponentType,
  useCallback,
} from 'react';
import {
  CheckCircle2,
  XCircle,
  X,
  Download,
  Eye,
  Trash2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatDateRelative } from '@/lib/utils';
import type { HistoryEntry } from '@/types/preload';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for HistoryListItem component.
 */
export interface HistoryListItemProps {
  /**
   * History entry data.
   */
  entry: HistoryEntry;

  /**
   * Callback when load button is clicked.
   * @param entry - The history entry to load
   */
  onLoad: (entry: HistoryEntry) => void;

  /**
   * Callback when export button is clicked.
   * @param entry - The history entry to export
   */
  onExport: (entry: HistoryEntry) => void;

  /**
   * Callback when delete button is clicked.
   * @param entry - The history entry to delete
   */
  onDelete: (entry: HistoryEntry) => void;

  /**
   * Additional CSS class names.
   */
  className?: string;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get status icon and color classes.
 */
function getStatusInfo(status: HistoryEntry['status']): {
  Icon: ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  border: string;
} {
  switch (status) {
    case 'SUCCESS':
      return {
        Icon: CheckCircle2,
        iconBg: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-500',
        border: 'border-green-200 dark:border-green-800',
      };
    case 'FAILED':
      return {
        Icon: XCircle,
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-500',
        border: 'border-red-200 dark:border-red-800',
      };
    case 'CANCELLED':
      return {
        Icon: X,
        iconBg: 'bg-gray-100 dark:bg-gray-800',
        iconColor: 'text-gray-600 dark:text-gray-500',
        border: 'border-gray-200 dark:border-gray-800',
      };
    default:
      return {
        Icon: CheckCircle2,
        iconBg: 'bg-gray-100 dark:bg-gray-800',
        iconColor: 'text-gray-600 dark:text-gray-500',
        border: 'border-gray-200 dark:border-gray-800',
      };
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * HistoryListItem Component
 *
 * Renders a history entry with summary and actions.
 *
 * @example
 * <HistoryListItem
 *   entry={historyEntry}
 *   onLoad={(entry) => loadReport(entry.id)}
 *   onExport={(entry) => exportReport(entry.id)}
 *   onDelete={(entry) => deleteEntry(entry.id)}
 * />
 */
export const HistoryListItem: FC<HistoryListItemProps> = ({
  entry,
  onLoad,
  onExport,
  onDelete,
  className,
}) => {
  const { Icon, iconBg, iconColor, border } = getStatusInfo(entry.status);

  /**
   * Handle load button click.
   */
  const handleLoad = useCallback(() => {
    onLoad(entry);
  }, [entry, onLoad]);

  /**
   * Handle export button click.
   */
  const handleExport = useCallback(() => {
    onExport(entry);
  }, [entry, onExport]);

  /**
   * Handle delete button click.
   */
  const handleDelete = useCallback(() => {
    onDelete(entry);
  }, [entry, onDelete]);

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg border bg-card',
        'hover:bg-accent/50 transition-colors',
        border,
        className
      )}
    >
      {/* Status Icon */}
      <div className={cn('flex-shrink-0 p-2 rounded-full', iconBg)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>

      {/* Entry Info */}
      <div className="flex flex-col min-w-0 flex-1 gap-1">
        {/* Status and Date */}
        <div className="flex items-center gap-2 text-sm">
          <span className={cn('font-medium', iconColor)}>
            {entry.status === 'SUCCESS' && 'Success'}
            {entry.status === 'FAILED' && 'Failed'}
            {entry.status === 'CANCELLED' && 'Cancelled'}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {formatDateRelative(new Date(entry.timestamp).toISOString())}
          </span>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{entry.summary.totalBattles} battles</span>
          <span>•</span>
          <span className="text-green-600 dark:text-green-500">
            {entry.summary.passedCount} passed
          </span>
          <span>•</span>
          <span className={entry.summary.failedCount > 0 ? 'text-red-600 dark:text-red-500' : ''}>
            {entry.summary.failedCount} failed
          </span>
        </div>

        {/* Project Path (truncated) */}
        <div className="text-xs text-muted-foreground truncate" title={entry.projectPath}>
          {entry.projectPath}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Load Button */}
        {entry.hasReport && (
          <button
            type="button"
            onClick={handleLoad}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
              'bg-primary text-primary-foreground text-xs font-medium',
              'hover:bg-primary/90 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
            )}
            title="Load this report"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View</span>
          </button>
        )}

        {/* Export Button */}
        <button
          type="button"
          onClick={handleExport}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
            'bg-secondary text-secondary-foreground text-xs font-medium',
            'hover:bg-secondary/80 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
          )}
          title="Export to file"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export</span>
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={handleDelete}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
            'bg-destructive/10 text-destructive text-xs font-medium',
            'hover:bg-destructive/20 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
          )}
          title="Delete this entry"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default HistoryListItem;
