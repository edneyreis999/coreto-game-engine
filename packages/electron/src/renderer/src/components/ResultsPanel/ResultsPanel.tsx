/**
 * ResultsPanel Component
 *
 * Panel for displaying TTK validation results as color-coded cards.
 * Enables game designers to quickly understand which trechos passed or failed.
 *
 * Features:
 * * Displays visual cards for each trecho result with color-coded pass/fail indicators
 * * Shows key metrics prominently: TTK turns (avg/p95), TTK actions (avg/p95), success rate, battle count
 * * Supports expandable cards that reveal detailed per-battle breakdowns
 * * Displays warnings grouped by severity with contextual information
 * * Integrates with IPC layer to receive Report data from main process
 * * Handles empty states gracefully when no results are available yet
 * * Supports responsive layout within the dashboard's four-panel vertical arrangement
 *
 * Color Coding Logic:
 * * Green (success): trecho.passed === true AND no critical warnings
 * * Red (fail): trecho.passed === false OR has critical warnings
 * * Yellow (warning): trecho.passed === true AND has warnings (non-critical)
 *
 * @see Task c963d4a0-5798-48b4-81ff-4ae21a22c57a
 */

import {
  type FC,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  BarChart3,
  Loader2,
  XCircle,
  RotateCw,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSimulationResults } from '@/hooks/useSimulationResults';
import { EmptyState } from './EmptyState';
import { TrechoCard } from './TrechoCard';
import type { ReportData } from '@/types/preload';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for ResultsPanel component.
 */
export interface ResultsPanelProps {
  /**
   * Whether the panel should be visible.
   * Panel is hidden until a simulation completes.
   */
  isVisible?: boolean;

  /**
   * Optional pre-loaded report data to display.
   * When provided, the panel will use this data instead of fetching via IPC.
   * Useful for loading historical reports from HistoryPanel.
   */
  currentData?: ReportData | null;

  /**
   * Additional CSS class names for styling.
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
  /**
   * Additional CSS class names.
   */
  className?: string;
}

/**
 * Loading state component.
 */
const LoadingState: FC<LoadingStateProps> = ({ className }) => {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-12', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading results...</p>
    </div>
  );
};

/**
 * Props for ErrorState component.
 */
interface ErrorStateProps {
  /**
   * The error that occurred.
   */
  error: Error;

  /**
   * Callback to retry fetching results.
   */
  onRetry: () => void;

  /**
   * Additional CSS class names.
   */
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
          Failed to load results
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
 * Props for ResultsSummary component.
 */
interface ResultsSummaryProps {
  /**
   * The report data to summarize.
   */
  report: ReportData;

