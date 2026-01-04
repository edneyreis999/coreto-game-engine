/**
 * Use Cases Layer Barrel Export
 *
 * Use cases encapsulate business logic and orchestrate domain entities.
 * They depend only on ports (interfaces), not concrete infrastructure.
 */

export * from './ExecuteBattleUseCase.js';
export * from './ValidateTrechoUseCase.js';
export * from './GenerateReportUseCase.js';
