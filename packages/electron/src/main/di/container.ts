/**
 * Dependency Injection Container for Electron Main Process
 *
 * Registers ILogger implementation for use in main process services.
 * Uses TSyringe container with token-based registration.
 */

import { container } from 'tsyringe';
import type { ILogger } from '@coreto/core';
import { ConsoleLogger } from '../services/ConsoleLogger.js';

/**
 * ILogger token for DI resolution.
 * Must match the token pattern used in @coreto/core.
 */
export const ILoggerToken = 'ILogger' as unknown as symbol;

/**
 * Registers main process dependencies in the DI container.
 *
 * Currently registers:
 * - ILogger: ConsoleLogger implementation
 */
export function registerMainDependencies(): void {
  container.register<ILogger>(ILoggerToken, {
    useClass: ConsoleLogger,
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
 * Export container for testing purposes.
 */
export { container };
