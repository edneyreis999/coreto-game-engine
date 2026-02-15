/**
 * NSD Worker - UtilityProcess Entry Point
 *
 * Runs NSD (Narrative Scene Document) parsing in an isolated process.
 * Uses TSyringe DI container with child containers for state isolation.
 *
 * Process Architecture:
 * Renderer (React) → Main (IPC) → UtilityProcess (this file) → NSD parsing
 *
 * @see planos/005-run-ttk-electron/TECHSPEC-round2.md Section 2.3
 */

import 'reflect-metadata';
import { parentPort } from 'electron';
import { container } from 'tsyringe';
import { registerDependencies } from '@coreto/core';
import type {
  MainToNsdWorkerMessage,
  NsdWorkerToMainMessage,
  NsdParseParams,
} from './nsd-worker-types.js';
import type { NsdProgressPayload, NsdProgressStage } from './nsd-worker-protocol.js';
import { mapNsdErrorToUserMessage } from './nsd-error-mapper.js';
import { NsdWorkerService } from './nsd-worker.service.js';

/**
 * Simple logger for worker process.
 * Worker runs in isolated process, so we use direct console.* calls.
 */
const logger = {
  info: (msg: string) => console.log(`[INFO] [NsdWorker] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] [NsdWorker] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] [NsdWorker] ${msg}`),
  debug: (msg: string) => console.debug(`[DEBUG] [NsdWorker] ${msg}`),
};

/**
 * Validates that worker is running as UtilityProcess.
 * parentPort is only available in UtilityProcess context.
 */
if (!parentPort) {
  throw new Error('NsdWorker must be run as UtilityProcess (parentPort not available)');
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
function sendMessage(message: NsdWorkerToMainMessage): void {
  // parentPort is verified to exist at file scope (line 43)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  parentPort!.postMessage(message);
}

/**
 * Send a progress event to the main process.
 * Helper function for constructing progress messages.
 *
 * @param payload - Progress payload data
 */
function sendProgress(payload: NsdProgressPayload): void {
  sendMessage({
    type: 'nsd:progress',
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
 * Parse NSD document content.
 *
 * Implementation steps:
 * 1. Create child container (isolated state per parsing operation)
 * 2. Emit initialization event
 * 3. Read content from file path or use direct text content
 * 4. Resolve NsdWorkerService from DI container
 * 5. Delegate parsing to NsdWorkerService with progress callback
 * 6. Emit completion event with results
 * 7. Cleanup child container (prevent memory leaks)
 *
 * @param params - NSD parsing parameters from main process
 */
async function handleNsdParse(params: NsdParseParams): Promise<void> {
  // Child container per parsing operation (CRITICAL for state isolation)
  const childContainer = container.createChildContainer();
  const startTime = Date.now();

  try {
    logger.info(`Starting NSD parsing ${params.id}`);

    // 1. Initialization event
    sendProgress({
      id: params.id,
      correlationId: params.correlationId,
      stage: 'reading',
      percent: 0,
      message: 'Reading NSD document content...',
      timestamp: Date.now(),
    });

    // 2. Read content from file path or use direct text content
    let content: string;

    if (params.content) {
      // Direct text content provided (paste scenario)
      content = params.content;
      logger.debug(`Using direct text content (${content.length} characters)`);
    } else if (params.filePath) {
      // Read from file path (file upload scenario)
      logger.debug(`Reading content from file: ${params.filePath}`);
      // TODO: Implement file reading logic in subsequent tasks
      // For now, this is a placeholder that will be implemented when
      // the full integration with file system is established
      content = ''; // Placeholder
    } else {
      throw new Error('Either filePath or content must be provided');
    }

    // 3. Resolve NsdWorkerService from child container
    const nsdService = childContainer.resolve(NsdWorkerService);

    // 4. Create progress callback to forward progress to main process
    const progressCallback = (stage: NsdProgressStage, percent: number): void => {
      sendProgress({
        id: params.id,
        correlationId: params.correlationId,
        stage,
        percent,
        message: getStageMessage(stage),
        timestamp: Date.now(),
      });
    };

    // 5. Delegate parsing to NsdWorkerService
    logger.debug(`Delegating parsing to NsdWorkerService for ${params.id}`);
    const scenes = await nsdService.parseNSD(
      content,
      params.fileName || 'unknown.md',
      progressCallback,
      params.correlationId
    );

    // 6. Send completion result
    const duration = Date.now() - startTime;
    sendMessage({
      type: 'nsd:result',
      payload: {
        id: params.id,
        correlationId: params.correlationId,
        fileName: params.fileName || 'unknown.md',
        scenes, // Array of NSDScene entities from NsdWorkerService
        warnings: [], // TODO: Collect warnings from parsing process
        duration,
      },
    });

    logger.info(`NSD parsing ${params.id} completed in ${duration}ms with ${scenes.length} scenes`);
  } catch (error) {
    logger.error(`NSD parsing ${params.id} failed: ${String(error)}`);

    // Map error to user-friendly message
    const mappedError = mapNsdErrorToUserMessage(error, params.correlationId);

    sendMessage({
      type: 'nsd:error',
      payload: mappedError,
    });
  } finally {
    // CRITICAL: Cleanup child container to prevent memory leaks
    childContainer.clearInstances();
    logger.debug(`Child container cleared for parsing operation ${params.id}`);
  }
}

/**
 * Get human-readable message for parsing stage.
 *
 * @param stage - Current parsing stage
 * @returns Human-readable stage message
 */
function getStageMessage(stage: NsdProgressStage): string {
  const messages: Record<NsdProgressStage, string> = {
    reading: 'Reading NSD document content...',
    parsing: 'Parsing markdown structure with AI...',
    extracting: 'Extracting scenes from parsed document...',
    validating: 'Validating document structure and scenes...',
    complete: 'Parsing completed successfully',
  };

  return messages[stage] || 'Processing...';
}

/**
 * Message handler for main → worker communication.
 * Listens for 'nsd:parse' and 'cancel' messages.
 */
parentPort.on('message', async (event: { data: MainToNsdWorkerMessage }) => {
  const message = event.data;

  switch (message.type) {
    case 'nsd:parse':
      await handleNsdParse(message.payload);
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
logger.info('NSD Worker initialized and ready for messages');
