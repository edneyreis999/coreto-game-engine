/**
 * FakeBuilder for Warning in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/core/src/core/domain/Warning.ts
 */

import Chance from 'chance';
import type { WarningData } from '@coreto/core';

const chance = new Chance();

/**
 * Builder for creating WarningData in tests.
 */
export class WarningBuilder {
  private data: Partial<WarningData> = {};

  static create(): WarningBuilder {
    return new WarningBuilder().withDefaults();
  }

  withDefaults(): this {
    this.data = {
      type: chance.pickone([
        'troop_not_found',
        'enemy_not_found',
        'class_not_found',
        'skill_not_found',
        'ttk_out_of_tolerance',
        'skill_formula_error',
        'battle_timeout',
      ]),
      severity: chance.pickone(['critical', 'warning', 'info']),
      message: chance.sentence(),
      context: {
        trechoId: `ato${chance.natural({ min: 1, max: 3 })}-nivel${chance.natural({ min: 1, max: 10 })}-${chance.natural({ min: 1, max: 99 })}`,
      },
    };
    return this;
  }

  withType(type: 'troop_not_found' | 'enemy_not_found' | 'class_not_found' | 'skill_not_found' | 'ttk_out_of_tolerance' | 'skill_formula_error' | 'battle_timeout'): this {
    this.data.type = type;
    return this;
  }

  withMessage(message: string): this {
    this.data.message = message;
    return this;
  }

  withSeverity(severity: 'critical' | 'warning' | 'info'): this {
    this.data.severity = severity;
    return this;
  }

  withContext(context: Record<string, unknown>): this {
    this.data.context = context;
    return this;
  }

  critical(): this {
    return this.withSeverity('critical');
  }

  warning(): this {
    return this.withSeverity('warning');
  }

  info(): this {
    return this.withSeverity('info');
  }

  troopNotFound(troopId?: number): this {
    this.data.type = 'troop_not_found';
    this.data.severity = 'critical';
    this.data.context = { troopId: troopId ?? chance.natural({ min: 1, max: 50 }) };
    return this;
  }

  enemyNotFound(enemyId?: number): this {
    this.data.type = 'enemy_not_found';
    this.data.severity = 'critical';
    this.data.context = { enemyId: enemyId ?? chance.natural({ min: 1, max: 50 }) };
    return this;
  }

  ttkOutOfTolerance(troopId?: number, ttkTurns?: number, targetTurns?: number): this {
    this.data.type = 'ttk_out_of_tolerance';
    this.data.severity = 'warning';
    this.data.context = {
      troopId: troopId ?? chance.natural({ min: 1, max: 50 }),
      ttkTurns: ttkTurns ?? chance.natural({ min: 11, max: 20 }),
      targetTurns: targetTurns ?? chance.natural({ min: 5, max: 10 }),
    };
    return this;
  }

  build(): WarningData {
    return this.data as WarningData;
  }
}
