import { EnemyMapper } from '../../../../../src/infrastructure/adapters/mappers/EnemyMapper.js';

describe('EnemyMapper', () => {
  describe('fromRmmzData', () => {
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
