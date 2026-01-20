import React, { useState } from 'react'
import { ProjectSelectionPanel, ConfigurationPanel } from '@/components'

/**
 * Root App Component
 *
 * This is the main React component for the Coreto Dev Portal.
 * Currently contains:
 * - Project selection panel (task #6)
 * - Configuration panel (task #7)
 *
 * In future tasks, it will contain:
 * - Execution panel with progress tracking (task #8)
 * - Results panel with color-coded cards (task #9)
 */

export default function App(): React.ReactElement {
  const [selectedProjectPath, setSelectedProjectPath] = useState<string | null>(null)

  const handleProjectSelected = (projectPath: string): void => {
    console.log('Project selected:', projectPath)
    setSelectedProjectPath(projectPath)
  }

  const handleConfigSaved = (config: unknown): void => {
    console.log('Configuration saved:', config)
    // TODO: Persist configuration via IPC
    // TODO: Enable navigation to next panels
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Coreto Dev Portal</h1>
        <p>Time-to-Kill (TTK) Validation System for RPG Maker MZ</p>
      </header>
      <main className="app-main">
        <div className="flex flex-col gap-6">
          <ProjectSelectionPanel onProjectSelected={handleProjectSelected} />
          {selectedProjectPath && (
            <ConfigurationPanel
              projectPath={selectedProjectPath}
              onConfigSaved={handleConfigSaved}
            />
          )}
        </div>
      </main>
    </div>
  )
}
