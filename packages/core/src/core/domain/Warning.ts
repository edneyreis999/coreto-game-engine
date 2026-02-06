import { ValidationError } from '../errors/index.js';

/**
 * Warning types for validation failures (ADR-013).
 *
 * - troop_not_found: Troop ID referenced in config doesn't exist in Troops.json
 * - enemy_not_found: Enemy ID referenced in troop doesn't exist in Enemies.json
 * - class_not_found: Class ID referenced in config doesn't exist in Classes.json
 * - skill_not_found: Skill ID referenced in battle doesn't exist in Skills.json
 * - ttk_out_of_tolerance: TTK measurement outside configured tolerance window
 * - skill_formula_error: Error evaluating skill damage formula
 * - battle_timeout: Battle exceeded maximum turn limit
 */
export type WarningType =
  | 'troop_not_found'
  | 'enemy_not_found'
  | 'class_not_found'
  | 'skill_not_found'
  | 'ttk_out_of_tolerance'
  | 'skill_formula_error'
  | 'battle_timeout';

/**
 * Warning severity levels (ADR-013).
 *
 * - critical: Blocking issues that prevent battle execution
 * - warning: Non-blocking issues that affect result validity
 * - info: Informational messages for debugging
 */
export type WarningSeverity = 'critical' | 'warning' | 'info';

/**
 * Warning data structure.
 * Contains all data needed to construct a Warning value object.
 */
export interface WarningData {
  /**
   * Warning category for machine parsing and analytics.
   * Types (ADR-013):
   * - troop_not_found: Troop ID referenced in config doesn't exist
   * - enemy_not_found: Enemy ID referenced in troop doesn't exist
   * - ttk_out_of_tolerance: TTK measurement outside configured tolerance
   * - skill_formula_error: Error evaluating skill damage formula
   * - battle_timeout: Battle exceeded maximum turn limit
   */
  type: WarningType;

  /**
   * Severity level for CI/CD automation.
   * Levels (ADR-013):
   * - critical: Blocking issues that prevent battle execution
   * - warning: Non-blocking issues that affect result validity
   * - info: Informational messages for debugging
   */
  severity: WarningSeverity;

  /**
   * Human-readable description for designers.
   */
  message: string;

  /**
   * Type-specific debugging information (troopId, enemyId, etc.).
   * Flexible structure to support different warning types.
   */
  context: Record<string, unknown>;
}

/**
 * Warning value object.
 * Represents a typed warning with severity level and context.
 *
 * Immutable value object following domain-driven design principles.
 * Implements ADR-013 (Typed Warning System with Severity Levels).
 *
 * @example
 * ```typescript
 * const warning = new Warning({
 *   type: 'ttk_out_of_tolerance',
 *   severity: 'warning',
 *   message: 'TTK fora da tolerância: 12T vs target 10T',
 *   context: { troopId: 1, ttkTurns: 12, targetTurns: 10 }
 * });
 * ```
 */
export class Warning {
  readonly type: WarningType;
  readonly severity: WarningSeverity;
  readonly message: string;
  readonly context: Record<string, unknown>;

  /**
   * Creates a new Warning.
   *
   * @param data - Warning data
   * @throws {ValidationError} If message is empty
   */
  constructor(data: WarningData) {
    if (!data.message || data.message.trim().length === 0) {
      throw new ValidationError('Warning message cannot be empty', { data });
    }

    this.type = data.type;
    this.severity = data.severity;
    this.message = data.message;
    this.context = { ...data.context }; // Shallow copy to prevent mutation

    // Freeze to ensure immutability
    Object.freeze(this);
    Object.freeze(this.context);
  }

  /**
   * Check if warning is critical.
   * Critical warnings indicate blocking issues.
   *
   * @returns True if severity is 'critical'
   */
  isCritical(): boolean {
    return this.severity === 'critical';
  }

  /**
   * Check if warning is of specific type.
   *
   * @param type - Warning type to check
   * @returns True if warning matches the type
   */
  isType(type: WarningType): boolean {
    return this.type === type;
  }

  /**
   * Value equality check.
   * Two warnings are equal if all fields match.
   *
   * @param other - The other Warning to compare
   * @returns True if warnings are equal
   */
  equals(other: Warning): boolean {
    return (
      this.type === other.type &&
      this.severity === other.severity &&
      this.message === other.message &&
      this.deepEqualsContext(this.context, other.context)
    );
  }

  /**
   * Deep equality check for context objects.
   * Compares two Record<string, unknown> objects recursively.
   *
   * @param a - First context object
   * @param b - Second context object
   * @returns True if contexts are deeply equal
   */
  private deepEqualsContext(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // Different number of keys means not equal
    if (keysA.length !== keysB.length) {
      return false;
    }

    // Check each key-value pair
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false;
      }

      const valueA = a[key];
      const valueB = b[key];

      // Handle null/undefined explicitly
      if (valueA === null || valueA === undefined) {
        return valueA === valueB;
      }

      if (valueB === null || valueB === undefined) {
        return false;
      }

      // Recursively compare objects
      if (typeof valueA === 'object' && typeof valueB === 'object') {
        if (Array.isArray(valueA) && Array.isArray(valueB)) {
          if (!this.deepEqualsArray(valueA, valueB)) {
            return false;
          }
        } else if (Array.isArray(valueA) || Array.isArray(valueB)) {
          // One is array, other is not
          return false;
        } else {
          // Both are objects
          if (
            !this.deepEqualsContext(
              valueA as Record<string, unknown>,
              valueB as Record<string, unknown>
            )
          ) {
            return false;
          }
        }
      } else if (valueA !== valueB) {
        // Primitive values must match exactly
        return false;
      }
    }

    return true;
  }

  /**
   * Deep equality check for arrays.
   *
   * @param a - First array
   * @param b - Second array
   * @returns True if arrays are deeply equal
   */
  private deepEqualsArray(a: unknown[], b: unknown[]): boolean {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      const valueA = a[i];
      const valueB = b[i];

      if (valueA === null || valueA === undefined) {
        if (valueA !== valueB) {
          return false;
        }
        continue;
      }

      if (typeof valueA === 'object' && typeof valueB === 'object') {
        if (Array.isArray(valueA) && Array.isArray(valueB)) {
          if (!this.deepEqualsArray(valueA, valueB)) {
            return false;
          }
        } else if (Array.isArray(valueA) || Array.isArray(valueB)) {
          return false;
        } else {
          if (
            !this.deepEqualsContext(
              valueA as Record<string, unknown>,
              valueB as Record<string, unknown>
            )
          ) {
            return false;
          }
        }
      } else if (valueA !== valueB) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert to plain object for serialization.
   * Suitable for JSON.stringify and report generation.
   *
   * @returns Plain object representation
   */
  toJSON(): WarningData {
    return {
      type: this.type,
      severity: this.severity,
      message: this.message,
      context: { ...this.context },
    };
  }

  /**
   * String representation of the warning.
   *
   * @returns String in format "[severity] type: message"
   */
  toString(): string {
    return `[${this.severity}] ${this.type}: ${this.message}`;
  }
}
