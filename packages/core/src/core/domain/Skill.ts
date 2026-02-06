import { ValidationError } from '../errors/index.js';
import type { SkillData } from '../../types/rmmz-data.js';

/**
 * Damage type enumeration.
 * Defines the type of effect a skill has on HP/MP.
 */
export type DamageType =
  | 'none' // No damage (healing, buffs, etc.)
  | 'hp_damage' // HP damage
  | 'mp_damage' // MP damage
  | 'hp_recover' // HP recovery
  | 'mp_recover' // MP recovery
  | 'hp_drain' // HP drain (absorb)
  | 'mp_drain'; // MP drain (absorb)

/**
 * Hit type enumeration.
 * Defines how accuracy is determined for the skill.
 */
export type HitType = 'certain' | 'physical' | 'magical';

/**
 * Skill scope enumeration.
 * Defines target selection for the skill.
 */
export type SkillScope =
  | 'none' // No target
  | 'one_enemy' // Single enemy
  | 'all_enemies' // All enemies
  | 'one_ally' // Single ally
  | 'all_allies' // All allies
  | 'user'; // User only (self)

/**
 * Skill damage data structure.
 * Contains damage calculation parameters.
 */
export interface SkillDamageData {
  /**
   * Damage type.
   */
  type: DamageType;

  /**
   * Element ID for damage calculation.
   * -1 = Normal Attack element
   * 0+ = references System.elements
   */
  elementId: number;

  /**
   * Damage formula as JavaScript expression.
   * Variables available: a (attacker), b (target), v (game variables)
   * Example: "a.atk * 4 - b.def * 2"
   */
  formula: string;

  /**
   * Damage variance percentage (0-100).
   * Higher values create more damage variation.
   */
  variance: number;

  /**
   * Whether the skill can deal critical hits.
   */
  critical: boolean;
}

/**
 * Skill entity data structure.
 * Contains all data needed to construct a Skill entity.
 */
export interface SkillEntityData {
  /**
   * Unique skill ID from RPG Maker MZ Skills.json (1-based index).
   */
  id: number;

  /**
   * Human-readable skill name.
   */
  name: string;

  /**
   * Skill description shown in menus.
   */
  description: string;

  /**
   * Damage configuration.
   */
  damage: SkillDamageData;

  /**
   * Hit type (certain, physical, or magical).
   */
  hitType: HitType;

  /**
   * Skill scope (target selection).
   */
  scope: SkillScope;

  /**
   * MP cost to use skill.
   */
  mpCost: number;

  /**
   * TP cost to use skill.
   */
  tpCost: number;

  /**
   * Base success rate percentage (0-100).
   */
  successRate: number;

  /**
   * Number of times skill hits (1 for normal skills).
   */
  repeats: number;

  /**
   * Speed correction (affects turn order).
   */
  speed: number;
}

/**
 * Skill entity.
 * Represents a skill, spell, or special ability from RPG Maker MZ.
 *
 * Immutable entity following domain-driven design principles.
 * All validation occurs in the constructor, ensuring invalid states are impossible.
 *
 * Domain entity for combat simulation, encapsulating skill properties
 * that affect TTK calculations (damage formula, costs, accuracy, scope).
 *
 * Implements ADR-019 (Skill Selection Optimization) by providing
 * methods to evaluate skill efficiency for damage-per-action calculations.
 *
 * @example
 * ```typescript
 * const skill = new Skill({
 *   id: 1,
 *   name: 'Fireball',
 *   description: 'Deals fire damage to one enemy',
 *   damage: {
 *     type: 'hp_damage',
 *     elementId: 2,
 *     formula: 'a.mat * 4 - b.mdf * 2',
 *     variance: 20,
 *     critical: true
 *   },
 *   hitType: 'magical',
 *   scope: 'one_enemy',
 *   mpCost: 5,
 *   tpCost: 0,
 *   successRate: 100,
 *   repeats: 1,
 *   speed: 0
 * });
 *
 * skill.isDamageSkill(); // true
 * skill.getTotalCost(); // { mp: 5, tp: 0 }
 * ```
 */
export class Skill {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly damage: SkillDamageData;
  readonly hitType: HitType;
  readonly scope: SkillScope;
  readonly mpCost: number;
  readonly tpCost: number;
  readonly successRate: number;
  readonly repeats: number;
  readonly speed: number;

  /**
   * Creates a new Skill.
   *
   * @param data - Skill entity data
   * @throws {ValidationError} If any validation rule fails
   */
  constructor(data: SkillEntityData) {
    // Validate ID
    if (data.id < 1) {
      throw new ValidationError('Skill ID must be >= 1', { id: data.id });
    }

    // Validate name
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Skill name cannot be empty', { id: data.id });
    }

