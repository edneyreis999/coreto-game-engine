import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'

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
    // TODO: Close database connection (task #5)
  })
}

/**
 * Initializes and starts the Electron application.
 *
 * This function:
 * 1. Waits for Electron to be ready
 * 2. Creates the main window
 * 3. Registers app lifecycle handlers
 *
 * @returns Promise that resolves when the app is ready
 */
export async function startApp(): Promise<void> {
  await app.whenReady()
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
