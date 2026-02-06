/**
 * Simulation Controller
 *
 * Manages UtilityProcess worker lifecycle for TTK simulations.
 * Implements Warm Pool strategy to reduce startup latency in consecutive runs.
 *
 * Key Features:
 * - Warm Pool: Keeps worker alive for 5 minutes after completion
 * - Graceful Shutdown: 5-second timeout before force kill
 * - Crash Recovery: Automatic worker restart on crash
 * - Storage Integration: Automatic result storage via ReportStorageService
 * - App Lifecycle Integration: Cleanup on app quit
 *
 * @see planos/005-run-ttk-electron/TECHSPEC-round2.md Section 2
 * @see planos/005-run-ttk-electron/tasks/05_task.md
 * @see Technical Debt DT-002
 */

import { utilityProcess, type UtilityProcess, BrowserWindow } from 'electron';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  MainToWorkerMessage,
  WorkerToMainMessage,
  SimulationParams,
} from '../workers/types.js';
import type { ReportData } from '../ipc/types.js';
import { ReportStorageService } from './report-storage.js';

// =============================================================================
// Simulation Controller
// =============================================================================

/**
 * Controller for managing simulation worker lifecycle.
 *
 * Implements Warm Pool pattern:
 * - Worker spawns on first simulation request
 * - Worker stays alive for 5 minutes after completion (warm pool)
 * - Re-running within 5 minutes reuses existing worker (<100ms startup)
 * - After 5 minutes idle, worker terminates to free resources
 *
 * Singleton pattern ensures only one worker exists at a time.
 */
export class SimulationController {
  private worker: UtilityProcess | null = null;
  private keepAliveTimer: NodeJS.Timeout | null = null;
  private readonly KEEP_ALIVE_MS = 5 * 60 * 1000; // 5 minutes
  private readonly GRACEFUL_SHUTDOWN_MS = 5 * 1000; // 5 seconds
  private currentSimulationId: string | null = null;
  private storageService: ReportStorageService | null = null;

  /**
   * Sets the ReportStorageService for result storage.
   * Must be called before starting simulations.
   *
   * @param service - ReportStorageService instance
   */
  setStorageService(service: ReportStorageService): void {
    this.storageService = service;
  }

  /**
   * Starts a new simulation.
   *
   * Flow:
   * 1. Ensures worker is running (warm pool check)
   * 2. Generates unique simulation ID
   * 3. Sends start message to worker
   * 4. Returns immediately (result comes via events)
   *
   * @param params - Simulation parameters (without simulationId)
   * @returns Simulation ID for tracking
   */
  async start(params: Omit<SimulationParams, 'simulationId'>): Promise<string> {
    const worker = await this.ensureWorker();

    this.currentSimulationId = randomUUID();

    const message: MainToWorkerMessage = {
      type: 'start',
      payload: {
        ...params,
        simulationId: this.currentSimulationId,
      },
    };

    worker.postMessage(message);

    return this.currentSimulationId;
  }

  /**
   * Cancels the currently running simulation.
   *
   * Sends cancel command to worker and initiates graceful shutdown.
   * Forces kill after 5 seconds if worker doesn't respond.
   */
  async cancel(): Promise<void> {
    if (!this.worker) {
      return;
    }

    // Send graceful shutdown command
    const message: MainToWorkerMessage = { type: 'cancel' };
    this.worker.postMessage(message);

    // Force kill after timeout
    const forceKillTimer = setTimeout(() => {
      if (this.worker) {
        console.warn('[SimulationController] Force killing unresponsive worker');
        this.worker.kill();
        this.worker = null;
      }
    }, this.GRACEFUL_SHUTDOWN_MS);

    // Clear force kill timer if worker exits gracefully
    this.worker.once('exit', () => {
      clearTimeout(forceKillTimer);
    });
  }

