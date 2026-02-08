import React, { useState, useCallback } from 'react'
import { ProjectSelectionPanel, ConfigurationPanel, ExecutionPanel, ResultsPanel, HistoryPanel } from '@/components'
import type { ProjectConfigFormData } from '@/components/ConfigurationPanel'
import type { SimulationConfigData } from '@coreto/electron/domain/services'
import { useLogger, useConfigSave } from '@/hooks'
import { mapSimulationReportToReportData } from '@coreto/electron/domain/mappers'

/**
 * Root App Component
 *
 * This is the main React component for the Coreto Dev Portal.
 * Contains:
 * - Project selection panel (task #6)
 * - Configuration panel (task #7)
 * - Execution panel with progress tracking (task #8)
 * - Results panel with color-coded cards (task #9)
 * - History panel for simulation history (task #11)
 */

export default function App(): React.ReactElement {
  const logger = useLogger()
  const { saveConfig } = useConfigSave()
  const [selectedProjectPath, setSelectedProjectPath] = useState<string | null>(null)
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfigData | null>(null)
  const [simulationCompleted, setSimulationCompleted] = useState<boolean>(false)
  const [historicalReport, setHistoricalReport] = useState<import('@coreto/electron/domain/types').ReportData | null>(null)

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
    const result = await saveConfig({ config, logger })
    if (result.success && result.simConfig) {
      setSimulationConfig(result.simConfig)
    }
  }, [saveConfig, logger])

  const handleSimulationComplete = (_result: unknown): void => {
    // Show Results Panel after simulation completes
    setSimulationCompleted(true)
    // Clear historical report when new simulation completes
    setHistoricalReport(null)
  }

  const handleLoadReport = useCallback((simulationId: string, report: import('@/types/preload').SimulationReport) => {
    // Load historical report data into ResultsPanel
    // Convert SimulationReport to ReportData format using domain mapper
    const reportData = mapSimulationReportToReportData(simulationId, report)

    setHistoricalReport(reportData)
    setSimulationCompleted(true)

    // Scroll to ResultsPanel
    setTimeout(() => {
      const resultsPanel = document.querySelector('[data-results-panel]')
      if (resultsPanel) {
        resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }, [])

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
            <ResultsPanel isVisible={true} currentData={historicalReport} />
          )}
          {selectedProjectPath && (
            <HistoryPanel
              projectPath={selectedProjectPath}
              simulationCompleted={simulationCompleted}
              onLoadReport={handleLoadReport}
            />
          )}
        </div>
      </main>
    </div>
  )
}
