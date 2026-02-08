/**
 * Status Utility Functions
 *
 * Helper functions for checking simulation status.
 * Extracted to improve testability and reusability.
 *
 * @see packages/electron/src/renderer/src/components/ExecutionPanel/ExecutionPanel.tsx
 */

// ============================================================================
// Status Types
// ============================================================================

/**
 * Simulation status type.
 */
export type SimulationStatus = 'idle' | 'running' | 'completed' | 'error' | 'cancelled';

// ============================================================================
// Status Check Functions
// ============================================================================

/**
 * Checks if status is a running state.
 * @param status - The simulation status to check.
 * @returns True if status is 'running'.
 */
export function isRunningStatus(status: SimulationStatus): boolean {
  return status === 'running';
}

/**
 * Checks if status is a completed state.
 * @param status - The simulation status to check.
 * @returns True if status is 'completed'.
 */
export function isCompletedStatus(status: SimulationStatus): boolean {
  return status === 'completed';
}

/**
 * Checks if status is an error state.
 * @param status - The simulation status to check.
 * @returns True if status is 'error'.
 */
export function isErrorStatus(status: SimulationStatus): boolean {
  return status === 'error';
}

/**
 * Checks if status is an idle state.
 * @param status - The simulation status to check.
 * @returns True if status is 'idle' or 'cancelled'.
 */
export function isIdleStatus(status: SimulationStatus): boolean {
  return status === 'idle' || status === 'cancelled';
}

/**
 * Gets the status message for display.
 * @param status - The simulation status.
 * @returns The human-readable status message.
 */
export function getStatusMessage(status: SimulationStatus): string {
  if (isRunningStatus(status)) {
    return 'Validating TTK balance...';
  }
  if (isCompletedStatus(status)) {
    return 'Validation complete';
  }
  if (isErrorStatus(status)) {
    return 'Validation failed';
  }
  return 'Ready to validate';
}
