/**
 * Render Utility Functions
 *
 * Helper functions for rendering ExecutionPanel.
 * Extracted to improve testability and reduce component complexity.
 *
 * @see packages/electron/src/renderer/src/components/ExecutionPanel/ExecutionPanel.tsx
 */

import type { SimulationConfigData } from '@coreto/electron/domain/services';
import type { SimulationCompletionResult } from '@/hooks/useSimulationProgress';

// ============================================================================
// Types
// ============================================================================

/**
 * Simulation progress data.
 */
export interface ProgressData {
  /** Current progress percentage (0-100). */
  percentage: number;
  /** Name of the current item being processed. */
  currentItem?: string;
}

// ============================================================================
// Render Helper Functions
// ============================================================================

/**
 * Gets the current item being processed for display.
 * @param result - Simulation result if completed.
 * @param progress - Current progress data.
 * @param config - Configuration data.
 * @returns The name of the current item being processed.
 */
export function getCurrentItem(
  result: SimulationCompletionResult | null,
  progress: ProgressData,
  config: SimulationConfigData | null
): string {
  if (result) {
    return result.troopName;
  }
  if (progress.currentItem) {
    return progress.currentItem;
  }
  if (config && config.trechos.length > 0) {
    return config.trechos[0]?.name ?? 'Unknown trecho';
  }
  return 'Waiting to start...';
}
