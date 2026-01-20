import React from 'react'
import type { IpcRenderer } from 'electron'

/**
 * Root App Component
 *
 * This is the main React component for the Coreto Dev Portal.
 * In future tasks, it will contain:
 * - Project selection panel (task #6)
 * - Configuration panel (task #7)
 * - Execution panel with progress tracking (task #8)
 * - Results panel with color-coded cards (task #9)
 */

export default function App(): React.ReactElement {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Coreto Dev Portal</h1>
        <p>Time-to-Kill (TTK) Validation System for RPG Maker MZ</p>
      </header>
      <main className="app-main">
        <div className="placeholder-content">
          <h2>Welcome to Coreto Dev Portal</h2>
          <p>
            This application is currently being scaffolded. Full functionality will be
            available in upcoming tasks.
          </p>
          <ul>
            <li>Task #6: Project Selection Panel</li>
            <li>Task #7: Configuration Panel</li>
            <li>Task #8: Execution Panel</li>
            <li>Task #9: Results Panel</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

/**
 * Extend Window interface with electron and coreto APIs exposed via preload.
 *
 * This will be expanded in task #5 when IPC handlers are implemented.
 */
declare global {
  interface Window {
    electron: {
      ipcRenderer: IpcRenderer
      // Additional Electron APIs from @electron-toolkit/preload
    }
    coreto: {
      // Coreto-specific IPC methods (to be implemented in task #5)
    }
  }
}
