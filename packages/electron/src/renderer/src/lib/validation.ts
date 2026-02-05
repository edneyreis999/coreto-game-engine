/**
 * Validation Utilities
 *
 * Common validation functions for form fields.
 * Provides reusable validators for TTK configuration fields.
 *
 * @see Task 08 - Real-time Validation
 */

import type { ValidationResult } from '../hooks/useFieldValidation';

// ============================================================================
// Common Validators
// ============================================================================

/**
 * Creates a required field validator.
 * @param fieldName - Name of the field for error message
 * @returns Validation function
 */
export function required(fieldName: string): (value: string) => ValidationResult {
  return (value: string) => {
    if (!value || value.trim().length === 0) {
      return {
        isValid: false,
        message: `${fieldName} is required`,
        severity: 'error',
      };
    }

    return { isValid: true };
  };
}

/**
 * Creates a min value validator for numbers.
 * @param min - Minimum value (inclusive)
 * @param fieldName - Name of the field for error message
 * @returns Validation function
 */
export function min(min: number, fieldName: string): (value: string) => ValidationResult {
  return (value: string) => {
    const num = parseInt(value, 10);

    if (isNaN(num)) {
      return {
        isValid: false,
        message: `${fieldName} must be a number`,
        severity: 'error',
      };
    }

    if (num < min) {
      return {
        isValid: false,
        message: `${fieldName} must be at least ${min}`,
        severity: 'error',
      };
    }

    return { isValid: true };
  };
}

/**
 * Creates a max value validator for numbers.
 * @param max - Maximum value (inclusive)
 * @param fieldName - Name of the field for error message
 * @returns Validation function
 */
export function max(max: number, fieldName: string): (value: string) => ValidationResult {
  return (value: string) => {
    const num = parseInt(value, 10);

    if (isNaN(num)) {
      return {
        isValid: false,
        message: `${fieldName} must be a number`,
        severity: 'error',
      };
    }

    if (num > max) {
      return {
        isValid: false,
        message: `${fieldName} must be at most ${max}`,
        severity: 'error',
      };
    }

    return { isValid: true };
  };
}

/**
 * Creates a range validator for numbers.
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param fieldName - Name of the field for error message
 * @returns Validation function
 */
export function range(min: number, max: number, fieldName: string): (value: string) => ValidationResult {
  return (value: string) => {
    const num = parseInt(value, 10);

    if (isNaN(num)) {
      return {
        isValid: false,
        message: `${fieldName} must be a number`,
        severity: 'error',
      };
    }

    if (num < min || num > max) {
      return {
        isValid: false,
        message: `${fieldName} must be between ${min} and ${max}`,
        severity: 'error',
      };
    }

    return { isValid: true };
  };
}

/**
 * Creates a min/max range validator where min must be <= max.
 * @param minFieldName - Name of the min field
 * @param maxFieldName - Name of the max field
 * @param minValue - Current min value
 * @returns Validation function for max value
 */
export function maxGreaterThanMin(
  minFieldName: string,
  maxFieldName: string,
  minValue: number
): (value: string) => ValidationResult {
  return (value: string) => {
    const num = parseInt(value, 10);

    if (isNaN(num)) {
      return {
        isValid: false,
        message: `${maxFieldName} must be a number`,
        severity: 'error',
      };
    }

    if (num < minValue) {
      return {
        isValid: false,
        message: `${maxFieldName} must be greater than or equal to ${minFieldName}`,
        severity: 'error',
      };
    }

    return { isValid: true };
  };
}

/**
 * Creates a troop ID validator.
 * Checks if troop ID exists in the provided list.
 * @param availableTroopIds - List of valid troop IDs
 * @returns Validation function
 */
export function troopId(availableTroopIds: number[]): (value: string) => ValidationResult {
  return (value: string) => {
    const id = parseInt(value, 10);

    if (isNaN(id)) {
      return {
        isValid: false,
        message: 'Troop ID must be a number',
        severity: 'error',
      };
    }

    if (!availableTroopIds.includes(id)) {
      return {
        isValid: false,
        message: `Troop ID ${id} does not exist in this project`,
        severity: 'error',
      };
    }

    return { isValid: true };
  };
}

