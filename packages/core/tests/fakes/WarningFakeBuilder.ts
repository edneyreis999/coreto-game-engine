import { FakeBuilder } from './FakeBuilder.js';
import { Warning, WarningData } from '@coreto/core';
import type { WarningType, WarningSeverity } from '@coreto/core';

/**
 * Builder for creating Warning instances in tests.
 * Provides sensible defaults and fluent interface for customization.
 *
 * @example
 * ```typescript
 * const warning = new WarningFakeBuilder()
 *   .withType('ttk_out_of_tolerance')
 *   .withSeverity('warning')
 *   .withMessage('TTK fora da tolerância')
 *   .build();
 *
 * const critical = new WarningFakeBuilder()
 *   .withCriticalSeverity()
 *   .build();
 * ```
 */
export class WarningFakeBuilder extends FakeBuilder<Warning> {
  private type: WarningType = 'ttk_out_of_tolerance';
  private severity: WarningSeverity = 'warning';
  private message = 'Test warning message';
  private context: Record<string, unknown> = {};

  /**
   * Set the warning type.
   *
   * @param type - Warning type from schema
   * @returns This builder for chaining
   */
  withType(type: WarningType): this {
    this.type = type;
    return this;
  }

  /**
   * Set the severity level.
   *
   * @param severity - Severity level (critical, warning, info)
   * @returns This builder for chaining
   */
  withSeverity(severity: WarningSeverity): this {
    this.severity = severity;
    return this;
  }

  /**
   * Set severity to critical.
   *
   * @returns This builder for chaining
   */
  withCriticalSeverity(): this {
    return this.withSeverity('critical');
  }

  /**
   * Set severity to warning.
   *
   * @returns This builder for chaining
   */
  withWarningSeverity(): this {
    return this.withSeverity('warning');
  }

  /**
   * Set severity to info.
   *
   * @returns This builder for chaining
   */
  withInfoSeverity(): this {
    return this.withSeverity('info');
  }

  /**
   * Set the warning message.
   *
   * @param message - Human-readable description
   * @returns This builder for chaining
   */
  withMessage(message: string): this {
    this.message = message;
    return this;
  }

  /**
   * Set the context object.
   *
   * @param context - Type-specific debugging information
   * @returns This builder for chaining
   */
  withContext(context: Record<string, unknown>): this {
    this.context = { ...context };
    return this;
  }

  /**
   * Add a single key-value pair to context.
   *
   * @param key - Context key
   * @param value - Context value
   * @returns This builder for chaining
   */
  withContextValue(key: string, value: unknown): this {
    this.context[key] = value;
    return this;
  }

  /**
   * Create a TTK out of tolerance warning.
   *
   * @param troopId - Troop ID
   * @param ttkTurns - Measured TTK turns
   * @param targetTurns - Target TTK turns
   * @returns This builder for chaining
   */
  withTtkOutOfTolerance(troopId: number = 1, ttkTurns: number = 12, targetTurns: number = 10): this {
    return this
      .withType('ttk_out_of_tolerance')
      .withWarningSeverity()
      .withMessage(`TTK fora da tolerância: ${ttkTurns}T vs target ${targetTurns}T`)
      .withContext({ troopId, ttkTurns, targetTurns });
  }

  /**
   * Create a troop not found warning.
   *
   * @param troopId - Missing troop ID
   * @returns This builder for chaining
   */
  withTroopNotFound(troopId: number = 999): this {
    return this
      .withType('troop_not_found')
      .withCriticalSeverity()
      .withMessage(`Troop ID ${troopId} not found`)
      .withContext({ troopId });
  }

  /**
   * Create a skill formula error warning.
   *
   * @param skillId - Skill ID with error
   * @param formula - Invalid formula
   * @returns This builder for chaining
   */
  withSkillFormulaError(skillId: number = 1, formula: string = 'invalid'): this {
    return this
      .withType('skill_formula_error')
      .withCriticalSeverity()
      .withMessage(`Error evaluating skill ${skillId} formula`)
      .withContext({ skillId, formula });
  }

  /**
   * Create a battle timeout warning.
   *
   * @param troopId - Troop ID that timed out
   * @param maxTurns - Maximum turn limit
   * @returns This builder for chaining
   */
  withBattleTimeout(troopId: number = 1, maxTurns: number = 50): this {
    return this
      .withType('battle_timeout')
      .withWarningSeverity()
      .withMessage(`Battle exceeded maximum turn limit of ${maxTurns}`)
      .withContext({ troopId, maxTurns });
  }

  /**
   * Create a warning with empty message (invalid).
   *
   * @returns This builder for chaining
   */
  withEmptyMessage(): this {
    return this.withMessage('');
  }

  /**
   * Create a warning with whitespace-only message (invalid).
   *
   * @returns This builder for chaining
   */
  withWhitespaceMessage(): this {
    return this.withMessage('   ');
  }

  /**
   * Build the Warning instance.
   *
   * @returns Warning instance
   * @throws {ValidationError} If message is empty
   */
  build(): Warning {
    const data: WarningData = {
      type: this.type,
      severity: this.severity,
      message: this.message,
      context: { ...this.context },
    };
    return new Warning(data);
  }

  /**
   * Create builder with invalid data.
   */
  withInvalidData(): this {
    return this.withEmptyMessage();
  }
}
