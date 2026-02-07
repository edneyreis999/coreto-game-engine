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
import { getLogger } from '../di/container.js';

// Lazy initialization to avoid calling getLogger() before DI container is ready
let logger: ReturnType<typeof getLogger> | null = null;
function ensureLogger() {
  if (!logger) {
    logger = getLogger();
  }
  return logger;
}

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
  private readonly SIMULATION_TIMEOUT_MS = 300_000; // 5 minutes
  private currentSimulationId: string | null = null;
  private storageService: ReportStorageService | null = null;
  private simulationTimeoutTimer: NodeJS.Timeout | null = null;

  // Simulation state management (moved from handlers/simulation.ts)
  private simulationProgress: SimulationProgress = {
    current: 0,
    total: 0,
    percentage: 0,
    isRunning: false,
  };
  private abortController: AbortController | null = null;
  private lastResults: ReportData | null = null;

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
   * 4. Starts timeout timer (5 minutes)
   * 5. Returns immediately (result comes via events)
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

    // Start timeout timer
    this.startSimulationTimeout();

    return this.currentSimulationId;
  }

  /**
   * Cancels the currently running simulation.
   *
   * Sends cancel command to worker and initiates graceful shutdown.
   * Forces kill after 5 seconds if worker doesn't respond.
   * Clears simulation timeout timer.
   */
  async cancel(): Promise<void> {
    if (!this.worker) {
      return;
    }

    // Clear simulation timeout
    this.clearSimulationTimeout();

    // Send graceful shutdown command
    const message: MainToWorkerMessage = { type: 'cancel' };
    this.worker.postMessage(message);

    // Force kill after timeout
    const forceKillTimer = setTimeout(() => {
      if (this.worker) {
        ensureLogger().warn('Force killing unresponsive worker');
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
      ensureLogger().info('Spawning new worker process');

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
          ensureLogger().error('Worker message handler error: ' + String(error));
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
          ensureLogger().error(`Worker crashed with code ${code}`);
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
        ensureLogger().debug(`[Worker stdout] ${data.toString()}`);
      });

      // Log worker stderr for debugging
      this.worker.stderr?.on('data', (data: Buffer) => {
        ensureLogger().error(`[Worker stderr] ${data.toString()}`);
      });
    }

    return this.worker;
  }

  /**
   * Handles messages from the worker process.
   *
   * Routes messages to appropriate handlers:
   * - progress: Forward to renderer for UI updates
   * - complete: Store result, forward to renderer, start warm pool timer, clear timeout
   * - error: Forward to renderer, start warm pool timer, clear timeout
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
        this.clearSimulationTimeout();
        this.sendToRenderer('simulation:error', message.payload);
        this.scheduleTermination();
        break;

      default: {
        // Type exhaustiveness check
        const _exhaustive: never = message;
        ensureLogger().warn('Unknown message type: ' + String(_exhaustive));
      }
    }
  }

  /**
   * Handles simulation completion.
   *
   * Stores result in SQLite, forwards to renderer, and starts warm pool timer.
   * Clears timeout timer.
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
    // Clear timeout timer
    this.clearSimulationTimeout();

    // Store result in SQLite if storage service is available
    if (this.storageService && this.currentSimulationId) {
      // Convert Report to ReportData for storage
      const reportData = this.convertToReportData(payload.report, payload);

      this.storageService
        .storeSimulation(this.currentSimulationId, payload.projectPath, reportData, 'SUCCESS')
        .catch((error) => {
          ensureLogger().error('Failed to store result: ' + String(error));
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
   * Starts simulation timeout timer.
   *
   * If simulation doesn't complete within SIMULATION_TIMEOUT_MS (5 minutes),
   * the worker is killed and an error is sent to renderer.
   */
  private startSimulationTimeout(): void {
    // Clear any existing timeout
    this.clearSimulationTimeout();

    ensureLogger().info(`Starting simulation timeout (${this.SIMULATION_TIMEOUT_MS / 1000}s)`);

    this.simulationTimeoutTimer = setTimeout(() => {
      ensureLogger().warn('Simulation timeout reached - killing worker');

      // Send timeout error to renderer
      this.sendToRenderer('simulation:error', {
        title: 'Simulation Timeout',
        description: 'The simulation took too long to complete and was terminated.',
        code: 'ERR_SIMULATION_TIMEOUT',
        details: `Timeout: ${this.SIMULATION_TIMEOUT_MS / 1000} seconds`,
      });

      // Kill worker and cleanup
      if (this.worker) {
        this.worker.kill();
        this.worker = null;
      }

      this.currentSimulationId = null;
      this.simulationTimeoutTimer = null;
    }, this.SIMULATION_TIMEOUT_MS);
  }

  /**
   * Clears the simulation timeout timer.
   *
   * Called when simulation completes or errors before timeout.
   */
  private clearSimulationTimeout(): void {
    if (this.simulationTimeoutTimer) {
      clearTimeout(this.simulationTimeoutTimer);
      this.simulationTimeoutTimer = null;
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

    ensureLogger().info(`Scheduling worker termination in ${this.KEEP_ALIVE_MS / 1000}s`);

    this.keepAliveTimer = setTimeout(() => {
      if (this.worker) {
        ensureLogger().info('Terminating idle worker');
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
   * - Clears simulation timeout timer
   * - Kills worker if running
   *
   * Should be called in app 'before-quit' and 'window-all-closed' handlers.
   */
  cleanup(): void {
    ensureLogger().info('SimulationController cleanup called');
    this.cancelTermination();
    this.clearSimulationTimeout();

    if (this.worker) {
      ensureLogger().info('Killing worker on cleanup');
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

  // ===========================================================================
  // Simulation State Management (moved from handlers/simulation.ts)
  // ===========================================================================

  /**
   * Gets the current simulation progress.
   *
   * @returns A copy of the current simulation progress
   */
  getProgress(): SimulationProgress {
    return { ...this.simulationProgress };
  }

  /**
   * Updates the simulation progress state.
   *
   * @param progress - Partial progress object to merge with current state
   */
  updateProgress(progress: Partial<SimulationProgress>): void {
    this.simulationProgress = { ...this.simulationProgress, ...progress };
  }

  /**
   * Resets simulation progress to initial state.
   */
  resetProgress(): void {
    this.simulationProgress = {
      current: 0,
      total: 0,
      percentage: 0,
      isRunning: false,
    };
    this.abortController = null;
  }

  /**
   * Gets the last simulation results.
   *
   * @returns The last simulation results or null
   */
  getLastResults(): ReportData | null {
    return this.lastResults;
  }

  /**
   * Sets the simulation results.
   *
   * @param results - The simulation results to store
   */
  setLastResults(results: ReportData): void {
    this.lastResults = results;
  }

  /**
   * Clears the stored simulation results.
   */
  clearLastResults(): void {
    this.lastResults = null;
  }

  /**
   * Gets the abort controller for cancellation.
   *
   * @returns The current abort controller or null
   */
  getAbortController(): AbortController | null {
    return this.abortController;
  }

  /**
   * Creates and returns a new abort controller.
   *
   * @returns A new abort controller
   */
  createAbortController(): AbortController {
    this.abortController = new AbortController();
    return this.abortController;
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
