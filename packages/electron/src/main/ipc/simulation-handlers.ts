/**
 * Simulation IPC Handlers
 *
 * IPC handlers for TTK simulation commands (start, cancel).
 * Implements the hybrid approach: invoke for commands, events for updates.
 *
 * These handlers bridge the main process with the SimulationController,
 * which manages the UtilityProcess worker lifecycle.
 *
 * Task 05: Now uses SimulationController for worker lifecycle management.
 *
 * @see planos/005-run-ttk-electron/TECHSPEC.md Section 2.1
 * @see planos/005-run-ttk-electron/tasks/02_task.md
 * @see planos/005-run-ttk-electron/tasks/05_task.md
 */

import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import type { SimulationParams } from '../workers/types.js';
import { simulationController } from '../services/index.js';

// =============================================================================
// IPC Handlers
// =============================================================================

/**
 * Registers simulation IPC handlers.
 *
 * Handlers:
 * - simulation:start: Starts a new simulation, returns simulationId
 * - simulation:cancel: Cancels the currently running simulation
 *
 * Results are delivered via events:
 * - simulation:progress: Real-time progress updates
 * - simulation:complete: Final simulation result
 * - simulation:error: Error information
 *
 * Note: Event forwarding is handled by SimulationController internally.
 */
export function registerSimulationHandlers(): void {
  /**
   * Starts a simulation.
   *
   * Flow:
   * 1. Delegate to SimulationController
   * 2. Controller spawns worker (or reuses warm pool)
   * 3. Controller sends start command to worker
   * 4. Return immediately with simulationId
   *
   * Result comes via 'simulation:complete' event.
   */
  ipcMain.handle(
    'simulation:start',
    async (_event: IpcMainInvokeEvent, params: Omit<SimulationParams, 'simulationId'>) => {
      try {
        const simulationId = await simulationController.start(params);

        return {
          success: true,
          data: { simulationId }
        };
      } catch (error) {
        return {
          success: false,
          error: {
            name: 'SimulationStartError',
            message: error instanceof Error ? error.message : 'Failed to start simulation',
            severity: 'critical',
            context: {},
            timestamp: new Date().toISOString()
          }
        };
      }
    }
  );

  /**
   * Cancels the currently running simulation.
   *
   * Delegates to SimulationController for graceful shutdown.
   */
  ipcMain.handle('simulation:cancel', async (_event: IpcMainInvokeEvent) => {
    try {
      await simulationController.cancel();

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: 'SimulationCancelError',
          message: error instanceof Error ? error.message : 'Failed to cancel simulation',
          severity: 'warning',
          context: {},
          timestamp: new Date().toISOString()
        }
      };
    }
  });
}
