import { injectable } from 'tsyringe';

/**
 * Type assertion for accessing global RMMZ objects
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalScope = global as any;

/**
 * Skill IDs defined in RPG Maker MZ core (Skills.json)
 * These IDs are standard across all RMMZ projects:
 * - 1: Attack (basic attack)
 * - 2: Guard (defend, reduces damage)
 */
const SKILL_ID_ATTACK = 1;
const SKILL_ID_GUARD = 2;

/**
 * Result of skill selection containing the selected skill and target
 */
export interface SkillSelectionResult {
  /** ID of the selected skill (from Skills.json) */
  skillId: number;
  /** Target battler object (Game_Enemy or Game_Actor) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any;
}

/**
 * SkillSelector - MVP implementation for skill selection in battle (ADR-004, ADR-019)
 *
 * This is a simplified MVP implementation that:
 * - Always selects basic attack ($dataSkills[1]) when HP/MP sufficient
 * - Falls back to Guard ($dataSkills[2]) when HP/MP insufficient
 * - Targets the first alive enemy from $gameTroop.aliveMembers()[0]
 *
 * IMPORTANT:
 * - This is NOT the full damage-per-action algorithm (ADR-019)
 * - Future iterations will implement skill comparison and optimization
 * - For MVP, we only validate basic attack selection logic
 *
 * @example
 * ```typescript
 * const selector = new SkillSelector();
 * const actor = $gameParty.members()[0];
 * const selection = selector.selectSkillForActor(actor);
 * // selection.skillId will be 1 (Attack) or 2 (Guard)
 * // selection.target will be first alive enemy
 * ```
 */
@injectable()
export class SkillSelector {
  /**
   * Select a skill for an actor to use in battle.
   * MVP implementation: always selects Attack (skill ID 1) if actor can afford it,
   * otherwise selects Guard (skill ID 2).
   *
   * HP/MP affordability check (ADR-004):
   * - Skill is affordable if actor.hp > skill.hpCost (or hpCost is 0)
   * - Skill is affordable if actor.mp >= skill.mpCost
   *
   * @param actor - Game_Actor instance to select skill for
   * @returns SkillSelectionResult with selected skill ID and target
   * @throws {Error} If no alive enemies found (battle should have ended)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectSkillForActor(actor: any): SkillSelectionResult {
    // Get basic attack skill data
    const attackSkill = globalScope.$dataSkills[SKILL_ID_ATTACK];

    // Check if actor can afford to use Attack skill (ADR-004)
    const canAffordAttack = this.canAffordSkill(actor, attackSkill);

    // Select skill: Attack if affordable, otherwise Guard
    const skillId = canAffordAttack ? SKILL_ID_ATTACK : SKILL_ID_GUARD;

    // Target selection: first alive enemy (ADR-019 MVP)
    const target = this.selectTarget();

    return { skillId, target };
  }

  /**
   * Check if an actor can afford to use a skill based on HP/MP costs.
   * Implements ADR-004 affordability constraints.
   *
   * A skill is affordable when:
   * 1. HP cost check: actor.hp > skill.hpCost (if hpCost exists)
   * 2. MP cost check: actor.mp >= skill.mpCost (if mpCost exists)
   *
   * @param actor - Game_Actor instance
   * @param skill - Skill data from $dataSkills
   * @returns true if actor can afford the skill, false otherwise
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private canAffordSkill(actor: any, skill: any): boolean {
    // Check HP cost (skill must have hpCost property, default to 0 if undefined)
    const hpCost = skill.hpCost ?? 0;
    if (hpCost > 0 && actor.hp <= hpCost) {
      return false; // Cannot afford: would kill actor
    }

    // Check MP cost (skill must have mpCost property, default to 0 if undefined)
    const mpCost = skill.mpCost ?? 0;
    if (actor.mp < mpCost) {
      return false; // Cannot afford: insufficient MP
    }

    return true;
  }

  /**
   * Select a target for the skill.
   * MVP implementation: always targets first alive enemy.
   *
   * @returns First alive enemy from $gameTroop
   * @throws {Error} If no alive enemies found
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private selectTarget(): any {
    const gameTroop = globalScope.$gameTroop;

    if (!gameTroop) {
      throw new Error('$gameTroop not initialized');
    }

    // Get all alive enemies
    const aliveEnemies = gameTroop.aliveMembers();

    if (!aliveEnemies || aliveEnemies.length === 0) {
      throw new Error('No alive enemies found. Battle should have ended.');
    }

    // Return first alive enemy (MVP target selection)
    return aliveEnemies[0];
  }
}
