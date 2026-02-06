import React, { useState, useCallback } from 'react'
import { ProjectSelectionPanel, ConfigurationPanel, ExecutionPanel, ResultsPanel } from '@/components'
import type { ProjectConfigFormData } from '@/components/ConfigurationPanel'
import type { SimulationConfigData } from '@coreto/electron/domain/services'
import { extractProjectName, mapToSimulationConfig } from '@coreto/electron/domain/services'

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

  const handleProjectSelected = useCallback((projectPath: string): void => {
    // Only reset if project actually changed
    if (projectPath !== selectedProjectPath) {
      setSelectedProjectPath(projectPath)
      // Reset simulation config when project changes
      setSimulationConfig(null)
      setSimulationCompleted(false)
    }
  }, [selectedProjectPath])

  const handleConfigSaved = useCallback(async (config: ProjectConfigFormData): Promise<void> => {
    try {
      // Call IPC to save config with the full trecho data
      const response = await window.coreto.saveConfig(config.projectPath, {
        version: '1.0',
        trechos: config.trechos,
        globalSettings: config.globalSettings,
        metadata: {
          projectName: extractProjectName(config.projectPath),
          lastModified: Date.now(),
        },
      })

      if (response.success) {
        // Convert to SimulationConfigData using domain mapper
        const simConfig = mapToSimulationConfig(
          config.projectPath,
          response.data.configPath,
          config.trechos.map(t => ({
            id: t.id,
            name: t.name,
            troopIds: t.troopIds,
          })),
          config.globalSettings
        )
        setSimulationConfig(simConfig)
      } else {
        console.error('[App] Failed to save configuration:', response.error)
      }
    } catch (error) {
      console.error('[App] Error saving configuration:', error)
    }
  }, [])

  const handleSimulationComplete = (result: unknown): void => {
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
