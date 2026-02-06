import { Enemy, type EnemyEntityData } from '../../../../src/core/domain/Enemy.js';
import { EnemyMapper } from '../../../../src/infrastructure/adapters/mappers/EnemyMapper.js';
import { ValidationError } from '../../../../src/core/errors/ValidationError.js';

describe('Enemy', () => {
  const createValidEnemyData = (): EnemyEntityData => ({
    id: 1,
    name: 'Goblin',
    params: [50, 0, 10, 5, 3, 3, 4, 4],
    actions: [
      { skillId: 1, rating: 5, conditionType: 0 },
      { skillId: 2, rating: 3, conditionType: 1 },
    ],
    dropItems: [
      { kind: 0, dataId: 1, denominator: 2 },
      { kind: 1, dataId: 5, denominator: 4 },
    ],
    exp: 10,
    gold: 5,
  });

  describe('constructor', () => {
    it('should create enemy with valid data', () => {
      const data = createValidEnemyData();
      const enemy = new Enemy(data);

      expect(enemy.id).toBe(1);
      expect(enemy.name).toBe('Goblin');
      expect(enemy.params).toEqual([50, 0, 10, 5, 3, 3, 4, 4]);
      expect(enemy.actions).toHaveLength(2);
      expect(enemy.dropItems).toHaveLength(2);
      expect(enemy.exp).toBe(10);
      expect(enemy.gold).toBe(5);
    });

    it('should throw ValidationError when id is 0', () => {
      const data = createValidEnemyData();
      data.id = 0;

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Enemy ID must be >= 1');
    });

    it('should throw ValidationError when id is negative', () => {
      const data = createValidEnemyData();
      data.id = -1;

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Enemy ID must be >= 1');
    });

    it('should throw ValidationError when name is empty', () => {
      const data = createValidEnemyData();
      data.name = '';

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Enemy name cannot be empty');
    });

    it('should throw ValidationError when name is whitespace only', () => {
      const data = createValidEnemyData();
      data.name = '   ';

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Enemy name cannot be empty');
    });

    it('should throw ValidationError when params length is not 8', () => {
      const data = createValidEnemyData();
      data.params = [50, 0, 10] as any;

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Enemy params must have exactly 8 values');
    });

    it('should throw ValidationError when any param is negative', () => {
      const data = createValidEnemyData();
      data.params = [50, 0, -10, 5, 3, 3, 4, 4];

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Enemy param[2] cannot be negative');
    });

    it('should throw ValidationError when MaxHP is 0', () => {
      const data = createValidEnemyData();
      data.params = [0, 0, 10, 5, 3, 3, 4, 4];

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Enemy MaxHP must be >= 1');
    });

    it('should accept zero params (valid for MP)', () => {
      const data = createValidEnemyData();
      data.params = [50, 0, 10, 5, 0, 0, 4, 4];

      const enemy = new Enemy(data);
      expect(enemy.maxMp).toBe(0);
      expect(enemy.magicAttack).toBe(0);
    });

    it('should throw ValidationError when action skillId is 0', () => {
      const data = createValidEnemyData();
      data.actions = [{ skillId: 0, rating: 5, conditionType: 0 }];

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Enemy action skillId must be >= 1');
    });

    it('should throw ValidationError when action rating is below 1', () => {
      const data = createValidEnemyData();
      data.actions = [{ skillId: 1, rating: 0, conditionType: 0 }];

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Enemy action rating must be 1-10');
    });

    it('should throw ValidationError when action rating exceeds 10', () => {
      const data = createValidEnemyData();
      data.actions = [{ skillId: 1, rating: 11, conditionType: 0 }];

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Enemy action rating must be 1-10');
    });

    it('should throw ValidationError when drop item kind is invalid', () => {
      const data = createValidEnemyData();
      data.dropItems = [{ kind: 3, dataId: 1, denominator: 2 }];

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Drop item kind must be 0-2');
    });

    it('should throw ValidationError when drop item dataId is negative', () => {
      const data = createValidEnemyData();
      data.dropItems = [{ kind: 0, dataId: -1, denominator: 2 }];

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Drop item dataId cannot be negative');
    });

    it('should throw ValidationError when drop item denominator is below 1', () => {
      const data = createValidEnemyData();
      data.dropItems = [{ kind: 0, dataId: 1, denominator: 0 }];

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Drop item denominator must be >= 1');
    });

    it('should throw ValidationError when EXP is negative', () => {
      const data = createValidEnemyData();
      data.exp = -10;

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Enemy EXP cannot be negative');
    });

    it('should throw ValidationError when gold is negative', () => {
      const data = createValidEnemyData();
      data.gold = -5;

      expect(() => new Enemy(data)).toThrow(ValidationError);
      expect(() => new Enemy(data)).toThrow('Enemy gold cannot be negative');
    });

    it('should accept zero EXP and gold', () => {
      const data = createValidEnemyData();
      data.exp = 0;
      data.gold = 0;

      const enemy = new Enemy(data);
      expect(enemy.exp).toBe(0);
      expect(enemy.gold).toBe(0);
    });
  });

  describe('parameter getters', () => {
    it('should return correct maxHp', () => {
      const data = createValidEnemyData();
      data.params = [100, 0, 10, 5, 3, 3, 4, 4];
      const enemy = new Enemy(data);

      expect(enemy.maxHp).toBe(100);
    });

    it('should return correct maxMp', () => {
      const data = createValidEnemyData();
      data.params = [50, 20, 10, 5, 3, 3, 4, 4];
      const enemy = new Enemy(data);

      expect(enemy.maxMp).toBe(20);
    });

    it('should return correct attack', () => {
      const data = createValidEnemyData();
      data.params = [50, 0, 15, 5, 3, 3, 4, 4];
      const enemy = new Enemy(data);

      expect(enemy.attack).toBe(15);
    });

    it('should return correct defense', () => {
      const data = createValidEnemyData();
      data.params = [50, 0, 10, 8, 3, 3, 4, 4];
      const enemy = new Enemy(data);

      expect(enemy.defense).toBe(8);
    });

    it('should return correct magicAttack', () => {
      const data = createValidEnemyData();
      data.params = [50, 0, 10, 5, 12, 3, 4, 4];
      const enemy = new Enemy(data);

      expect(enemy.magicAttack).toBe(12);
    });

    it('should return correct magicDefense', () => {
      const data = createValidEnemyData();
      data.params = [50, 0, 10, 5, 3, 9, 4, 4];
      const enemy = new Enemy(data);

      expect(enemy.magicDefense).toBe(9);
    });

    it('should return correct agility', () => {
      const data = createValidEnemyData();
      data.params = [50, 0, 10, 5, 3, 3, 7, 4];
      const enemy = new Enemy(data);

      expect(enemy.agility).toBe(7);
    });

    it('should return correct luck', () => {
      const data = createValidEnemyData();
      data.params = [50, 0, 10, 5, 3, 3, 4, 6];
      const enemy = new Enemy(data);

      expect(enemy.luck).toBe(6);
    });
  });

  describe('canUseSkill', () => {
    it('should return true when enemy has the skill', () => {
      const data = createValidEnemyData();
      data.actions = [
        { skillId: 1, rating: 5, conditionType: 0 },
        { skillId: 2, rating: 3, conditionType: 1 },
      ];
      const enemy = new Enemy(data);

      expect(enemy.canUseSkill(1)).toBe(true);
      expect(enemy.canUseSkill(2)).toBe(true);
    });

    it('should return false when enemy does not have the skill', () => {
      const data = createValidEnemyData();
      data.actions = [{ skillId: 1, rating: 5, conditionType: 0 }];
      const enemy = new Enemy(data);

      expect(enemy.canUseSkill(99)).toBe(false);
    });

    it('should return false when enemy has no actions', () => {
      const data = createValidEnemyData();
      data.actions = [];
      const enemy = new Enemy(data);

      expect(enemy.canUseSkill(1)).toBe(false);
    });
  });

  describe('getAvailableSkillIds', () => {
    it('should return unique skill IDs', () => {
      const data = createValidEnemyData();
      data.actions = [
        { skillId: 1, rating: 5, conditionType: 0 },
        { skillId: 2, rating: 3, conditionType: 1 },
        { skillId: 1, rating: 4, conditionType: 2 }, // Duplicate
      ];
      const enemy = new Enemy(data);

      const skillIds = enemy.getAvailableSkillIds();
      expect(skillIds).toEqual([1, 2]);
    });

    it('should return empty array when enemy has no actions', () => {
      const data = createValidEnemyData();
      data.actions = [];
      const enemy = new Enemy(data);

      expect(enemy.getAvailableSkillIds()).toEqual([]);
    });

    it('should return frozen array', () => {
      const data = createValidEnemyData();
      data.actions = [{ skillId: 1, rating: 5, conditionType: 0 }];
      const enemy = new Enemy(data);

      const skillIds = enemy.getAvailableSkillIds();
      expect(Object.isFrozen(skillIds)).toBe(true);
    });
  });

  describe('getDropChance', () => {
    it('should return correct drop probability', () => {
      const data = createValidEnemyData();
      data.dropItems = [
        { kind: 0, dataId: 1, denominator: 2 }, // 50%
        { kind: 1, dataId: 5, denominator: 4 }, // 25%
        { kind: 2, dataId: 10, denominator: 10 }, // 10%
      ];
      const enemy = new Enemy(data);

      expect(enemy.getDropChance(0)).toBe(0.5);
      expect(enemy.getDropChance(1)).toBe(0.25);
      expect(enemy.getDropChance(2)).toBe(0.1);
    });

    it('should return 0 for invalid drop index', () => {
      const data = createValidEnemyData();
      data.dropItems = [{ kind: 0, dataId: 1, denominator: 2 }];
      const enemy = new Enemy(data);

      expect(enemy.getDropChance(-1)).toBe(0);
      expect(enemy.getDropChance(1)).toBe(0);
      expect(enemy.getDropChance(99)).toBe(0);
    });

    it('should return 0 when enemy has no drop items', () => {
      const data = createValidEnemyData();
      data.dropItems = [];
      const enemy = new Enemy(data);

      expect(enemy.getDropChance(0)).toBe(0);
    });

    it('should handle denominator of 1 (100% drop)', () => {
      const data = createValidEnemyData();
      data.dropItems = [{ kind: 0, dataId: 1, denominator: 1 }];
      const enemy = new Enemy(data);

      expect(enemy.getDropChance(0)).toBe(1);
    });
  });

  describe('equals', () => {
    it('should return true for enemies with same ID', () => {
      const data1 = createValidEnemyData();
      const data2 = createValidEnemyData();
      data2.name = 'Different Name'; // Different name but same ID

      const enemy1 = new Enemy(data1);
      const enemy2 = new Enemy(data2);

      expect(enemy1.equals(enemy2)).toBe(true);
    });

    it('should return false for enemies with different IDs', () => {
      const data1 = createValidEnemyData();
      const data2 = createValidEnemyData();
      data2.id = 2;

      const enemy1 = new Enemy(data1);
      const enemy2 = new Enemy(data2);

      expect(enemy1.equals(enemy2)).toBe(false);
    });

    it('should support reflexive equality', () => {
      const data = createValidEnemyData();
      const enemy = new Enemy(data);

      expect(enemy.equals(enemy)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should format enemy correctly', () => {
      const data = createValidEnemyData();
      const enemy = new Enemy(data);

      expect(enemy.toString()).toBe('Enemy #1: Goblin');
    });

    it('should handle spaces in name', () => {
      const data = createValidEnemyData();
      data.name = 'Red Goblin';
      const enemy = new Enemy(data);

      expect(enemy.toString()).toBe('Enemy #1: Red Goblin');
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const data = createValidEnemyData();
      const enemy = new Enemy(data);

      expect(Object.isFrozen(enemy)).toBe(true);
    });

    it('should have frozen params array', () => {
      const data = createValidEnemyData();
      const enemy = new Enemy(data);

      expect(Object.isFrozen(enemy.params)).toBe(true);
    });

    it('should have frozen actions array', () => {
      const data = createValidEnemyData();
      const enemy = new Enemy(data);

      expect(Object.isFrozen(enemy.actions)).toBe(true);
    });

    it('should have frozen dropItems array', () => {
      const data = createValidEnemyData();
      const enemy = new Enemy(data);

      expect(Object.isFrozen(enemy.dropItems)).toBe(true);
    });

    it('should not allow modification of params', () => {
      const data = createValidEnemyData();
      const enemy = new Enemy(data);

      expect(() => {
        (enemy.params as any)[0] = 999;
      }).toThrow();
    });

    it('should not allow modification of actions', () => {
      const data = createValidEnemyData();
      const enemy = new Enemy(data);

      expect(() => {
        (enemy.actions as any).push({ skillId: 99, rating: 5, conditionType: 0 });
      }).toThrow();
    });

    it('should not share reference with input params', () => {
      const data = createValidEnemyData();
      const originalParams = [...data.params];
      const enemy = new Enemy(data);

      // Create new data to test immutability
      const newData = { ...data, params: [999, 0, 10, 5, 3, 3, 4, 4] as const };

      expect(enemy.params).toEqual(originalParams);
      expect(newData.params[0]).toBe(999);
    });

    it('should not share reference with input actions', () => {
      const data = createValidEnemyData();
      const originalActions = [...data.actions];
      const enemy = new Enemy(data);

      // Create new data to test immutability
      const newData = {
        ...data,
        actions: [
          ...data.actions,
          { skillId: 99, rating: 5, conditionType: 0 },
        ],
      };

      expect(enemy.actions).toEqual(originalActions);
      expect(enemy.actions).toHaveLength(2);
      expect(newData.actions).toHaveLength(3);
    });
  });

  describe('EnemyMapper.fromRmmzData', () => {
    it('should create Enemy from RMMZ EnemyData', () => {
      const rmmzData = {
        id: 1,
        name: 'Goblin',
        params: [50, 0, 10, 5, 3, 3, 4, 4] as [number, number, number, number, number, number, number, number],
        actions: [
          { skillId: 1, rating: 5, conditionType: 0, conditionParam1: 0, conditionParam2: 0 },
          { skillId: 2, rating: 3, conditionType: 1, conditionParam1: 0, conditionParam2: 0 },
        ],
        dropItems: [
          { kind: 0, dataId: 1, denominator: 2 },
          { kind: 1, dataId: 5, denominator: 4 },
        ],
        exp: 10,
        gold: 5,
        battlerName: 'Monster',
        battlerHue: 0,
        traits: [],
        note: '',
      };

      const enemy = EnemyMapper.fromRmmzData(rmmzData);

      expect(enemy.id).toBe(1);
      expect(enemy.name).toBe('Goblin');
      expect(enemy.params).toEqual([50, 0, 10, 5, 3, 3, 4, 4]);
      expect(enemy.actions).toHaveLength(2);
      expect(enemy.dropItems).toHaveLength(2);
      expect(enemy.exp).toBe(10);
      expect(enemy.gold).toBe(5);
    });
  });
});
