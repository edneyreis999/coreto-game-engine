/**
 * HistoryPanel Component
 *
 * Panel for displaying and managing simulation history.
 * Enables game designers to view, export, and delete past simulation runs.
 *
 * Features:
 * - List of past simulations with timestamp and summary
 * - Color-coded status indicators (success/failed/cancelled)
 * - View detailed reports from history
 * - Export reports to files
 * - Delete history entries
 * - Optional project path filtering
 * - Empty and error states
 *
 * @see Task 11 - Simulation History & Report Export
 */

import {
  type FC,
  useCallback,
  useState,
} from 'react';
import {
  History,
  Loader2,
  XCircle,
  RotateCw,
} from 'lucide-react';
import { useLogger } from '@/hooks/useLogger';

import { cn } from '@/lib/utils';
import { useSimulationHistory } from '@/hooks/useSimulationHistory';
import { HistoryListItem } from './HistoryListItem';
import { EmptyState } from '../ResultsPanel/EmptyState';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for HistoryPanel component.
 */
export interface HistoryPanelProps {
  /**
   * Optional filter by project path.
   * When provided, only shows history for that project.
   */
  projectPath?: string;

  /**
   * Maximum number of entries to display.
   * @default 50
   */
  limit?: number;

  /**
   * Callback when a history entry is loaded.
   * Passes the report data for display in ResultsPanel.
   * @param simulationId - UUID of the simulation
   * @param report - Simulation report data
   */
  onLoadReport?: (simulationId: string, report: import('@/types/preload').SimulationReport) => void;

  /**
   * Additional CSS class names.
   */
  className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Props for LoadingState component.
 */
interface LoadingStateProps {
  className?: string;
}

/**
 * Loading state component.
 */
const LoadingState: FC<LoadingStateProps> = ({ className }) => {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-12', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading history...</p>
    </div>
  );
};

/**
 * Props for ErrorState component.
 */
interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
  className?: string;
}

/**
 * Error state component with retry button.
 */
const ErrorState: FC<ErrorStateProps> = ({ error, onRetry, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 p-6',
        'bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800',
        'rounded-lg',
        className
      )}
    >
      <XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
      <div className="text-center">
        <p className="text-sm font-medium text-red-900 dark:text-red-200">
          Failed to load history
        </p>
        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
          {error.message}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          'flex items-center gap-2 px-4 py-2',
          'bg-white dark:bg-black',
          'border border-red-200 dark:border-red-800',
          'rounded-md',
          'hover:bg-red-100 dark:hover:bg-red-900',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'text-sm font-medium'
        )}
      >
        <RotateCw className="h-4 w-4" />
        <span>Retry</span>
      </button>
    </div>
  );
};

/**
 * Props for HistoryList component.
 */
interface HistoryListProps {
  entries: import('@/types/preload').HistoryEntry[];
  onLoad: (entry: import('@/types/preload').HistoryEntry) => void;
  onExport: (entry: import('@/types/preload').HistoryEntry) => void;
  onDelete: (entry: import('@/types/preload').HistoryEntry) => void;
  className?: string;
}

/**
 * List of history items.
 */
const HistoryList: FC<HistoryListProps> = ({
  entries,
  onLoad,
  onExport,
  onDelete,
  className,
}) => {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {entries.map((entry) => (
        <HistoryListItem
          key={entry.id}
          entry={entry}
          onLoad={onLoad}
          onExport={onExport}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

// ============================================================================
// Component
// ============================================================================

/**
 * HistoryPanel Component
 *
 * Renders a panel displaying simulation history.
 *
 * @example
 * <HistoryPanel
 *   limit={20}
 *   onLoadReport={(id, report) => console.log('Loaded:', id, report)}
 * />
 */
export const HistoryPanel: FC<HistoryPanelProps> = ({
  projectPath,
  limit = 50,
  onLoadReport,
  className,
}) => {
  const logger = useLogger();
  const [exportingId, setExportingId] = useState<string | null>(null);

  const {
    history,
    isLoading,
    error,
    hasHistory,
    refresh,
    loadReport,
    deleteEntry,
    exportReport,
  } = useSimulationHistory({
    projectPath,
    limit,
    autoLoad: true,
  });

  /**
   * Handle load button click.
   */
  const handleLoad = useCallback(async (entry: import('@/types/preload').HistoryEntry) => {
    if (!entry.hasReport) {
      return;
    }

    const report = await loadReport(entry.id);
    if (report && onLoadReport) {
      onLoadReport(entry.id, report);
    }
  }, [loadReport, onLoadReport]);

  /**
   * Handle export button click.
   */
  const handleExport = useCallback(async (entry: import('@/types/preload').HistoryEntry) => {
    setExportingId(entry.id);

    try {
      // First load the report if not already available
      const report = await loadReport(entry.id);
      if (!report) {
        throw new Error('Failed to load report for export');
      }

      // Then export it
      const filePath = await exportReport(entry.id, report.reportData, entry.projectPath);
      logger.info(`Exported to: ${filePath}`);
    } catch (err) {
      logger.error(`Export failed: ${String(err)}`);
    } finally {
      setExportingId(null);
    }
  }, [loadReport, exportReport, logger]);

  /**
   * Handle delete button click.
   */
  const handleDelete = useCallback(async (entry: import('@/types/preload').HistoryEntry) => {
    // Confirm before deleting
    const confirmed = window.confirm(
      `Are you sure you want to delete this simulation entry?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    await deleteEntry(entry.id);
  }, [deleteEntry]);

  // ========================================================================
  // Render Helpers
  // ========================================================================

  /**
   * Whether to show loading state.
   */
  const showLoading = isLoading;

  /**
   * Whether to show error state.
   */
  const showError = !isLoading && error !== null;

  /**
   * Whether to show empty state.
   */
  const showEmpty = !isLoading && !error && !hasHistory;

  /**
   * Whether to show history list.
   */
  const showList = !isLoading && !error && hasHistory;

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div
      className={cn(
        'flex flex-col gap-6 p-6 bg-background rounded-lg border border-border',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold tracking-tight">
              Simulation History
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            View, export, and delete past simulation results
          </p>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={refresh}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5',
            'bg-secondary text-secondary-foreground rounded-md',
            'hover:bg-secondary/80 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'text-sm font-medium',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <RotateCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4">
        {/* Loading State */}
        {showLoading && <LoadingState />}

        {/* Error State */}
        {showError && <ErrorState error={error} onRetry={refresh} />}

        {/* Empty State */}
        {showEmpty && (
          <EmptyState
            title="No Simulation History"
            message="Run simulations to see them here. History is automatically saved after each simulation."
          />
        )}

        {/* History List */}
        {showList && (
          <HistoryList
            entries={history}
            onLoad={handleLoad}
            onExport={handleExport}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
