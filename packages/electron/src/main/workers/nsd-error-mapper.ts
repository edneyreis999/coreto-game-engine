/**
 * NSD Error Mapper - User-Friendly Error Translation
 *
 * Transforms technical errors from NSD parsing into user-facing
 * error messages with actionable guidance.
 *
 * @see planos/005-run-ttk-electron/TECHSPEC.md Section 2.6
 * @see planos/005-run-ttk-electron/TECHSPEC-round2.md Section 5
 */

import type { NsdErrorPayload } from './nsd-worker-protocol.js';

/**
 * NSD error mapping result.
 * Contains user-friendly error information for display in UI.
 */
export interface MappedNsdError extends NsdErrorPayload {
  /** Original error type for logging */
  originalType?: string;
}

/**
 * Maps technical errors to user-friendly error messages for NSD operations.
 *
 * Design principles:
 * - Hide technical stack traces by default (collapsible in UI)
 * - Provide actionable guidance for resolution
 * - Include error codes for logging/analytics
 * - Preserve context for debugging (details field)
 *
 * Error categories:
 * 1. FileSystemError: File not found, invalid path, permission denied
 * 2. ParseError: Invalid markdown format, malformed structure
 * 3. ValidationError: Missing required fields, invalid scene data
 * 4. SizeError: File exceeds maximum size limit
 * 5. EmptyError: Document is empty or contains no content
 * 6. UnknownError: Unexpected errors (fallback)
 *
 * @example
 * ```typescript
 * try {
 *   await nsdParser.parse(content);
 * } catch (error) {
 *   const mapped = mapNsdErrorToUserMessage(error, correlationId);
 *   sendMessage({ type: 'nsd:error', payload: mapped });
 * }
 * ```
 */
export function mapNsdErrorToUserMessage(
  error: unknown,
  correlationId: string,
): MappedNsdError {
  // Null/undefined handling
  if (error === null || error === undefined) {
    return {
      code: 'NSD_UNKNOWN_ERROR',
      message: 'An unexpected error occurred during NSD parsing. Please try again.',
      correlationId,
      originalType: 'null',
    };
  }

  // Error object handling
  if (!(error instanceof Error)) {
    return {
      code: 'NSD_INVALID_ERROR',
      message: 'An invalid error object was received during NSD parsing.',
      correlationId,
      details: String(error),
      originalType: typeof error,
    };
  }

  // FileSystemError: File not found or invalid path
  if (isFileSystemError(error)) {
    return {
      code: 'NSD_READ_ERROR',
      message: 'Could not read the NSD file. Check that the file exists and you have permission to access it.',
      correlationId,
      details: `Path: ${error.context?.path || 'unknown'}\n${error.message}`,
      originalType: 'FileSystemError',
    };
  }

  // ParseError: Invalid markdown format
  if (isParseError(error)) {
    return {
      code: 'NSD_PARSE_ERROR',
      message: 'Failed to parse the NSD document. Check that the markdown format is correct.',
      correlationId,
      details: error.message,
      originalType: 'ParseError',
    };
  }

  // ValidationError: Invalid document structure
  if (isValidationError(error)) {
    const field = (error.context?.field as string) || 'unknown';
    return {
      code: 'NSD_VALIDATE_ERROR',
      message: `Invalid NSD document structure. The field "${field}" is missing or invalid.`,
      correlationId,
      details: `Field: ${field}\n${error.message}`,
      originalType: 'ValidationError',
    };
  }

  // SizeError: File too large
  if (isSizeError(error)) {
    const maxSize = error.context?.maxSize || '1MB';
    return {
      code: 'NSD_SIZE_ERROR',
      message: `The NSD file exceeds the maximum size limit of ${maxSize}. Please split it into smaller files.`,
      correlationId,
      details: `Maximum size: ${maxSize}\n${error.message}`,
      originalType: 'SizeError',
    };
  }

  // EmptyError: Document is empty
  if (isEmptyError(error)) {
    return {
      code: 'NSD_EMPTY_ERROR',
      message: 'The NSD document is empty. Please provide a document with content.',
      correlationId,
      details: error.message,
      originalType: 'EmptyError',
    };
  }

  // Unknown error: Fallback
  return {
    code: 'NSD_UNKNOWN_ERROR',
    message: 'An unexpected error occurred during NSD parsing. Please check the document format and try again.',
    correlationId,
    details: error.message,
    originalType: error.constructor.name,
  };
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard for FileSystemError.
 * Checks for error-specific properties.
 */
function isFileSystemError(error: Error): error is Error & { context?: { path?: string } } {
  return (
    'context' in error &&
    typeof error.context === 'object' &&
    error.context !== null &&
    'path' in error.context
  );
}

/**
 * Type guard for ParseError.
 * Checks error name or constructor name.
 */
function isParseError(error: Error): boolean {
  return error.name === 'ParseError' || error.constructor.name === 'ParseError';
}

/**
 * Type guard for ValidationError.
 * Checks for context with field information.
 */
function isValidationError(error: Error): error is Error & { context?: { field?: string } } {
  return (
    'context' in error &&
    typeof error.context === 'object' &&
    error.context !== null &&
    ('field' in error.context || 'name' === 'ValidationError')
  );
}

/**
 * Type guard for SizeError.
 * Checks for context with maxSize information.
 */
function isSizeError(error: Error): error is Error & { context?: { maxSize?: string } } {
  return (
    ('name' in error && error.name === 'SizeError') ||
    error.constructor.name === 'SizeError' ||
    ('context' in error &&
      typeof error.context === 'object' &&
      error.context !== null &&
      'maxSize' in error.context)
  );
}

/**
 * Type guard for EmptyError.
 * Checks error name or constructor name.
 */
function isEmptyError(error: Error): boolean {
  return error.name === 'EmptyError' || error.constructor.name === 'EmptyError';
}
