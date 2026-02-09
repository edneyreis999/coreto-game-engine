/**
 * useLogger Hook - Barrel Export
 *
 * Exports logging utilities for React components and console override.
 */

// Main hook for React components
export { useLogger } from './useLogger';

// Circular buffer instance and factory (for console override)
export { logBuffer, createLogEntry } from './useLogger';

// Type definitions
export type { LogEntry, Logger } from './types';
