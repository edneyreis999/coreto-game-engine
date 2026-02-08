import { ValidationError } from '../../../../src/core/errors/ValidationError.js';
import { EnemyFakeBuilder } from '../../../fakes';

describe('Enemy', () => {
  describe('constructor', () => {
    it('should create enemy with valid data', () => {
      const enemy = new EnemyFakeBuilder().build();

      expect(enemy.id).toBe(1);
      expect(enemy.name).toBe('Goblin');
      expect(enemy.params).toEqual([50, 0, 10, 5, 3, 3, 4, 4]);
      expect(enemy.actions).toHaveLength(2);
      expect(enemy.dropItems).toHaveLength(2);
      expect(enemy.exp).toBe(10);
      expect(enemy.gold).toBe(5);
    });

    it('should throw ValidationError when id is 0', () => {
      expect(() => new EnemyFakeBuilder().withId(0).build()).toThrow(ValidationError);
      expect(() => new EnemyFakeBuilder().withId(0).build()).toThrow('Enemy ID must be >= 1');
    });

    it('should throw ValidationError when id is negative', () => {
      expect(() => new EnemyFakeBuilder().withId(-1).build()).toThrow(ValidationError);
      expect(() => new EnemyFakeBuilder().withId(-1).build()).toThrow('Enemy ID must be >= 1');
    });

    it('should throw ValidationError when name is empty', () => {
      expect(() => new EnemyFakeBuilder().withName('').build()).toThrow(ValidationError);
      expect(() => new EnemyFakeBuilder().withName('').build()).toThrow('Enemy name cannot be empty');
    });

    it('should throw ValidationError when name is whitespace only', () => {
      expect(() => new EnemyFakeBuilder().withName('   ').build()).toThrow(ValidationError);
      expect(() => new EnemyFakeBuilder().withName('   ').build()).toThrow('Enemy name cannot be empty');
    });

    it('should throw ValidationError when params length is not 8', () => {
      expect(() =>
        new EnemyFakeBuilder()
          .withInvalidParams()
          .build(),
      ).toThrow(ValidationError);
      expect(() =>
        new EnemyFakeBuilder()
          .withInvalidParams()
          .build(),
      ).toThrow('Enemy params must have exactly 8 values');
    });

    it('should throw ValidationError when any param is negative', () => {
      expect(() =>
        new EnemyFakeBuilder()
          .withParams([50, 0, -10, 5, 3, 3, 4, 4])
          .build(),
      ).toThrow(ValidationError);
      expect(() =>
        new EnemyFakeBuilder()
          .withParams([50, 0, -10, 5, 3, 3, 4, 4])
          .build(),
      ).toThrow('Enemy param[2] cannot be negative');
    });

    it('should throw ValidationError when MaxHP is 0', () => {
      expect(() =>
        new EnemyFakeBuilder()
          .withParams([0, 0, 10, 5, 3, 3, 4, 4])
          .build(),
      ).toThrow(ValidationError);
      expect(() =>
        new EnemyFakeBuilder()
          .withParams([0, 0, 10, 5, 3, 3, 4, 4])
          .build(),
      ).toThrow('Enemy MaxHP must be >= 1');
    });

    it('should accept zero params (valid for MP)', () => {
      const enemy = new EnemyFakeBuilder()
        .withParams([50, 0, 10, 5, 0, 0, 4, 4])
        .build();
      expect(enemy.maxMp).toBe(0);
      expect(enemy.magicAttack).toBe(0);
    });

    it('should throw ValidationError when action skillId is 0', () => {
      expect(() =>
        new EnemyFakeBuilder()
          .withActions([{ skillId: 0, rating: 5, conditionType: 0 }])
          .build(),
      ).toThrow(ValidationError);
      expect(() =>
        new EnemyFakeBuilder()
          .withActions([{ skillId: 0, rating: 5, conditionType: 0 }])
          .build(),
      ).toThrow('Enemy action skillId must be >= 1');
    });

    it('should throw ValidationError when action rating is below 1', () => {
      expect(() =>
        new EnemyFakeBuilder()
          .withActions([{ skillId: 1, rating: 0, conditionType: 0 }])
          .build(),
      ).toThrow(ValidationError);
      expect(() =>
        new EnemyFakeBuilder()
          .withActions([{ skillId: 1, rating: 0, conditionType: 0 }])
          .build(),
      ).toThrow('Enemy action rating must be 1-10');
    });

    it('should throw ValidationError when action rating exceeds 10', () => {
      expect(() =>
        new EnemyFakeBuilder()
          .withActions([{ skillId: 1, rating: 11, conditionType: 0 }])
          .build(),
      ).toThrow(ValidationError);
      expect(() =>
        new EnemyFakeBuilder()
          .withActions([{ skillId: 1, rating: 11, conditionType: 0 }])
          .build(),
      ).toThrow('Enemy action rating must be 1-10');
    });

    it('should throw ValidationError when drop item kind is invalid', () => {
      expect(() =>
        new EnemyFakeBuilder()
          .withDropItems([{ kind: 3, dataId: 1, denominator: 2 }])
          .build(),
      ).toThrow(ValidationError);
      expect(() =>
        new EnemyFakeBuilder()
          .withDropItems([{ kind: 3, dataId: 1, denominator: 2 }])
          .build(),
      ).toThrow('Drop item kind must be 0-2');
    });

    it('should throw ValidationError when drop item dataId is negative', () => {
      expect(() =>
        new EnemyFakeBuilder()
          .withDropItems([{ kind: 0, dataId: -1, denominator: 2 }])
          .build(),
      ).toThrow(ValidationError);
      expect(() =>
        new EnemyFakeBuilder()
          .withDropItems([{ kind: 0, dataId: -1, denominator: 2 }])
          .build(),
      ).toThrow('Drop item dataId cannot be negative');
    });

    it('should throw ValidationError when drop item denominator is below 1', () => {
      expect(() =>
        new EnemyFakeBuilder()
          .withDropItems([{ kind: 0, dataId: 1, denominator: 0 }])
          .build(),
      ).toThrow(ValidationError);
      expect(() =>
        new EnemyFakeBuilder()
          .withDropItems([{ kind: 0, dataId: 1, denominator: 0 }])
          .build(),
      ).toThrow('Drop item denominator must be >= 1');
    });

    it('should throw ValidationError when EXP is negative', () => {
      expect(() => new EnemyFakeBuilder().withExp(-10).build()).toThrow(ValidationError);
      expect(() => new EnemyFakeBuilder().withExp(-10).build()).toThrow('Enemy EXP cannot be negative');
    });

    it('should throw ValidationError when gold is negative', () => {
      expect(() => new EnemyFakeBuilder().withGold(-5).build()).toThrow(ValidationError);
      expect(() => new EnemyFakeBuilder().withGold(-5).build()).toThrow('Enemy gold cannot be negative');
    });

    it('should accept zero EXP and gold', () => {
      const enemy = new EnemyFakeBuilder()
        .withExp(0)
        .withGold(0)
        .build();
      expect(enemy.exp).toBe(0);
      expect(enemy.gold).toBe(0);
    });
  });

  describe('parameter getters', () => {
    it('should return correct maxHp', () => {
      const enemy = new EnemyFakeBuilder()
        .withParams([100, 0, 10, 5, 3, 3, 4, 4])
        .build();

      expect(enemy.maxHp).toBe(100);
    });

    it('should return correct maxMp', () => {
      const enemy = new EnemyFakeBuilder()
        .withParams([50, 20, 10, 5, 3, 3, 4, 4])
        .build();

      expect(enemy.maxMp).toBe(20);
    });

    it('should return correct attack', () => {
      const enemy = new EnemyFakeBuilder()
        .withParams([50, 0, 15, 5, 3, 3, 4, 4])
        .build();

      expect(enemy.attack).toBe(15);
    });

    it('should return correct defense', () => {
      const enemy = new EnemyFakeBuilder()
        .withParams([50, 0, 10, 8, 3, 3, 4, 4])
        .build();

      expect(enemy.defense).toBe(8);
    });

    it('should return correct magicAttack', () => {
      const enemy = new EnemyFakeBuilder()
        .withParams([50, 0, 10, 5, 12, 3, 4, 4])
        .build();

      expect(enemy.magicAttack).toBe(12);
    });

    it('should return correct magicDefense', () => {
      const enemy = new EnemyFakeBuilder()
        .withParams([50, 0, 10, 5, 3, 9, 4, 4])
        .build();

      expect(enemy.magicDefense).toBe(9);
    });

    it('should return correct agility', () => {
      const enemy = new EnemyFakeBuilder()
        .withParams([50, 0, 10, 5, 3, 3, 7, 4])
        .build();

      expect(enemy.agility).toBe(7);
    });

    it('should return correct luck', () => {
      const enemy = new EnemyFakeBuilder()
        .withParams([50, 0, 10, 5, 3, 3, 4, 6])
        .build();

      expect(enemy.luck).toBe(6);
    });
  });

  describe('canUseSkill', () => {
    it('should return true when enemy has the skill', () => {
      const enemy = new EnemyFakeBuilder()
        .withActions([
          { skillId: 1, rating: 5, conditionType: 0 },
          { skillId: 2, rating: 3, conditionType: 1 },
        ])
        .build();

      expect(enemy.canUseSkill(1)).toBe(true);
      expect(enemy.canUseSkill(2)).toBe(true);
    });

    it('should return false when enemy does not have the skill', () => {
      const enemy = new EnemyFakeBuilder()
        .withActions([{ skillId: 1, rating: 5, conditionType: 0 }])
        .build();

      expect(enemy.canUseSkill(99)).toBe(false);
    });

    it('should return false when enemy has no actions', () => {
      const enemy = new EnemyFakeBuilder().withNoActions().build();

      expect(enemy.canUseSkill(1)).toBe(false);
    });
  });

  describe('getAvailableSkillIds', () => {
    it('should return unique skill IDs', () => {
      const enemy = new EnemyFakeBuilder()
        .withActions([
          { skillId: 1, rating: 5, conditionType: 0 },
          { skillId: 2, rating: 3, conditionType: 1 },
          { skillId: 1, rating: 4, conditionType: 2 }, // Duplicate
        ])
        .build();

      const skillIds = enemy.getAvailableSkillIds();
      expect(skillIds).toEqual([1, 2]);
    });

    it('should return empty array when enemy has no actions', () => {
      const enemy = new EnemyFakeBuilder().withNoActions().build();

      expect(enemy.getAvailableSkillIds()).toEqual([]);
    });

    it('should return frozen array', () => {
      const enemy = new EnemyFakeBuilder()
        .withActions([{ skillId: 1, rating: 5, conditionType: 0 }])
        .build();

      const skillIds = enemy.getAvailableSkillIds();
      expect(Object.isFrozen(skillIds)).toBe(true);
    });
  });

  describe('getDropChance', () => {
    it('should return correct drop probability', () => {
      const enemy = new EnemyFakeBuilder()
        .withDropItems([
          { kind: 0, dataId: 1, denominator: 2 }, // 50%
          { kind: 1, dataId: 5, denominator: 4 }, // 25%
          { kind: 2, dataId: 10, denominator: 10 }, // 10%
        ])
        .build();

      expect(enemy.getDropChance(0)).toBe(0.5);
      expect(enemy.getDropChance(1)).toBe(0.25);
      expect(enemy.getDropChance(2)).toBe(0.1);
    });

    it('should return 0 for invalid drop index', () => {
      const enemy = new EnemyFakeBuilder()
        .withDropItems([{ kind: 0, dataId: 1, denominator: 2 }])
        .build();

      expect(enemy.getDropChance(-1)).toBe(0);
      expect(enemy.getDropChance(1)).toBe(0);
      expect(enemy.getDropChance(99)).toBe(0);
    });

    it('should return 0 when enemy has no drop items', () => {
      const enemy = new EnemyFakeBuilder().withNoDropItems().build();

      expect(enemy.getDropChance(0)).toBe(0);
    });

    it('should handle denominator of 1 (100% drop)', () => {
      const enemy = new EnemyFakeBuilder()
        .withDropItems([{ kind: 0, dataId: 1, denominator: 1 }])
        .build();

      expect(enemy.getDropChance(0)).toBe(1);
    });
  });

  describe('equals', () => {
    it('should return true for enemies with same ID', () => {
      const enemy1 = new EnemyFakeBuilder().build();
      const enemy2 = new EnemyFakeBuilder().withName('Different Name').build();

      expect(enemy1.equals(enemy2)).toBe(true);
    });

    it('should return false for enemies with different IDs', () => {
      const enemy1 = new EnemyFakeBuilder().build();
      const enemy2 = new EnemyFakeBuilder().withId(2).build();

      expect(enemy1.equals(enemy2)).toBe(false);
    });

    it('should support reflexive equality', () => {
      const enemy = new EnemyFakeBuilder().build();

      expect(enemy.equals(enemy)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should format enemy correctly', () => {
      const enemy = new EnemyFakeBuilder().build();

      expect(enemy.toString()).toBe('Enemy #1: Goblin');
    });

    it('should handle spaces in name', () => {
      const enemy = new EnemyFakeBuilder().withName('Red Goblin').build();

      expect(enemy.toString()).toBe('Enemy #1: Red Goblin');
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const enemy = new EnemyFakeBuilder().build();

      expect(Object.isFrozen(enemy)).toBe(true);
    });

    it('should have frozen params array', () => {
      const enemy = new EnemyFakeBuilder().build();

      expect(Object.isFrozen(enemy.params)).toBe(true);
    });

    it('should have frozen actions array', () => {
      const enemy = new EnemyFakeBuilder().build();

      expect(Object.isFrozen(enemy.actions)).toBe(true);
    });

    it('should have frozen dropItems array', () => {
      const enemy = new EnemyFakeBuilder().build();

      expect(Object.isFrozen(enemy.dropItems)).toBe(true);
    });

    it('should not allow modification of params', () => {
      const enemy = new EnemyFakeBuilder().build();
      const mutator = new EnemyFakeBuilder().withParamsMutation();

      expect(() => {
        mutator(enemy.params);
      }).toThrow();
    });

    it('should not allow modification of actions', () => {
      const enemy = new EnemyFakeBuilder().build();
      const mutator = new EnemyFakeBuilder().withActionsMutation();

      expect(() => {
        mutator(enemy.actions);
      }).toThrow();
    });

    it('should not share reference with input params', () => {
      const enemy = new EnemyFakeBuilder()
        .withParams([50, 0, 10, 5, 3, 3, 4, 4])
        .build();

      const enemy2 = new EnemyFakeBuilder()
        .withParams([999, 0, 10, 5, 3, 3, 4, 4])
        .build();

      expect(enemy.params).toEqual([50, 0, 10, 5, 3, 3, 4, 4]);
      expect(enemy2.params[0]).toBe(999);
    });

    it('should not share reference with input actions', () => {
      const enemy = new EnemyFakeBuilder()
        .withActions([
          { skillId: 1, rating: 5, conditionType: 0 },
          { skillId: 2, rating: 3, conditionType: 1 },
        ])
        .build();

      const enemy2 = new EnemyFakeBuilder()
        .withActions([
          { skillId: 1, rating: 5, conditionType: 0 },
          { skillId: 2, rating: 3, conditionType: 1 },
          { skillId: 99, rating: 5, conditionType: 0 },
        ])
        .build();

      expect(enemy.actions).toHaveLength(2);
      expect(enemy2.actions).toHaveLength(3);
    });
  });
});