  /**
   * Additional CSS class names.
   */
  className?: string;
}

/**
 * Summary statistics component.
 */
const ResultsSummary: FC<ResultsSummaryProps> = ({ report, className }) => {
  // Calculate summary statistics
  const passedCount = report.trechos.filter((t) => t.passed).length;
  const failedCount = report.trechos.length - passedCount;
  const hasCriticalWarnings = report.trechos.some((t) =>
    t.warnings.some((w) => w.severity === 'critical')
  );
  const hasWarnings = report.trechos.some((t) => t.warnings.length > 0);

  return (
    <div className={cn('flex flex-wrap items-center gap-4 text-sm', className)}>
      <span className="text-muted-foreground">
        Total Trechos: {report.trechos.length}
      </span>
      <span>•</span>
      <span className="text-green-600 dark:text-green-500 font-medium">
        Passed: {passedCount}
      </span>
      <span>•</span>
      <span className={failedCount > 0 ? 'text-red-600 dark:text-red-500 font-medium' : 'text-muted-foreground'}>
        Failed: {failedCount}
      </span>
      {hasCriticalWarnings && (
        <>
          <span>•</span>
          <span className="text-red-600 dark:text-red-500">Critical Warnings</span>
        </>
      )}
      {hasWarnings && !hasCriticalWarnings && (
        <>
          <span>•</span>
          <span className="text-yellow-600 dark:text-yellow-500">Warnings</span>
        </>
      )}
    </div>
  );
};

// ============================================================================
// Component
// ============================================================================

/**
 * ResultsPanel Component
 *
 * Renders a panel displaying simulation results as color-coded trecho cards.
 * Shows empty state when no results, loading state during fetch, and error state on failure.
 *
 * @example
 * <ResultsPanel isVisible={true} />
 */
export const ResultsPanel: FC<ResultsPanelProps> = ({
  isVisible = true,
  currentData = null,
  className,
}) => {
  const { report: ipcReport, error, isLoading, hasResults: hasIpcResults, refresh } = useSimulationResults();

  /**
   * Use currentData if provided, otherwise fall back to IPC report.
   * This allows displaying historical data without additional IPC calls.
   */
  const report = useMemo(() => {
    const result = currentData ?? ipcReport;
    return result;
  }, [currentData, ipcReport]);

  /**
   * Determine if we have results to display.
   * Use currentData if available, otherwise check IPC results.
   */
  const hasResults = useMemo(() => {
    const result = currentData !== null || hasIpcResults;
    return result;
  }, [currentData, hasIpcResults]);

  /**
   * Determine if we should show loading state.
   * Only show loading if we're fetching from IPC and no currentData is provided.
   */
  const shouldShowLoading = useMemo(() => {
    const result = currentData === null && isLoading;
    return result;
  }, [currentData, isLoading]);

  /**
   * Track previous visibility to detect when panel becomes visible.
   * This ensures we only call refresh() when transitioning from hidden to visible,
   * not on initial mount when invokeOnMount already handles the first fetch.
   */
  const wasVisibleRef = useRef(isVisible);

  /**
   * Track whether we've already fetched for this visibility cycle.
   * Prevents duplicate refresh calls when the panel stays visible but state changes.
   */
  const hasFetchedRef = useRef(false);

  /**
   * Auto-refresh results when panel becomes visible and no data is available.
   * This ensures results are displayed as soon as they're available.
   *
   * NOTE: The useIpc hook already calls invoke() on mount (invokeOnMount: true),
   * so we only call refresh() here when transitioning from hidden → visible,
   * not on initial mount when already visible.
   *
   * The refresh() function is still available for manual refresh via the retry button.
   */
  useEffect(() => {
    const wasVisible = wasVisibleRef.current;
    wasVisibleRef.current = isVisible;

    // Only fetch when transitioning from hidden to visible
    // This avoids calling refresh() on initial mount (invokeOnMount handles that)
    // and ensures we fetch when panel becomes visible after simulation
    if (isVisible && !wasVisible && !hasResults && !hasFetchedRef.current && !currentData) {
      hasFetchedRef.current = true;
      refresh();
    }

    // Reset fetch flag when panel hides, so we fetch again when it becomes visible
    if (!isVisible) {
      hasFetchedRef.current = false;
    }
  }, [isVisible, hasResults, currentData, refresh]);

  // Hide panel if not visible
  if (!isVisible) {
    return null;
  }

  // ========================================================================
  // Render Helpers
  // ========================================================================

  /**
   * Whether to show empty state.
   */
  const showEmptyState = !shouldShowLoading && !hasResults && !error;

  /**
   * Whether to show loading state.
   */
  const showLoading = shouldShowLoading;

  /**
   * Whether to show error state.
   */
  const showError = !shouldShowLoading && error !== null;

  /**
   * Whether to show results.
   */
  const showResults = !shouldShowLoading && hasResults && !error;

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div
      data-results-panel="true"
      className={cn(
        'flex flex-col gap-6 p-6 bg-background rounded-lg border border-border',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold tracking-tight">
            Results
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          TTK validation results with color-coded pass/fail indicators
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4">
        {/* Loading State */}
        {showLoading && <LoadingState />}

        {/* Error State */}
        {showError && <ErrorState error={error} onRetry={refresh} />}

        {/* Empty State */}
        {showEmptyState && (
          <EmptyState
            title="No Simulation Results"
            message="Run a simulation in the Execution panel to see validation results here."
          />
        )}

        {/* Results */}
        {showResults && report && (
          <div className="flex flex-col gap-6">
            {/* Summary */}
            <ResultsSummary report={report} />

            {/* Trecho Cards */}
            {report.trechos.length > 0 ? (
              <div className="flex flex-col gap-4">
                {report.trechos.map((trecho) => (
                  <TrechoCard key={trecho.id} trecho={trecho} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Trechos in Report"
                message="The simulation completed but no trecho results were found."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;
