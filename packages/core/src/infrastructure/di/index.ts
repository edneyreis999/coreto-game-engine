/**
 * DI Module Barrel Export
 *
 * Exports DI container functions and tokens for external use.
 */

export {
  registerDependencies,
  clearContainer,
  resolve,
  container,
  IConfigLoaderToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
  IReporterToken,
  IHeadlessRuntimeToken,
  ILoggerToken,
  IFileSystemToken,
} from './container.js';
