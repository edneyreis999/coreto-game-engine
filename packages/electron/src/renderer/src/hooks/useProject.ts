/**
 * useProject Hook
 *
 * MIGRATED: This hook now uses React Context for global state management.
 * The implementation has moved to @/contexts/ProjectContext.tsx.
 *
 * This file re-exports useProject from the context for backwards compatibility.
 * Existing imports using `import { useProject } from '@/hooks'` will continue to work.
 *
 * Migration notes:
 * - API is unchanged - same return types, same function signatures
 * - State is now shared globally across all components using useProject()
 * - Must wrap app with <ProjectProvider> in App.tsx
 *
 * @see @/contexts/ProjectContext.tsx for the actual implementation
 * @see docs/tecnical-debit/001-useproject-global-state.md for the migration details
 */

// Re-export everything from ProjectContext for backwards compatibility
export {
  useProject,
  ProjectProvider,
  isValidStatus,
  isInvalidStatus,
  isValidatingStatus,
  isIdleStatus,
  getValidationMessage,
} from '@/contexts/ProjectContext';

// Re-export types
export type {
  ProjectContextValue,
  ValidationStatus,
  ProjectProviderProps,
} from '@/contexts/ProjectContext';

// Re-export ProjectInfo for convenience
export type { ProjectInfo } from '@coreto/electron/domain/types';
