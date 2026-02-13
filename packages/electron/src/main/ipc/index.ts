/**
 * IPC Module Entry Point
 *
 * Exports the setup function for registering all IPC handlers.
 * Called from main process entry point during app initialization.
 *
 * @see packages/electron/src/main/index.ts
 */

import { registerDependencies } from '@coreto/core';
import { registerHandlers as registerIpcHandlers, cleanupIpcHandlers } from './handlers/index';
import { registerMainDependencies } from '../di/container';

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
 * 1. Registers all core dependencies in DI container
 * 2. Registers Electron-specific dependencies (overrides core defaults)
 * 3. Registers all IPC handlers with ipcMain
 * 4. Registers config-specific handlers with ipcMain
 * 5. Registers simulation handlers (event streaming)
 * 6. Enables type-safe communication via the preload script
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

  // Register Electron-specific dependencies (overrides core defaults)
  registerMainDependencies();

  // Register all IPC handlers with ipcMain
  registerIpcHandlers();
}

export { cleanupIpcHandlers };
