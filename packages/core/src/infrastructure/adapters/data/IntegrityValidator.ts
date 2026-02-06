/**
 * IntegrityValidator - Cross-reference integrity validation for RPG Maker MZ database
 *
 * Validates that all ID references between database files are valid.
 * Implements warning-based validation approach (ADR-013).
 *
 * Cross-references validated:
 * - TroopMember.enemyId -> Enemies.json
 * - EnemyAction.skillId -> Skills.json
 * - ClassLearning.skillId -> Skills.json
 * - SystemData.testBattlers classId -> Classes.json
 *
 * @example
 * ```typescript
 * const validator = new IntegrityValidator();
 * const warnings = validator.validate(database);
 * console.log(warnings); // Array of Warning objects
 * ```
 */

import type { RmmzDatabase, Warning } from '../../../core/ports/index.js';

/**
 * IntegrityValidator validates cross-references between database entries.
 * Follows warning-based validation approach (ADR-013) - collects warnings instead of throwing.
 */
export class IntegrityValidator {
  /**
   * Validate all cross-references in the database.
   * Returns array of warnings for invalid references.
   *
   * @param database - Loaded RPG Maker MZ database
   * @returns Array of validation warnings (empty if all valid)
   */
  validate(database: RmmzDatabase): Warning[] {
    const warnings: Warning[] = [];

    // Validate troop members reference valid enemies
    warnings.push(...this.validateTroopEnemyReferences(database));

    // Validate enemy actions reference valid skills
    warnings.push(...this.validateEnemyActionReferences(database));

    // Validate class learnings reference valid skills
    warnings.push(...this.validateClassLearningReferences(database));

    // Validate system test battlers reference valid classes
    warnings.push(...this.validateSystemTestBattlerReferences(database));

    return warnings;
  }

