/**
 * DI Tokens for Electron Main Process
 *
 * Token definitions for dependency injection container.
 * These tokens are used to register and resolve dependencies.
 */

// Existing token from @coreto/core
export const ILoggerToken = 'ILogger' as unknown as symbol;

// New tokens for @coreto/electron dependencies
export const IProjectValidatorToken = Symbol.for('IProjectValidator');
export const IGameDataLoaderToken = Symbol.for('IGameDataLoader');
export const IConfigStorageToken = Symbol.for('IConfigStorage');
export const IReportBuilderToken = Symbol.for('IReportBuilder');
export const INsdParserServiceToken = Symbol.for('INsdParserService');
