/**
 * DI Container Configuration
 *
 * Singleton TSyringe container for dependency injection.
 * Registers all implementations and provides resolver functions.
 */

import 'reflect-metadata';
import { container as tsyringeContainer } from 'tsyringe';

import type {
  ILogger,
  IFileSystem,
  IConfigLoader,
  IDataLoader,
  IBattleSimulator,
  IReporter,
  IClock,
} from '../../core/ports/index.js';

import {
  ILoggerToken,
  IFileSystemToken,
  IConfigLoaderToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
  IReporterToken,
  IClockToken,
} from './tokens.js';

import { ConsoleLogger } from '../adapters/logger/ConsoleLogger.js';
import { NodeFileSystem } from '../adapters/filesystem/NodeFileSystem.js';
import { ZodConfigLoader } from '../config/ZodConfigLoader.js';
import { RmmzDataLoader, RmmzProjectValidator } from '../adapters/data/index.js';
import { HeadlessBattleSimulator } from '../simulation/BattleSimulator.js';
import { JsonReporter } from '../adapters/reporter/JsonReporter.js';
import { SystemClock } from '../adapters/clock/SystemClock.js';
import { ExecuteBattleUseCase } from '../../core/use-cases/ExecuteBattleUseCase.js';
import { GenerateReportUseCase } from '../../core/use-cases/GenerateReportUseCase.js';
import { ValidateTrechoUseCase } from '../../core/use-cases/ValidateTrechoUseCase.js';

// Re-export all tokens for external use
export {
  IConfigLoaderToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
  IReporterToken,
  IHeadlessRuntimeToken,
  ILoggerToken,
  IFileSystemToken,
  IClockToken,
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
 * - HeadlessBattleSimulator (IBattleSimulator implementation)
 * - JsonReporter (IReporter implementation)
 * - SystemClock (IClock implementation)
 * - RmmzProjectValidator (helper for data loading)
 *
 * To be implemented:
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

  // BattleSimulator: HeadlessBattleSimulator implementation registered as singleton
  tsyringeContainer.registerSingleton<IBattleSimulator>(
    IBattleSimulatorToken,
    HeadlessBattleSimulator
  );

  // Reporter: JsonReporter implementation registered as singleton
  tsyringeContainer.registerSingleton<IReporter>(IReporterToken, JsonReporter);

  // Clock: SystemClock implementation registered as singleton
  tsyringeContainer.registerSingleton<IClock>(IClockToken, SystemClock);

  // RmmzProjectValidator: Helper for data loading validation (singleton)
  tsyringeContainer.registerSingleton(RmmzProjectValidator);

  // Use Cases: registered with manual factory functions (domain stays framework-free)
  // Usa o mesmo padrao de resolve que ja existe na linha 108: token as unknown as string
  tsyringeContainer.register(ExecuteBattleUseCase, {
    useFactory: () =>
      new ExecuteBattleUseCase(
        tsyringeContainer.resolve(IBattleSimulatorToken as unknown as string),
        tsyringeContainer.resolve(IClockToken as unknown as string)
      ),
  });

  tsyringeContainer.register(GenerateReportUseCase, {
    useFactory: () =>
      new GenerateReportUseCase(
        tsyringeContainer.resolve(IReporterToken as unknown as string)
      ),
  });

  tsyringeContainer.register(ValidateTrechoUseCase, {
    useFactory: () => new ValidateTrechoUseCase(),
  });

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
