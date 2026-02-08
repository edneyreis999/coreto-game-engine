import { ValidationError } from '../../../../src/core/errors/ValidationError.js';
import { SkillFakeBuilder } from '../../../fakes';
import type { DamageType } from '../../../../src/core/domain/Skill.js';

describe('Skill', () => {
  describe('constructor', () => {
    it('should create skill with valid data', () => {
      const skill = new SkillFakeBuilder().build();

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
      expect(() => new SkillFakeBuilder().withId(0).build()).toThrow(ValidationError);
      expect(() => new SkillFakeBuilder().withId(0).build()).toThrow('Skill ID must be >= 1');
    });

    it('should throw ValidationError when id is negative', () => {
      expect(() => new SkillFakeBuilder().withId(-1).build()).toThrow(ValidationError);
      expect(() => new SkillFakeBuilder().withId(-1).build()).toThrow('Skill ID must be >= 1');
    });

    it('should throw ValidationError when name is empty', () => {
      expect(() => new SkillFakeBuilder().withName('').build()).toThrow(ValidationError);
      expect(() => new SkillFakeBuilder().withName('').build()).toThrow('Skill name cannot be empty');
    });

    it('should throw ValidationError when name is whitespace only', () => {
      expect(() => new SkillFakeBuilder().withName('   ').build()).toThrow(ValidationError);
      expect(() => new SkillFakeBuilder().withName('   ').build()).toThrow('Skill name cannot be empty');
    });

    it('should throw ValidationError when MP cost is negative', () => {
      expect(() => new SkillFakeBuilder().withMpCost(-5).build()).toThrow(ValidationError);
      expect(() => new SkillFakeBuilder().withMpCost(-5).build()).toThrow('Skill MP cost cannot be negative');
    });

    it('should throw ValidationError when TP cost is negative', () => {
      expect(() => new SkillFakeBuilder().withTpCost(-10).build()).toThrow(ValidationError);
      expect(() => new SkillFakeBuilder().withTpCost(-10).build()).toThrow('Skill TP cost cannot be negative');
    });

    it('should accept zero MP and TP costs', () => {
      const skill = new SkillFakeBuilder()
        .withMpCost(0)
        .withTpCost(0)
        .build();
      expect(skill.mpCost).toBe(0);
      expect(skill.tpCost).toBe(0);
    });

    it('should throw ValidationError when success rate is below 0', () => {
      expect(() => new SkillFakeBuilder().withSuccessRate(-1).build()).toThrow(ValidationError);
      expect(() => new SkillFakeBuilder().withSuccessRate(-1).build()).toThrow('Skill success rate must be 0-100');
    });

    it('should throw ValidationError when success rate exceeds 100', () => {
      expect(() => new SkillFakeBuilder().withSuccessRate(101).build()).toThrow(ValidationError);
      expect(() => new SkillFakeBuilder().withSuccessRate(101).build()).toThrow('Skill success rate must be 0-100');
    });

    it('should throw ValidationError when repeats is below 1', () => {
      expect(() => new SkillFakeBuilder().withRepeats(0).build()).toThrow(ValidationError);
      expect(() => new SkillFakeBuilder().withRepeats(0).build()).toThrow('Skill repeats must be >= 1');
    });

    it('should throw ValidationError when damage formula is empty', () => {
      expect(() => new SkillFakeBuilder().withFormula('').build()).toThrow(ValidationError);
      expect(() => new SkillFakeBuilder().withFormula('').build()).toThrow('Skill damage formula cannot be empty');
    });

    it('should throw ValidationError when damage formula is whitespace only', () => {
      expect(() => new SkillFakeBuilder().withFormula('   ').build()).toThrow(ValidationError);
      expect(() => new SkillFakeBuilder().withFormula('   ').build()).toThrow('Skill damage formula cannot be empty');
    });

    it('should throw ValidationError when damage variance is below 0', () => {
      expect(() => new SkillFakeBuilder().withVariance(-1).build()).toThrow(ValidationError);
      expect(() => new SkillFakeBuilder().withVariance(-1).build()).toThrow('Skill damage variance must be 0-100');
    });

    it('should throw ValidationError when damage variance exceeds 100', () => {
      expect(() => new SkillFakeBuilder().withVariance(101).build()).toThrow(ValidationError);
      expect(() => new SkillFakeBuilder().withVariance(101).build()).toThrow('Skill damage variance must be 0-100');
    });

    it('should accept boundary values for success rate', () => {
      const skill1 = new SkillFakeBuilder()
        .withSuccessRate(0)
        .build();
      expect(skill1.successRate).toBe(0);

      const skill2 = new SkillFakeBuilder()
        .withSuccessRate(100)
        .build();
      expect(skill2.successRate).toBe(100);
    });

    it('should accept boundary values for variance', () => {
      const skill1 = new SkillFakeBuilder()
        .withVariance(0)
        .build();
      expect(skill1.damage.variance).toBe(0);

      const skill2 = new SkillFakeBuilder()
        .withVariance(100)
        .build();
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
      const skill = new SkillFakeBuilder()
        .withDamageType(damageType as DamageType)
        .build();

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
      const skill = new SkillFakeBuilder()
        .withDamageType(damageType as DamageType)
        .build();

      expect(skill.isHealingSkill()).toBe(expected);
    });
  });

  describe('hasCost', () => {
    it('should return true when MP cost is greater than 0', () => {
      const skill = new SkillFakeBuilder()
        .withMpCost(10)
        .withTpCost(0)
        .build();

      expect(skill.hasCost()).toBe(true);
    });

    it('should return true when TP cost is greater than 0', () => {
      const skill = new SkillFakeBuilder()
        .withMpCost(0)
        .withTpCost(50)
        .build();

      expect(skill.hasCost()).toBe(true);
    });

    it('should return true when both MP and TP costs are greater than 0', () => {
      const skill = new SkillFakeBuilder()
        .withMpCost(5)
        .withTpCost(25)
        .build();

      expect(skill.hasCost()).toBe(true);
    });

    it('should return false when both costs are 0', () => {
      const skill = new SkillFakeBuilder().withNoCost().build();

      expect(skill.hasCost()).toBe(false);
    });
  });

  describe('getTotalCost', () => {
    it('should return correct cost object', () => {
      const skill = new SkillFakeBuilder()
        .withMpCost(15)
        .withTpCost(30)
        .build();

      expect(skill.getTotalCost()).toEqual({ mp: 15, tp: 30 });
    });

    it('should return zero costs when skill is free', () => {
      const skill = new SkillFakeBuilder().withNoCost().build();

      expect(skill.getTotalCost()).toEqual({ mp: 0, tp: 0 });
    });
  });

  describe('canMiss', () => {
    it('should return true for physical hit type', () => {
      const skill = new SkillFakeBuilder().withPhysical().build();

      expect(skill.canMiss()).toBe(true);
    });

    it('should return true for magical hit type', () => {
      const skill = new SkillFakeBuilder().withMagical().build();

      expect(skill.canMiss()).toBe(true);
    });

    it('should return false for certain hit type', () => {
      const skill = new SkillFakeBuilder().withCertain().build();

      expect(skill.canMiss()).toBe(false);
    });
  });

  describe('targetsEnemies', () => {
    it('should return true for one_enemy scope', () => {
      const skill = new SkillFakeBuilder()
        .withScope('one_enemy')
        .build();

      expect(skill.targetsEnemies()).toBe(true);
    });

    it('should return true for all_enemies scope', () => {
      const skill = new SkillFakeBuilder()
        .withScope('all_enemies')
        .build();

      expect(skill.targetsEnemies()).toBe(true);
    });

    it('should return false for one_ally scope', () => {
      const skill = new SkillFakeBuilder()
        .withScope('one_ally')
        .build();

      expect(skill.targetsEnemies()).toBe(false);
    });

    it('should return false for user scope', () => {
      const skill = new SkillFakeBuilder()
        .withScope('user')
        .build();

      expect(skill.targetsEnemies()).toBe(false);
    });
  });

  describe('targetsAllies', () => {
    it('should return true for one_ally scope', () => {
      const skill = new SkillFakeBuilder()
        .withScope('one_ally')
        .build();

      expect(skill.targetsAllies()).toBe(true);
    });

    it('should return true for all_allies scope', () => {
      const skill = new SkillFakeBuilder()
        .withScope('all_allies')
        .build();

      expect(skill.targetsAllies()).toBe(true);
    });

    it('should return true for user scope', () => {
      const skill = new SkillFakeBuilder()
        .withScope('user')
        .build();

      expect(skill.targetsAllies()).toBe(true);
    });

    it('should return false for one_enemy scope', () => {
      const skill = new SkillFakeBuilder()
        .withScope('one_enemy')
        .build();

      expect(skill.targetsAllies()).toBe(false);
    });
  });

  describe('isAoe', () => {
    it('should return true for all_enemies scope', () => {
      const skill = new SkillFakeBuilder()
        .withScope('all_enemies')
        .build();

      expect(skill.isAoe()).toBe(true);
    });

    it('should return true for all_allies scope', () => {
      const skill = new SkillFakeBuilder()
        .withScope('all_allies')
        .build();

      expect(skill.isAoe()).toBe(true);
    });

    it('should return false for one_enemy scope', () => {
      const skill = new SkillFakeBuilder()
        .withScope('one_enemy')
        .build();

      expect(skill.isAoe()).toBe(false);
    });

    it('should return false for one_ally scope', () => {
      const skill = new SkillFakeBuilder()
        .withScope('one_ally')
        .build();

      expect(skill.isAoe()).toBe(false);
    });

    it('should return false for user scope', () => {
      const skill = new SkillFakeBuilder()
        .withScope('user')
        .build();

      expect(skill.isAoe()).toBe(false);
    });
  });

  describe('canCrit', () => {
    it('should return true for physical with critical enabled', () => {
      const skill = new SkillFakeBuilder()
        .withPhysical()
        .withCritical(true)
        .build();

      expect(skill.canCrit()).toBe(true);
    });

    it('should return true for magical with critical enabled', () => {
      const skill = new SkillFakeBuilder()
        .withMagical()
        .withCritical(true)
        .build();

      expect(skill.canCrit()).toBe(true);
    });

    it('should return false when critical is disabled', () => {
      const skill = new SkillFakeBuilder()
        .withPhysical()
        .withCritical(false)
        .build();

      expect(skill.canCrit()).toBe(false);
    });

    it('should return false for certain hit type', () => {
      const skill = new SkillFakeBuilder()
        .withCertain()
        .withCritical(true)
        .build();

      expect(skill.canCrit()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for skills with same ID', () => {
      const skill1 = new SkillFakeBuilder().build();
      const skill2 = new SkillFakeBuilder().withName('Different Name').build();

      expect(skill1.equals(skill2)).toBe(true);
    });

    it('should return false for skills with different IDs', () => {
      const skill1 = new SkillFakeBuilder().build();
      const skill2 = new SkillFakeBuilder().withId(2).build();

      expect(skill1.equals(skill2)).toBe(false);
    });

    it('should support reflexive equality', () => {
      const skill = new SkillFakeBuilder().build();

      expect(skill.equals(skill)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should format skill correctly', () => {
      const skill = new SkillFakeBuilder().build();

      expect(skill.toString()).toBe('Skill #1: Fireball');
    });

    it('should handle spaces in name', () => {
      const skill = new SkillFakeBuilder().withName('Great Fireball').build();

      expect(skill.toString()).toBe('Skill #1: Great Fireball');
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const skill = new SkillFakeBuilder().build();

      expect(Object.isFrozen(skill)).toBe(true);
    });

    it('should have frozen damage object', () => {
      const skill = new SkillFakeBuilder().build();

      expect(Object.isFrozen(skill.damage)).toBe(true);
    });

    it('should not allow modification of damage', () => {
      const skill = new SkillFakeBuilder().build();
      const mutator = new SkillFakeBuilder().withDamageMutation();

      expect(() => {
        mutator(skill.damage);
      }).toThrow();
    });

    it('should not share reference with input damage', () => {
      const skill1 = new SkillFakeBuilder().build();
      const skill2 = new SkillFakeBuilder()
        .withDamageType('hp_recover')
        .build();

      expect(skill1.damage.type).toBe('hp_damage');
      expect(skill2.damage.type).toBe('hp_recover');
    });
  });
});
