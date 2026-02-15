/**
 * NSD (Narrative Scene Document) IPC Schemas
 *
 * Zod schemas for runtime validation of NSD IPC payloads.
 * All inbound IPC requests must be validated at the boundary.
 *
 * This file is in the infrastructure layer (main/ipc/) because it defines
 * the transport protocol validation for NSD-related IPC communication.
 *
 * @see main/ipc/types.ts for other IPC schemas
 * @see domain/types/nsd-types.ts for NSD domain types
 * @see packages/electron/CLAUDE.md (Import Conventions)
 */

import { z } from 'zod';

// ============================================================================
// NSD Upload Progress Stages
// ============================================================================

/**
 * Processing stages for NSD document upload operations.
 *
 * These stages progress sequentially: reading → parsing → extracting → validating → complete.
 * Each stage represents a distinct phase of document processing.
 *
 * @example
 * 'parsing' // Second stage where markdown is analyzed for structure
 */
export const NSDUploadStageEnum = z.enum([
  'reading',
  'parsing',
  'extracting',
  'validating',
  'complete',
]);

export type NSDUploadStage = z.infer<typeof NSDUploadStageEnum>;

// ============================================================================
// NSD Upload Request Schema
// ============================================================================

/**
 * Zod schema for validating NSD upload request payloads.
 *
 * Validates the nsd:upload IPC request, ensuring:
 * - At least one source is provided (path OR text)
 * - Correlation ID is a non-empty string
 * - Path is validated for security (no path traversal)
 *
 * @example
 * // File path upload (from file dialog)
 * const payload = { source: { path: '/path/to/quest.md' }, correlationId: 'uuid' };
 * NSDUploadPayloadSchema.parse(payload);
 *
 * @example
 * // Direct text upload (from paste)
 * const payload = { source: { text: '# Quest Title\n\nContent...' }, correlationId: 'uuid' };
 * NSDUploadPayloadSchema.parse(payload);
 */
export const NSDUploadPayloadSchema = z.object({
  /**
   * Source of the NSD document content.
   *
   * Must provide exactly one of:
   * - `path`: Absolute file system path to the markdown file (main process)
   * - `text`: Direct markdown text content (paste scenario)
   */
  source: z
    .object({
      /**
       * Absolute file path to the NSD markdown file (optional).
       * Validated for path traversal attacks.
       */
      path: z
        .string()
        .min(1, 'File path cannot be empty')
        .refine((p) => !p.includes('..'), 'Path traversal not allowed')
        .optional(),

      /**
       * Direct markdown text content (optional).
       * Used for paste scenarios where user pastes NSD content directly.
       */
      text: z.string().min(1, 'Text content cannot be empty').optional(),
    })
    .refine(
      (data) => data.path !== undefined || data.text !== undefined,
      'At least one source (path or text) must be provided'
    )
    .refine(
      (data) => !(data.path !== undefined && data.text !== undefined),
      'Only one source (path or text) should be provided, not both'
    ),

  /**
   * Unique correlation identifier for this upload operation.
   *
   * Used to track progress events and match responses to requests.
   * Should be a UUID v4 or similar unique identifier.
   */
  correlationId: z.string().min(1, 'Correlation ID cannot be empty'),
});

/**
 * Inferred TypeScript type for NSD upload payload.
 *
 * Represents the validated structure of nsd:upload IPC requests.
 */
export type NSDUploadPayload = z.infer<typeof NSDUploadPayloadSchema>;

// ============================================================================
// NSD Upload Progress Schema
// ============================================================================

/**
 * Zod schema for validating NSD upload progress event payloads.
 *
 * Validates the nsd:upload:progress IPC event, ensuring:
 * - Stage is one of the valid upload stages
 * - Percent is between 0-100
 * - Correlation ID is a non-empty string
 *
 * @example
 * const progress = { stage: 'parsing', percent: 45, correlationId: 'uuid' };
 * NSDProgressPayloadSchema.parse(progress);
 */
