import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigurationPanel, ExecutionPanel, ResultsPanel, HistoryPanel, BackButton } from '@/components'
import type { ProjectConfigFormData } from '@/components/ConfigurationPanel'
import type { SimulationConfigData } from '@coreto/electron/domain/services'
import type { UIProjectConfig } from '@coreto/electron/domain/schemas'
import { useLogger, useConfigSave, useProject } from '@/hooks'
import { mapSimulationReportToReportData } from '@coreto/electron/domain/mappers'
import { mapToSimulationConfig } from '@coreto/electron/domain/services'

/**
 * TTK Validation Flow Component
 *
 * This component encapsulates the complete Time-to-Kill (TTK) validation workflow.
 * Extracted from App.tsx as a risk mitigation step before App.tsx refactoring.
 *
 * Contains:
 * - Project selection panel
 * - Configuration panel
 * - Execution panel with progress tracking
 * - Results panel with color-coded cards
 * - History panel for simulation history
 *
 * Preserved from App.tsx:
 * - useLogger hook (line 23): const logger = useLogger()
 * - All TTK logic without modifications
 * - Race condition guard (projectPathRef)
 * - Auto-load saved trechos from SQLite
 */

export function TTKValidationFlow(): React.ReactElement {
  const logger = useLogger()
  const navigate = useNavigate()
  const { projectInfo } = useProject()
  const { saveConfig } = useConfigSave()
  const [loadedConfig, setLoadedConfig] = useState<UIProjectConfig | null>(null)
  const [simulationCompleted, setSimulationCompleted] = useState<boolean>(false)
  const [historicalReport, setHistoricalReport] = useState<import('@coreto/electron/domain/types').ReportData | null>(null)

  // Ref to track the latest project path for race condition detection (Task 11)
  const projectPathRef = useRef<string | null>(null)

  /**
   * Load config when project path changes from global state.
   * Reacts to project changes from context (e.g., switching projects).
   * Project state is managed globally via React Context (useProject).
   */
  useEffect(() => {
    const projectPathFromContext = projectInfo?.path ?? null

    // Only reload if project path actually changed
    if (projectPathFromContext && projectPathFromContext !== projectPathRef.current) {
      logger.info('Project path changed from global state', { projectPath: projectPathFromContext })
      projectPathRef.current = projectPathFromContext

      // Auto-load saved trechos from SQLite when project changes
      window.coreto.config.load(projectPathFromContext).then((response) => {
        if (response.success && response.data && projectPathRef.current === projectPathFromContext) {
          setLoadedConfig(response.data)
          logger.info('Auto-loaded config from global state', { projectPath: projectPathFromContext })
        }
      }).catch((error) => {
        logger.error('Failed to load config from global state:', error)
      })
    } else if (!projectPathFromContext) {
      // Clear config when no project is selected
      setLoadedConfig(null)
      projectPathRef.current = null
    }
  }, [projectInfo?.path, logger])


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
    if (!loadedConfig || !projectInfo?.path) return null

    const trechosForSim = loadedConfig.trechos.map((t) => ({
      id: t.id,
      name: t.name,
      troopIds: t.troopIds,
    }))

    return mapToSimulationConfig(
      projectInfo.path,
      projectInfo.path,
      trechosForSim,
      loadedConfig.globalSettings ?? { seed: 12345 }
    )
  }, [loadedConfig, projectInfo?.path])

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
    <div className="flex flex-col gap-6">
      {/* Show error if no project is selected */}
      {!projectInfo?.path && (
        <div className="flex flex-col items-center justify-center p-12 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            No Project Selected
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-6 text-center">
            Please select a project from the home screen before accessing TTK Validation.
          </p>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      )}

      {/* Only show TTK panels if project is selected */}
      {projectInfo?.path && (
        <>
          <div className="flex items-center">
            <BackButton />
          </div>
          <ConfigurationPanel
            projectPath={projectInfo.path}
            initialTrechos={loadedConfig?.trechos ?? []}
            onConfigSaved={handleConfigSaved}
          />
          {simulationConfig && (
            <ExecutionPanel
              config={simulationConfig}
              onSimulationComplete={handleSimulationComplete}
            />
          )}
          {simulationCompleted && (
            <ResultsPanel isVisible={true} currentData={historicalReport} />
          )}
          <HistoryPanel
            projectPath={projectInfo.path}
            simulationCompleted={simulationCompleted}
            onLoadReport={handleLoadReport}
          />
        </>
      )}
    </div>
  )
}
