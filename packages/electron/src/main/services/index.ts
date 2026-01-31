/**
 * Main Process Services
 *
 * Exports all service classes for the main process.
 *
 * @see packages/electron/src/main/services/
 */

export { SimulationController, simulationController } from './simulation-controller.js';
export { ReportStorageService, generateSimulationId } from './report-storage.js';
export { ConfigService, configService } from './config-service.js';

// Type exports
export type { SimulationSummary, SimulationReport, TrechoSummary } from './types.js';
export type { ProjectConfig, TrechoConfig } from './schemas.js';
