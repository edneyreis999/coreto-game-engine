/**
 * SkillMapper - Infrastructure mapper for RPG Maker MZ skill data.
 *
 * Bridges the infrastructure layer (raw RMMZ SkillData) to the domain layer
 * (Skill entity) by mapping numeric enums and raw fields to domain value types.
 *
 * Extracted from the Skill domain entity to maintain clean architecture boundaries:
 * domain entities should not depend on infrastructure types.
 *
 * @example
 * ```typescript
 * const rmmzSkill: SkillData = loadedDatabase.skills[1];
 * const skill = SkillMapper.fromRmmzData(rmmzSkill);
 * ```
 */

import { Skill } from '@coreto/core';
import type { DamageType, HitType, SkillScope } from '@coreto/core';
import type { SkillData } from '../../../types/rmmz-data.js';

export class SkillMapper {
  /**
   * Create Skill from RPG Maker MZ SkillData.
   * Maps raw RMMZ numeric enums and data to domain entity types.
   *
   * @param data - Raw RPG Maker MZ SkillData
   * @returns Skill domain entity
   */
  static fromRmmzData(data: SkillData): Skill {
    // Map damage type
    const damageTypeMap: Record<number, DamageType> = {
      0: 'none',
      1: 'hp_damage',
      2: 'mp_damage',
      3: 'hp_recover',
      4: 'mp_recover',
      5: 'hp_drain',
      6: 'mp_drain',
    };

    // Map hit type
    const hitTypeMap: Record<number, HitType> = {
      0: 'certain',
      1: 'physical',
      2: 'magical',
    };

    // Map scope
    const scopeMap: Record<number, SkillScope> = {
      0: 'none',
      1: 'one_enemy',
      2: 'all_enemies',
      3: 'one_ally', // Not actual MZ value but logical extension
      7: 'one_ally',
      8: 'all_allies',
      10: 'user',
      11: 'user',
    };

    const damageType = damageTypeMap[data.damage.type] || 'none';
    const hitType = hitTypeMap[data.hitType] || 'certain';
    const scope = scopeMap[data.scope] || 'one_enemy';

    return new Skill({
      id: data.id,
      name: data.name,
      description: data.description,
      damage: {
        type: damageType,
        elementId: data.damage.elementId,
        formula: data.damage.formula,
        variance: data.damage.variance,
        critical: data.damage.critical,
      },
      hitType,
      scope,
      mpCost: data.mpCost,
      tpCost: data.tpCost,
      successRate: data.successRate,
      repeats: data.repeats,
      speed: data.speed,
    });
  }
}
