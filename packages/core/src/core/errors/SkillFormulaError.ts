import { DomainError } from './DomainError.js';

/**
 * Error thrown when a skill's damage formula fails to evaluate.
 *
 * This is a warning-level error because the system can continue by skipping
 * this skill or using a fallback damage calculation. However, it indicates
 * an issue with the skill data that should be investigated.
 *
 * Common causes:
 * - Syntax errors in the formula string
 * - References to undefined variables
 * - Division by zero or other runtime errors
 *
 * @example
 * ```typescript
 * try {
 *   damage = eval(skill.damage.formula);
 * } catch (error) {
 *   throw new SkillFormulaError(
 *     skill.id,
 *     skill.damage.formula,
 *     error.message
 *   );
 * }
 * ```
 */
export class SkillFormulaError extends DomainError {
  /**
   * Creates a new SkillFormulaError.
   *
   * @param skillId - The skill ID with the invalid formula
   * @param formula - The formula string that failed
   * @param errorMessage - The error message from formula evaluation
   */
  constructor(skillId: number, formula: string, errorMessage: string) {
    super(`Skill formula error: ${errorMessage}`, 'warning', {
      skillId,
      formula,
      errorMessage,
    });
  }
}
