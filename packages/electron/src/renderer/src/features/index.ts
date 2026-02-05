/**
 * Features Barrel Export
 *
 * Exports all feature modules from the features directory.
 *
 * Each feature represents a distinct functional area of the application:
 * - project-selection: Project selection and validation
 * - configuration: TTK configuration management
 * - simulation: Simulation execution and progress
 * - results: Simulation results display
 * - history: Simulation history management
 *
 * @see Task 06 - Feature Folder Structure
 */

// Project Selection Feature
export {
  ProjectSelectionPanel,
  type ProjectSelectionPanelProps,
} from './project-selection';

// Configuration Feature
export {
  ConfigurationPanel,
  type ConfigurationPanelProps,
  TrechosListSection,
  type TrechosListSectionProps,
  TrechoForm,
  type TrechoFormProps,
  GlobalSettingsSection,
  type GlobalSettingsSectionProps,
} from './configuration';

// Simulation Feature
export {
  ExecutionPanel,
  type ExecutionPanelProps,
  useSimulationProgress,
  type SimulationProgressReturn,
  type SimulationConfig,
} from './simulation';

// Results Feature
export {
  ResultsPanel,
  type ResultsPanelProps,
  TrechoCard,
  type TrechoCardProps,
  BattleDetails,
  type BattleDetailsProps,
  WarningsList,
  type WarningsListProps,
  EmptyState,
  type EmptyStateProps,
  useSimulationResults,
  type UseSimulationResultsReturn,
} from './results';

// History Feature
export {
  HistoryPanel,
  type HistoryPanelProps,
  HistoryListItem,
  type HistoryListItemProps,
  useSimulationHistory,
  type UseSimulationHistoryReturn,
  type UseSimulationHistoryOptions,
} from './history';
