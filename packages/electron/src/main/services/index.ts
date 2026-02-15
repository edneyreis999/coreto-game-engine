/**
 * Main Process Services
 *
 * Exports all service classes for the main process.
 *
 * @see packages/electron/src/main/services/
 */

export { SimulationController, simulationController } from './simulation-controller.js';
export { ReportStorageService, generateSimulationId } from './report-storage.js';
export { initializeLogCapture, logCapture, logAggregator } from './log-capture.js';
export { McpClientService, mcpClientService } from './McpClientService.js';
export { NsdParserService } from './nsd-parser.service.js';

// Type exports
export type { SimulationSummary, SimulationReport, TrechoSummary } from './types.js';
// Note: Renamed from ProjectConfig/TrechoConfig to UIProjectConfig/UITrechoConfig
// to avoid naming collision with @coreto/core's types
export type { UIProjectConfig, UITrechoConfig } from './schemas.js';
export type { LogEntry, LogBundle } from './log-capture.js';
export type {
  NSDProgressStage,
  NSDProgressCallback,
  NSDErrorCode,
  NSDParseError,
} from './nsd-parser.service.js';
