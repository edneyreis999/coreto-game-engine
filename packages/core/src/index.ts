/**
 * @coreto/core - Public API Exports
 *
 * Core game engine logic for TTK validation.
 * Shared between CLI and Electron applications.
 *
 * Architecture: Hexagonal (Ports and Adapters)
 * - Core layer: Domain entities, value objects, use cases, errors
 * - Infrastructure layer: Adapters implementing core ports
 * - DI: TSyringe container with typed tokens
 */

// =============================================================================
// Domain Types
// =============================================================================

// Value Objects
export * from './core/domain/AnchorLevelRange.js';
export * from './core/domain/TtkTarget.js';
export * from './core/domain/TtkMetrics.js';
export * from './core/domain/Warning.js';

// Entities
export * from './core/domain/Trecho.js';
export * from './core/domain/PartyConfig.js';
export * from './core/domain/BattleResult.js';
export * from './core/domain/Report.js';

// Domain Services
export * from './core/domain/services/WarningCollector.js';

// =============================================================================
// Port Interfaces
// =============================================================================

export type {
  ILogger,
  IFileSystem,
  IConfigLoader,
  ProjectConfig,
  IDataLoader,
  RmmzDatabase,
  DatabaseObjects,
  IBattleSimulator,
  BattleSetup,
  IReporter,
  WarningType,
  WarningSeverity,
  IHeadlessRuntime,
} from './core/ports/index.js';

// =============================================================================
// Use Cases
// =============================================================================

export * from './core/use-cases/ExecuteBattleUseCase.js';
export * from './core/use-cases/ValidateTrechoUseCase.js';
export * from './core/use-cases/GenerateReportUseCase.js';

// =============================================================================
// Domain Errors
// =============================================================================

export * from './core/errors/DomainError.js';
export * from './core/errors/ValidationError.js';
export * from './core/errors/ConfigError.js';
export * from './core/errors/DataLoadError.js';
export * from './core/errors/BattleTimeoutError.js';
export * from './core/errors/SkillFormulaError.js';
export * from './core/errors/FileSystemError.js';

// =============================================================================
// Dependency Injection
// =============================================================================

export {
  registerDependencies,
  clearContainer,
  resolve,
  container,
} from './infrastructure/di/container.js';

export {
  IConfigLoaderToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
  IReporterToken,
  IHeadlessRuntimeToken,
  ILoggerToken,
  IFileSystemToken,
} from './infrastructure/di/tokens.js';

// =============================================================================
// Infrastructure Adapters
// Exported for integration tests and DI registration.
// Prefer using port interfaces (IDataLoader, IFileSystem, IReporter) via DI.
// =============================================================================

export * from './infrastructure/adapters/data/index.js';
export * from './infrastructure/adapters/filesystem/index.js';
export * from './infrastructure/adapters/reporter/index.js';
export * from './infrastructure/security/index.js';

// =============================================================================
// Report Schemas and Types
// =============================================================================

export {
  WarningTypeSchema,
  WarningSeveritySchema,
  WarningSchema,
  ActorSchema,
  ActionSchema,
  TurnSchema,
  BattleResultSchema,
  TrechoAggregatesSchema,
  TrechoReportSchema,
  ReportMetadataSchema,
  ReportSummarySchema,
  ReportSchema,
  type WarningType as WarningTypeDTO,
  type WarningSeverity as WarningSeverityDTO,
  type Warning as WarningDTO,
  type Actor as ActorDTO,
  type Action as ActionDTO,
  type Turn as TurnDTO,
  type BattleResult as BattleResultDTO,
  type TrechoAggregates as TrechoAggregatesDTO,
  type TrechoReport as TrechoReportDTO,
  type ReportMetadata as ReportMetadataDTO,
  type ReportSummary as ReportSummaryDTO,
  type Report as ReportDTO,
} from './infrastructure/schemas/report.schema.js';

// =============================================================================
// Runtime Infrastructure (for testing and headless execution)
// NOTE: Exported for core package tests. External consumers should use DI.
// =============================================================================

export * from './infrastructure/runtime/index.js';

// =============================================================================
// Simulation Infrastructure
// NOTE: Exported for core package tests. External consumers should use DI.
// =============================================================================

export * from './infrastructure/simulation/index.js';

// =============================================================================
// Configuration Module
// =============================================================================

export { ZodConfigLoader } from './infrastructure/config/ZodConfigLoader.js';
export {
  AnchorLevelRangeSchema,
  TtkTargetSchema,
  PartyMemberSchema,
  PartyConfigSchema,
  TrechoSchema,
  ProjectConfigSchema,
  type AnchorLevelRangeDTO,
  type TtkTargetDTO,
  type PartyMemberDTO,
  type PartyConfigDTO,
  type TrechoDTO,
  type ProjectConfigDTO,
} from './infrastructure/config/schemas.js';

// =============================================================================
// TypeScript Types
// =============================================================================

export * from './types/rmmz-data.js';
