/**
 * Results Feature
 *
 * Feature for displaying simulation results.
 * Provides UI for viewing TTK validation results with color-coded indicators.
 *
 * Components:
 * - ResultsPanel - Main results panel
 * - TrechoCard - Individual trecho result card
 * - BattleDetails - Expandable battle details
 * - WarningsList - List of warnings with severity
 * - EmptyState - Empty state placeholder
 *
 * Hooks:
 * - useSimulationResults - Hook for loading simulation results
 *
 * @see Task 06 - Feature Folder Structure
 */

// Components
export { ResultsPanel } from '../../components/ResultsPanel';
export type { ResultsPanelProps } from '../../components/ResultsPanel';

export { TrechoCard } from '../../components/ResultsPanel/TrechoCard';
export type { TrechoCardProps } from '../../components/ResultsPanel/TrechoCard';

export { BattleDetails } from '../../components/ResultsPanel/BattleDetails';
export type { BattleDetailsProps } from '../../components/ResultsPanel/BattleDetails';

export { WarningsList } from '../../components/ResultsPanel/WarningsList';
export type { WarningsListProps } from '../../components/ResultsPanel/WarningsList';

export { EmptyState } from '../../components/ResultsPanel/EmptyState';
export type { EmptyStateProps } from '../../components/ResultsPanel/EmptyState';

// Hooks - re-export from hooks directory
export { useSimulationResults } from '../../hooks/useSimulationResults';
export type { UseSimulationResultsReturn } from '../../hooks/useSimulationResults';
