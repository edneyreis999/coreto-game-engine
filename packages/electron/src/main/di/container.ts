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
import { createSQLiteConfigStorage } from '../adapters/index.js';
import { createSQLiteConfigLoader } from '../adapters/index.js';
import type { IProjectValidator, IGameDataLoader, IConfigStorage, IReportBuilder } from '@coreto/electron/domain/ports';
import { NodeFileSystem, RmmzDataLoader, IConfigLoaderToken } from '@coreto/core';
import { createSimulationReportBuilder } from '@coreto/electron/domain/use-cases';
import { getDatabase } from '../database/index.js';

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
 * - IConfigStorage: SQLite config storage adapter
 * - IConfigLoader: SQLite config loader adapter (bridges core and electron)
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
      const db = getDatabase();
      return createSQLiteConfigStorage(db);
    },
  });

  // IConfigLoader - factory function (Task 09: SQLite-based config loading)
  container.register(IConfigLoaderToken as unknown as string, {
    useFactory: () => {
      const storage = container.resolve<IConfigStorage>(IConfigStorageToken as unknown as string);
      const loader = createSQLiteConfigLoader(storage);
      return loader;
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