export const NSDProgressPayloadSchema = z.object({
  /**
   * Current stage of the upload process.
   *
   * Stages progress sequentially: reading → parsing → extracting → validating → complete.
   */
  stage: NSDUploadStageEnum,

  /**
   * Completion percentage for the current stage (0-100).
   *
   * Indicates progress within the current stage. When `stage` is 'complete',
   * this value should be 100.
   */
  percent: z
    .number()
    .min(0, 'Percent cannot be negative')
    .max(100, 'Percent cannot exceed 100'),

  /**
   * Correlation ID matching the original upload request.
   *
   * Links this progress update to the specific upload operation
   * for proper UI tracking.
   */
  correlationId: z.string().min(1, 'Correlation ID cannot be empty'),
});

/**
 * Inferred TypeScript type for NSD progress payload.
 *
 * Represents the validated structure of nsd:upload:progress IPC events.
 */
export type NSDProgressPayload = z.infer<typeof NSDProgressPayloadSchema>;

// ============================================================================
// NSD Upload Error Schema
// ============================================================================

/**
 * Zod schema for validating NSD upload error event payloads.
 *
 * Validates the nsd:upload:error IPC event, ensuring:
 * - Code is a non-empty string
 * - Message is a non-empty string
 * - Correlation ID is a non-empty string
 *
 * Standard error codes:
 * - `NSD_READ_ERROR`: Failed to read file or text content
 * - `NSD_PARSE_ERROR`: Markdown parsing failed
 * - `NSD_VALIDATE_ERROR`: Document validation failed
 * - `NSD_EXTRACT_ERROR`: Scene extraction failed
 * - `NSD_SIZE_ERROR`: File exceeds maximum size (1MB)
 * - `NSD_EMPTY_ERROR`: Document is empty or contains no content
 *
 * @example
 * const error = { code: 'NSD_PARSE_ERROR', message: 'Invalid markdown format', correlationId: 'uuid' };
 * NSDErrorPayloadSchema.parse(error);
 */
export const NSDErrorPayloadSchema = z.object({
  /**
   * Machine-readable error code for categorization.
   *
   * Standard error codes are documented in the schema JSDoc above.
   */
  code: z.string().min(1, 'Error code cannot be empty'),

  /**
   * Human-readable error message for display.
   *
   * Should provide clear, actionable information about what went wrong
   * and how to fix it. Avoid technical jargon when possible.
   */
  message: z.string().min(1, 'Error message cannot be empty'),

  /**
   * Correlation ID matching the failed upload request.
   *
   * Links this error to the specific upload operation for debugging
   * and user feedback.
   */
  correlationId: z.string().min(1, 'Correlation ID cannot be empty'),
});

/**
 * Inferred TypeScript type for NSD error payload.
 *
 * Represents the validated structure of nsd:upload:error IPC events.
 */
export type NSDErrorPayload = z.infer<typeof NSDErrorPayloadSchema>;

// ============================================================================
// Schema Export Map
// ============================================================================

/**
 * Map of NSD IPC channels to their respective Zod schemas.
 *
 * Used for runtime validation of inbound IPC payloads in the NSD upload flow.
 * Ensures type safety and data integrity across the IPC boundary.
 *
 * @example
 * // Validate payload for nsd:upload channel
 * const schema = NSDIPCSchemas['nsd:upload'];
 * const validated = schema.parse(rawPayload);
 */
export const NSDIPCSchemas = {
  'nsd:upload': NSDUploadPayloadSchema,
  'nsd:upload:progress': NSDProgressPayloadSchema,
  'nsd:upload:error': NSDErrorPayloadSchema,
} as const;

/**
 * Type-safe payload extraction for NSD IPC channels.
 *
 * @example
 * type NsdUploadPayload = NSDChannelPayload<'nsd:upload'>;
 */
export type NSDChannelPayload<T extends keyof typeof NSDIPCSchemas> = z.infer<
  (typeof NSDIPCSchemas)[T]
>;
