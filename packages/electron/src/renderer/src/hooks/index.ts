/**
 * Hooks Barrel Export
 *
 * Exports all custom React hooks from the hooks directory.
 */

export { useIpc, useIpcWithArg } from './useIpc';
export { useRecentProjects, getProjectValidationStatus } from './useRecentProjects';
export {
  useProject,
  isValidStatus,
  isInvalidStatus,
  isValidatingStatus,
  isIdleStatus,
  getValidationMessage,
} from './useProject';
export { useConfig } from './useConfig';
export { useConfigSave } from './useConfigSave';
export { useSimulationProgress } from './useSimulationProgress';
export { useSimulationHistory } from './useSimulationHistory';
export { useFieldValidation } from './useFieldValidation';
export {
  useLogger,
  logBuffer,
  createLogEntry,
  type Logger,
  type LogEntry,
} from './useLogger/index';
export {
  useConfigurationManager,
  type UseConfigurationManagerReturn,
} from './useConfigurationManager';
export {
  useOracleMcpClient,
  type GenerateNsdPromptParams,
  type UseOracleMcpClientResult,
} from './useOracleMcpClient';
