/**
 * History Feature
 *
 * Feature for simulation history management.
 * Provides UI for viewing, exporting, and deleting past simulation runs.
 *
 * Components:
 * - HistoryPanel - Main history panel
 * - HistoryListItem - Individual history entry
 *
 * Hooks:
 * - useSimulationHistory - Hook for history state management
 *
 * @see Task 06 - Feature Folder Structure & Task 11 - Simulation History
 */

// Components
export { HistoryPanel } from '../../components/HistoryPanel';
export type { HistoryPanelProps } from '../../components/HistoryPanel';

export { HistoryListItem } from '../../components/HistoryPanel/HistoryListItem';
export type { HistoryListItemProps } from '../../components/HistoryPanel/HistoryListItem';

// Hooks - re-export from hooks directory
export { useSimulationHistory } from '../../hooks/useSimulationHistory';
export type {
  UseSimulationHistoryReturn,
  UseSimulationHistoryOptions,
} from '../../hooks/useSimulationHistory';
