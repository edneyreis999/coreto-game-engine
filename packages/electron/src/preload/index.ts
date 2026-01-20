import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

/**
 * Preload Script - IPC Bridge Foundation
 *
 * This script runs in an isolated context (sandboxed) and provides
 * a secure bridge between the renderer process and main process via
 * contextBridge and ipcRenderer.
 *
 * Security features:
 * - Context isolation: ENABLED (renderer cannot access Node.js APIs)
 * - Sandbox: ENABLED (preload has limited Node.js access)
 * - Node integration: DISABLED in renderer
 *
 * The @electron-toolkit/preload provides a type-safe electronAPI
 * that exposes common Electron APIs to the renderer process.
 */

/**
 * Custom API for Coreto-specific IPC communication.
 *
 * This API will be extended in task #5 when IPC handlers are implemented.
 * For now, it provides a foundation for type-safe IPC communication.
 *
 * Expected channels:
 * - project:open, project:validate
 * - simulation:run, simulation:getProgress
 * - preferences:get, preferences:set
 * - history:list
 */
const coretoAPI = {
  // Placeholder for future IPC handlers
  // These will be implemented in task #5
}

/**
 * Expose APIs to renderer process via contextBridge.
 *
 * The renderer process can access:
 * - window.electron: Standard Electron APIs (via @electron-toolkit/preload)
 * - window.coreto: Coreto-specific IPC APIs (to be implemented)
 */
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('coreto', coretoAPI)
  } catch (error) {
    console.error('Failed to expose context bridge APIs:', error)
  }
} else {
  // Fallback for non-isolated context (should not happen with proper config)
  console.warn('Context isolation is not enabled. This is a security risk.')
}

/**
 * Type definitions for the exposed APIs (for TypeScript in renderer)
 *
 * Add to src/renderer/src/types/preload.d.ts or similar:
 *
 * interface ElectronAPI {
 *   // Types from @electron-toolkit/preload
 * }
 *
 * interface CoretoAPI {
 *   // Coreto-specific IPC methods (to be defined in task #5)
 * }
 *
 * declare global {
 *   interface Window {
 *     electron: ElectronAPI
 *     coreto: CoretoAPI
 *   }
 * }
 */
