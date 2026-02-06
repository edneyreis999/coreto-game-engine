/**
 * Error Mapper - User-Friendly Error Translation
 *
 * Transforms technical errors from @coreto/core into user-facing
 * error messages with actionable guidance.
 *
 * @see planos/005-run-ttk-electron/TECHSPEC.md Section 2.6
 * @see planos/005-run-ttk-electron/TECHSPEC-round2.md Section 5
 */

import type {
  DomainError,
  FileSystemError,
  BattleTimeoutError,
  ConfigError,
  DataLoadError,
  SkillFormulaError,
} from '@coreto/core';
import type { ErrorPayload } from './types.js';

/**
 * Error mapping result.
 * Contains user-friendly error information for display in UI.
 */
export interface MappedError extends ErrorPayload {
  /** Original error type for logging */
  originalType?: string;
}

/**
 * Maps technical errors to user-friendly error messages.
 *
 * Design principles:
 * - Hide technical stack traces by default (collapsible in UI)
 * - Provide actionable guidance for resolution
 * - Include error codes for logging/analytics
 * - Preserve context for debugging (details field)
 *
 * Error categories:
 * 1. FileSystemError: Project not found, invalid path
 * 2. ConfigError: Invalid configuration, missing trechos
 * 3. DataLoadError: Troop/enemy/skill not found in database
 * 4. BattleTimeoutError: Infinite loop in skill formulas
 * 5. SkillFormulaError: JavaScript syntax errors in formulas
 * 6. DomainError: Generic domain logic errors
 * 7. UnknownError: Unexpected errors (fallback)
 *
 * @example
 * ```typescript
 * try {
 *   await simulation.run(params);
 * } catch (error) {
 *   const mapped = mapErrorToUserMessage(error);
 *   sendMessage({ type: 'error', payload: mapped });
 * }
 * ```
 */
export function mapErrorToUserMessage(error: unknown): MappedError {
  // Null/undefined handling
  if (error === null || error === undefined) {
    return {
      title: 'Unknown Error',
      description: 'An unexpected error occurred. Please try again.',
      code: 'ERR_UNKNOWN',
      originalType: 'null',
    };
  }

  // Error object handling
  if (!(error instanceof Error)) {
    return {
      title: 'Invalid Error',
      description: 'An invalid error object was received.',
      details: String(error),
      code: 'ERR_INVALID_ERROR',
      originalType: typeof error,
    };
  }

  // FileSystemError: Project not found or invalid path
  if (isFileSystemError(error)) {
    return {
      title: 'Project Not Found',
      description:
        'Could not find a valid RPG Maker MZ project. Ensure the directory contains game.rmmzproject.',
      details: `Path: ${error.context?.path || 'unknown'}\n${error.message}`,
      code: 'ERR_PROJECT_NOT_FOUND',
      originalType: 'FileSystemError',
    };
  }

  // ConfigError: Invalid configuration
  if (isConfigError(error)) {
    return {
      title: 'Invalid Configuration',
      description:
        'The project configuration is invalid. Check that all trechos have valid hero teams and enemy troops.',
      details: error.message,
      code: 'ERR_INVALID_CONFIG',
      originalType: 'ConfigError',
    };
  }

  // DataLoadError: Troop/enemy/skill not found
  if (isDataLoadError(error)) {
    const entityType: string = (error.context?.entityType as string) || 'Entity';
    const entityId = error.context?.entityId || 'unknown';

    return {
      title: `${entityType} Not Found`,
      description: `Could not find ${entityType.toLowerCase()} with ID "${entityId}" in the RPG Maker MZ database.`,
      details: error.message,
      code: 'ERR_ENTITY_NOT_FOUND',
      originalType: 'DataLoadError',
    };
  }

  // BattleTimeoutError: Infinite loop detected
  if (isBattleTimeoutError(error)) {
    const maxTurns = error.context?.maxTurns || 'unknown';

    return {
      title: 'Battle Simulation Timed Out',
      description:
        'Battle took too long to complete, often indicating an infinite loop in skill formulas. Check skill formulas for recursive calls or missing break conditions.',
      details: `Timeout: ${maxTurns} turns\n${error.message}`,
      code: 'ERR_TIMEOUT',
      originalType: 'BattleTimeoutError',
    };
  }

  // SkillFormulaError: JavaScript syntax error
  if (isSkillFormulaError(error)) {
    const skillId = error.context?.skillId || 'unknown';
    const formula = error.context?.formula || '';

    return {
      title: 'Skill Formula Error',
      description: `A JavaScript error occurred in the formula for skill ${skillId}. Check the formula syntax for typos, missing operators, or invalid references.`,
      details: `Skill: ${skillId}\nFormula: ${formula}\nError: ${error.message}`,
      code: 'ERR_FORMULA',
      originalType: 'SkillFormulaError',
    };
  }

  // DomainError: Generic domain error
  if (isDomainError(error)) {
    return {
      title: 'Validation Error',
      description: error.message || 'A validation error occurred during simulation.',
      ...(error.context && { details: JSON.stringify(error.context, null, 2) }),
      code: 'ERR_VALIDATION',
      originalType: 'DomainError',
    };
  }

  // Unknown error: Fallback
  return {
    title: 'Simulation Failed',
    description:
      'An unexpected error occurred during simulation. Please check the project configuration and try again.',
    details: error.message,
    code: 'ERR_UNKNOWN',
    originalType: error.constructor.name,
  };
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard for FileSystemError.
 * Checks for error-specific properties.
 */
function isFileSystemError(error: Error): error is FileSystemError {
  return (
    'context' in error &&
    typeof error.context === 'object' &&
    error.context !== null &&
    'path' in error.context
  );
}

/**
 * Type guard for ConfigError.
 * Checks error name or constructor name.
 */
function isConfigError(error: Error): error is ConfigError {
  return error.name === 'ConfigError' || error.constructor.name === 'ConfigError';
}

/**
 * Type guard for DataLoadError.
 * Checks for context with entityType/entityId.
 */
function isDataLoadError(error: Error): error is DataLoadError {
  return (
    'context' in error &&
    typeof error.context === 'object' &&
    error.context !== null &&
    ('entityType' in error.context || 'entityId' in error.context)
  );
}

/**
 * Type guard for BattleTimeoutError.
 * Checks for context with maxTurns.
 */
function isBattleTimeoutError(error: Error): error is BattleTimeoutError {
  return (
    'context' in error &&
    typeof error.context === 'object' &&
    error.context !== null &&
    'maxTurns' in error.context
  );
}

/**
 * Type guard for SkillFormulaError.
 * Checks for context with skillId/formula.
 */
function isSkillFormulaError(error: Error): error is SkillFormulaError {
  return (
    'context' in error &&
    typeof error.context === 'object' &&
    error.context !== null &&
    ('skillId' in error.context || 'formula' in error.context)
  );
}

/**
 * Type guard for DomainError base class.
 * Checks error name or constructor name.
 */
function isDomainError(error: Error): error is DomainError {
  return error.name === 'DomainError' || error.constructor.name === 'DomainError';
}
