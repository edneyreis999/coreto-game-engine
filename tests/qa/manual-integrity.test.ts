/**
 * Manual QA Tests for Integrity Validation (Section 4)
 * These tests validate the manual QA scenarios from MANUAL_QA_GUIDE.md
 */

import { IntegrityValidator } from '../../../../packages/core/src/infrastructure/adapters/data/index.js'IntegrityValidator';
import type { RmmzDatabase } from '../../../../packages/core/src/core/ports/index.js';
import type { EnemyData, TroopData, ClassData, SkillData, SystemData } from '../../../../packages/core/src/types/rmmz-data.js';

// Helper to create a minimal valid database
function createValidDatabase(): RmmzDatabase {
  return {
    $dataActors: [],
    $dataClasses: [
      null,
      {
        id: 1,
        name: 'Guerreiro',
        expParams: [30, 20, 30, 30],
        traits: [],
        learnings: [],
        params: [[100], [50], [20], [15], [10], [10], [15], [10]],
        note: '',
      },
    ] as ClassData[],
    $dataSkills: [
      null,
      {
        id: 1,
        name: 'Ataque',
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
        name: 'Slime',
        params: [100, 0, 10, 10, 10, 10, 10, 10],
        actions: [
          { skillId: 1, conditionType: 0, conditionParam1: 0, conditionParam2: 0, rating: 5 },
        ],
        traits: [],
        dropItems: [],
        exp: 5,
        gold: 3,
        battlerName: 'Slime',
        battlerHue: 0,
        note: '',
      },
    ] as EnemyData[],
    $dataTroops: [
      null,
      {
        id: 1,
        name: 'Slime*2',
        members: [
          { enemyId: 1, x: 400, y: 400, hidden: false },
          { enemyId: 1, x: 450, y: 400, hidden: false },
        ],
        pages: [],
      },
    ] as TroopData[],
    $dataStates: [],
    $dataSystem: {
      gameTitle: 'QA Test Game',
      locale: 'pt_BR',
      partyMembers: [1],
      testBattlers: [{ actorId: 1, level: 1, equips: [0, 0, 0, 0, 0] }],
      testTroopId: 1,
      elements: ['', 'Fisico', 'Fogo'],
      skillTypes: ['', 'Magia'],
      weaponTypes: ['', 'Espada'],
      armorTypes: ['', 'Armadura'],
      equipTypes: ['', 'Arma', 'Escudo'],
    } as unknown as SystemData,
  };
}

describe('Manual QA - Section 4: Validação de Integridade', () => {
  let validator: IntegrityValidator;

  beforeEach(() => {
    validator = new IntegrityValidator();
  });

  describe('TC-INT-001: Referências Válidas', () => {
    it('should return empty array for valid database with no cross-reference issues', () => {
      const database = createValidDatabase();
      const warnings = validator.validate(database);
      expect(warnings).toEqual([]);
    });
  });

  describe('TC-INT-002: Enemy ID Inexistente em Troop', () => {
    it('should detect troop member referencing non-existent enemy', () => {
      const database = createValidDatabase();
      // Modify troop to reference non-existent enemy
      (database.$dataTroops as TroopData[])[1]!.members = [
        { enemyId: 999, x: 400, y: 400, hidden: false },
      ];

      const warnings = validator.validate(database);

      expect(warnings.length).toBeGreaterThan(0);
      const enemyWarning = warnings.find(w => w.type === 'enemy_not_found');
      expect(enemyWarning).toBeDefined();
      expect(enemyWarning?.severity).toBe('critical');
      expect(enemyWarning?.context).toHaveProperty('enemyId', 999);
      expect(enemyWarning?.context).toHaveProperty('troopId', 1);
    });
  });

  describe('TC-INT-003: Skill ID Inexistente em Enemy Action', () => {
    it('should detect enemy action referencing non-existent skill', () => {
      const database = createValidDatabase();
      // Modify enemy to reference non-existent skill
      (database.$dataEnemies as EnemyData[])[1]!.actions = [
        { skillId: 999, conditionType: 0, conditionParam1: 0, conditionParam2: 0, rating: 5 },
      ];

      const warnings = validator.validate(database);

      expect(warnings.length).toBeGreaterThan(0);
      const skillWarning = warnings.find(w => w.type === 'skill_not_found');
      expect(skillWarning).toBeDefined();
      expect(skillWarning?.severity).toBe('critical');
    });
  });

  describe('TC-INT-004: Class ID Inexistente em TestBattlers', () => {
    it('should detect test battler referencing non-existent class', () => {
      const database = createValidDatabase();
      // Modify system to reference non-existent class
      (database.$dataSystem as unknown as { testBattlers: { actorId: number; classId: number; level: number }[] }).testBattlers = [
        { actorId: 1, classId: 999, level: 1 },
      ];

      const warnings = validator.validate(database);

      expect(warnings.length).toBeGreaterThan(0);
      const classWarning = warnings.find(w => w.type === 'class_not_found');
      expect(classWarning).toBeDefined();
    });
  });
});
