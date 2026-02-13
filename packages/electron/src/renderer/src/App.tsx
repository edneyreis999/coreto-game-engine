import React, { useState, useCallback, useRef, useMemo } from 'react'
import { ProjectSelectionPanel, ConfigurationPanel, ExecutionPanel, ResultsPanel, HistoryPanel, LogExportButton, OracleMcpTestButton } from '@/components'
import type { ProjectConfigFormData } from '@/components/ConfigurationPanel'
import type { SimulationConfigData } from '@coreto/electron/domain/services'
import type { UIProjectConfig } from '@coreto/electron/domain/schemas'
import { useLogger, useConfigSave } from '@/hooks'
import { mapSimulationReportToReportData } from '@coreto/electron/domain/mappers'
import { mapToSimulationConfig } from '@coreto/electron/domain/services'

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
  const [loadedConfig, setLoadedConfig] = useState<UIProjectConfig | null>(null)
  const [simulationCompleted, setSimulationCompleted] = useState<boolean>(false)
  const [historicalReport, setHistoricalReport] = useState<import('@coreto/electron/domain/types').ReportData | null>(null)

  // Ref to track the latest project path for race condition detection (Task 11)
  const projectPathRef = useRef<string | null>(null)

  const handleProjectSelected = useCallback(async (projectPath: string): Promise<void> => {
    // Only reset if project actually changed
    if (projectPath !== selectedProjectPath) {
      setSelectedProjectPath(projectPath)
      projectPathRef.current = projectPath

      // Reset simulation config when project changes
      setLoadedConfig(null)
      setSimulationCompleted(false)

      // Auto-load saved trechos from SQLite (Task 11)
      try {
        const response = await window.coreto.config.load(projectPath)

        // Race condition guard: ensure project hasn't changed during async load (D011-RACE)
        if (projectPathRef.current === projectPath) {
          if (response.success && response.data) {
            setLoadedConfig(response.data)
          }
        }
      } catch (error) {
        // Graceful error handling: null if load fails
        logger?.error('Failed to load config:', error)
        setLoadedConfig(null)
      }
    }
  }, [selectedProjectPath, logger])

  const handleConfigSaved = useCallback(async (config: ProjectConfigFormData): Promise<void> => {
    const result = await saveConfig({ config, logger })
    if (result.success) {
      // Build UIProjectConfig from the saved config for ConfigurationPanel
      const uiConfig: UIProjectConfig = {
        version: '1.0',
        trechos: config.trechos,
        globalSettings: config.globalSettings,
        metadata: {
          projectName: config.projectPath.split('/').pop() ?? 'Unknown Project',
          lastModified: Date.now(),
        },
      }
      setLoadedConfig(uiConfig)
    }
  }, [saveConfig, logger])

  // Convert loaded config to SimulationConfigData for ExecutionPanel
  const simulationConfig = useMemo(() => {
    if (!loadedConfig) return null

    const trechosForSim = loadedConfig.trechos.map((t) => ({
      id: t.id,
      name: t.name,
      troopIds: t.troopIds,
    }))

    return mapToSimulationConfig(
      selectedProjectPath ?? '',
      selectedProjectPath ?? '',
      trechosForSim,
      loadedConfig.globalSettings ?? { seed: 12345 }
    )
  }, [loadedConfig, selectedProjectPath])

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
        <div className="flex items-center justify-between w-full">
          <div>
            <h1>Coreto Dev Portal</h1>
            <p>Time-to-Kill (TTK) Validation System for RPG Maker MZ</p>
          </div>
          <div className="flex items-center gap-3">
            <OracleMcpTestButton />
            <LogExportButton />
          </div>
        </div>
      </header>
      <main className="app-main">
        <div className="flex flex-col gap-6">
          <ProjectSelectionPanel onProjectSelected={handleProjectSelected} />
          {selectedProjectPath && (
            <ConfigurationPanel
              projectPath={selectedProjectPath}
              initialTrechos={loadedConfig?.trechos ?? []}
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
