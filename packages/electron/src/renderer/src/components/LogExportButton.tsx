/**
 * LogExportButton Component
 *
 * Button component for exporting application logs to a file.
 * Triggers the logs:export IPC call and handles download with user feedback.
 *
 * Features:
 * - Export button with download icon
 * - Loading state during export operation
 * - Success display with file location
 * - Error display with error message
 * - Consistent styling with shadcn/ui patterns
 * - Flushes renderer logs before export (best-effort with timeout)
 *
 * @see Task 10 - Create LogExportButton Component
 * @see planos/017-botao-export-logs/debug/consensus-summary.md - On-demand flush pattern
 */

import {
  type FC,
  useCallback,
  useState,
} from 'react';
import {
  Download,
  Loader2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ErrorDisplay } from './shared/ErrorDisplay';
import { logBuffer } from '@/hooks/useLogger/index';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for LogExportButton component.
 */
export interface LogExportButtonProps {
  /**
   * Optional additional CSS class names.
   */
  className?: string;

  /**
   * Button text override.
   * @default 'Export Logs'
   */
  label?: string;

  /**
   * Whether the button is disabled.
   */
  disabled?: boolean;

  /**
   * Callback when export completes successfully.
   * @param filePath - The path where logs were exported
   */
  onExportSuccess?: (filePath: string) => void;

  /**
   * Callback when export fails.
   * @param error - The error message
   */
  onExportError?: (error: string) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * LogExportButton Component
 *
 * Renders a button that exports application logs when clicked.
 * Shows loading state during export and provides feedback on success/error.
 *
 * @example
 * <LogExportButton
 *   onExportSuccess={(filePath) => console.log('Exported to:', filePath)}
 *   onExportError={(error) => console.error('Export failed:', error)}
 * />
 */
export const LogExportButton: FC<LogExportButtonProps> = ({
  className,
  label = 'Export Logs',
  disabled = false,
  onExportSuccess,
  onExportError,
}) => {
  // ========================================================================
  // State
  // ========================================================================

  /**
   * Whether export is currently in progress.
   */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Success message with file path.
   */
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Error message from export failure.
   */
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ========================================================================
  // Handlers
  // ========================================================================

  /**
   * Handles button click to export logs.
   * Flushes renderer logs to main process before export (best-effort with timeout).
   * Then triggers the logs:export IPC call and handles the response.
   */
  const handleClick = useCallback(async () => {
    // Reset previous state
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Step 1: Flush renderer logs to main process (best-effort with timeout)
      // This ensures renderer logs are included in the export bundle
      try {
        const logs = logBuffer.getAll();

        // Create a timeout promise (3 seconds as per consensus)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Flush timeout')), 3000)
        );

        // Race between flush and timeout
        await Promise.race([
          (window as unknown as {
            coreto?: {
              logs?: {
                flushRendererLogs: (logs: unknown[]) => Promise<{ success: boolean; error?: string }>;
              };
            };
          }).coreto?.logs?.flushRendererLogs(logs),
          timeoutPromise,
        ]);
      } catch (flushError) {
        // If flush fails (timeout or error), continue without renderer logs
        // This is the best-effort pattern from the consensus
        console.warn('[LogExport] Failed to flush renderer logs:', flushError);
        // Do NOT set errorMessage - we continue with export
      }

      // Step 2: Export logs (always works, with or without renderer logs)
      // Response format: { success: boolean, data?: { downloadPath: string, mainLogCount: number, rendererLogCount: number, totalCount: number }, error?: string }
      const response = await (window as unknown as {
        coreto?: {
          logs?: {
            export: () => Promise<{
              success: boolean;
              data?: {
                downloadPath: string;
                mainLogCount: number;
                rendererLogCount: number;
                totalCount: number;
              };
              error?: string;
            }>;
          };
        };
      }).coreto?.logs?.export();

      if (response?.success && response.data?.downloadPath) {
        const { downloadPath, mainLogCount, rendererLogCount, totalCount } = response.data;
        setSuccessMessage(
          `Logs exported to: ${downloadPath} (Main: ${mainLogCount}, Renderer: ${rendererLogCount}, Total: ${totalCount})`
        );
        onExportSuccess?.(downloadPath);

        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        const error = response?.error ?? 'Unknown error occurred';
        setErrorMessage(error);
        onExportError?.(error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export logs';
      setErrorMessage(message);
      onExportError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [onExportSuccess, onExportError]);

  /**
   * Clears success message.
   */
  const handleDismissSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  /**
   * Clears error message.
   */
  const handleDismissError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="flex flex-col gap-3">
      {/* Export Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          'flex items-center justify-center gap-2',
          'px-4 py-2 rounded-md',
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors',
          'font-medium text-sm',
          'min-w-[140px]',
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Success Display */}
      {successMessage && (
        <ErrorDisplay
          severity="success"
          variant="alert"
          message={successMessage}
          dismissible
          onDismiss={handleDismissSuccess}
        />
      )}

      {/* Error Display */}
      {errorMessage && (
        <ErrorDisplay
          severity="error"
          variant="alert"
          title="Export Failed"
          message={errorMessage}
          dismissible
          onDismiss={handleDismissError}
        />
      )}
    </div>
  );
};

export default LogExportButton;
