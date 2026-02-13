import 'reflect-metadata';
import { app, BrowserWindow, shell, utilityProcess, type UtilityProcess } from 'electron';
import path from 'node:path';
import { setupIpcHandlers, setMainWindowReference } from './ipc/index.js';
import { initDatabase, closeDatabase, setDatabasePath } from './database/index.js';
import { simulationController, initializeLogCapture } from './services/index.js';
import { createWindowConfig, getWindowUrl } from './window-config.js';
import type { WorkerToMainMessage } from './workers/types.js';
import { getLogger } from './di/container.js';

/**
 * Main Process Entry Point
 *
 * Initializes the Electron application, creates the main window,
 * and manages app lifecycle events.
 */

// Task 07: Initialize log capture before any other initialization
// This ensures all console output is captured from startup
initializeLogCapture();

let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main application window.
 *
 * Window configuration:
 * - Title bar style: 'hiddenInset' for macOS native appearance
 * - Context isolation: enabled for security
 * - Node integration: disabled (use preload for IPC)
 * - Sandbox: enabled for preload script
 *
 * @returns The created BrowserWindow instance
 */
export function createWindow(): BrowserWindow {
  const isDev = process.env.NODE_ENV === 'development';

  mainWindow = new BrowserWindow(createWindowConfig(isDev));

  // Load the renderer process
  const windowUrl = getWindowUrl(isDev);
  if (isDev) {
    mainWindow.loadURL(windowUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(windowUrl.replace('file://', ''));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Set window reference for IPC event forwarding (Task 02)
  setMainWindowReference(mainWindow);

  // Handle external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return mainWindow;
}

/**
 * Registers all app lifecycle event handlers.
 *
 * This function sets up handlers for:
 * - window-all-closed: Quit on non-macOS platforms
 * - activate: Create new window on macOS dock click
 * - before-quit: Clean up resources before exit
 */
export function registerAppLifecycleHandlers(): void {
  /**
   * App lifecycle: Quit when all windows are closed (except macOS).
   */
  app.on('window-all-closed', () => {
    // Cleanup simulation controller on window close
    simulationController.cleanup();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  /**
   * App lifecycle: macOS-specific: Create new window when clicking dock icon.
   */
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  /**
   * App lifecycle: Before quitting, clean up resources.
   */
  app.on('before-quit', () => {
    // TODO: Save window bounds for persistence (task #6)
    simulationController.cleanup();
    closeDatabase();
    cleanupIpcHandlers(); // Cleanup Oracle MCP and other handlers
  });
}

/**
 * Initializes and starts the Electron application.
 *
 * This function:
 * 1. Waits for Electron to be ready
 * 2. Sets database path and initializes the SQLite database
 * 3. Sets up IPC handlers for main-renderer communication
 * 4. Creates the main window
 * 5. Registers app lifecycle handlers
 *
 * @returns Promise that resolves when the app is ready
 */
import { loadCredentials } from './credentials.js';

export async function startApp(): Promise<void> {
  await app.whenReady();

  // Load credentials BEFORE initializing DI container
  // This ensures MCP server has access to required environment variables
  try {
    await loadCredentials();
  } catch (error) {
    console.error('[ERROR] Failed to load credentials:', error instanceof Error ? error.message : String(error));
  }

  // Initialize DI container BEFORE any logger usage
  setupIpcHandlers(); // This registers both core and main dependencies

  const logger = getLogger();
  logger.info('Electron app starting...');

  const dbPath = path.join(app.getPath('userData'), 'coreto.db');
  setDatabasePath(dbPath);
  initDatabase();
  createWindow();
  registerAppLifecycleHandlers();

  logger.info('Electron app started successfully');
}

/**
 * Auto-start the app when this module is imported (non-test environment).
 *
 * In production, this runs immediately when Electron launches.
 * In tests, the test harness imports and controls startup manually.
 */
if (process.env.NODE_ENV !== 'test') {
  startApp().catch((error) => {
    // Use console.error here since DI container isn't initialized yet
    console.error('[ERROR] Failed to start Electron app:', error);
    process.exit(1);
  });
}

/**
 * Export window instance for testing and IPC handler access.
 */
export { mainWindow };

// =============================================================================
// UtilityProcess Worker Placeholder (Task 01)
// =============================================================================

/**
 * Spawn a new UtilityProcess worker for TTK simulation.
 *
 * NOTE: This is a placeholder implementation for Task 01.
 * Full lifecycle management will be implemented in Task 05 (SimulationController).
 *
 * @see planos/005-run-ttk-electron/tasks/01_task.md Section 4
 */
export function spawnWorker(): UtilityProcess {
  const worker = utilityProcess.fork(path.join(__dirname, './workers/simulation.worker.js'), [], {
    serviceName: 'SimulationWorker',
    stdio: 'pipe',
  });

  const logger = getLogger();

  // Handle messages from worker
  worker.on('message', (message: WorkerToMainMessage) => {
    logger.info(`Received from worker: ${message.type}`);
    // TODO: Forward to renderer (Task 02 - IPC Layer)
  });

  // Handle worker crashes
  worker.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      logger.error(`Worker crashed with code ${code}`);
    }
  });

  // Log worker stdout for debugging
  worker.stdout?.on('data', (data: Buffer) => {
    logger.debug(`[Worker stdout] ${data.toString()}`);
  });

  // Log worker stderr for debugging
  worker.stderr?.on('data', (data: Buffer) => {
    logger.error(`[Worker stderr] ${data.toString()}`);
  });

  return worker;
}
