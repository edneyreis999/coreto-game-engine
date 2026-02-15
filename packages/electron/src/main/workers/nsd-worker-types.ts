/**
 * NSD Worker Communication Type Contracts (Infrastructure Adapter)
 *
 * Type-safe message definitions for UtilityProcess communication
 * between main process and NSD worker.
 *
 * This module defines infrastructure-specific message types for
 * NSD document parsing operations.
 *
 * @see planos/005-run-ttk-electron/TECHSPEC-round2.md Section 5
 */

// Re-export NSD worker protocol types from nsd-worker-protocol.ts
export type {
  NsdProgressStage,
  NsdProgressPayload,
  NsdErrorPayload,
  NsdResultPayload,
} from './nsd-worker-protocol.js';

// =============================================================================
// Messages: Main → UtilityProcess
// =============================================================================

/**
 * NSD parsing parameters sent from main process to worker.
 * Contains all configuration needed to parse an NSD document.
 */
export interface NsdParseParams {
  /** Unique parsing identifier (UUID v4) */
  id: string;
  /** Optional correlation ID for tracking the operation */
  correlationId: string;
  /** Absolute file path to the NSD markdown file (optional) */
  filePath?: string;
  /** Direct markdown text content (optional, for paste scenarios) */
  content?: string;
  /** Original filename of the NSD document (for display) */
  fileName?: string;
}

/**
 * Discriminated union for messages from main process to NSD worker.
 * Type narrowing via 'type' field enables exhaustiveness checks.
 */
export type MainToNsdWorkerMessage =
  | { type: 'nsd:parse'; payload: NsdParseParams }
  | { type: 'cancel' };

// =============================================================================
// Messages: UtilityProcess → Main
// =============================================================================

/**
 * Discriminated union for messages from NSD worker to main process.
 * Type narrowing via 'type' field enables exhaustiveness checks.
 *
 * Uses protocol types for payload contracts.
 */
export type NsdWorkerToMainMessage =
  | { type: 'nsd:progress'; payload: NsdProgressPayload }
  | { type: 'nsd:result'; payload: NsdResultPayload }
  | { type: 'nsd:error'; payload: NsdErrorPayload };
