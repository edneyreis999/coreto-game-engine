/**
 * NSD Worker Protocol Types
 *
 * Core protocol definitions for NSD document parsing operations.
 * These types define the contract between worker and main process.
 *
 * @see planos/005-run-ttk-electron/TECHSPEC-round2.md Section 5
 */

/**
 * Processing stages for NSD document parsing operations.
 *
 * Represents the sequential phases of document processing from
 * initial read through validation completion.
 */
export type NsdProgressStage =
  | 'reading'     // Reading file from disk or receiving text content
  | 'parsing'     // Parsing markdown structure and extracting sections
  | 'extracting'  // Identifying and extracting individual scenes
  | 'validating'  // Validating document structure and required fields
  | 'complete';   // All processing finished successfully

/**
 * Progress update payload for NSD document parsing operations.
 *
 * Emitted periodically during parsing to keep the UI informed of
 * the current processing stage and completion percentage.
 */
export interface NsdProgressPayload {
  /** Unique parsing identifier */
  id: string;
  /** Correlation ID matching the original parse request */
  correlationId: string;
  /** Current stage of the parsing process */
  stage: NsdProgressStage;
  /** Completion percentage (0-100) */
  percent: number;
  /** Human-readable progress message */
  message: string;
  /** Timestamp when progress was emitted */
  timestamp: number;
}

/**
 * Error response payload for failed NSD document parsing operations.
 *
 * Provides structured error information with error code, message,
 * and correlation ID for debugging and user feedback.
 */
export interface NsdErrorPayload {
  /** Machine-readable error code for categorization */
  code: string;
  /** Human-readable error message for display */
  message: string;
  /** Correlation ID matching the failed parse request */
  correlationId: string;
  /** Optional additional error details */
  details?: string;
}

/**
 * Result payload returned after successful NSD document parsing.
 *
 * Contains the parsed scenes list, warnings, and metadata.
 */
export interface NsdResultPayload {
  /** Unique parsing identifier */
  id: string;
  /** Correlation ID matching the original parse request */
  correlationId: string;
  /** Original filename of the parsed NSD document */
  fileName: string;
  /** List of scenes extracted from the NSD document */
  scenes: unknown[]; // TODO: Replace with NSDScene[] when entity is defined
  /** Optional list of non-critical warnings from parsing */
  warnings: string[];
  /** Duration of the parsing operation in milliseconds */
  duration: number;
}
