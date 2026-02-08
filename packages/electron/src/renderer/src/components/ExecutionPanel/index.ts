/**
 * ExecutionPanel Component Barrel Export
 *
 * Exports all ExecutionPanel-related components and types.
 *
 * @see packages/electron/src/renderer/src/components/ExecutionPanel/ExecutionPanel.tsx
 */

// Main component
export { ExecutionPanel } from './ExecutionPanel';
export type { ExecutionPanelProps, SimulationConfigData } from './ExecutionPanel';

// Sub-components
export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps } from './ProgressBar';

export { StatusBanner } from './StatusBanner';
export type { StatusBannerProps, StatusBannerVariant } from './StatusBanner';

export { ExecutionPanelHeader } from './ExecutionPanelHeader';
export type { ExecutionPanelHeaderProps } from './ExecutionPanelHeader';

// State components
export {
  ConfigNotReadyState,
  IdleState,
  RunningState,
  CompletedState,
  ErrorState,
} from './ExecutionPanelStates';
export type {
  ConfigNotReadyStateProps,
  IdleStateProps,
  RunningStateProps,
  CompletedStateProps,
  ErrorStateProps,
} from './ExecutionPanelStates';

// Utilities
export {
  isRunningStatus,
  isCompletedStatus,
  isErrorStatus,
  isIdleStatus,
  getStatusMessage,
} from './statusUtils';
export type { SimulationStatus } from './statusUtils';

export { getCurrentItem } from './renderUtils';
export type { ProgressData } from './renderUtils';
