import Chance from 'chance';
import { Warning } from '../../../src/core/domain/Warning';
import type { WarningData } from '../../../src/core/domain/Warning';
import type { WarningType, WarningSeverity } from '../../../src/core/ports/IReporter';

/**
 * FakeBuilder for Warning domain entity.
 * Provides fluent interface for creating test warnings with realistic defaults.
 */
export class WarningFakeBuilder {
  private chance = new Chance();
  private data: WarningData = {
    type: 'ttk_out_of_tolerance',
    severity: 'warning',
    message: 'TTK out of tolerance',
    context: { troopId: 1 },
  };

  /**
   * Sets the warning type.
   */
  withType(type: WarningType): this {
    this.data.type = type;
    return this;
  }

  /**
   * Sets the warning severity.
   */
  withSeverity(severity: WarningSeverity): this {
    this.data.severity = severity;
    return this;
  }

  /**
   * Sets the warning message.
   */
  withMessage(message: string): this {
    this.data.message = message;
    return this;
  }

  /**
   * Sets the warning context.
   */
  withContext(context: Record<string, unknown>): this {
    this.data.context = context;
    return this;
  }

  /**
   * Adds a value to the warning context.
   */
  withContextValue(key: string, value: unknown): this {
    this.data.context = { ...this.data.context, [key]: value };
    return this;
  }

  /**
   * Sets as a critical warning.
   */
  asCritical(): this {
    this.data.severity = 'critical';
    return this;
  }

  /**
   * Sets as an info warning.
   */
  asInfo(): this {
    this.data.severity = 'info';
    return this;
  }

  /**
   * Sets as a warning (default severity).
   */
  asWarning(): this {
    this.data.severity = 'warning';
    return this;
  }

  /**
   * Creates a TTK out of tolerance warning.
   */
  asTtkOutOfTolerance(troopId: number = 1): this {
    this.data.type = 'ttk_out_of_tolerance';
    this.data.severity = 'warning';
    this.data.message = 'TTK out of tolerance';
    this.data.context = { troopId };
    return this;
  }

  /**
   * Creates a troop not found warning.
   */
  asTroopNotFound(troopId: number): this {
    this.data.type = 'troop_not_found';
    this.data.severity = 'critical';
    this.data.message = `Troop ${troopId} not found`;
    this.data.context = { troopId };
    return this;
  }

  /**
   * Creates a battle timeout warning.
   */
  asBattleTimeout(troopId: number = 1, maxTurns: number = 100, actualTurns: number = 100): this {
    this.data.type = 'battle_timeout';
    this.data.severity = 'warning';
    this.data.message = 'Battle exceeded maximum turn limit';
    this.data.context = { troopId, maxTurns, actualTurns };
    return this;
  }

  /**
   * Creates a skill formula error warning.
   */
  asSkillFormulaError(skillId: number, formula: string = 'a.atk * 2 - b.def'): this {
    this.data.type = 'skill_formula_error';
    this.data.severity = 'critical';
    this.data.message = 'Error evaluating skill damage formula';
    this.data.context = { skillId, formula };
    return this;
  }

  /**
   * Creates an enemy not found warning.
   */
  asEnemyNotFound(enemyId: number, troopId: number = 1): this {
    this.data.type = 'enemy_not_found';
    this.data.severity = 'critical';
    this.data.message = `Enemy ${enemyId} not found in troop ${troopId}`;
    this.data.context = { enemyId, troopId };
    return this;
  }

  /**
   * Sets a random valid warning.
   */
  withRandomData(): this {
    const types: WarningType[] = ['ttk_out_of_tolerance', 'troop_not_found', 'enemy_not_found', 'skill_formula_error', 'battle_timeout'];
    const severities: WarningSeverity[] = ['critical', 'warning', 'info'];

    this.data = {
      type: this.chance.pickone(types),
      severity: this.chance.pickone(severities),
      message: this.chance.sentence({ words: 5 }),
      context: { id: this.chance.integer({ min: 1, max: 100 }) },
    };
    return this;
  }

  /**
   * Builds the Warning instance.
   */
  build(): Warning {
    return new Warning(this.data);
  }
}
