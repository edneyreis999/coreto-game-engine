/**
 * Dependency Injection Container for Electron Main Process
 *
 * Registers main process dependencies for use in services and handlers.
 * Uses TSyringe container with token-based registration.
 */

// LOG 10: main/di/container.ts loaded
console.log('[NSD-WORKER-LOG-010] main/di/container.ts - starting imports...');

import { container } from 'tsyringe';
import type { ILogger } from '@coreto/core';
import { ConsoleLogger } from '../services/ConsoleLogger.js';

// LOG 11: Before importing adapters (which may import database)
console.log('[NSD-WORKER-LOG-011] About to import adapters/index.js...');

import { createProjectValidator } from '../adapters/index.js';
import { createGameDataLoader } from '../adapters/index.js';
import { createSQLiteConfigStorage } from '../adapters/index.js';
import { createSQLiteConfigLoader } from '../adapters/index.js';

// LOG 12: After importing adapters
console.log('[NSD-WORKER-LOG-012] Adapters imported successfully!');
import type { IProjectValidator, IGameDataLoader, IConfigStorage, IReportBuilder } from '@coreto/electron/domain/ports';
import { NodeFileSystem, RmmzDataLoader, IConfigLoaderToken } from '@coreto/core';
import { createSimulationReportBuilder } from '@coreto/electron/domain/use-cases';
import { getDatabase } from '../database/index.js';
import { NsdParserService } from '../services/nsd-parser.service.js';

// Import tokens
import {
  ILoggerToken,
  IProjectValidatorToken,
  IGameDataLoaderToken,
  IConfigStorageToken,
  IReportBuilderToken,
  INsdParserServiceToken,
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
 * - INsdParserService: NSD parser service with AI integration (runs in main thread)
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

  // INsdParserService - factory function (main thread, AI-powered NSD parsing)
  container.register(INsdParserServiceToken as unknown as string, {
    useFactory: () => {
      const logger = getLogger();
      return new NsdParserService(logger);
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
