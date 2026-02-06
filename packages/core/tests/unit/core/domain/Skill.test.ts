import { Skill, type SkillEntityData } from '../../../../src/core/domain/Skill.js';
import { ValidationError } from '../../../../src/core/errors/ValidationError.js';
import { TEST_SKILL } from '../../../fixtures/test-constants.js';

describe('Skill', () => {
  const createValidSkillData = (): SkillEntityData => ({
    id: 1,
    name: 'Fireball',
    description: 'Deals fire damage to one enemy',
    damage: {
      type: 'hp_damage',
      elementId: 2,
      formula: 'a.mat * 4 - b.mdf * 2',
      variance: 20,
      critical: true,
    },
    hitType: 'magical',
    scope: 'one_enemy',
    mpCost: 5,
    tpCost: 0,
    successRate: TEST_SKILL.GUARANTEED_SUCCESS_RATE,
    repeats: 1,
    speed: 0,
  });

  describe('constructor', () => {
    it('should create skill with valid data', () => {
      const data = createValidSkillData();
      const skill = new Skill(data);

      expect(skill.id).toBe(1);
      expect(skill.name).toBe('Fireball');
      expect(skill.description).toBe('Deals fire damage to one enemy');
      expect(skill.damage.type).toBe('hp_damage');
      expect(skill.hitType).toBe('magical');
      expect(skill.scope).toBe('one_enemy');
      expect(skill.mpCost).toBe(5);
      expect(skill.tpCost).toBe(0);
      expect(skill.successRate).toBe(100);
      expect(skill.repeats).toBe(1);
      expect(skill.speed).toBe(0);
    });

    it('should throw ValidationError when id is 0', () => {
      const data = createValidSkillData();
      data.id = 0;

      expect(() => new Skill(data)).toThrow(ValidationError);
      expect(() => new Skill(data)).toThrow('Skill ID must be >= 1');
    });

    it('should throw ValidationError when id is negative', () => {
      const data = createValidSkillData();
      data.id = -1;

      expect(() => new Skill(data)).toThrow(ValidationError);
      expect(() => new Skill(data)).toThrow('Skill ID must be >= 1');
    });

    it('should throw ValidationError when name is empty', () => {
      const data = createValidSkillData();
      data.name = '';

      expect(() => new Skill(data)).toThrow(ValidationError);
      expect(() => new Skill(data)).toThrow('Skill name cannot be empty');
    });

    it('should throw ValidationError when name is whitespace only', () => {
      const data = createValidSkillData();
      data.name = '   ';

      expect(() => new Skill(data)).toThrow(ValidationError);
      expect(() => new Skill(data)).toThrow('Skill name cannot be empty');
    });

    it('should throw ValidationError when MP cost is negative', () => {
      const data = createValidSkillData();
      data.mpCost = -5;

      expect(() => new Skill(data)).toThrow(ValidationError);
      expect(() => new Skill(data)).toThrow('Skill MP cost cannot be negative');
    });

    it('should throw ValidationError when TP cost is negative', () => {
      const data = createValidSkillData();
      data.tpCost = -10;

      expect(() => new Skill(data)).toThrow(ValidationError);
      expect(() => new Skill(data)).toThrow('Skill TP cost cannot be negative');
    });

    it('should accept zero MP and TP costs', () => {
      const data = createValidSkillData();
      data.mpCost = 0;
      data.tpCost = 0;

      const skill = new Skill(data);
      expect(skill.mpCost).toBe(0);
      expect(skill.tpCost).toBe(0);
    });

    it('should throw ValidationError when success rate is below 0', () => {
      const data = createValidSkillData();
      data.successRate = -1;

      expect(() => new Skill(data)).toThrow(ValidationError);
      expect(() => new Skill(data)).toThrow('Skill success rate must be 0-100');
    });

    it('should throw ValidationError when success rate exceeds 100', () => {
      const data = createValidSkillData();
      data.successRate = 101;

      expect(() => new Skill(data)).toThrow(ValidationError);
      expect(() => new Skill(data)).toThrow('Skill success rate must be 0-100');
    });

    it('should throw ValidationError when repeats is below 1', () => {
      const data = createValidSkillData();
      data.repeats = 0;

      expect(() => new Skill(data)).toThrow(ValidationError);
      expect(() => new Skill(data)).toThrow('Skill repeats must be >= 1');
    });

    it('should throw ValidationError when damage formula is empty', () => {
      const data = createValidSkillData();
      data.damage.formula = '';

      expect(() => new Skill(data)).toThrow(ValidationError);
      expect(() => new Skill(data)).toThrow('Skill damage formula cannot be empty');
    });

    it('should throw ValidationError when damage formula is whitespace only', () => {
      const data = createValidSkillData();
      data.damage.formula = '   ';

      expect(() => new Skill(data)).toThrow(ValidationError);
      expect(() => new Skill(data)).toThrow('Skill damage formula cannot be empty');
    });

    it('should throw ValidationError when damage variance is below 0', () => {
      const data = createValidSkillData();
      data.damage.variance = -1;

      expect(() => new Skill(data)).toThrow(ValidationError);
      expect(() => new Skill(data)).toThrow('Skill damage variance must be 0-100');
    });

    it('should throw ValidationError when damage variance exceeds 100', () => {
      const data = createValidSkillData();
      data.damage.variance = 101;

      expect(() => new Skill(data)).toThrow(ValidationError);
      expect(() => new Skill(data)).toThrow('Skill damage variance must be 0-100');
    });

    it('should accept boundary values for success rate', () => {
      const data1 = createValidSkillData();
      data1.successRate = 0;
      const skill1 = new Skill(data1);
      expect(skill1.successRate).toBe(0);

      const data2 = createValidSkillData();
      data2.successRate = 100;
      const skill2 = new Skill(data2);
      expect(skill2.successRate).toBe(100);
    });

    it('should accept boundary values for variance', () => {
      const data1 = createValidSkillData();
      data1.damage.variance = 0;
      const skill1 = new Skill(data1);
      expect(skill1.damage.variance).toBe(0);

      const data2 = createValidSkillData();
      data2.damage.variance = 100;
      const skill2 = new Skill(data2);
      expect(skill2.damage.variance).toBe(100);
    });
  });

  describe('isDamageSkill', () => {
    test.each([
      ['hp_damage', true, 'HP damage skill'],
      ['hp_drain', true, 'HP drain skill'],
      ['mp_drain', true, 'MP drain skill'],
      ['hp_recover', false, 'HP recover skill'],
      ['mp_recover', false, 'MP recover skill'],
      ['none', false, 'no damage type'],
    ])('should return %p for damage type %s', (damageType, expected, _description) => {
      const data = createValidSkillData();
      (data.damage.type as any) = damageType;
      const skill = new Skill(data);

      expect(skill.isDamageSkill()).toBe(expected);
    });
  });

  describe('isHealingSkill', () => {
    test.each([
      ['hp_recover', true, 'HP recover skill'],
      ['mp_recover', true, 'MP recover skill'],
      ['hp_damage', false, 'HP damage skill'],
      ['hp_drain', false, 'HP drain skill'],
      ['mp_drain', false, 'MP drain skill'],
      ['none', false, 'no damage type'],
    ])('should return %p for damage type %s', (damageType, expected, _description) => {
      const data = createValidSkillData();
      (data.damage.type as any) = damageType;
      const skill = new Skill(data);

      expect(skill.isHealingSkill()).toBe(expected);
    });
  });

  describe('hasCost', () => {
    it('should return true when MP cost is greater than 0', () => {
      const data = createValidSkillData();
      data.mpCost = 10;
      data.tpCost = 0;
      const skill = new Skill(data);

      expect(skill.hasCost()).toBe(true);
    });

    it('should return true when TP cost is greater than 0', () => {
      const data = createValidSkillData();
      data.mpCost = 0;
      data.tpCost = 50;
      const skill = new Skill(data);

      expect(skill.hasCost()).toBe(true);
    });

    it('should return true when both MP and TP costs are greater than 0', () => {
      const data = createValidSkillData();
      data.mpCost = 5;
      data.tpCost = 25;
      const skill = new Skill(data);

      expect(skill.hasCost()).toBe(true);
    });

    it('should return false when both costs are 0', () => {
      const data = createValidSkillData();
      data.mpCost = 0;
      data.tpCost = 0;
      const skill = new Skill(data);

      expect(skill.hasCost()).toBe(false);
    });
  });

  describe('getTotalCost', () => {
    it('should return correct cost object', () => {
      const data = createValidSkillData();
      data.mpCost = 15;
      data.tpCost = 30;
      const skill = new Skill(data);

      expect(skill.getTotalCost()).toEqual({ mp: 15, tp: 30 });
    });

    it('should return zero costs when skill is free', () => {
      const data = createValidSkillData();
      data.mpCost = 0;
      data.tpCost = 0;
      const skill = new Skill(data);

      expect(skill.getTotalCost()).toEqual({ mp: 0, tp: 0 });
    });
  });

  describe('canMiss', () => {
    it('should return true for physical hit type', () => {
      const data = createValidSkillData();
      data.hitType = 'physical';
      const skill = new Skill(data);

      expect(skill.canMiss()).toBe(true);
    });

    it('should return true for magical hit type', () => {
      const data = createValidSkillData();
      data.hitType = 'magical';
      const skill = new Skill(data);

      expect(skill.canMiss()).toBe(true);
    });

    it('should return false for certain hit type', () => {
      const data = createValidSkillData();
      data.hitType = 'certain';
      const skill = new Skill(data);

      expect(skill.canMiss()).toBe(false);
    });
  });

  describe('targetsEnemies', () => {
    it('should return true for one_enemy scope', () => {
      const data = createValidSkillData();
      data.scope = 'one_enemy';
      const skill = new Skill(data);

      expect(skill.targetsEnemies()).toBe(true);
    });

    it('should return true for all_enemies scope', () => {
      const data = createValidSkillData();
      data.scope = 'all_enemies';
      const skill = new Skill(data);

      expect(skill.targetsEnemies()).toBe(true);
    });

    it('should return false for one_ally scope', () => {
      const data = createValidSkillData();
      data.scope = 'one_ally';
      const skill = new Skill(data);

      expect(skill.targetsEnemies()).toBe(false);
    });

    it('should return false for user scope', () => {
      const data = createValidSkillData();
      data.scope = 'user';
      const skill = new Skill(data);

      expect(skill.targetsEnemies()).toBe(false);
    });
  });

  describe('targetsAllies', () => {
    it('should return true for one_ally scope', () => {
      const data = createValidSkillData();
      data.scope = 'one_ally';
      const skill = new Skill(data);

      expect(skill.targetsAllies()).toBe(true);
    });

    it('should return true for all_allies scope', () => {
      const data = createValidSkillData();
      data.scope = 'all_allies';
      const skill = new Skill(data);

      expect(skill.targetsAllies()).toBe(true);
    });

    it('should return true for user scope', () => {
      const data = createValidSkillData();
      data.scope = 'user';
      const skill = new Skill(data);

      expect(skill.targetsAllies()).toBe(true);
    });

    it('should return false for one_enemy scope', () => {
      const data = createValidSkillData();
      data.scope = 'one_enemy';
      const skill = new Skill(data);

      expect(skill.targetsAllies()).toBe(false);
    });
  });

  describe('isAoe', () => {
    it('should return true for all_enemies scope', () => {
      const data = createValidSkillData();
      data.scope = 'all_enemies';
      const skill = new Skill(data);

      expect(skill.isAoe()).toBe(true);
    });

    it('should return true for all_allies scope', () => {
      const data = createValidSkillData();
      data.scope = 'all_allies';
      const skill = new Skill(data);

      expect(skill.isAoe()).toBe(true);
    });

    it('should return false for one_enemy scope', () => {
      const data = createValidSkillData();
      data.scope = 'one_enemy';
      const skill = new Skill(data);

      expect(skill.isAoe()).toBe(false);
    });

    it('should return false for one_ally scope', () => {
      const data = createValidSkillData();
      data.scope = 'one_ally';
      const skill = new Skill(data);

      expect(skill.isAoe()).toBe(false);
    });

    it('should return false for user scope', () => {
      const data = createValidSkillData();
      data.scope = 'user';
      const skill = new Skill(data);

      expect(skill.isAoe()).toBe(false);
    });
  });

  describe('canCrit', () => {
    it('should return true for physical with critical enabled', () => {
      const data = createValidSkillData();
      data.hitType = 'physical';
      data.damage.critical = true;
      const skill = new Skill(data);

      expect(skill.canCrit()).toBe(true);
    });

    it('should return true for magical with critical enabled', () => {
      const data = createValidSkillData();
      data.hitType = 'magical';
      data.damage.critical = true;
      const skill = new Skill(data);

      expect(skill.canCrit()).toBe(true);
    });

    it('should return false when critical is disabled', () => {
      const data = createValidSkillData();
      data.hitType = 'physical';
      data.damage.critical = false;
      const skill = new Skill(data);

      expect(skill.canCrit()).toBe(false);
    });

    it('should return false for certain hit type', () => {
      const data = createValidSkillData();
      data.hitType = 'certain';
      data.damage.critical = true;
      const skill = new Skill(data);

      expect(skill.canCrit()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for skills with same ID', () => {
      const data1 = createValidSkillData();
      const data2 = createValidSkillData();
      data2.name = 'Different Name'; // Different name but same ID

      const skill1 = new Skill(data1);
      const skill2 = new Skill(data2);

      expect(skill1.equals(skill2)).toBe(true);
    });

    it('should return false for skills with different IDs', () => {
      const data1 = createValidSkillData();
      const data2 = createValidSkillData();
      data2.id = 2;

      const skill1 = new Skill(data1);
      const skill2 = new Skill(data2);

      expect(skill1.equals(skill2)).toBe(false);
    });

    it('should support reflexive equality', () => {
      const data = createValidSkillData();
      const skill = new Skill(data);

      expect(skill.equals(skill)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should format skill correctly', () => {
      const data = createValidSkillData();
      const skill = new Skill(data);

      expect(skill.toString()).toBe('Skill #1: Fireball');
    });

    it('should handle spaces in name', () => {
      const data = createValidSkillData();
      data.name = 'Great Fireball';
      const skill = new Skill(data);

      expect(skill.toString()).toBe('Skill #1: Great Fireball');
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const data = createValidSkillData();
      const skill = new Skill(data);

      expect(Object.isFrozen(skill)).toBe(true);
    });

    it('should have frozen damage object', () => {
      const data = createValidSkillData();
      const skill = new Skill(data);

      expect(Object.isFrozen(skill.damage)).toBe(true);
    });

    it('should not allow modification of damage', () => {
      const data = createValidSkillData();
      const skill = new Skill(data);

      expect(() => {
        (skill.damage as any).type = 'hp_recover';
      }).toThrow();
    });

    it('should not share reference with input damage', () => {
      const data = createValidSkillData();
      const originalType = data.damage.type;
      const skill = new Skill(data);

      data.damage.type = 'hp_recover';

      expect(skill.damage.type).toBe(originalType);
    });
  });
});