    // Validate costs
    if (data.mpCost < 0) {
      throw new ValidationError('Skill MP cost cannot be negative', {
        id: data.id,
        mpCost: data.mpCost,
      });
    }
    if (data.tpCost < 0) {
      throw new ValidationError('Skill TP cost cannot be negative', {
        id: data.id,
        tpCost: data.tpCost,
      });
    }

    // Validate success rate
    if (data.successRate < 0 || data.successRate > 100) {
      throw new ValidationError('Skill success rate must be 0-100', {
        id: data.id,
        successRate: data.successRate,
      });
    }

    // Validate repeats
    if (data.repeats < 1) {
      throw new ValidationError('Skill repeats must be >= 1', {
        id: data.id,
        repeats: data.repeats,
      });
    }

    // Validate damage
    if (!data.damage.formula || data.damage.formula.trim() === '') {
      throw new ValidationError('Skill damage formula cannot be empty', { id: data.id });
    }
    if (data.damage.variance < 0 || data.damage.variance > 100) {
      throw new ValidationError('Skill damage variance must be 0-100', {
        id: data.id,
        variance: data.damage.variance,
      });
    }

    // Assign validated data
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.damage = Object.freeze({ ...data.damage });
    this.hitType = data.hitType;
    this.scope = data.scope;
    this.mpCost = data.mpCost;
    this.tpCost = data.tpCost;
    this.successRate = data.successRate;
    this.repeats = data.repeats;
    this.speed = data.speed;

    // Freeze to ensure immutability
    Object.freeze(this);
  }

  /**
   * Check if this skill deals damage.
   * Returns true for HP damage, HP drain, or MP drain skills.
   *
   * @returns True if skill deals damage
   */
  isDamageSkill(): boolean {
    return (
      this.damage.type === 'hp_damage' ||
      this.damage.type === 'hp_drain' ||
      this.damage.type === 'mp_drain'
    );
  }

  /**
   * Check if this skill is a healing skill.
   * Returns true for HP recover or MP recover skills.
   *
   * @returns True if skill heals
   */
  isHealingSkill(): boolean {
    return this.damage.type === 'hp_recover' || this.damage.type === 'mp_recover';
  }

  /**
   * Check if this skill has a resource cost.
   * Returns true if MP or TP cost is greater than 0.
   *
   * @returns True if skill has a cost
   */
  hasCost(): boolean {
    return this.mpCost > 0 || this.tpCost > 0;
  }

  /**
   * Get total resource cost as object.
   *
   * @returns Object with mp and tp costs
   */
  getTotalCost(): { mp: number; tp: number } {
    return { mp: this.mpCost, tp: this.tpCost };
  }

  /**
   * Check if skill can miss based on hit type.
   * Certain hit skills never miss (except for state immunity).
   *
   * @returns True if skill can miss
   */
  canMiss(): boolean {
    return this.hitType !== 'certain';
  }

  /**
   * Check if skill targets enemies.
   *
   * @returns True if skill targets one or more enemies
   */
  targetsEnemies(): boolean {
    return this.scope === 'one_enemy' || this.scope === 'all_enemies';
  }

  /**
   * Check if skill targets allies.
   *
   * @returns True if skill targets one or more allies
   */
  targetsAllies(): boolean {
    return this.scope === 'one_ally' || this.scope === 'all_allies' || this.scope === 'user';
  }

  /**
   * Check if skill is an AOE (area of effect) skill.
   *
   * @returns True if skill targets multiple enemies or allies
   */
  isAoe(): boolean {
    return this.scope === 'all_enemies' || this.scope === 'all_allies';
  }

  /**
   * Check if skill has critical hit potential.
   *
   * @returns True if skill can crit
   */
  canCrit(): boolean {
    return this.damage.critical && (this.hitType === 'physical' || this.hitType === 'magical');
  }

  /**
   * Value equality check.
   * Two skills are equal if they have the same ID.
   *
   * @param other - The other Skill to compare
   * @returns True if both skills have the same ID
   */
  equals(other: Skill): boolean {
    return this.id === other.id;
  }

  /**
   * Create Skill from RPG Maker MZ SkillData.
   * Factory method to convert raw RMMZ data to domain entity.
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

  /**
   * String representation of the skill.
   *
   * @returns String in format "Skill #{id}: {name}"
   */
  toString(): string {
    return `Skill #${this.id}: ${this.name}`;
  }
}