/**
 * Creates a non-empty array validator.
 * @param fieldName - Name of the field for error message
 * @returns Validation function
 */
export function nonEmptyArray<T>(fieldName: string): (value: T[]) => ValidationResult {
  return (value: T[]) => {
    if (!value || value.length === 0) {
      return {
        isValid: false,
        message: `${fieldName} cannot be empty`,
        severity: 'error',
      };
    }

    return { isValid: true };
  };
}

/**
 * Composes multiple validators.
 * Runs validators in order and returns the first error.
 * @param validators - Array of validation functions
 * @returns Composed validation function
 */
export function compose(...validators: Array<(value: string) => ValidationResult>): (value: string) => ValidationResult {
  return (value: string) => {
    for (const validator of validators) {
      const result = validator(value);

      if (!result.isValid) {
        return result;
      }
    }

    return { isValid: true };
  };
}

// ============================================================================
// TTK Configuration Validators
// ============================================================================

/**
 * Validates anchor level range.
 * Ensures min is between 1-99 and max >= min.
 */
export function validateAnchorLevelRange(
  minLevel: string,
  maxLevel: string
): ValidationResult {
  const min = parseInt(minLevel, 10);
  const max = parseInt(maxLevel, 10);

  if (isNaN(min) || isNaN(max)) {
    return {
      isValid: false,
      message: 'Anchor levels must be numbers',
      severity: 'error',
    };
  }

  if (min < 1 || min > 99) {
    return {
      isValid: false,
      message: 'Min anchor level must be between 1 and 99',
      severity: 'error',
    };
  }

  if (max < 1 || max > 99) {
    return {
      isValid: false,
      message: 'Max anchor level must be between 1 and 99',
      severity: 'error',
    };
  }

  if (max < min) {
    return {
      isValid: false,
      message: 'Max anchor level must be greater than or equal to min',
      severity: 'error',
    };
  }

  return { isValid: true };
}

/**
 * Validates TTK target values.
 * Ensures turns and actions are positive numbers.
 */
export function validateTtkTarget(
  turns: string,
  actions: string
): ValidationResult {
  const ttkTurns = parseInt(turns, 10);
  const ttkActions = parseInt(actions, 10);

  if (isNaN(ttkTurns) || ttkTurns <= 0) {
    return {
      isValid: false,
      message: 'Target TTK turns must be a positive number',
      severity: 'error',
    };
  }

  if (isNaN(ttkActions) || ttkActions <= 0) {
    return {
      isValid: false,
      message: 'Target TTK actions must be a positive number',
      severity: 'error',
    };
  }

  return { isValid: true };
}

/**
 * Validates tolerance percentage.
 * Ensures tolerance is between 0 and 100.
 */
export function validateTolerance(tolerance: string): ValidationResult {
  const tol = parseFloat(tolerance);

  if (isNaN(tol)) {
    return {
      isValid: false,
      message: 'Tolerance must be a number',
      severity: 'error',
    };
  }

  if (tol < 0 || tol > 100) {
    return {
      isValid: false,
      message: 'Tolerance must be between 0 and 100 percent',
      severity: 'error',
    };
  }

  return { isValid: true };
}

/**
 * Validates max battle turns.
 * Ensures max turns is a positive number.
 */
export function validateMaxBattleTurns(maxTurns: string): ValidationResult {
  const turns = parseInt(maxTurns, 10);

  if (isNaN(turns) || turns <= 0) {
    return {
      isValid: false,
      message: 'Max battle turns must be a positive number',
      severity: 'error',
    };
  }

  if (turns > 1000) {
    return {
      isValid: false,
      message: 'Max battle turns cannot exceed 1000',
      severity: 'warning',
    };
  }

  return { isValid: true };
}

/**
 * Validates seed value.
 * Ensures seed is a positive integer.
 */
export function validateSeed(seed: string): ValidationResult {
  const s = parseInt(seed, 10);

  if (isNaN(s) || s < 0) {
    return {
      isValid: false,
      message: 'Seed must be a non-negative integer',
      severity: 'error',
    };
  }

  if (s > 2147483647) {
    return {
      isValid: false,
      message: 'Seed must be less than 2147483648',
      severity: 'error',
    };
  }

  return { isValid: true };
}
