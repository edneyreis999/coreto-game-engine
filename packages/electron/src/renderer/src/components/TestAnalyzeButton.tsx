/**
 * TestAnalyzeButton Component
 *
 * Test button for Oracle MCP project analysis integration.
 * Tests the full flow: Export files → IPC → MCP Server → Project Analysis
 *
 * Fixed parameters for testing:
 * - NSD file: semifinal.NSD.fluxo-cenas.md
 * - Scene: Cena 4: Bronca no Gramado
 * - Project: projectX/frontend
 *
 * The button:
 * 1. Reads NSD file content from fixed path
 * 2. Copies NSD file to export directory (reports/analyze_project/)
 * 3. Creates scene markdown file with fixed content
 * 4. Calls test-analyze-project IPC endpoint
 * 5. Shows success message with file paths
 */

'use client';

import { type FC, useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useOracleMcpClient } from '@/hooks/useOracleMcpClient';
import { cn } from '@/lib/utils';

// ============================================================================
// Fixed Configuration
// ============================================================================

/**
 * Fixed test configuration for project analysis.
 * Uses predetermined paths and content for testing.
 */
const FIXED_CONFIG = {
  nsdPath: '/Users/edney/projects/coreto/projectX/docs/Quests/2-semifinal/semifinal.NSD.fluxo-cenas.md',
  sceneText: 'Jogador guia Thorin até Dragobur, que o encara com impaciência. Dragobur solta um sermão sobre disciplina e compromisso. O treinador enfatiza que Thorin não está usando capacete e não pode entrar em campo sem ele. Dragobur aponta o vestiário e diz "Capacete. Agora!". Jogador retoma a corrida rumo aos vestiários.',
  sceneName: 'Cena 4: Bronca no Gramado',
  sceneFile: 'cena-4-bronca-no-gramado.md',
  projectPath: '/Users/edney/projects/coreto/projectX/frontend',
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for TestAnalyzeButton component.
 */
export interface TestAnalyzeButtonProps {
  /**
   * Optional additional CSS class names.
   */
  className?: string;

  /**
   * Callback when test completes successfully.
   * @param result - The test analysis result
   */
  onTestSuccess?: (result: {
    outputPath: string;
    files: { json: string; markdown: string };
  }) => void;

  /**
   * Callback when test fails.
   * @param error - The error message
   */
  onTestError?: (error: string) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * TestAnalyzeButton Component
 *
 * Renders a button that tests the project analysis with fixed parameters.
 * Shows loading state during test and provides feedback on success/error.
 *
 * @example
 * <TestAnalyzeButton
 *   onTestSuccess={(result) => console.log('Test completed:', result)}
 *   onTestError={(error) => console.error('Test failed:', error)}
 * />
 */
export const TestAnalyzeButton: FC<TestAnalyzeButtonProps> = ({
  className,
  onTestSuccess,
  onTestError,
}) => {
  const { testAnalyzeProject, isTestAnalyzing } = useOracleMcpClient();

  // State for feedback messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Handles button click to run test analysis.
   * Creates test directory with required files and calls the test endpoint.
   */
  const handleClick = useCallback(async () => {
    // Reset previous state
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Step 1: Prepare test directory with NSD and scene files
      const prepareResult = await (window as unknown as {
        coreto?: {
          testAnalyze?: {
            prepareDirectory: (params: {
              nsdPath: string;
              sceneText: string;
              sceneFile: string;
              exportDir?: string;
            }) => Promise<{
              success: boolean;
              data?: {
                testDirectory: string;
                nsdFile: string;
                sceneFile: string;
              };
              error?: {
                message: string;
              };
            }>;
          };
        };
      }).coreto?.testAnalyze?.prepareDirectory({
        nsdPath: FIXED_CONFIG.nsdPath,
        sceneText: FIXED_CONFIG.sceneText,
        sceneFile: FIXED_CONFIG.sceneFile,
      });

      if (!prepareResult?.success || !prepareResult.data) {
        throw new Error(prepareResult?.error?.message ?? 'Failed to prepare test directory');
      }

      // Step 2: Call test-analyze-project endpoint
      const result = await testAnalyzeProject({
        testDirectory: prepareResult.data.testDirectory,
        model: 'glm-4.7',
      });

      // Step 3: Show success message
      const message = `Test analysis completed!\nOutput: ${result.outputPath}\nJSON: ${result.files.json}\nMarkdown: ${result.files.markdown}`;
      setSuccessMessage(message);
      onTestSuccess?.({
        outputPath: result.outputPath,
        files: result.files,
      });

      // Auto-clear success message after 10 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 10000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run test analysis';
      setErrorMessage(message);
      onTestError?.(message);

      // Auto-clear error message after 10 seconds
      setTimeout(() => {
        setErrorMessage(null);
      }, 10000);
    }
  }, [testAnalyzeProject, onTestSuccess, onTestError]);

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

  return (
    <div className="flex flex-col gap-3">
      {/* Test Analyze Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isTestAnalyzing}
        className={cn(
          'flex items-center justify-center gap-2',
          'px-4 py-2 rounded-md',
          'bg-purple-600 text-white',
          'hover:bg-purple-700',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors',
          'font-medium text-sm',
          'min-w-[140px]',
          className
        )}
      >
        {isTestAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyzing...</span>
          </>
        ) : (
          <span>Test Analyze</span>
        )}
      </button>

      {/* Success Display */}
      {successMessage && (
        <div
          className={cn(
            'flex items-start gap-3',
            'p-3 rounded-md border border-green-500/50',
            'bg-green-500/10 text-green-700 dark:text-green-400',
            'text-sm',
            'relative'
          )}
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={handleDismissSuccess}
            className="absolute top-1 right-1 text-green-700/50 hover:text-green-700 dark:text-green-400/50 dark:hover:text-green-400"
            aria-label="Dismiss success"
          >
            ✕
          </button>
          <div className="flex-1 whitespace-pre-line">{successMessage}</div>
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <div
          className={cn(
            'flex items-start gap-3',
            'p-3 rounded-md border border-destructive/50',
            'bg-destructive/10 text-destructive',
            'text-sm',
            'relative'
          )}
          role="alert"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={handleDismissError}
            className="absolute top-1 right-1 text-destructive/50 hover:text-destructive"
            aria-label="Dismiss error"
          >
            ✕
          </button>
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}
    </div>
  );
};

export default TestAnalyzeButton;
