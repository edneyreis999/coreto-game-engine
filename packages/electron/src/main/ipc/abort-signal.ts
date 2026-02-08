/**
 * Abort Signal Utilities
 *
 * Helper utilities for adding abort signal support to IPC handlers.
 * Enables cancellation of long-running operations when renderer is destroyed.
 *
 * @see packages/electron/CLAUDE.md Task 05: Add Abort Signal Checks to IPC Handlers
 */

import type { IpcMainInvokeEvent } from 'electron';
import { getLogger } from '../di/container.js';

// Lazy initialization to avoid calling getLogger() before DI container is ready
let logger: ReturnType<typeof getLogger> | null = null;
function ensureLogger(): ReturnType<typeof getLogger> {
  if (!logger) {
    logger = getLogger();
  }
  return logger;
}

/**
 * Checks if an abort signal has been aborted and throws if so.
 * This is the primary method for checking cancellation during long-running operations.
 *
 * @param signal - The AbortSignal to check
 * @param operation - Description of the current operation (for error messages)
 * @throws {Error} If the signal is aborted
 *
 * @example
 * ```typescript
 * async function longRunningOperation(signal: AbortSignal) {
 *   checkAbortSignal(signal, 'loading database');
 *   // ... do work
 *   checkAbortSignal(signal, 'processing data');
 *   // ... do more work
 * }
 * ```
 */
export function checkAbortSignal(signal: AbortSignal, operation?: string): void {
  if (signal.aborted) {
    const message = operation ? `Operation cancelled: ${operation}` : 'Operation cancelled';
    ensureLogger().debug(`[AbortSignal] ${message}`);
    throw new Error(message);
  }
}

/**
 * Wraps a handler with abort signal support.
 * Creates an AbortController that aborts when the renderer window is destroyed.
 *
 * This pattern keeps handler signatures clean while providing abort signal support.
 * The signal is automatically injected and managed by the wrapper.
 *
 * @param handler - The handler function to wrap, receives signal as first parameter
 * @returns A wrapped handler that accepts standard IPC handler signature
 *
 * @example
 * ```typescript
 * // Define handler with abort signal support
 * async function handleSimulationRun(signal: AbortSignal, event: IpcMainInvokeEvent, payload: unknown) {
 *   checkAbortSignal(signal, 'before loading data');
 *   const data = await loadData();
 *   checkAbortSignal(signal, 'before processing');
 *   return processData(data);
 * }
 *
 * // Register with wrapper
 * ipcMain.handle('simulation:run', withAbortSignal(handleSimulationRun));
 * ```
 */
export function withAbortSignal<
  T extends (
    signal: AbortSignal,
    event: IpcMainInvokeEvent,
    payload: unknown
  ) => Promise<unknown>
>(handler: T): (event: IpcMainInvokeEvent, payload: unknown) => ReturnType<T> {
  return async (event: IpcMainInvokeEvent, payload: unknown) => {
    const controller = new AbortController();
    const signal = controller.signal;

    // Abort when renderer is destroyed
    const sender = event.sender;
    const destroyListener = () => {
      ensureLogger().debug('[AbortSignal] Renderer destroyed, aborting operation');
      controller.abort();
    };

    sender.once('destroyed', destroyListener);

    try {
      // Call handler with signal
      return await handler(signal, event, payload);
    } finally {
      // Clean up listener
      sender.removeListener('destroyed', destroyListener);
    }
  };
}

/**
 * Creates an abort controller that auto-aborts after a timeout.
 * Useful for preventing operations from running indefinitely.
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns AbortController with auto-timeout
 *
 * @example
 * ```typescript
 * const controller = createTimeoutController(5000); // 5 second timeout
 * try {
 *   await longRunningOperation(controller.signal);
 * } catch (error) {
 *   if (controller.signal.aborted) {
 *     console.log('Operation timed out');
 *   }
 * }
 * ```
 */
export function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    ensureLogger().debug(`[AbortSignal] Timeout reached after ${timeoutMs}ms, aborting`);
    controller.abort();
  }, timeoutMs);

  // Clear timeout when abort is manually called or operation completes
  const originalAbort = controller.abort.bind(controller);
  controller.abort = () => {
    clearTimeout(timeoutId);
    return originalAbort();
  };

  return controller;
}

/**
 * Executes a callback periodically and checks abort signal between iterations.
 * Useful for processing items in a loop with cancellation support.
 *
 * @param items - Array of items to process
 * @param signal - AbortSignal to check
 * @param callback - Function to call for each item
 * @param options - Processing options
 * @returns Array of results from callback
 * @throws {Error} If signal is aborted during processing
 *
 * @example
 * ```typescript
 * const results = await processWithAbortSignal(
 *   troops,
 *   signal,
 *   async (troop) => await simulateTroop(troop),
 *   { checkInterval: 10 } // Check every 10 items
 * );
 * ```
 */
export async function processWithAbortSignal<T, R>(
  items: readonly T[],
  signal: AbortSignal,
  callback: (item: T, index: number) => Promise<R>,
  options?: { checkInterval?: number }
): Promise<R[]> {
  const results: R[] = [];
  const checkInterval = options?.checkInterval ?? 1;

  for (let i = 0; i < items.length; i++) {
    // Check abort signal at specified interval
    if (i % checkInterval === 0) {
      checkAbortSignal(signal, `processing item ${i + 1}/${items.length}`);
    }

    const result = await callback(items[i] as T, i);
    results.push(result);
  }

  return results;
}
