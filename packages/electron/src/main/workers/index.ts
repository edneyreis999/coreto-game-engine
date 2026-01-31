/**
 * Workers Module Entry Point
 *
 * Exports worker types, error mapper, and related utilities
 * for UtilityProcess-based TTK validation simulation.
 *
 * @see planos/005-run-ttk-electron/tasks/01_task.md
 */

// Type contracts for worker communication
export * from './types.js';

// Error mapper for user-friendly error messages
export * from './error-mapper.js';

// Worker entry point (imported by electron-vite)
export { spawnWorker } from '../index.js';
