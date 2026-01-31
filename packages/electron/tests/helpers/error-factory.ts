/**
 * Error Factory
 *
 * Creates error objects that are compatible with type guards.
 * All errors inherit from Error.prototype correctly.
 *
 * @see packages/electron/src/main/workers/error-mapper.ts
 */

/**
 * Creates a FileSystemError compatible with type guards.
 */
export function createFileSystemError(message: string, path?: string): Error {
  const error = new Error(message) as any;
  error.name = 'FileSystemError';
  error.context = { path: path || 'unknown' };
  return error;
}

/**
 * Creates a ConfigError compatible with type guards.
 */
export function createConfigError(message: string): Error {
  const error = new Error(message) as any;
  error.name = 'ConfigError';
  error.context = {};
  return error;
}

/**
 * Creates a DataLoadError compatible with type guards.
 */
export function createDataLoadError(
  message: string,
  entityType: string,
  entityId: string
): Error {
  const error = new Error(message) as any;
  error.name = 'DataLoadError';
  error.context = { entityType, entityId };
  return error;
}

/**
 * Creates a BattleTimeoutError compatible with type guards.
 */
export function createBattleTimeoutError(message: string, maxTurns: number): Error {
  const error = new Error(message) as any;
  error.name = 'BattleTimeoutError';
  error.context = { maxTurns };
  return error;
}

/**
 * Creates a SkillFormulaError compatible with type guards.
 */
export function createSkillFormulaError(message: string, skillId: number, formula: string): Error {
  const error = new Error(message) as any;
  error.name = 'SkillFormulaError';
  error.context = { skillId, formula };
  return error;
}

/**
 * Creates a DomainError compatible with type guards.
 */
export function createDomainError(message: string, context?: Record<string, unknown>): Error {
  const error = new Error(message) as any;
  error.name = 'DomainError';
  error.context = context || {};
  return error;
}
