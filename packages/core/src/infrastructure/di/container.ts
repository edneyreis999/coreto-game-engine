/**
 * DI Container Configuration
 *
 * Singleton TSyringe container for dependency injection.
 * Registers all implementations and provides resolver functions.
 */

import 'reflect-metadata';
import { container as tsyringeContainer } from 'tsyringe';

import type {
  IClock,
  ILogger,
  IFileSystem,
  IConfigLoader,
  IDataLoader,
  IBattleSimulator,
  IReporter,
  IHeadlessRuntime,
} from '@coreto/core';

import {
  ILoggerToken,
  IFileSystemToken,
  IConfigLoaderToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
  IReporterToken,
  IHeadlessRuntimeToken,
  IClockToken,
} from './tokens.js';

import { ConsoleLogger } from '../adapters/logger/ConsoleLogger.js';
import { NodeFileSystem } from '../adapters/filesystem/NodeFileSystem.js';
import { ZodConfigLoader } from '../config/ZodConfigLoader.js';
import { RmmzDataLoader, RmmzProjectValidator } from '../adapters/data/index.js';
import { HeadlessBattleSimulator } from '../simulation/BattleSimulator.js';
import { JsonReporter } from '../adapters/reporter/JsonReporter.js';
import { JsdomHeadlessRuntime } from '../runtime/JsdomHeadlessRuntime.js';
import { SystemClock } from '../adapters/clock/SystemClock.js';
import { ExecuteBattleUseCase } from '@coreto/core';
import { GenerateReportUseCase } from '@coreto/core';
import { ValidateTrechoUseCase } from '@coreto/core';

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
 * Coerces a typed Symbol token to string for TSyringe compatibility.
 *
 * TSyringe expects `string | InjectionToken` but we use Symbol tokens for type safety.
 * This utility provides a type-safe conversion that preserves the phantom type parameter.
 *
 * @template T - The type associated with the injection token
 * @param token - Typed Symbol token (created via Symbol.for())
 * @returns String representation of the token for TSyringe
 *
 * @example
 * ```ts
 * // Registration
 * tsyringeContainer.registerSingleton<ILogger>(
 *   coerceToken(ILoggerToken),
 *   ConsoleLogger
 * );
 *
 * // Resolution
 * const logger = tsyringeContainer.resolve<ILogger>(coerceToken(ILoggerToken));
 * ```
 */
function coerceToken<T>(token: symbol & { __type: T }): string {
  return token as unknown as string;
}

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
 * - JsdomHeadlessRuntime (IHeadlessRuntime implementation)
 * - RmmzProjectValidator (helper for data loading)
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

  // HeadlessRuntime: JsdomHeadlessRuntime implementation registered as singleton
  tsyringeContainer.registerSingleton<IHeadlessRuntime>(
    IHeadlessRuntimeToken,
    JsdomHeadlessRuntime
  );

  // RmmzProjectValidator: Helper for data loading validation (singleton)
  tsyringeContainer.registerSingleton(RmmzProjectValidator);

  // Clock: SystemClock implementation registered as singleton
  tsyringeContainer.registerSingleton<IClock>(coerceToken(IClockToken), SystemClock);

  // Use Cases: registered with manual factory functions (domain stays framework-free)
  tsyringeContainer.register(ExecuteBattleUseCase, {
    useFactory: () =>
      new ExecuteBattleUseCase(
        tsyringeContainer.resolve(coerceToken(IBattleSimulatorToken)),
        tsyringeContainer.resolve(coerceToken(IClockToken))
      ),
  });

  tsyringeContainer.register(GenerateReportUseCase, {
    useFactory: () =>
      new GenerateReportUseCase(tsyringeContainer.resolve(coerceToken(IReporterToken))),
  });

  tsyringeContainer.register(ValidateTrechoUseCase, {
    useFactory: () => new ValidateTrechoUseCase(),
  });

  const logger = tsyringeContainer.resolve<ILogger>(coerceToken(ILoggerToken));
  logger.info('[DI] All dependencies registered');
}

/**
 * Clear all instances from the container.
 * Useful for testing to ensure clean state between tests.
 */
export function clearContainer(): void {
  tsyringeContainer.clearInstances();
}

/**
 * Resolves a dependency from the DI container.
 * Type-safe wrapper around container.resolve().
 *
 * @param token - Injection token for the dependency
 * @returns Resolved instance
 */
export function resolve<T>(token: symbol & { __type: T }): T {
  return tsyringeContainer.resolve(coerceToken(token)) as T;
}

/**
 * Export the TSyringe container instance.
 * Prefer using the typed resolve() function instead of direct container access.
 */
export { tsyringeContainer as container };
