/**
 * DI Container Configuration
 *
 * Singleton TSyringe container for dependency injection.
 * Registers all implementations and provides resolver functions.
 */

import 'reflect-metadata';
import { container as tsyringeContainer } from 'tsyringe';

import type { ILogger, IFileSystem, IConfigLoader, IDataLoader } from '@/core/ports/index.js';

import { ILoggerToken, IFileSystemToken, IConfigLoaderToken, IDataLoaderToken } from './tokens.js';

import { ConsoleLogger } from '../adapters/logger/ConsoleLogger.js';
import { NodeFileSystem } from '../adapters/filesystem/NodeFileSystem.js';
import { ZodConfigLoader } from '../config/ZodConfigLoader.js';
import { RmmzDataLoader, RmmzProjectValidator } from '../adapters/data/index.js';

// Re-export all tokens for external use
export {
  IConfigLoaderToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
  IReporterToken,
  IHeadlessRuntimeToken,
  ILoggerToken,
  IFileSystemToken,
} from './tokens.js';

/**
 * Register all dependencies in the DI container.
 * Should be called once at application startup.
 *
 * Implementations registered:
 * - ConsoleLogger (ILogger implementation)
 * - NodeFileSystem (IFileSystem implementation)
 * - ZodConfigLoader (IConfigLoader implementation)
 * - RmmzDataLoader (IDataLoader implementation)
 * - RmmzProjectValidator (helper for data loading)
 *
 * To be implemented:
 * - BattleSimulator (IBattleSimulator)
 * - Reporter (IReporter)
 * - HeadlessRuntime (IHeadlessRuntime)
 */
export function registerDependencies(): void {
  // Logger: ConsoleLogger implementation registered as singleton
  tsyringeContainer.registerSingleton<ILogger>(ILoggerToken, ConsoleLogger);

  // FileSystem: NodeFileSystem implementation registered as singleton
  tsyringeContainer.registerSingleton<IFileSystem>(IFileSystemToken, NodeFileSystem);

  // ConfigLoader: ZodConfigLoader implementation registered as singleton
  tsyringeContainer.registerSingleton<IConfigLoader>(IConfigLoaderToken, ZodConfigLoader);

  // DataLoader: RmmzDataLoader implementation registered as singleton
  tsyringeContainer.registerSingleton<IDataLoader>(IDataLoaderToken, RmmzDataLoader);

  // RmmzProjectValidator: Helper for data loading validation (singleton)
  tsyringeContainer.registerSingleton(RmmzProjectValidator);

  console.log('[DI] All dependencies registered');
}

/**
 * Clear all instances from the container.
 * Useful for testing to ensure clean state between tests.
 */
export function clearContainer(): void {
  tsyringeContainer.clearInstances();
  console.log('[DI] Container cleared');
}

/**
 * Resolve a dependency from the container.
 * Type-safe wrapper around container.resolve().
 *
 * @param token - Injection token for the dependency
 * @returns Resolved instance
 */
export function resolve<T>(token: symbol & { __type: T }): T {
  return tsyringeContainer.resolve(token as unknown as string) as T;
}

/**
 * Export the TSyringe container instance.
 * Prefer using the typed resolve() function instead of direct container access.
 */
export { tsyringeContainer as container };
