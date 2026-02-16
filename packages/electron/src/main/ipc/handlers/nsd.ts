/**
 * NSD (Narrative Scene Document) IPC Handlers
 *
 * Handlers for NSD document upload and parsing operations.
 * Processes NSD documents directly in main thread using NsdWorkerService.
 *
 * Architecture:
 * Renderer (React) → Main (IPC Handler) → NsdWorkerService → Regex Parsing
 *
 * @see packages/electron/src/main/workers/nsd-worker.service.ts
 * @see packages/electron/src/main/ipc/nsd-schemas.ts
 */

import type { IpcMainInvokeEvent } from 'electron';
import { readFile } from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';
import type { ILogger } from '@coreto/core';
import { resolve } from '@coreto/core';

import type { IPCResult } from '../protocol-types.js';
import type { NSDUploadPayload } from '../nsd-schemas.js';
import { NSDUploadPayloadSchema } from '../nsd-schemas.js';
import { wrapHandler } from '../ipc-response.js';
import { ILoggerToken } from '../../di/tokens.js';
import type { NSDUploadResponse } from '@coreto/electron/domain/types';

// Import NSDScene and service for main thread processing
import { NSDScene } from '@coreto/electron/domain/entities';
import { NsdWorkerService, type PlainScene, type NSDProgressStage } from '../../workers/nsd-worker.service.js';

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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts PlainScene POJOs from parsing result to NSDScene entities.
 * Main process creates entities after parsing completes.
 *
 * @param plainScenes - PlainScene POJOs from NsdWorkerService
 * @param correlationId - Optional correlation ID for logging
 * @returns Array of NSDScene entities
 */
function convertToNSDScenes(plainScenes: PlainScene[], correlationId?: string): NSDScene[] {
  const scenes: NSDScene[] = [];

  for (const plain of plainScenes) {
    try {
      const scene = NSDScene.create(
        plain.title,
        plain.content,
        plain.sceneNumber,
        correlationId,
        plain.summary
      );
      scenes.push(scene);
    } catch (error) {
      // Log and skip invalid scenes
      console.warn(`[IPC] Failed to create NSDScene for scene ${plain.sceneNumber}:`, error);
    }
  }

  return scenes;
}

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
 * Processing Flow (Main Thread):
 * 1. Validate payload using Zod schema
 * 2. If source.path: read file, validate extension (.md), validate size (1MB)
 * 3. If source.text: use text directly
 * 4. Generate correlationId for tracking
 * 5. Parse NSD content using NsdWorkerService (regex-based, no AI)
 * 6. Forward progress events to renderer
 * 7. Convert PlainScene[] to NSDScene[] entities
 * 8. Return IPC response with scenes
 *
 * Error Handling:
 * - Invalid payload: Returns error immediately
 * - Wrong extension: Returns user-friendly error
 * - File too large: Returns error with size limit
 * - Parse error: Returns error with details
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
    const documentId = uuidv4(); // Unique ID for this document
    const startTime = Date.now();

    logger.info(`[IPC] Starting NSD parsing in main thread: documentId=${documentId}, correlationId=${correlationId}`);

    // 4. Create NsdWorkerService instance
    const nsdService = new NsdWorkerService(logger);

    // 5. Progress callback to forward events to renderer
    const progressCallback = (stage: NSDProgressStage, percent: number): void => {
      logger.debug(`[IPC] NSD parsing progress: ${stage} (${percent}%)`);

      // Send progress event to renderer
      event.sender.send('nsd:upload:progress', {
        stage,
        percent,
        correlationId,
      });
    };

    // 6. Parse NSD content (regex-based, no AI)
    const plainScenes = await nsdService.parseNSD(
      content,
      fileName,
      progressCallback,
      correlationId
    );

    const duration = Date.now() - startTime;

    logger.info(
      `[IPC] NSD parsing completed: documentId=${documentId}, scenes=${plainScenes.length}, duration=${duration}ms`
    );

    // 7. Convert PlainScene[] to NSDScene[] entities
    const scenes = convertToNSDScenes(plainScenes, correlationId);

    // 8. Build response
    const response: NSDUploadResponse = {
      documentId,
      sceneList: scenes as NSDScene[],
      warnings: [], // TODO: Collect warnings during parsing if needed
    };

    logger.info(`[IPC] NSD upload completed successfully: documentId=${documentId}`);

    return response;
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
