/**
 * DI Container Tokens
 *
 * Type-safe injection tokens for TSyringe DI container.
 * Each token represents a port interface that can be injected.
 */

import type {
  IConfigLoader,
  IDataLoader,
  IBattleSimulator,
  IReporter,
  IHeadlessRuntime,
  ILogger,
  IFileSystem,
} from '../../core/ports/index.js';

/**
 * Injection token for IConfigLoader.
 * Used to resolve configuration loading implementations.
 */
export const IConfigLoaderToken = Symbol.for('IConfigLoader') as symbol & {
  __type: IConfigLoader;
};

/**
 * Injection token for IDataLoader.
 * Used to resolve RPG Maker MZ data loading implementations.
 */
export const IDataLoaderToken = Symbol.for('IDataLoader') as symbol & {
  __type: IDataLoader;
};

/**
 * Injection token for IBattleSimulator.
 * Used to resolve battle simulation implementations.
 */
export const IBattleSimulatorToken = Symbol.for('IBattleSimulator') as symbol & {
  __type: IBattleSimulator;
};

/**
 * Injection token for IReporter.
 * Used to resolve report generation implementations.
 */
export const IReporterToken = Symbol.for('IReporter') as symbol & {
  __type: IReporter;
};

/**
 * Injection token for IHeadlessRuntime.
 * Used to resolve headless runtime implementations.
 */
export const IHeadlessRuntimeToken = Symbol.for('IHeadlessRuntime') as symbol & {
  __type: IHeadlessRuntime;
};

/**
 * Injection token for ILogger.
 * Used to resolve logger implementations.
 */
export const ILoggerToken = Symbol.for('ILogger') as symbol & {
  __type: ILogger;
};

/**
 * Injection token for IFileSystem.
 * Used to resolve filesystem abstraction implementations.
 */
export const IFileSystemToken = Symbol.for('IFileSystem') as symbol & {
  __type: IFileSystem;
};
