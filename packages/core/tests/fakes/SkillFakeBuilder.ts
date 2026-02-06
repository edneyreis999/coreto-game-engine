import { FakeBuilder } from './FakeBuilder.js';
import { Skill, type SkillEntityData } from '../../src/core/domain/Skill.js';
import type { DamageType, HitType, SkillScope } from '../../src/core/domain/Skill.js';

export class SkillFakeBuilder extends FakeBuilder<Skill> {
  private id = 1;
  private name = 'Fireball';
  private description = 'Deals fire damage to one enemy';
  private damageType: DamageType = 'hp_damage';
  private elementId = 2;
  private formula = 'a.mat * 4 - b.mdf * 2';
  private variance = 20;
  private critical = true;
  private hitType: HitType = 'magical';
  private scope: SkillScope = 'one_enemy';
  private mpCost = 5;
  private tpCost = 0;
  private successRate = 100;
  private repeats = 1;
  private speed = 0;

  withId(id: number): this {
    this.id = id;
    return this;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withDescription(desc: string): this {
    this.description = desc;
    return this;
  }

  withDamageType(type: DamageType): this {
    this.damageType = type;
    return this;
  }

  withFormula(formula: string): this {
    this.formula = formula;
    return this;
  }

  withVariance(variance: number): this {
    this.variance = variance;
    return this;
  }

  withCritical(critical: boolean): this {
    this.critical = critical;
    return this;
  }

  withHitType(hitType: HitType): this {
    this.hitType = hitType;
    return this;
  }

  withScope(scope: SkillScope): this {
    this.scope = scope;
    return this;
  }

  withMpCost(cost: number): this {
    this.mpCost = cost;
    return this;
  }

  withTpCost(cost: number): this {
    this.tpCost = cost;
    return this;
  }

  withSuccessRate(rate: number): this {
    this.successRate = rate;
    return this;
  }

  withRepeats(repeats: number): this {
    this.repeats = repeats;
    return this;
  }

  withSpeed(speed: number): this {
    this.speed = speed;
    return this;
  }

  // Convenience methods
  withPhysical(): this {
    return this.withHitType('physical');
  }

  withMagical(): this {
    return this.withHitType('magical');
  }

  withCertain(): this {
    return this.withHitType('certain');
  }

  withHealing(): this {
    return this.withDamageType('hp_recover');
  }

  withNoCost(): this {
    this.mpCost = 0;
    this.tpCost = 0;
    return this;
  }

  build(): Skill {
    const data: SkillEntityData = {
      id: this.id,
      name: this.name,
      description: this.description,
      damage: {
        type: this.damageType,
        elementId: this.elementId,
        formula: this.formula,
        variance: this.variance,
        critical: this.critical,
      },
      hitType: this.hitType,
      scope: this.scope,
      mpCost: this.mpCost,
      tpCost: this.tpCost,
      successRate: this.successRate,
      repeats: this.repeats,
      speed: this.speed,
    };
    return new Skill(data);
  }

  withInvalidData(): this {
    return this.withId(0);
  }
}
