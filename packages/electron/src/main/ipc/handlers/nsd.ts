/**
 * NSD (Narrative Scene Document) IPC Handlers
 *
 * Handlers for NSD document upload and parsing operations.
 * Delegates business logic to NSD worker process via UtilityProcess.
 *
 * Architecture:
 * Renderer (React) → Main (IPC Handler) → UtilityProcess (NSD Worker) → NSD Parsing
 *
 * @see packages/electron/src/main/workers/nsd.worker.ts
 * @see packages/electron/src/main/ipc/nsd-schemas.ts
 */

import type { IpcMainInvokeEvent } from 'electron';
import { UtilityProcess } from 'electron';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';
import type { ILogger } from '@coreto/core';
import { resolve } from '@coreto/core';

import type { IPCResult } from '../protocol-types.js';
import type { NSDUploadPayload } from '../nsd-schemas.js';
import { NSDUploadPayloadSchema } from '../nsd-schemas.js';
import { wrapHandler } from '../ipc-response.js';
import { ILoggerToken } from '../../di/tokens.js';
import type {
  MainToNsdWorkerMessage,
  NsdWorkerToMainMessage,
  NsdParseParams,
} from '../../workers/nsd-worker-types.js';
import type {
  NsdProgressPayload,
  NsdResultPayload,
  NsdErrorPayload,
} from '../../workers/nsd-worker-protocol.js';
import type { NSDUploadResponse } from '@coreto/electron/domain/types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum file size for NSD document upload (1MB).
 * Prevents memory issues and ensures reasonable processing times.
 */
const MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes

/**
 * Allowed file extension for NSD documents.
 * Only markdown files are supported for NSD format.
 */
const ALLOWED_EXTENSION = '.md';

/**
 * Worker timeout in milliseconds (5 minutes).
 * Prevents runaway worker processes from hanging indefinitely.
 */
const WORKER_TIMEOUT = 5 * 60 * 1000;

/**
 * Path to the NSD worker script.
 * Resolved relative to the compiled output directory.
 */
const WORKER_PATH = join(__dirname, '../../workers/nsd.worker.js');

// ============================================================================
// Response Types
// ============================================================================

/**
 * Validates an IPC payload against its Zod schema.
 *
 * @param channel - IPC channel name for error messages
 * @param payload - Raw payload to validate
 * @param schema - Zod schema for validation
 * @throws Error with validation details if schema validation fails
 */
function validatePayload<T extends unknown>(
  channel: string,
  payload: unknown,
  schema: { safeParse: (data: unknown) => { success: boolean; error?: { errors: Array<{ path: string[]; message: string }> } } }
): asserts payload is T {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new Error(`Invalid payload for ${channel}: ${errorMessages}`);
  }
}

/**
 * Validates file extension for NSD document upload.
 *
 * @param filePath - Absolute file path to validate
 * @throws Error if file extension is not .md
 */
function validateFileExtension(filePath: string): void {
  if (!filePath.endsWith(ALLOWED_EXTENSION)) {
    throw new Error(
      `Invalid file type. NSD documents must be markdown files (.md). Received: ${filePath}`
    );
  }
}

/**
 * Validates file size for NSD document upload.
 *
 * @param fileSize - File size in bytes
 * @param filePath - File path for error message
 * @throws Error if file exceeds MAX_FILE_SIZE
 */
function validateFileSize(fileSize: number): void {
  if (fileSize > MAX_FILE_SIZE) {
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    throw new Error(
      `File too large: ${sizeMB}MB exceeds maximum size of 1MB. Please split your document into smaller files.`
    );
  }
}

// ============================================================================
// Handler: nsd:upload
// ============================================================================

/**
 * Handler: nsd:upload
 *
 * Uploads and parses an NSD (Narrative Scene Document) markdown file.
 * Supports two input modes: file path (from file dialog) or direct text (paste).
 *
 * Processing Flow:
 * 1. Validate payload using Zod schema
 * 2. If source.path: read file, validate extension (.md), validate size (1MB)
 * 3. If source.text: use text directly
 * 4. Generate correlationId for tracking
 * 5. Spawn NSD worker via UtilityProcess.fork()
 * 6. Send message to worker: { type: 'nsd:parse', id, correlationId, content, fileName }
 * 7. Listen for worker messages:
 *    - nsd:progress: forward to renderer via event
 *    - nsd:result: resolve promise with scenes
 *    - nsd:error: reject promise with error
 * 8. Map worker results to IPC response
 *
 * Error Handling:
 * - Invalid payload: Returns error immediately
 * - Wrong extension: Returns user-friendly error
 * - File too large: Returns error with size limit
 * - Worker crash: Timeout error
 * - Parse error: Forwards worker error message
 *
 * @param event - IPC invoke event (used for sending progress events)
 * @param payload - NSD upload payload with source and correlationId
 * @returns Promise<IPCResult<NSDUploadResponse>> with documentId, sceneList, warnings
 *
 * @example
 * // File path upload (from file dialog)
 * const payload = {
 *   source: { path: '/path/to/quest.md' },
 *   correlationId: 'uuid-v4'
 * };
 * const result = await nsdUploadHandler(event, payload);
 *
 * @example
 * // Direct text upload (from paste)
 * const payload = {
 *   source: { text: '# Quest Title\n\nScene content...' },
 *   correlationId: 'uuid-v4'
 * };
 * const result = await nsdUploadHandler(event, payload);
 */
