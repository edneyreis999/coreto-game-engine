/**
 * Type Definitions for Preload Exposed APIs
 *
 * This file extends the global Window interface with type definitions
 * for the APIs exposed via contextBridge in the preload script.
 *
 * @see src/preload/index.ts
 */

import type { IPC } from '@electron-toolkit/preload'

/**
 * Standard Electron API exposed via @electron-toolkit/preload
 *
 * Provides type-safe access to common Electron APIs from the renderer process.
 */
interface ElectronAPI {
  ipcRenderer: IPC
}

/**
 * Coreto-specific IPC API
 *
 * This interface will be expanded in task #5 when IPC handlers are implemented.
 * For now, it provides a foundation for type-safe IPC communication.
 *
 * Expected channels (to be implemented in task #5):
 * - project:open - Open and validate RPG Maker MZ project
 * - project:validate - Validate project structure and data
 * - simulation:run - Execute TTK simulation
 * - simulation:getProgress - Get simulation progress
 * - preferences:get - Get user preferences
 * - preferences:set - Set user preferences
 * - history:list - Get simulation history
 */
interface CoretoAPI {
  // Placeholder for future IPC handlers
  // These will be implemented in task #5
}

/**
 * Extend Window interface with exposed preload APIs
 *
 * This allows TypeScript to recognize window.electron and window.coreto
 * in the renderer process.
 */
declare global {
  interface Window {
    /**
     * Standard Electron APIs exposed via @electron-toolkit/preload
     *
     * @example
     * window.electron.ipcRenderer.send('channel', data)
     * const result = await window.electron.ipcRenderer.invoke('channel')
     */
    electron: ElectronAPI

    /**
     * Coreto-specific IPC APIs
     *
     * @example (to be implemented in task #5)
     * const project = await window.coreto.openProject('/path/to/project')
     * const results = await window.coreto.runSimulation(config)
     */
    coreto: CoretoAPI
  }
}

// Export types for use in components
export type { ElectronAPI, CoretoAPI }
