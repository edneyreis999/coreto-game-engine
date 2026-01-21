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
// Configuration Schemas (Zod)
// =============================================================================

export {
  AnchorLevelRangeSchema,
  TtkTargetSchema,
  PartyMemberSchema,
  PartyConfigSchema,
  TrechoSchema,
  ProjectConfigSchema,
  type AnchorLevelRange as ZodAnchorLevelRange,
  type TtkTarget as ZodTtkTarget,
  type PartyMember as ZodPartyMember,
  type PartyConfig as ZodPartyConfig,
  type TrechoConfig as ZodTrechoConfig,
  type ProjectConfig as ZodProjectConfig,
} from './infrastructure/config/schemas.js';

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
  Warning,
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
// TypeScript Types
// =============================================================================

export * from './types/config.js';
export * from './types/rmmz-data.js';
