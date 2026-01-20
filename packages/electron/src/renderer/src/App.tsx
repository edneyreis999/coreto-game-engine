import React from 'react'
import { ProjectSelectionPanel } from '@/components'

/**
 * Root App Component
 *
 * This is the main React component for the Coreto Dev Portal.
 * Currently contains:
 * - Project selection panel (task #6)
 *
 * In future tasks, it will contain:
 * - Configuration panel (task #7)
 * - Execution panel with progress tracking (task #8)
 * - Results panel with color-coded cards (task #9)
 */

export default function App(): React.ReactElement {
  const handleProjectSelected = (projectPath: string): void => {
    console.log('Project selected:', projectPath)
    // TODO: Store project path in state for use in other panels
    // TODO: Enable navigation to next panels
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Coreto Dev Portal</h1>
        <p>Time-to-Kill (TTK) Validation System for RPG Maker MZ</p>
      </header>
      <main className="app-main">
        <ProjectSelectionPanel onProjectSelected={handleProjectSelected} />
      </main>
    </div>
  )
}
