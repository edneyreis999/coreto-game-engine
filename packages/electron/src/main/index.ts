import 'reflect-metadata'
import { app, BrowserWindow, shell, utilityProcess, type UtilityProcess } from 'electron'
import path from 'node:path'
import { setupIpcHandlers, setMainWindowReference } from './ipc/index.js'
import { initDatabase, closeDatabase, setDatabasePath } from './database/index.js'
import { simulationController } from './services/index.js'
import type { WorkerToMainMessage } from './workers/types.js'

/**
 * Main Process Entry Point
 *
 * Initializes the Electron application, creates the main window,
 * and manages app lifecycle events.
 */

let mainWindow: BrowserWindow | null = null

/**
 * Default window dimensions matching TechSpec specifications
 */
const DEFAULT_WINDOW_WIDTH = 1200
const DEFAULT_WINDOW_HEIGHT = 800

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
  mainWindow = new BrowserWindow({
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    title: 'Coreto Dev Portal',
    show: false, // Don't show until ready-to-show
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  // Load the renderer process
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Set window reference for IPC event forwarding (Task 02)
  setMainWindowReference(mainWindow)

  // Handle external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return mainWindow
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
    simulationController.cleanup()
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  /**
   * App lifecycle: macOS-specific: Create new window when clicking dock icon.
   */
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  /**
   * App lifecycle: Before quitting, clean up resources.
   */
  app.on('before-quit', () => {
    // TODO: Save window bounds for persistence (task #6)
    simulationController.cleanup()
    closeDatabase()
  })
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
export async function startApp(): Promise<void> {
  await app.whenReady()
  const dbPath = path.join(app.getPath('userData'), 'coreto.db')
  setDatabasePath(dbPath)
  initDatabase()
  setupIpcHandlers()
  createWindow()
  registerAppLifecycleHandlers()
}

/**
 * Auto-start the app when this module is imported (non-test environment).
 *
 * In production, this runs immediately when Electron launches.
 * In tests, the test harness imports and controls startup manually.
 */
if (process.env.NODE_ENV !== 'test') {
  startApp().catch(error => {
    console.error('Failed to start Electron app:', error)
    process.exit(1)
  })
}

/**
 * Export window instance for testing and IPC handler access.
 */
export { mainWindow }

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
  const worker = utilityProcess.fork(
    path.join(__dirname, './workers/simulation.worker.js'),
    [],
    {
      serviceName: 'SimulationWorker',
      stdio: 'pipe'
    }
  )

  // Handle messages from worker
  worker.on('message', (message: WorkerToMainMessage) => {
    console.log('[Main] Received from worker:', message.type)
    // TODO: Forward to renderer (Task 02 - IPC Layer)
  })

  // Handle worker crashes
  worker.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[Main] Worker crashed with code ${code}`)
    }
  })

  // Log worker stdout for debugging
  worker.stdout?.on('data', (data: Buffer) => {
    console.log(`[Worker stdout] ${data.toString()}`)
  })

  // Log worker stderr for debugging
  worker.stderr?.on('data', (data: Buffer) => {
    console.error(`[Worker stderr] ${data.toString()}`)
  })

  return worker
}
