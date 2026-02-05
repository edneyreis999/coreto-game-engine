/**
 * Fakes and Builders for Electron testing.
 *
 * Provides in-memory implementations and test data builders
 * for testing without external dependencies.
 */

export { FakeUtilityProcess } from './FakeUtilityProcess.js';
export { FakeReportStorageService } from './FakeReportStorageService.js';
export { SimulationParamsBuilder } from '../builders/SimulationParamsBuilder.js';
export { ProgressPayloadBuilder } from '../builders/ProgressPayloadBuilder.js';
export { SimulationResultPayloadBuilder } from '../builders/SimulationResultPayloadBuilder.js';
export { ErrorPayloadBuilder } from '../builders/ErrorPayloadBuilder.js';