  /**
   * Validate that all troop members reference existing enemies.
   * Checks TroopMember.enemyId against $dataEnemies.
   *
   * @param database - Loaded database
   * @returns Array of warnings for invalid enemy references
   */
  private validateTroopEnemyReferences(database: RmmzDatabase): Warning[] {
    const warnings: Warning[] = [];
    const { $dataTroops, $dataEnemies } = database;

    // Build set of valid enemy IDs (RPG Maker uses 1-based arrays)
    const validEnemyIds = new Set<number>();
    for (let i = 1; i < $dataEnemies.length; i++) {
      const enemy = $dataEnemies[i];
      if (enemy && typeof enemy === 'object' && 'id' in enemy && typeof enemy.id === 'number') {
        validEnemyIds.add(enemy.id);
      }
    }

    // Check each troop member
    for (let i = 1; i < $dataTroops.length; i++) {
      const troop = $dataTroops[i];
      if (!troop || typeof troop !== 'object' || !('members' in troop)) {
        continue;
      }

      const members = troop.members as Array<{ enemyId: number }>;
      for (const member of members) {
        if (!validEnemyIds.has(member.enemyId)) {
          warnings.push({
            type: 'enemy_not_found',
            severity: 'critical',
            message: `Troop ${troop.id} references non-existent enemy ${member.enemyId}`,
            context: {
              troopId: troop.id,
              troopName: (troop as { name: string }).name,
              enemyId: member.enemyId,
              source: 'TroopMember.enemyId',
            },
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Validate that all enemy actions reference existing skills.
   * Checks EnemyAction.skillId against $dataSkills.
   *
   * @param database - Loaded database
   * @returns Array of warnings for invalid skill references
   */
  private validateEnemyActionReferences(database: RmmzDatabase): Warning[] {
    const warnings: Warning[] = [];
    const { $dataEnemies, $dataSkills } = database;

    // Build set of valid skill IDs
    const validSkillIds = new Set<number>();
    for (let i = 1; i < $dataSkills.length; i++) {
      const skill = $dataSkills[i];
      if (skill && typeof skill === 'object' && 'id' in skill) {
        validSkillIds.add(skill.id as number);
      }
    }

    // Check each enemy action
    for (let i = 1; i < $dataEnemies.length; i++) {
      const enemy = $dataEnemies[i];
      if (!enemy || typeof enemy !== 'object' || !('actions' in enemy)) {
        continue;
      }

      const actions = enemy.actions as Array<{ skillId: number }>;
      for (const action of actions) {
        if (typeof action.skillId !== 'number') {
          warnings.push({
            type: 'skill_formula_error',
            severity: 'critical',
            message: `Enemy ${(enemy as { id: number }).id} action has non-numeric skillId`,
            context: {
              enemyId: (enemy as { id: number }).id,
              source: 'EnemyAction.skillId',
            },
          });
          continue;
        }
        if (!validSkillIds.has(action.skillId)) {
          warnings.push({
            type: 'skill_not_found',
            severity: 'critical',
            message: `Enemy ${enemy.id} action references non-existent skill ${action.skillId}`,
            context: {
              enemyId: enemy.id,
              enemyName: (enemy as { name: string }).name,
              skillId: action.skillId,
              source: 'EnemyAction.skillId',
            },
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Validate that all class learnings reference existing skills.
   * Checks ClassLearning.skillId against $dataSkills.
   *
   * @param database - Loaded database
   * @returns Array of warnings for invalid skill references
   */
  private validateClassLearningReferences(database: RmmzDatabase): Warning[] {
    const warnings: Warning[] = [];
    const { $dataClasses, $dataSkills } = database;

    // Build set of valid skill IDs
    const validSkillIds = new Set<number>();
    for (let i = 1; i < $dataSkills.length; i++) {
      const skill = $dataSkills[i];
      if (skill && typeof skill === 'object' && 'id' in skill) {
        validSkillIds.add(skill.id as number);
      }
    }

    // Check each class learning
    for (let i = 1; i < $dataClasses.length; i++) {
      const classData = $dataClasses[i];
      if (!classData || typeof classData !== 'object' || !('learnings' in classData)) {
        continue;
      }

      const learnings = classData.learnings as Array<{ skillId: number; level: number }>;
      for (const learning of learnings) {
        if (!validSkillIds.has(learning.skillId)) {
          warnings.push({
            type: 'skill_not_found',
            severity: 'critical',
            message: `Class ${classData.id} learning references non-existent skill ${learning.skillId}`,
            context: {
              classId: classData.id,
              className: (classData as { name: string }).name,
              skillId: learning.skillId,
              learningLevel: learning.level,
              source: 'ClassLearning.skillId',
            },
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Validate that system test battlers reference existing classes.
   * Checks SystemData.testBattlers classId against $dataClasses.
   *
   * @param database - Loaded database
   * @returns Array of warnings for invalid class references
   */
  private validateSystemTestBattlerReferences(database: RmmzDatabase): Warning[] {
    const warnings: Warning[] = [];
    const { $dataSystem, $dataClasses } = database;

    // Build set of valid class IDs
    const validClassIds = new Set<number>();
    for (let i = 1; i < $dataClasses.length; i++) {
      const classData = $dataClasses[i];
      if (classData && typeof classData === 'object' && 'id' in classData) {
        validClassIds.add(classData.id as number);
      }
    }

    // Check test battlers
    if (!$dataSystem || typeof $dataSystem !== 'object' || !('testBattlers' in $dataSystem)) {
      return warnings;
    }

    const testBattlers = $dataSystem.testBattlers as Array<{ classId: number; actorId: number }>;
    if (!Array.isArray(testBattlers)) {
      return warnings;
    }

    for (const battler of testBattlers) {
      if (!battler || typeof battler !== 'object' || !('classId' in battler)) {
        continue;
      }

      if (!validClassIds.has(battler.classId)) {
        warnings.push({
          type: 'class_not_found',
          severity: 'critical',
          message: `System test battler references non-existent class ${battler.classId}`,
          context: {
            classId: battler.classId,
            actorId: battler.actorId,
            source: 'SystemData.testBattlers.classId',
          },
        });
      }
    }

    return warnings;
  }
}
