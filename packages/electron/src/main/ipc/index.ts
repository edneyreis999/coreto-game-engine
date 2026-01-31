/**
 * IPC Module Entry Point
 *
 * Exports the setup function for registering all IPC handlers.
 * Called from main process entry point during app initialization.
 *
 * @see packages/electron/src/main/index.ts
 */

import { registerDependencies, clearContainer } from '@coreto/core';
import { registerIpcHandlers } from './handlers.js';

/**
 * Sets the main window reference for simulation event forwarding.
 *
 * Note: Event forwarding is now handled by SimulationController internally.
 * This function is kept for API compatibility but does nothing.
 *
 * @param window - The main BrowserWindow instance (ignored)
 */
export function setMainWindowReference(_window: unknown): void {
  // Window reference no longer needed - controller handles forwarding
  // Kept for API compatibility
}

/**
 * Setup IPC handlers for communication between main and renderer processes.
 *
 * This function:
 * 1. Registers all core dependencies in the DI container
 * 2. Registers all IPC handlers with ipcMain
 * 3. Registers config-specific handlers with ipcMain
 * 4. Registers simulation handlers (event streaming)
 * 5. Enables type-safe communication via the preload script
 *
 * Should be called once during app initialization after app.whenReady().
 *
 * @example
 * ```typescript
 * import { app } from 'electron';
 * import { setupIpcHandlers } from './ipc/index.js';
 *
 * app.whenReady().then(() => {
 *   setupIpcHandlers();
 *   createWindow();
 * });
 * ```
 */
export function setupIpcHandlers(): void {
  // Register all core dependencies in DI container
  registerDependencies();

  // Register all IPC handlers with ipcMain
  registerIpcHandlers();
}

/**
 * Clear all DI container instances.
 * Useful for testing to ensure clean state between tests.
 */
export { clearContainer };

