/**
 * useProject Hook
 *
 * Custom React hook for managing project operations.
 * Provides state management for opening and validating RPG Maker MZ projects.
 *
 * @see packages/electron/src/main/ipc/handlers.ts (project:open, project:validate)
 */

import { useCallback, useState } from 'react';

import type { ProjectInfo } from '@coreto/electron/preload/index.js';

// ============================================================================
// Validation Status
// ============================================================================

/**
 * Validation status of a project.
 */
export type ValidationStatus =
  | 'idle'
  | 'validating'
  | 'valid'
  | 'invalid';

/**
 * Validation state including status and errors.
 */
interface ValidationState {
  status: ValidationStatus;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Hook State
// ============================================================================

/**
 * State for project operations.
 */
interface ProjectState {
  projectInfo: ProjectInfo | null;
  validation: ValidationState;
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// Hook Return Value
// ============================================================================

/**
 * Return value for useProject hook.
 */
interface ProjectReturn extends ProjectState {
  /**
   * Opens and validates a project by path.
   * @param projectPath - Absolute path to the project directory
   */
  openProject: (projectPath: string) => Promise<void>;

  /**
   * Validates a project by path without opening it.
   * @param projectPath - Absolute path to the project directory
   */
  validateProject: (projectPath: string) => Promise<void>;

  /**
   * Resets the state to initial values.
   */
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

/**
 * Initial validation state.
 */
const initialValidationState: ValidationState = {
  status: 'idle',
  errors: [],
  warnings: [],
};

/**
 * Initial project state.
 */
const initialState: ProjectState = {
  projectInfo: null,
  validation: initialValidationState,
  isLoading: false,
  error: null,
};

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Creates an error object from an IPC error response.
 */
function createIpcError(ipcError: {
  name: string;
  message: string;
  severity: string;
  context: Record<string, unknown>;
  timestamp: string;
}): Error {
  const error = new Error(ipcError.message);
  error.name = ipcError.name;
  return error;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Custom hook for managing project operations.
 *
 * Provides functions to open and validate RPG Maker MZ projects.
 * Updates state with project info and validation results.
 *
 * @returns Project state and control functions
 *
 * @example
 * const { projectInfo, validation, isLoading, error, openProject, validateProject } = useProject();
 *
 * // Open a project
 * await openProject('/path/to/project');
 *
 * // Validate without opening
 * await validateProject('/path/to/project');
 *
 * // Check if project is valid
 * if (validation.status === 'valid') {
 *   console.log('Project is valid!');
 * }
 */
export function useProject(): ProjectReturn {
  const [state, setState] = useState<ProjectState>(initialState);

  /**
   * Resets the state to initial values.
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  /**
   * Opens and validates a project by path.
   * Updates state with project info and validation results.
   */
  const openProject = useCallback(async (projectPath: string) => {
    setState({
      projectInfo: null,
      validation: { status: 'validating', errors: [], warnings: [] },
      isLoading: true,
      error: null,
    });

    try {
      const result = await window.coreto.openProject(projectPath);

      if (result.success) {
        const info = result.data;
        setState({
          projectInfo: info,
          validation: {
            status: info.isValid ? 'valid' : 'invalid',
            errors: info.isValid ? [] : ['Project is not valid'],
            warnings: [],
          },
          isLoading: false,
          error: null,
        });
      } else {
        setState({
          projectInfo: null,
          validation: {
            status: 'invalid',
            errors: [result.error.message],
            warnings: [],
          },
          isLoading: false,
          error: createIpcError(result.error),
        });
      }
    } catch (error) {
      setState({
        projectInfo: null,
        validation: {
          status: 'invalid',
          errors: [error instanceof Error ? error.message : String(error)],
          warnings: [],
        },
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, []);

  /**
   * Validates a project by path without opening it.
   * Updates state with validation results only.
   */
  const validateProject = useCallback(async (projectPath: string) => {
    setState((prev) => ({
      ...prev,
      validation: { status: 'validating', errors: [], warnings: [] },
      isLoading: true,
      error: null,
    }));

    try {
      const result = await window.coreto.validateProject(projectPath);

      if (result.success) {
        const validationData = result.data;
        setState({
          projectInfo: null,
          validation: {
            status: validationData.isValid ? 'valid' : 'invalid',
            errors: validationData.errors,
            warnings: validationData.warnings,
          },
          isLoading: false,
          error: null,
        });
      } else {
        setState({
          projectInfo: null,
          validation: {
            status: 'invalid',
            errors: [result.error.message],
            warnings: [],
          },
          isLoading: false,
          error: createIpcError(result.error),
        });
      }
    } catch (error) {
      setState({
        projectInfo: null,
        validation: {
          status: 'invalid',
          errors: [error instanceof Error ? error.message : String(error)],
          warnings: [],
        },
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, []);

  return {
    ...state,
    openProject,
    validateProject,
    reset,
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Checks if a validation status represents a valid project.
 */
export function isValidStatus(status: ValidationStatus): boolean {
  return status === 'valid';
}

/**
 * Checks if a validation status represents an invalid project.
 */
export function isInvalidStatus(status: ValidationStatus): boolean {
  return status === 'invalid';
}

/**
 * Checks if a validation is currently in progress.
 */
export function isValidatingStatus(status: ValidationStatus): boolean {
  return status === 'validating';
}

/**
 * Checks if validation hasn't started yet.
 */
export function isIdleStatus(status: ValidationStatus): boolean {
  return status === 'idle';
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
      return 'Select a project to begin';
    case 'validating':
      return projectName
        ? `Validating ${projectName}...`
        : 'Validating project...';
    case 'valid':
      return projectName
        ? `${projectName} is a valid RPG Maker MZ project`
        : 'Valid RPG Maker MZ project';
    case 'invalid':
      if (validation.errors.length > 0) {
        return validation.errors[0] ?? 'Invalid project';
      }
      return 'Invalid project';
    default:
      return 'Unknown status';
  }
}
