/**
 * Simulation Feature
 *
 * Feature for simulation execution and progress tracking.
 * Provides UI for running TTK validation simulations.
 *
 * Components:
 * - ExecutionPanel - Main panel for running simulations
 *
 * Hooks:
 * - useSimulationProgress - Hook for simulation progress state
 *
 * @see Task 06 - Feature Folder Structure
 */

// Components
export { ExecutionPanel } from '../../components/ExecutionPanel';
export type { ExecutionPanelProps } from '../../components/ExecutionPanel';

// Hooks - re-export from hooks directory
export { useSimulationProgress } from '../../hooks/useSimulationProgress';
export type {
  SimulationProgressReturn,
  SimulationConfig,
} from '../../hooks/useSimulationProgress';
