/**
 * Simulation Worker - UtilityProcess Entry Point
 *
 * Runs TTK validation simulations in an isolated process.
 * Uses TSyringe DI container with child containers for state isolation.
 *
 * Process Architecture:
 * Renderer (React) → Main (IPC) → UtilityProcess (this file) → @coreto/core
 *
 * Task 09: Config loading now uses SQLite storage via IConfigLoader.
 * Config is loaded from database using projectPath key (no configPath in SimulationParams).
 *
 * @see planos/005-run-ttk-electron/TECHSPEC-round2.md Section 2.3
 */

import 'reflect-metadata';
import { parentPort } from 'electron';
import { container } from 'tsyringe';
import { registerDependencies } from '@coreto/core';
import type {
  MainToWorkerMessage,
  WorkerToMainMessage,
  SimulationParams,
} from './types.js';
import type { ProgressPayload } from './protocol-types.js';
import { mapErrorToUserMessage } from './error-mapper.js';

/**
 * Simple logger for worker process.
 * Worker runs in isolated process, so we use direct console.* calls.
 */
const logger = {
  info: (msg: string) => console.log(`[INFO] [SimulationWorker] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] [SimulationWorker] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] [SimulationWorker] ${msg}`),
  debug: (msg: string) => console.debug(`[DEBUG] [SimulationWorker] ${msg}`),
};

/**
 * Validates that worker is running as UtilityProcess.
 * parentPort is only available in UtilityProcess context.
 */
if (!parentPort) {
  throw new Error('SimulationWorker must be run as UtilityProcess (parentPort not available)');
}

/**
 * Setup DI container with @coreto/core dependencies.
 * Called once on worker startup.
 */
function setupContainer(): void {
  logger.info('Setting up DI container');
  registerDependencies();
}

/**
 * Send a message to the main process via MessageChannel.
 * Type-safe wrapper around parentPort.postMessage.
 *
 * @param message - Message to send to main process
 */
function sendMessage(message: WorkerToMainMessage): void {
  // parentPort is verified to exist at file scope (line 29)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  parentPort!.postMessage(message);
}

/**
 * Send a progress event to the main process.
 * Helper function for constructing progress messages.
 *
 * @param payload - Progress payload data
 */
function sendProgress(payload: ProgressPayload): void {
  sendMessage({
    type: 'progress',
    payload,
  });
}

/**
 * Handle graceful cancellation request.
 * Exits worker process cleanly with exit code 0.
 */
function handleCancellation(): void {
  logger.info('Graceful shutdown requested');
  process.exit(0);
}

/**
 * Run a single TTK validation simulation.
 *
 * Implementation steps:
 * 1. Create child container (isolated state per simulation)
 * 2. Emit initialization event
 * 3. Setup event listeners for trecho/battle progress
 * 4. Load config from SQLite using IConfigLoader (Task 09)
 * 5. Run simulation via @coreto/core
 * 6. Emit completion event with results
 * 7. Cleanup child container (prevent memory leaks)
 *
 * @param params - Simulation parameters from main process
 */
async function handleSimulation(params: SimulationParams): Promise<void> {
  // Child container per simulation (CRITICAL for state isolation)
  const childContainer = container.createChildContainer();
  const startTime = Date.now();

  try {
    logger.info(`Starting simulation ${params.simulationId}`);

    // 1. Initialization event
    sendProgress({
      stage: 'initialization',
      current: 0,
      total: 100,
      percentage: 0,
      message: 'Loading project and setting up simulation...',
      timestamp: Date.now(),
    });

    // 2. Resolve dependencies from child container
    // TODO: Implement actual simulation execution using @coreto/core
    // For now, this is a placeholder that will be implemented in subsequent tasks
    // when the full integration with @coreto/core is established

    // Simulate progress events (placeholder for testing)
    // In production, these will be emitted by the actual simulation
    const totalTrechos = 3; // Placeholder

    for (let i = 1; i <= totalTrechos; i++) {
      // Trecho start event
      sendProgress({
        stage: 'trecho',
        trechoId: `trecho-${i}`,
        trechoName: `Trecho ${i}`,
        current: i,
        total: totalTrechos,
        percentage: Math.round((i / totalTrechos) * 100),
        message: `Starting trecho ${i}/${totalTrechos}`,
        timestamp: Date.now(),
      });

      // Simulate battle progress (placeholder)
      const battlesPerTrecho = 10;
      for (let j = 1; j <= battlesPerTrecho; j++) {
        if (j % 5 === 0) {
          // Emit progress every 5 battles (batching)
          sendProgress({
            stage: 'battle',
            trechoId: `trecho-${i}`,
            trechoName: `Trecho ${i}`,
            current: j,
            total: battlesPerTrecho,
            percentage: Math.round((j / battlesPerTrecho) * 100),
            message: `Battle ${j}/${battlesPerTrecho} in Trecho ${i}`,
            timestamp: Date.now(),
          });
        }
      }

      // Trecho complete event
      sendProgress({
        stage: 'trecho-complete',
        trechoId: `trecho-${i}`,
        current: i,
        total: totalTrechos,
        percentage: Math.round((i / totalTrechos) * 100),
        message: `Completed trecho ${i}/${totalTrechos}`,
        timestamp: Date.now(),
      });
    }

    // 3. Finalization event
    const duration = Date.now() - startTime;
    sendProgress({
      stage: 'finalization',
      current: 100,
      total: 100,
      percentage: 100,
      message: 'Finalizing results...',
      timestamp: Date.now(),
    });

    // 4. Send completion (placeholder)
    // TODO: Replace with actual Report from @coreto/core
    sendMessage({
      type: 'complete',
      payload: {
        simulationId: params.simulationId,
        projectPath: params.projectPath,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        report: null as any, // Will be replaced with actual Report
        duration,
        seed: params.seed || Date.now(),
      },
    });

    logger.info(`Simulation ${params.simulationId} completed in ${duration}ms`);
  } catch (error) {
    logger.error(`Simulation ${params.simulationId} failed: ${String(error)}`);

    // Map error to user-friendly message
    const mappedError = mapErrorToUserMessage(error);

    sendMessage({
      type: 'error',
      payload: mappedError,
    });
  } finally {
    // CRITICAL: Cleanup child container to prevent memory leaks
    childContainer.clearInstances();
    logger.debug(`Child container cleared for simulation ${params.simulationId}`);
  }
}

/**
 * Message handler for main → worker communication.
 * Listens for 'start' and 'cancel' messages.
 */
parentPort.on('message', async (event: { data: MainToWorkerMessage }) => {
  const message = event.data;

  switch (message.type) {
    case 'start':
      await handleSimulation(message.payload);
      break;

    case 'cancel':
      handleCancellation();
      break;

    default: {
      // Type exhaustiveness check
      const _exhaustive: never = message;
      logger.warn('Unknown message type: ' + String(_exhaustive));
    }
  }
});

/**
 * Setup DI container on worker startup.
 */
setupContainer();

/**
 * Log worker startup for debugging.
 */
logger.info('Worker initialized and ready for messages');
