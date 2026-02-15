/**
 * ProjectContext
 *
 * React Context for global project state management.
 * Solves the issue where components couldn't share project state across routes.
 *
 * Before: Each useProject() call created independent local state
 * After: All components share the same project state via Context
 *
 * @see docs/tecnical-debit/001-useproject-global-state.md
 */

import React, { type FC, useCallback, useState, useContext, useMemo } from 'react'

import type { ProjectInfo } from '@coreto/electron/domain/types'
import { useLogger } from '@/hooks'

// ============================================================================
// Validation Status
// ============================================================================

/**
 * Validation status of a project.
 */
export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

/**
 * Validation state including status and errors.
 */
interface ValidationState {
  status: ValidationStatus
  errors: string[]
  warnings: string[]
}

// ============================================================================
// Context State
// ============================================================================

/**
 * State for project operations.
 */
interface ProjectState {
  projectInfo: ProjectInfo | null
  validation: ValidationState
  isLoading: boolean
  error: Error | null
}

/**
 * Initial validation state.
 */
const initialValidationState: ValidationState = {
  status: 'idle',
  errors: [],
  warnings: [],
}

/**
 * Initial project state.
 */
const initialState: ProjectState = {
  projectInfo: null,
  validation: initialValidationState,
  isLoading: false,
  error: null,
}

// ============================================================================
// Context Value
// ============================================================================

/**
 * Value provided by ProjectContext.
 * Combines state with control functions.
 */
export interface ProjectContextValue extends ProjectState {
  /**
   * Opens and validates a project by path.
   * @param projectPath - Absolute path to the project directory
   */
  openProject: (projectPath: string) => Promise<void>

  /**
   * Validates a project by path without opening it.
   * @param projectPath - Absolute path to the project directory
   */
  validateProject: (projectPath: string) => Promise<void>

  /**
   * Resets the state to initial values.
   */
  reset: () => void
}

// ============================================================================
// Context Definition
// ============================================================================

/**
 * React Context for project state management.
 * Must be used within ProjectProvider.
 */
const ProjectContext = React.createContext<ProjectContextValue | null>(null)

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Creates an error object from an IPC error response.
 */
function createIpcError(ipcError: {
  name: string
  message: string
  severity: string
  context: Record<string, unknown>
  timestamp: string
}): Error {
  const error = new Error(ipcError.message)
  error.name = ipcError.name
  return error
}

// ============================================================================
// ProjectProvider Component
// ============================================================================

/**
 * ProjectProvider Component Props
 */
interface ProjectProviderProps {
  /**
   * Child components that will have access to project state.
   */
  children: React.ReactNode
}

/**
 * ProjectProvider Component
 *
 * Provides global project state to all child components.
 * Wraps the application with React Context for state sharing.
 *
 * @example
 * <ProjectProvider>
 *   <HashRouter>
 *     <App />
 *   </HashRouter>
 * </ProjectProvider>
 *
 * Features:
 * - Global state management for project selection
 * - All components using useProject() share the same state
 * - Automatic state synchronization across routes
 * - No manual state plumbing required
 */
