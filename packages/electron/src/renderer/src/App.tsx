import React, { useState } from 'react'
import { ProjectSelectionPanel, ConfigurationPanel, ExecutionPanel, ResultsPanel } from '@/components'
import type { SimulationConfigData } from '@/components'

/**
 * Root App Component
 *
 * This is the main React component for the Coreto Dev Portal.
 * Contains:
 * - Project selection panel (task #6)
 * - Configuration panel (task #7)
 * - Execution panel with progress tracking (task #8)
 * - Results panel with color-coded cards (task #9)
 */

export default function App(): React.ReactElement {
  const [selectedProjectPath, setSelectedProjectPath] = useState<string | null>(null)
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfigData | null>(null)
  const [simulationCompleted, setSimulationCompleted] = useState<boolean>(false)

  const handleProjectSelected = (projectPath: string): void => {
    console.log('Project selected:', projectPath)
    setSelectedProjectPath(projectPath)
    // Reset simulation config when project changes
    setSimulationConfig(null)
    setSimulationCompleted(false)
  }

  const handleConfigSaved = (config: SimulationConfigData): void => {
    console.log('Configuration saved:', config)
    // Store config for Execution Panel
    setSimulationConfig(config)
  }

  const handleSimulationComplete = (result: unknown): void => {
    console.log('Simulation complete:', result)
    // Show Results Panel after simulation completes
    setSimulationCompleted(true)
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
          {simulationConfig && (
            <ExecutionPanel
              config={simulationConfig}
              onSimulationComplete={handleSimulationComplete}
            />
          )}
          {simulationCompleted && (
            <ResultsPanel isVisible={true} />
          )}
        </div>
      </main>
    </div>
  )
}
