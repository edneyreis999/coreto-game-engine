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
 *
 * @version 3.0.0
 *
 * IMPORTANT: Infrastructure internals are NO LONGER exported from the main entry point.
 * For testing, use the `/testing` subpath export:
 *   import { HeadlessRuntimeBootstrapper, BattleSimulator } from '@coreto/core/testing';
 */

// =============================================================================
// PUBLIC API - Core Domain
// =============================================================================

// Errors
export * from './core/errors/index.js';

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
export * from './core/domain/Enemy.js';
export * from './core/domain/Skill.js';

// Domain Services
export * from './core/domain/services/WarningCollector.js';

// Use Cases
export * from './core/use-cases/index.js';

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
  // DTOs with original names (for backward compatibility)
  type AnchorLevelRangeDTO,
  type TtkTargetDTO,
  type PartyMemberDTO,
  type PartyConfigDTO,
  type TrechoDTO,
  type ProjectConfigDTO,
  // DTOs with Zod prefix (alternative naming)
  type AnchorLevelRangeDTO as ZodAnchorLevelRange,
  type TtkTargetDTO as ZodTtkTarget,
  type PartyMemberDTO as ZodPartyMember,
  type PartyConfigDTO as ZodPartyConfig,
  type TrechoDTO as ZodTrechoConfig,
  type ProjectConfigDTO as ZodProjectConfig,
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
  WarningType,
  WarningSeverity,
  IHeadlessRuntime,
  IClock,
} from './core/ports/index.js';

// =============================================================================
// PUBLIC API - Dependency Injection
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
// PUBLIC API - Validation Schemas
// =============================================================================

// Report schemas
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
// PUBLIC API - Configuration Loader
// =============================================================================

export { ZodConfigLoader } from './infrastructure/config/ZodConfigLoader.js';

// =============================================================================
// PUBLIC API - Type Definitions
// =============================================================================

// Infrastructure types (for reference and backward compatibility)
export * from './types/rmmz-data.js';

// Domain data types (pure domain DTOs)
export * from './core/domain/data/index.js';

// =============================================================================
// PUBLIC API - Infrastructure Adapters
// =============================================================================

// Filesystem Adapters
export { NodeFileSystem } from './infrastructure/adapters/filesystem/NodeFileSystem.js';

// Data Adapters
export { RmmzDataLoader } from './infrastructure/adapters/data/RmmzDataLoader.js';
export { RmmzProjectValidator } from './infrastructure/adapters/data/RmmzProjectValidator.js';
export { IntegrityValidator } from './infrastructure/adapters/data/IntegrityValidator.js';

// Reporter Adapters
export { JsonReporter } from './infrastructure/adapters/reporter/JsonReporter.js';

// Clock Adapters
export { SystemClock } from './infrastructure/adapters/clock/SystemClock.js';

// Mapper Adapters
export { EnemyMapper } from './infrastructure/adapters/mappers/EnemyMapper.js';
export { SkillMapper } from './infrastructure/adapters/mappers/SkillMapper.js';
export { DataMapper } from './infrastructure/adapters/mappers/DataMapper.js';

// =============================================================================
// PUBLIC API - Security
// =============================================================================

export { PathSanitizer } from './infrastructure/security/PathSanitizer.js';
export { ReadOnlyGuard } from './infrastructure/security/ReadOnlyGuard.js';

// =============================================================================
// PUBLIC API - Runtime Infrastructure
// =============================================================================

// Bootstrapper
export { HeadlessRuntimeBootstrapper } from './infrastructure/runtime/HeadlessRuntimeBootstrapper.js';

// Loaders
export { DatabaseLoader } from './infrastructure/runtime/loaders/DatabaseLoader.js';
export { ScriptLoader } from './infrastructure/runtime/loaders/ScriptLoader.js';

// Overrides
export { HeadlessOverrides } from './infrastructure/runtime/overrides/HeadlessOverrides.js';

// Simulation Loop
export { SyncWarpLoop } from './infrastructure/runtime/simulation/SyncWarpLoop.js';

// =============================================================================
// PUBLIC API - Simulation Infrastructure
// =============================================================================

export { DeterministicRNG } from './infrastructure/simulation/DeterministicRNG.js';
export { HeadlessBattleSimulator } from './infrastructure/simulation/BattleSimulator.js';
export { TtkMeasurer } from './infrastructure/simulation/TtkMeasurer.js';
export { SkillSelector } from './infrastructure/simulation/SkillSelector.js';

// =============================================================================
// PUBLIC API - Runtime Shims
// =============================================================================

// PIXI Shims
export {
  PIXI,
  DisplayObject,
  Container,
  Sprite,
  Rectangle,
  Point,
} from './infrastructure/runtime/shims/pixi_shim.js';
