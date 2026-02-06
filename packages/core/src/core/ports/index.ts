/**
 * Barrel export for all port interfaces.
 * Ports define the boundaries of the core domain (Hexagonal Architecture).
 *
 * Port interfaces establish contracts between the core domain and external adapters.
 * All ports are designed following the Dependency Inversion Principle.
 */

// Logger Port
export type { ILogger } from './ILogger.js';

// FileSystem Port
export type { IFileSystem } from './IFileSystem.js';

// Configuration Port
export type { IConfigLoader, ProjectConfig } from './IConfigLoader.js';

// Data Loader Port
export type { IDataLoader, RmmzDatabase, DatabaseObjects } from './IDataLoader.js';

// Battle Simulator Port
export type { IBattleSimulator, BattleSetup } from './IBattleSimulator.js';

// Reporter Port
export type { IReporter, Warning, WarningType, WarningSeverity } from './IReporter.js';

// Headless Runtime Port
export type { IHeadlessRuntime } from './IHeadlessRuntime.js';

// Clock Port
export type { IClock } from './IClock.js';
