/**
 * Dependency Injection Container for Electron Main Process
 *
 * Registers main process dependencies for use in services and handlers.
 * Uses TSyringe container with token-based registration.
 */

import { container } from 'tsyringe';
import type { ILogger } from '@coreto/core';
import { ConsoleLogger } from '../services/ConsoleLogger.js';
import { createProjectValidator } from '../adapters/index.js';
import { createGameDataLoader } from '../adapters/index.js';
import { createFileConfigStorage } from '../adapters/index.js';
import type { IProjectValidator, IGameDataLoader, IConfigStorage, IReportBuilder } from '@coreto/electron/domain/ports';
import { NodeFileSystem, RmmzDataLoader } from '@coreto/core';
import { createSimulationReportBuilder } from '@coreto/electron/domain/use-cases';

// Import tokens
import {
  ILoggerToken,
  IProjectValidatorToken,
  IGameDataLoaderToken,
  IConfigStorageToken,
  IReportBuilderToken,
} from './tokens.js';

/**
 * Registers main process dependencies in the DI container.
 *
 * Currently registers:
 * - ILogger: ConsoleLogger implementation
 * - IProjectValidator: Project validator adapter
 * - IGameDataLoader: Game data loader adapter
 * - IConfigStorage: File config storage adapter
 * - IReportBuilder: Simulation report builder use case
 */
export function registerMainDependencies(): void {
  // ILogger - using ConsoleLogger
  container.register<ILogger>(ILoggerToken, {
    useClass: ConsoleLogger,
  });

  // IFileSystem and IDataLoader - singleton instances
  const fileSystem = new NodeFileSystem();
  const dataLoader = new RmmzDataLoader(fileSystem);

  // IProjectValidator - factory function
  container.register<IProjectValidator>(IProjectValidatorToken as unknown as string, {
    useFactory: () => {
      const logger = getLogger();
      return createProjectValidator(fileSystem, dataLoader, logger);
    },
  });

  // IGameDataLoader - factory function
  container.register<IGameDataLoader>(IGameDataLoaderToken as unknown as string, {
    useFactory: () => {
      const logger = getLogger();
      return createGameDataLoader(fileSystem, logger);
    },
  });

  // IConfigStorage - factory function
  container.register<IConfigStorage>(IConfigStorageToken as unknown as string, {
    useFactory: () => {
      return createFileConfigStorage();
    },
  });

  // IReportBuilder - factory function
  container.register<IReportBuilder>(IReportBuilderToken as unknown as string, {
    useFactory: () => {
      return createSimulationReportBuilder();
    },
  });
}

/**
 * Resolves ILogger from the DI container.
 *
 * @returns ILogger instance
 */
export function getLogger(): ILogger {
  return container.resolve<ILogger>(ILoggerToken);
}

/**
 * Generic resolver for any registered dependency.
 *
 * @param token - DI token to resolve
 * @returns Resolved dependency instance
 */
export function resolve<T>(token: symbol): T {
  return container.resolve<T>(token as unknown as string);
}

/**
 * Export container for testing purposes.
 */
export { container };