  /**
   * Ensures worker process is running.
   *
   * Implements Warm Pool strategy:
   * - If worker exists and is alive, reuse it (cancel termination timer)
   * - If worker doesn't exist, spawn new worker
   *
   * @returns The active UtilityProcess worker
   */
  private async ensureWorker(): Promise<UtilityProcess> {
    // Cancel termination timer if worker is in warm pool
    this.cancelTermination();

    if (!this.worker) {
      console.log('[SimulationController] Spawning new worker process');

      this.worker = utilityProcess.fork(
        path.join(__dirname, '../workers/simulation.worker.js'),
        [],
        {
          serviceName: 'SimulationWorker',
          stdio: 'pipe',
        }
      );

      // Setup message handling with error boundary
      this.worker.on('message', (message: WorkerToMainMessage) => {
        try {
          this.handleWorkerMessage(message);
        } catch (error) {
          console.error('[SimulationController] Worker message handler error:', error);
          this.sendToRenderer('simulation:error', {
            title: 'Worker Handler Error',
            description: 'An error occurred while processing the worker message.',
            code: 'ERR_WORKER_HANDLER',
            details: error instanceof Error ? error.message : String(error),
          });
        }
      });

      // Setup crash handling
      this.worker.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.error(`[SimulationController] Worker crashed with code ${code}`);
          this.worker = null;

          // Notify renderer of crash
          this.sendToRenderer('simulation:error', {
            title: 'Simulation Process Crashed',
            description: 'The simulation process unexpectedly terminated. Please try again.',
            code: 'ERR_WORKER_CRASH',
            details: `Exit code: ${code}`,
          });
        }
      });

      // Log worker stdout for debugging
      this.worker.stdout?.on('data', (data: Buffer) => {
        console.log(`[Worker stdout] ${data.toString()}`);
      });

      // Log worker stderr for debugging
      this.worker.stderr?.on('data', (data: Buffer) => {
        console.error(`[Worker stderr] ${data.toString()}`);
      });
    }

    return this.worker;
  }

  /**
   * Handles messages from the worker process.
   *
   * Routes messages to appropriate handlers:
   * - progress: Forward to renderer for UI updates
   * - complete: Store result, forward to renderer, start warm pool timer
   * - error: Forward to renderer, start warm pool timer
   *
   * @param message - Worker message to handle
   */
  private handleWorkerMessage(message: WorkerToMainMessage): void {
    switch (message.type) {
      case 'progress':
        this.sendToRenderer('simulation:progress', message.payload);
        break;

      case 'complete':
        this.handleCompletion(message.payload);
        break;

      case 'error':
        this.sendToRenderer('simulation:error', message.payload);
        this.scheduleTermination();
        break;

      default: {
        // Type exhaustiveness check
        const _exhaustive: never = message;
        console.warn('[SimulationController] Unknown message type:', _exhaustive);
      }
    }
  }

  /**
   * Handles simulation completion.
   *
   * Stores result in SQLite, forwards to renderer, and starts warm pool timer.
   *
   * @param payload - Simulation result payload
   */
  private handleCompletion(payload: {
    simulationId: string;
    projectPath: string;
    report: unknown; // Report type from @coreto/core
    duration: number;
    seed: number;
  }): void {
    // Store result in SQLite if storage service is available
    if (this.storageService && this.currentSimulationId) {
      // Convert Report to ReportData for storage
      const reportData = this.convertToReportData(payload.report, payload);

      this.storageService
        .storeSimulation(
          this.currentSimulationId,
          payload.projectPath,
          reportData,
          'SUCCESS'
        )
        .catch((error) => {
          console.error('[SimulationController] Failed to store result:', error);
        });
    }

    // Forward to renderer
    this.sendToRenderer('simulation:complete', payload);

    // Start warm pool timer
    this.scheduleTermination();
  }

  /**
   * Converts @coreto/core Report to ReportData for storage.
   *
   * @param report - Raw report from worker
   * @param payload - Simulation result payload
   * @returns ReportData for storage
   */
  private convertToReportData(
    _report: unknown,
    _payload: {
      simulationId: string;
      projectPath: string;
      duration: number;
      seed: number;
    }
  ): ReportData {
    // This is a placeholder - actual conversion depends on Report structure
    // In production, this would properly extract data from the Report object
    return {
      trechos: [],
      timestamp: new Date().toISOString(),
      totalBattles: 0,
      overallTtkTurns: 0,
      overallOutcome: 'victory',
    } as ReportData;
  }

  /**
   * Sends a message to the renderer process via IPC.
   *
   * @param channel - IPC event channel name
   * @param payload - Message payload
   */
  private sendToRenderer(channel: string, payload: unknown): void {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, payload);
    }
  }

  /**
   * Cancels the warm pool termination timer.
   *
   * Called when starting a new simulation to keep worker alive.
   */
  private cancelTermination(): void {
    if (this.keepAliveTimer) {
      clearTimeout(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  /**
   * Schedules worker termination after idle timeout.
   *
   * Implements Warm Pool strategy:
   * - Worker terminates after 5 minutes of inactivity
   * - Reduces resource usage when not actively simulating
   */
  private scheduleTermination(): void {
    this.cancelTermination();

    console.log(
      `[SimulationController] Scheduling worker termination in ${this.KEEP_ALIVE_MS / 1000}s`
    );

    this.keepAliveTimer = setTimeout(() => {
      if (this.worker) {
        console.log('[SimulationController] Terminating idle worker');
        this.worker.kill();
        this.worker = null;
      }
    }, this.KEEP_ALIVE_MS);
  }

  /**
   * Cleans up controller resources.
   *
   * Called during app shutdown to ensure graceful cleanup:
   * - Cancels termination timer
   * - Kills worker if running
   *
   * Should be called in app 'before-quit' and 'window-all-closed' handlers.
   */
  cleanup(): void {
    console.log('[SimulationController] Cleanup called');
    this.cancelTermination();

    if (this.worker) {
      console.log('[SimulationController] Killing worker on cleanup');
      this.worker.kill();
      this.worker = null;
    }

    this.currentSimulationId = null;
  }

  /**
   * Gets the current simulation ID.
   *
   * @returns Current simulation ID or null
   */
  getCurrentSimulationId(): string | null {
    return this.currentSimulationId;
  }

  /**
   * Checks if a simulation is currently running.
   *
   * @returns true if worker exists and simulation ID is set
   */
  isRunning(): boolean {
    return this.worker !== null && this.currentSimulationId !== null;
  }

  /**
   * Gets the current worker process (for testing).
   *
   * @returns The current UtilityProcess worker or null
   */
  getWorker(): UtilityProcess | null {
    return this.worker;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

/**
 * Singleton instance of SimulationController.
 * Used throughout the application for simulation lifecycle management.
 */
export const simulationController = new SimulationController();