export async function nsdUploadHandler(
  event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<NSDUploadResponse>> {
  return wrapHandler(async () => {
    // 1. Validate payload with Zod schema
    validatePayload('nsd:upload', payload, NSDUploadPayloadSchema);

    const { source, correlationId: requestCorrelationId } = payload as NSDUploadPayload;

    // Resolve logger for this operation
    const logger = resolve<ILogger>(ILoggerToken);
    logger.info(`[IPC] NSD upload requested: correlationId=${requestCorrelationId}`);

    let content: string;
    let fileName: string;

    // 2. Process source based on type (path vs text)
    if (source.path) {
      // File path mode: read and validate file
      logger.debug(`[IPC] Reading NSD file: ${source.path}`);

      // Validate file extension
      validateFileExtension(source.path);

      // Read file content
      const fileBuffer = await readFile(source.path, 'utf-8');

      // Validate file size
      validateFileSize(fileBuffer.length);

      content = fileBuffer;
      fileName = source.path.split('/').pop() || source.path.split('\\').pop() || 'unknown.md';

      logger.debug(`[IPC] File read successfully: ${fileName} (${content.length} characters)`);
    } else if (source.text) {
      // Direct text mode: use content directly
      content = source.text;
      fileName = 'pasted-content.md';

      // Validate size for text content as well
      validateFileSize(content.length);

      logger.debug(`[IPC] Using direct text content: ${content.length} characters`);
    } else {
      // This should never happen due to Zod validation, but type safety requires it
      throw new Error('Invalid source: either path or text must be provided');
    }

    // 3. Generate correlation ID for tracking (UUID v4)
    const correlationId = requestCorrelationId || uuidv4();
    const parseId = uuidv4(); // Unique ID for this parse operation

    logger.info(`[IPC] Spawning NSD worker: parseId=${parseId}, correlationId=${correlationId}`);

    // 4. Spawn NSD worker via UtilityProcess.fork()
    const worker = UtilityProcess.fork(WORKER_PATH, [], {
      env: process.env,
    });

    // 5. Set up worker communication and timeout
    const workerPromise = new Promise<NSDUploadResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        logger.error(`[IPC] NSD worker timeout: parseId=${parseId}`);
        worker.kill();
        reject(new Error('NSD parsing timed out. The document may be too complex or the worker crashed.'));
      }, WORKER_TIMEOUT);

      // 6. Listen for worker messages
      worker.on('message', (message: NsdWorkerToMainMessage) => {
        switch (message.type) {
          case 'nsd:progress': {
            // Forward progress to renderer via event
            const progressPayload: NsdProgressPayload = message.payload;
            logger.debug(
              `[IPC] NSD progress: ${progressPayload.stage} (${progressPayload.percent}%)`
            );

            // Send progress event to renderer
            event.sender.send('nsd:upload:progress', {
              stage: progressPayload.stage,
              percent: progressPayload.percent,
              correlationId,
            });
            break;
          }

          case 'nsd:result': {
            // Worker completed successfully - resolve promise
            clearTimeout(timeout);
            const resultPayload: NsdResultPayload = message.payload;

            logger.info(
              `[IPC] NSD parsing completed: parseId=${parseId}, scenes=${resultPayload.scenes.length}, duration=${resultPayload.duration}ms`
            );

            // Map worker result to IPC response format
            // TODO: Map scenes array to NSDSceneDTO[] when worker returns proper types
            const response: NSDUploadResponse = {
              documentId: resultPayload.id, // Use worker-generated ID
              sceneList: resultPayload.scenes as NSDScene[], // Type assertion until worker types are finalized
              warnings: resultPayload.warnings,
            };

            resolve(response);
            break;
          }

          case 'nsd:error': {
            // Worker failed - reject promise with error
            clearTimeout(timeout);
            const errorPayload: NsdErrorPayload = message.payload;

            logger.error(
              `[IPC] NSD parsing failed: parseId=${parseId}, code=${errorPayload.code}, message=${errorPayload.message}`
            );

            reject(new Error(`${errorPayload.code}: ${errorPayload.message}`));
            break;
          }

          default: {
            // Type exhaustiveness check
            const _exhaustive: never = message;
            logger.warn(`[IPC] Unknown worker message type: ${String(_exhaustive)}`);
          }
        }
      });

      // Handle worker crashes
      worker.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          clearTimeout(timeout);
          logger.error(`[IPC] NSD worker exited with code: ${code}`);
          reject(new Error(`NSD worker process exited unexpectedly with code ${code}`));
        }
      });
    });

    // 7. Send parse request to worker
    const parseParams: NsdParseParams = {
      id: parseId,
      correlationId,
      content,
      fileName,
    };

    const workerMessage: MainToNsdWorkerMessage = {
      type: 'nsd:parse',
      payload: parseParams,
    };

    worker.postMessage(workerMessage);
    logger.debug(`[IPC] Sent nsd:parse message to worker: parseId=${parseId}`);

    // 8. Wait for worker result
    const result = await workerPromise;

    // 9. Clean up worker process
    worker.kill();

    logger.info(`[IPC] NSD upload completed successfully: documentId=${result.documentId}`);

    return result;
  });
}

// ============================================================================
// Handler Exports
// ============================================================================

/**
 * Export all NSD IPC handlers for registration.
 * Wrapped with wrapHandler for consistent error handling.
 */
export const nsdHandlers = {
  'nsd:upload': nsdUploadHandler,
};
