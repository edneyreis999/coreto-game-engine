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

import type { RmmzDatabase } from '@coreto/core';
import { Warning } from '@coreto/core';
import type {
  DomainEnemyData,
  DomainClassData,
  DomainTroopData,
  DomainSystemData,
} from '@coreto/core';

/**
 * Type guard for validating an object has a numeric id property.
 * Used to safely extract IDs from database entries.
 */
function hasNumericId(value: unknown): value is { id: number } {
  return (
    value !== null && typeof value === 'object' && 'id' in value && typeof value.id === 'number'
  );
}

/**
 * Type guard for validating TroopData structure.
 */
function isTroopData(value: unknown): value is DomainTroopData {
  return (
    hasNumericId(value) &&
    'members' in value &&
    Array.isArray(value.members) &&
    'name' in value &&
    typeof value.name === 'string'
  );
}

/**
 * Type guard for validating a troop member has enemyId.
 */
function hasTroopMemberEnemyId(value: unknown): value is { enemyId: number } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'enemyId' in value &&
    typeof value.enemyId === 'number'
  );
}

/**
 * Type guard for validating EnemyData structure with actions.
 */
function isEnemyDataWithActions(value: unknown): value is DomainEnemyData {
  return (
    hasNumericId(value) &&
    'actions' in value &&
    Array.isArray(value.actions) &&
    'name' in value &&
    typeof value.name === 'string'
  );
}

/**
 * Type guard for validating an enemy action has skillId.
 */
function hasActionSkillId(value: unknown): value is { skillId: number } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'skillId' in value &&
    typeof value.skillId === 'number'
  );
}

/**
 * Type guard for validating ClassData structure with learnings.
 */
function isClassDataWithLearnings(
  value: unknown
): value is DomainClassData & { learnings: Array<{ skillId: number; level: number }> } {
  return (
    hasNumericId(value) &&
    'learnings' in value &&
    Array.isArray(value.learnings) &&
    'name' in value &&
    typeof value.name === 'string'
  );
}

/**
 * Type guard for validating a class learning entry.
 */
function hasLearningSkillId(value: unknown): value is { skillId: number; level: number } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'skillId' in value &&
    typeof value.skillId === 'number' &&
    'level' in value &&
    typeof value.level === 'number'
  );
}

/**
 * Type guard for validating SystemData structure with testBattlers.
 */
function isSystemDataWithTestBattlers(
  value: unknown
): value is DomainSystemData & { testBattlers: Array<{ classId: number; actorId: number }> } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'testBattlers' in value &&
    Array.isArray(value.testBattlers)
  );
}

/**
 * Type guard for validating a test battler entry.
 */
function hasTestBattlerClassId(value: unknown): value is { classId: number; actorId: number } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'classId' in value &&
    typeof value.classId === 'number' &&
    'actorId' in value &&
    typeof value.actorId === 'number'
  );
}

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
      if (hasNumericId(enemy)) {
        validEnemyIds.add(enemy.id);
      }
    }

    // Check each troop member
    for (let i = 1; i < $dataTroops.length; i++) {
      const troop = $dataTroops[i];
      if (!isTroopData(troop)) {
        continue;
      }

      for (const member of troop.members) {
        if (!hasTroopMemberEnemyId(member)) {
          warnings.push(new Warning({
            type: 'enemy_not_found',
            severity: 'critical',
            message: `Troop ${troop.id} has member with invalid enemyId structure`,
            context: {
              troopId: troop.id,
              troopName: troop.name,
              source: 'TroopMember.enemyId',
              issue: 'Missing or non-numeric enemyId',
            },
          }));
          continue;
        }

        if (!validEnemyIds.has(member.enemyId)) {
          warnings.push(new Warning({
            type: 'enemy_not_found',
            severity: 'critical',
            message: `Troop ${troop.id} references non-existent enemy ${member.enemyId}`,
            context: {
              troopId: troop.id,
              troopName: troop.name,
              enemyId: member.enemyId,
              source: 'TroopMember.enemyId',
            },
          }));
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
      if (hasNumericId(skill)) {
        validSkillIds.add(skill.id);
      }
    }

    // Check each enemy action
    for (let i = 1; i < $dataEnemies.length; i++) {
      const enemy = $dataEnemies[i];
      if (!isEnemyDataWithActions(enemy)) {
        continue;
      }

      for (const action of enemy.actions) {
        if (!hasActionSkillId(action)) {
          warnings.push(new Warning({
            type: 'skill_formula_error',
            severity: 'critical',
            message: `Enemy ${enemy.id} action has invalid skillId structure`,
            context: {
              enemyId: enemy.id,
              enemyName: enemy.name,
              source: 'EnemyAction.skillId',
              issue: 'Missing or non-numeric skillId',
            },
          }));
          continue;
        }

        if (!validSkillIds.has(action.skillId)) {
          warnings.push(new Warning({
            type: 'skill_not_found',
            severity: 'critical',
            message: `Enemy ${enemy.id} action references non-existent skill ${action.skillId}`,
            context: {
              enemyId: enemy.id,
              enemyName: enemy.name,
              skillId: action.skillId,
              source: 'EnemyAction.skillId',
            },
          }));
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
      if (hasNumericId(skill)) {
        validSkillIds.add(skill.id);
      }
    }

    // Check each class learning
    for (let i = 1; i < $dataClasses.length; i++) {
      const classData = $dataClasses[i];
      if (!isClassDataWithLearnings(classData)) {
        continue;
      }

      for (const learning of classData.learnings) {
        if (!hasLearningSkillId(learning)) {
          warnings.push(new Warning({
            type: 'skill_not_found',
            severity: 'critical',
            message: `Class ${classData.id} learning has invalid skillId structure`,
            context: {
              classId: classData.id,
              className: classData.name,
              source: 'ClassLearning.skillId',
              issue: 'Missing or non-numeric skillId/level',
            },
          }));
          continue;
        }

        if (!validSkillIds.has(learning.skillId)) {
          warnings.push(new Warning({
            type: 'skill_not_found',
            severity: 'critical',
            message: `Class ${classData.id} learning references non-existent skill ${learning.skillId}`,
            context: {
              classId: classData.id,
              className: classData.name,
              skillId: learning.skillId,
              learningLevel: learning.level,
              source: 'ClassLearning.skillId',
            },
          }));
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
      if (hasNumericId(classData)) {
        validClassIds.add(classData.id);
      }
    }

    // Check test battlers - validate structure first
    if (!isSystemDataWithTestBattlers($dataSystem)) {
      return warnings;
    }

    for (const battler of $dataSystem.testBattlers) {
      // Skip validation if battler doesn't have classId (optional field in some games)
      if (!hasTestBattlerClassId(battler)) {
        continue;
      }

      if (!validClassIds.has(battler.classId)) {
        warnings.push(new Warning({
          type: 'class_not_found',
          severity: 'critical',
          message: `System test battler references non-existent class ${battler.classId}`,
          context: {
            classId: battler.classId,
            actorId: battler.actorId,
            source: 'SystemData.testBattlers.classId',
          },
        }));
      }
    }

    return warnings;
  }
}
