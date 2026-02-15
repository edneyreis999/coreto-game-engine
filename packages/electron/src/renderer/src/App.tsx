import React, { useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ProjectSelectionPanel, Home, TTKValidationFlow, NSDGeneratorPlaceholder, LogExportButton, OracleMcpTestButton } from '@/components'
import { useLogger } from '@/hooks'

/**
 * Root App Component
 *
 * This is the main React component for the Coreto Dev Portal.
 * Now using React Router for SPA navigation with HashRouter.
 *
 * Routes:
 * - / → ProjectSelectionPage (project selection)
 * - /home → HomePage (main navigation portal)
 * - /ttk → TTKValidationFlow (complete TTK validation workflow)
 * - /nsd → NSDGeneratorPlaceholder (placeholder for Sprint 2)
 *
 * Features:
 * - HashRouter for file:// protocol compatibility
 * - Toaster from sonner for toast notifications
 * - useLogger for router initialization and route change logging
 * - Global header with action buttons
 */

/**
 * RouterTracker Component
 *
 * Tracks route changes and logs them via useLogger.
 * This component must be inside HashRouter to access useLocation.
 */
function RouterTracker(): React.ReactElement | null {
  const logger = useLogger()
  const location = useLocation()

  useEffect(() => {
    logger.info('Route changed', { to: location.pathname })
  }, [location, logger])

  return null
}

export default function App(): React.ReactElement {
  const logger = useLogger()

  // Log router initialization on mount
  useEffect(() => {
    logger.info('Router initialized', { routes: ['/', '/home', '/ttk', '/nsd'] })
  }, [logger])

  return (
    <HashRouter>
      <div className="app-container">
        {/* Global Header */}
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

        {/* Main Content with Router Routes */}
        <main className="app-main">
          <Routes>
            {/* Route: Project Selection (default landing page) */}
            <Route
              path="/"
              element={
                <div className="flex flex-col gap-6">
                  <ProjectSelectionPanel />
                </div>
              }
            />

            {/* Route: Home Portal Navigation */}
            <Route path="/home" element={<Home />} />

            {/* Route: TTK Validation Flow (complete workflow) */}
            <Route path="/ttk" element={<TTKValidationFlow />} />

            {/* Route: NSD Generator Placeholder (Sprint 2) */}
            <Route path="/nsd" element={<NSDGeneratorPlaceholder />} />
          </Routes>
        </main>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            classNames: {
              toast: 'font-sans',
            },
          }}
        />

        {/* Router Tracker (hidden, logs route changes) */}
        <RouterTracker />
      </div>
    </HashRouter>
  )
}
