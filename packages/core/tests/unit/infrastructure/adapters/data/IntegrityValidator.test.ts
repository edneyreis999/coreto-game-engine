/**
 * IntegrityValidator Unit Tests
 *
 * Tests cross-reference validation between RPG Maker MZ database entries.
 * Validates that the warning-based approach (ADR-013) is correctly implemented.
 */

import { IntegrityValidator } from '@coreto/core/infrastructure/adapters/data/IntegrityValidator.js';
import type { RmmzDatabase } from '@coreto/core/core/ports/index.js';
import type { EnemyData, TroopData, ClassData, SkillData, SystemData } from '@coreto/core/types/rmmz-data.js';

describe('IntegrityValidator', () => {
  let validator: IntegrityValidator;

  beforeEach(() => {
    validator = new IntegrityValidator();
  });

  describe('validate', () => {
    it('should return empty array for valid database with no cross-reference issues', () => {
      // Arrange - Valid database with all references existing
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [
          null,
          {
            id: 1,
            name: 'Warrior',
            expParams: [30, 20, 30, 30],
            traits: [],
            learnings: [{ level: 5, note: '', skillId: 1 }],
            params: [[100], [50], [20], [15], [10], [10], [15], [10]],
            note: '',
          },
        ] as ClassData[],
        $dataSkills: [
          null,
          {
            id: 1,
            name: 'Attack',
            description: '',
            animationId: -1,
            damage: { type: 1, elementId: -1, formula: 'a.atk * 4', variance: 20, critical: true },
            effects: [],
            hitType: 1,
            iconIndex: 76,
            message1: '',
            message2: '',
            mpCost: 0,
            note: '',
            occasion: 1,
            repeats: 1,
            requiredWtypeId1: 0,
            requiredWtypeId2: 0,
            scope: 1,
            speed: 0,
            stypeId: 0,
            successRate: 100,
            tpCost: 0,
            tpGain: 0,
            messageType: 1,
          },
        ] as SkillData[],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [
          null,
          {
            id: 1,
            name: 'Goblin',
            params: [100, 50, 20, 15, 10, 10, 15, 10],
            actions: [
              {
                conditionParam1: 0,
                conditionParam2: 0,
                conditionType: 0,
                rating: 5,
                skillId: 1,
              },
            ],
            traits: [],
            dropItems: [],
            exp: 10,
            gold: 5,
            battlerName: '',
            battlerHue: 0,
            note: '',
          },
        ] as EnemyData[],
        $dataTroops: [
          null,
          {
            id: 1,
            name: 'Goblin*2',
            members: [{ enemyId: 1, x: 300, y: 400, hidden: false }],
            pages: [],
          },
        ] as TroopData[],
        $dataStates: [],
        $dataSystem: {
          gameTitle: 'Test Game',
          versionId: 1,
          testBattlers: [{ classId: 1, actorId: 1 }],
          elements: [''],
          skillTypes: [''],
          weaponTypes: [''],
          armorTypes: [''],
          equipTypes: [''],
        } as unknown as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toEqual([]);
    });

    it('should return empty array for minimal valid database', () => {
      // Arrange - Minimal valid database (empty arrays)
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [null] as unknown as ClassData[],
        $dataSkills: [null] as unknown as SkillData[],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [null] as unknown as EnemyData[],
        $dataTroops: [null] as unknown as TroopData[],
        $dataStates: [],
        $dataSystem: {
          testBattlers: [],
        } as unknown as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toEqual([]);
    });
  });

  describe('validateTroopEnemyReferences', () => {
    it('should detect troop member referencing non-existent enemy', () => {
      // Arrange - Troop references enemy ID 999 which does not exist
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [],
        $dataSkills: [],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [
          null,
          {
            id: 1,
            name: 'Goblin',
            params: [100, 50, 20, 15, 10, 10, 15, 10],
            actions: [],
            traits: [],
            dropItems: [],
            exp: 10,
            gold: 5,
            battlerName: '',
            battlerHue: 0,
            note: '',
          },
        ] as EnemyData[],
        $dataTroops: [
          null,
          {
            id: 1,
            name: 'Invalid Troop',
            members: [{ enemyId: 999, x: 300, y: 400, hidden: false }],
            pages: [],
          },
        ] as TroopData[],
        $dataStates: [],
        $dataSystem: {} as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toEqual({
        type: 'enemy_not_found',
        severity: 'critical',
        message: 'Troop 1 references non-existent enemy 999',
        context: {
          troopId: 1,
          troopName: 'Invalid Troop',
          enemyId: 999,
          source: 'TroopMember.enemyId',
        },
      });
    });

    it('should detect multiple invalid enemy references in same troop', () => {
      // Arrange - Troop with 2 invalid enemy references
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [],
        $dataSkills: [],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [null] as unknown as EnemyData[],
        $dataTroops: [
          null,
          {
            id: 1,
            name: 'Multi-Invalid Troop',
            members: [
              { enemyId: 777, x: 300, y: 400, hidden: false },
              { enemyId: 888, x: 400, y: 400, hidden: false },
            ],
            pages: [],
          },
        ] as TroopData[],
        $dataStates: [],
        $dataSystem: {} as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toHaveLength(2);
      expect(warnings[0]?.context.enemyId).toBe(777);
      expect(warnings[1]?.context.enemyId).toBe(888);
    });

    it('should handle troops with valid and invalid enemy references', () => {
      // Arrange - Troop with 1 valid and 1 invalid enemy reference
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [],
        $dataSkills: [],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [
          null,
          {
            id: 1,
            name: 'Goblin',
            params: [100, 50, 20, 15, 10, 10, 15, 10],
            actions: [],
            traits: [],
            dropItems: [],
            exp: 10,
            gold: 5,
            battlerName: '',
            battlerHue: 0,
            note: '',
          },
        ] as EnemyData[],
        $dataTroops: [
          null,
          {
            id: 1,
            name: 'Mixed Troop',
            members: [
              { enemyId: 1, x: 300, y: 400, hidden: false }, // Valid
              { enemyId: 999, x: 400, y: 400, hidden: false }, // Invalid
            ],
            pages: [],
          },
        ] as TroopData[],
        $dataStates: [],
        $dataSystem: {} as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toHaveLength(1);
      expect(warnings[0]?.context.enemyId).toBe(999);
    });
  });

  describe('validateEnemyActionReferences', () => {
    it('should detect enemy action referencing non-existent skill', () => {
      // Arrange - Enemy action references skill ID 999 which does not exist
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [],
        $dataSkills: [null] as unknown as SkillData[],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [
          null,
          {
            id: 1,
            name: 'Goblin',
            params: [100, 50, 20, 15, 10, 10, 15, 10],
            actions: [
              {
                conditionParam1: 0,
                conditionParam2: 0,
                conditionType: 0,
                rating: 5,
                skillId: 999,
              },
            ],
            traits: [],
            dropItems: [],
            exp: 10,
            gold: 5,
            battlerName: '',
            battlerHue: 0,
            note: '',
          },
        ] as EnemyData[],
        $dataTroops: [],
        $dataStates: [],
        $dataSystem: {} as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toEqual({
        type: 'skill_not_found',
        severity: 'critical',
        message: 'Enemy 1 action references non-existent skill 999',
        context: {
          enemyId: 1,
          enemyName: 'Goblin',
          skillId: 999,
          source: 'EnemyAction.skillId',
        },
      });
    });

    it('should detect multiple invalid skill references in same enemy', () => {
      // Arrange - Enemy with 2 invalid skill references
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [],
        $dataSkills: [null] as unknown as SkillData[],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [
          null,
          {
            id: 1,
            name: 'Multi-Skill Enemy',
            params: [100, 50, 20, 15, 10, 10, 15, 10],
            actions: [
              {
                conditionParam1: 0,
                conditionParam2: 0,
                conditionType: 0,
                rating: 5,
                skillId: 777,
              },
              {
                conditionParam1: 0,
                conditionParam2: 0,
                conditionType: 0,
                rating: 3,
                skillId: 888,
              },
            ],
            traits: [],
            dropItems: [],
            exp: 10,
            gold: 5,
            battlerName: '',
            battlerHue: 0,
            note: '',
          },
        ] as EnemyData[],
        $dataTroops: [],
        $dataStates: [],
        $dataSystem: {} as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toHaveLength(2);
      expect(warnings[0]?.context.skillId).toBe(777);
      expect(warnings[1]?.context.skillId).toBe(888);
    });
  });

  describe('validateClassLearningReferences', () => {
    it('should detect class learning referencing non-existent skill', () => {
      // Arrange - Class learning references skill ID 999 which does not exist
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [
          null,
          {
            id: 1,
            name: 'Warrior',
            expParams: [30, 20, 30, 30],
            traits: [],
            learnings: [{ level: 5, note: '', skillId: 999 }],
            params: [[100], [50], [20], [15], [10], [10], [15], [10]],
            note: '',
          },
        ] as ClassData[],
        $dataSkills: [null] as unknown as SkillData[],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [],
        $dataTroops: [],
        $dataStates: [],
        $dataSystem: {} as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toEqual({
        type: 'skill_not_found',
        severity: 'critical',
        message: 'Class 1 learning references non-existent skill 999',
        context: {
          classId: 1,
          className: 'Warrior',
          skillId: 999,
          learningLevel: 5,
          source: 'ClassLearning.skillId',
        },
      });
    });

    it('should detect multiple invalid skill references in class learnings', () => {
      // Arrange - Class with 2 invalid skill learnings
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [
          null,
          {
            id: 1,
            name: 'Mage',
            expParams: [30, 20, 30, 30],
            traits: [],
            learnings: [
              { level: 5, note: '', skillId: 777 },
              { level: 10, note: '', skillId: 888 },
            ],
            params: [[100], [50], [20], [15], [10], [10], [15], [10]],
            note: '',
          },
        ] as ClassData[],
        $dataSkills: [null] as unknown as SkillData[],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [],
        $dataTroops: [],
        $dataStates: [],
        $dataSystem: {} as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toHaveLength(2);
      expect(warnings[0]?.context.skillId).toBe(777);
      expect(warnings[0]?.context.learningLevel).toBe(5);
      expect(warnings[1]?.context.skillId).toBe(888);
      expect(warnings[1]?.context.learningLevel).toBe(10);
    });
  });

  describe('validateSystemTestBattlerReferences', () => {
    it('should detect test battler referencing non-existent class', () => {
      // Arrange - Test battler references class ID 999 which does not exist
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [null] as unknown as ClassData[],
        $dataSkills: [],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [],
        $dataTroops: [],
        $dataStates: [],
        $dataSystem: {
          testBattlers: [{ classId: 999, actorId: 1 }],
        } as unknown as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toEqual({
        type: 'class_not_found',
        severity: 'critical',
        message: 'System test battler references non-existent class 999',
        context: {
          classId: 999,
          actorId: 1,
          source: 'SystemData.testBattlers.classId',
        },
      });
    });

    it('should detect multiple invalid class references in test battlers', () => {
      // Arrange - Multiple test battlers with invalid class references
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [null] as unknown as ClassData[],
        $dataSkills: [],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [],
        $dataTroops: [],
        $dataStates: [],
        $dataSystem: {
          testBattlers: [
            { classId: 777, actorId: 1 },
            { classId: 888, actorId: 2 },
          ],
        } as unknown as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toHaveLength(2);
      expect(warnings[0]?.context.classId).toBe(777);
      expect(warnings[1]?.context.classId).toBe(888);
    });

    it('should handle missing testBattlers property gracefully', () => {
      // Arrange - System data without testBattlers
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [null] as unknown as ClassData[],
        $dataSkills: [],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [],
        $dataTroops: [],
        $dataStates: [],
        $dataSystem: {} as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toEqual([]);
    });
  });

  describe('comprehensive validation scenarios', () => {
    it('should collect warnings from all validation types', () => {
      // Arrange - Database with multiple cross-reference issues
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [
          null,
          {
            id: 1,
            name: 'Warrior',
            expParams: [30, 20, 30, 30],
            traits: [],
            learnings: [{ level: 5, note: '', skillId: 777 }], // Invalid skill
            params: [[100], [50], [20], [15], [10], [10], [15], [10]],
            note: '',
          },
        ] as ClassData[],
        $dataSkills: [null] as unknown as SkillData[],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [
          null,
          {
            id: 1,
            name: 'Goblin',
            params: [100, 50, 20, 15, 10, 10, 15, 10],
            actions: [
              {
                conditionParam1: 0,
                conditionParam2: 0,
                conditionType: 0,
                rating: 5,
                skillId: 888, // Invalid skill
              },
            ],
            traits: [],
            dropItems: [],
            exp: 10,
            gold: 5,
            battlerName: '',
            battlerHue: 0,
            note: '',
          },
        ] as EnemyData[],
        $dataTroops: [
          null,
          {
            id: 1,
            name: 'Invalid Troop',
            members: [{ enemyId: 999, x: 300, y: 400, hidden: false }], // Invalid enemy
            pages: [],
          },
        ] as TroopData[],
        $dataStates: [],
        $dataSystem: {
          testBattlers: [{ classId: 666, actorId: 1 }], // Invalid class
        } as unknown as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toHaveLength(4);
      expect(warnings.some((w) => w.type === 'enemy_not_found')).toBe(true);
      expect(warnings.some((w) => w.type === 'skill_not_found')).toBe(true);
      expect(warnings.some((w) => w.type === 'class_not_found')).toBe(true);
    });

    it('should handle null/undefined entries gracefully', () => {
      // Arrange - Database with null entries (normal for RPG Maker MZ)
      const database: RmmzDatabase = {
        $dataActors: [],
        $dataClasses: [null, null, null] as unknown as ClassData[],
        $dataSkills: [null, null] as unknown as SkillData[],
        $dataItems: [],
        $dataWeapons: [],
        $dataArmors: [],
        $dataEnemies: [null, null] as unknown as EnemyData[],
        $dataTroops: [null, null] as unknown as TroopData[],
        $dataStates: [],
        $dataSystem: {
          testBattlers: [],
        } as unknown as SystemData,
      };

      // Act
      const warnings = validator.validate(database);

      // Assert
      expect(warnings).toEqual([]);
    });
  });
});
