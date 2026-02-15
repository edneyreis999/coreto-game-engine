/**
 * Contexts Barrel Export
 *
 * Exports all React contexts from the contexts directory.
 */

export { ProjectProvider, useProject } from './ProjectContext';
export type { ProjectContextValue, ProjectProviderProps } from './ProjectContext';

// Re-export utility functions from useProject
export {
  isValidStatus,
  isInvalidStatus,
  isValidatingStatus,
  isIdleStatus,
  getValidationMessage,
} from './ProjectContext';

// Re-export types for backwards compatibility with old useProject hook location
export type { ValidationStatus } from './ProjectContext';