export const ProjectProvider: FC<ProjectProviderProps> = ({ children }) => {
  const logger = useLogger()
  const [state, setState] = useState<ProjectState>(initialState)

  /**
   * Resets the state to initial values.
   */
  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  /**
   * Opens and validates a project by path.
   * Updates context state with project info and validation results.
   */
  const openProject = useCallback(async (projectPath: string) => {
    logger.debug(`[ProjectProvider] openProject called with: ${projectPath}`)
    setState({
      projectInfo: null,
      validation: { status: 'validating', errors: [], warnings: [] },
      isLoading: true,
      error: null,
    })

    try {
      logger.debug('[ProjectProvider] Calling window.coreto.project.open...')
      const result = await window.coreto.project.open(projectPath)
      logger.debug(`[ProjectProvider] openProject result: ${JSON.stringify(result)}`)

      if (result.success) {
        const info = result.data
        logger.debug(`[ProjectProvider] Project is valid, info: ${JSON.stringify(info)}`)
        setState({
          projectInfo: info,
          validation: {
            status: info.isValid ? 'valid' : 'invalid',
            errors: info.isValid ? [] : ['Project is not valid'],
            warnings: [],
          },
          isLoading: false,
          error: null,
        })
      } else {
        logger.warn(`[ProjectProvider] Project is invalid, error: ${JSON.stringify(result.error)}`)
        setState({
          projectInfo: null,
          validation: {
            status: 'invalid',
            errors: [result.error.message],
            warnings: [],
          },
          isLoading: false,
          error: createIpcError(result.error),
        })
      }
    } catch (error) {
      logger.error(`[ProjectProvider] Exception during openProject: ${String(error)}`)
      setState({
        projectInfo: null,
        validation: {
          status: 'invalid',
          errors: [error instanceof Error ? error.message : String(error)],
          warnings: [],
        },
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }, [logger])

  /**
   * Validates a project by path without opening it.
   * Updates context state with validation results only.
   * Preserves existing projectInfo to maintain context.
   */
  const validateProject = useCallback(async (projectPath: string) => {
    setState((prev) => ({
      ...prev,
      validation: { status: 'validating', errors: [], warnings: [] },
      isLoading: true,
      error: null,
    }))

    try {
      const result = await window.coreto.project.validate(projectPath)

      if (result.success) {
        const validationData = result.data
        setState((prev) => ({
          projectInfo: prev.projectInfo, // Preserve existing project info
          validation: {
            status: validationData.isValid ? 'valid' : 'invalid',
            errors: validationData.errors,
            warnings: validationData.warnings,
          },
          isLoading: false,
          error: null,
        }))
      } else {
        setState((prev) => ({
          projectInfo: prev.projectInfo, // Preserve existing project info
          validation: {
            status: 'invalid',
            errors: [result.error.message],
            warnings: [],
          },
          isLoading: false,
          error: createIpcError(result.error),
        }))
      }
    } catch (error) {
      setState((prev) => ({
        projectInfo: prev.projectInfo, // Preserve existing project info
        validation: {
          status: 'invalid',
          errors: [error instanceof Error ? error.message : String(error)],
          warnings: [],
        },
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }))
    }
  }, [logger])

  /**
   * Context value memoized to prevent unnecessary re-renders.
   * Only changes when state or functions change.
   * This prevents all consumers from re-rendering on every Provider render.
   */
  const value: ProjectContextValue = useMemo(() => ({
    ...state,
    openProject,
    validateProject,
    reset,
  }), [state, openProject, validateProject, reset])

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

// ============================================================================
// useProject Hook
// ============================================================================

/**
 * useProject Hook
 *
 * Custom React hook that accesses the global project state from Context.
 * Must be used within a ProjectProvider wrapper.
 *
 * @throws {Error} If used outside ProjectProvider
 * @returns Project state and control functions
 *
 * @example
 * const { projectInfo, validation, isLoading, error, openProject, validateProject } = useProject()
 *
 * // Get current project path
 * const projectPath = projectInfo?.path
 *
 * // Open a project
 * await openProject('/path/to/project')
 *
 * // Check if project is valid
 * if (validation.status === 'valid') {
 *   console.log('Project is valid!')
 * }
 */
export function useProject(): ProjectContextValue {
  const context = useContext(ProjectContext)

  if (context === null) {
    throw new Error(
      'useProject must be used within a ProjectProvider. ' +
      'Wrap your app with <ProjectProvider> in App.tsx.'
    )
  }

  return context
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Checks if a validation status represents a valid project.
 */
export function isValidStatus(status: ValidationStatus): boolean {
  return status === 'valid'
}

/**
 * Checks if a validation status represents an invalid project.
 */
export function isInvalidStatus(status: ValidationStatus): boolean {
  return status === 'invalid'
}

/**
 * Checks if a validation is currently in progress.
 */
export function isValidatingStatus(status: ValidationStatus): boolean {
  return status === 'validating'
}

/**
 * Checks if validation hasn't started yet.
 */
export function isIdleStatus(status: ValidationStatus): boolean {
  return status === 'idle'
}

/**
 * Gets a human-readable message for the validation status.
 */
export function getValidationMessage(
  validation: ValidationState,
  projectName?: string
): string {
  switch (validation.status) {
    case 'idle':
      return 'Select a project to begin'
    case 'validating':
      return projectName ? `Validating ${projectName}...` : 'Validating project...'
    case 'valid':
      return projectName
        ? `${projectName} is a valid RPG Maker MZ project`
        : 'Valid RPG Maker MZ project'
    case 'invalid':
      if (validation.errors.length > 0) {
        return validation.errors[0] ?? 'Invalid project'
      }
      return 'Invalid project'
    default:
      return 'Unknown status'
  }
}
