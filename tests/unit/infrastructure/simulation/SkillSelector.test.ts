import { SkillSelector } from '../../../../packages/core/src/infrastructure/simulation/SkillSelector.js';
import type { SkillData } from '../../../../packages/core/src/types/rmmz-data.js';

/**
 * Create a minimal valid SkillData mock
 */
function createMockSkillData(
  id: number,
  name: string,
  options: { mpCost?: number; hpCost?: number } = {}
): SkillData {
  return {
    id,
    name,
    description: '',
    iconIndex: 0,
    mpCost: options.mpCost ?? 0,
    tpCost: 0,
    tpGain: 0,
    message1: '',
    message2: '',
    messageType: 1,
    note: '',
    occasion: 1,
    repeats: 1,
    requiredWtypeId1: 0,
    requiredWtypeId2: 0,
    scope: 1,
    speed: 0,
    stypeId: 1,
    successRate: 100,
    hitType: 0,
    animationId: 0,
    damage: {
      critical: false,
      elementId: 0,
      formula: '0',
      type: 0,
      variance: 0,
    },
    effects: [],
    // @ts-expect-error hpCost is not in SkillData type but used in implementation
    hpCost: options.hpCost ?? 0,
  };
}

/**
 * Unit tests for SkillSelector.
 *
 * Tests the MVP implementation of skill selection (ADR-004, ADR-019):
 * - Basic attack selection when HP/MP sufficient
 * - Guard fallback when HP/MP insufficient
 * - Target selection (first alive enemy)
 */
describe('SkillSelector', () => {
  let selector: SkillSelector;
  let mockGlobal: any;
  let mockActor: any;
  let mockEnemy1: any;
  let mockEnemy2: any;

  beforeEach(() => {
    selector = new SkillSelector();

    // Mock RMMZ globals
    mockGlobal = global as any;

    // Mock actor with HP/MP resources
    mockActor = {
      hp: 100,
      mp: 50,
      name: 'TestActor',
    };

    // Mock enemies
    mockEnemy1 = {
      enemyId: 1,
      hp: 100,
      name: 'Slime',
      isAlive: jest.fn(() => true),
    };

    mockEnemy2 = {
      enemyId: 2,
      hp: 80,
      name: 'Bat',
      isAlive: jest.fn(() => true),
    };

    // Mock $dataSkills
    mockGlobal.$dataSkills = [
      null, // Index 0 is null
      createMockSkillData(1, 'Attack', { mpCost: 0, hpCost: 0 }), // Basic attack
      createMockSkillData(2, 'Guard', { mpCost: 0, hpCost: 0 }), // Guard
    ];

    // Mock $gameTroop
    mockGlobal.$gameTroop = {
      aliveMembers: jest.fn(() => [mockEnemy1, mockEnemy2]),
    };
  });

  afterEach(() => {
    // Cleanup mocks
    delete mockGlobal.$dataSkills;
    delete mockGlobal.$gameTroop;
  });

  describe('selectSkillForActor', () => {
    it('should select Attack (skill ID 1) when actor has sufficient HP/MP', () => {
      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(1); // Attack
      expect(result.target).toBe(mockEnemy1); // First alive enemy
    });

    it('should select Guard (skill ID 2) when actor has insufficient MP', () => {
      // Set actor MP below required MP cost for Attack
      mockActor.mp = 5;
      mockGlobal.$dataSkills[1].mpCost = 10; // Attack costs 10 MP

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(2); // Guard (fallback)
      expect(result.target).toBe(mockEnemy1); // First alive enemy
    });

    it('should select Guard (skill ID 2) when actor has insufficient HP', () => {
      // Set actor HP at hpCost threshold
      mockActor.hp = 10;
      (mockGlobal.$dataSkills[1] as any).hpCost = 10; // Attack costs 10 HP

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(2); // Guard (fallback)
      expect(result.target).toBe(mockEnemy1); // First alive enemy
    });

    it('should select Attack when actor has exactly required MP', () => {
      mockActor.mp = 10;
      mockGlobal.$dataSkills[1].mpCost = 10; // Attack costs exactly 10 MP

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(1); // Attack (affordable)
      expect(result.target).toBe(mockEnemy1);
    });

    it('should select Guard when actor HP equals hpCost (would kill actor)', () => {
      mockActor.hp = 10;
      (mockGlobal.$dataSkills[1] as any).hpCost = 10; // Attack costs 10 HP (would kill)

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(2); // Guard (cannot afford Attack)
    });

    it('should select Attack when actor HP > hpCost', () => {
      mockActor.hp = 11;
      (mockGlobal.$dataSkills[1] as any).hpCost = 10; // Attack costs 10 HP

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(1); // Attack (affordable)
    });

    it('should target first alive enemy from $gameTroop.aliveMembers()', () => {
      const result = selector.selectSkillForActor(mockActor);

      expect(result.target).toBe(mockEnemy1); // First in array
      expect(mockGlobal.$gameTroop.aliveMembers).toHaveBeenCalled();
    });

    it('should throw Error if $gameTroop not initialized', () => {
      mockGlobal.$gameTroop = null;

      expect(() => selector.selectSkillForActor(mockActor)).toThrow('$gameTroop not initialized');
    });

    it('should throw Error if no alive enemies found', () => {
      mockGlobal.$gameTroop.aliveMembers = jest.fn(() => []);

      expect(() => selector.selectSkillForActor(mockActor)).toThrow(
        'No alive enemies found. Battle should have ended.'
      );
    });
  });

  describe('HP cost validation (ADR-004)', () => {
    it('should reject skill when actor.hp <= skill.hpCost', () => {
      mockActor.hp = 5;
      (mockGlobal.$dataSkills[1] as any).hpCost = 5; // HP exactly at cost

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(2); // Guard (cannot afford)
    });

    it('should accept skill when actor.hp > skill.hpCost', () => {
      mockActor.hp = 6;
      (mockGlobal.$dataSkills[1] as any).hpCost = 5; // HP above cost

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(1); // Attack (affordable)
    });

    it('should accept skill when hpCost is 0 (default)', () => {
      mockActor.hp = 1; // Very low HP
      (mockGlobal.$dataSkills[1] as any).hpCost = 0; // No HP cost

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(1); // Attack (affordable)
    });

    it('should accept skill when hpCost is undefined (defaults to 0)', () => {
      mockActor.hp = 1; // Very low HP
      delete (mockGlobal.$dataSkills[1] as any).hpCost; // No hpCost property

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(1); // Attack (affordable)
    });
  });

  describe('MP cost validation (ADR-004)', () => {
    it('should reject skill when actor.mp < skill.mpCost', () => {
      mockActor.mp = 9;
      mockGlobal.$dataSkills[1].mpCost = 10; // MP below cost

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(2); // Guard (cannot afford)
    });

    it('should accept skill when actor.mp >= skill.mpCost', () => {
      mockActor.mp = 10;
      mockGlobal.$dataSkills[1].mpCost = 10; // MP exactly at cost

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(1); // Attack (affordable)
    });

    it('should accept skill when mpCost is 0 (default)', () => {
      mockActor.mp = 0; // No MP
      mockGlobal.$dataSkills[1].mpCost = 0; // No MP cost

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(1); // Attack (affordable)
    });

    it('should accept skill when mpCost is undefined (defaults to 0)', () => {
      mockActor.mp = 0; // No MP
      delete mockGlobal.$dataSkills[1].mpCost; // No mpCost property

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(1); // Attack (affordable)
    });
  });

  describe('combined HP/MP validation', () => {
    it('should reject skill when both HP and MP insufficient', () => {
      mockActor.hp = 5;
      mockActor.mp = 5;
      (mockGlobal.$dataSkills[1] as any).hpCost = 5;
      mockGlobal.$dataSkills[1].mpCost = 10;

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(2); // Guard (cannot afford)
    });

    it('should accept skill when both HP and MP sufficient', () => {
      mockActor.hp = 20;
      mockActor.mp = 20;
      (mockGlobal.$dataSkills[1] as any).hpCost = 10;
      mockGlobal.$dataSkills[1].mpCost = 10;

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(1); // Attack (affordable)
    });

    it('should reject skill when HP sufficient but MP insufficient', () => {
      mockActor.hp = 100;
      mockActor.mp = 5;
      (mockGlobal.$dataSkills[1] as any).hpCost = 0;
      mockGlobal.$dataSkills[1].mpCost = 10;

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(2); // Guard (cannot afford due to MP)
    });

    it('should reject skill when MP sufficient but HP insufficient', () => {
      mockActor.hp = 5;
      mockActor.mp = 100;
      (mockGlobal.$dataSkills[1] as any).hpCost = 5;
      mockGlobal.$dataSkills[1].mpCost = 0;

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(2); // Guard (cannot afford due to HP)
    });
  });

  describe('target selection (ADR-019 MVP)', () => {
    it('should always select first enemy from aliveMembers array', () => {
      const result = selector.selectSkillForActor(mockActor);

      expect(result.target).toBe(mockEnemy1); // First enemy
      expect(result.target).not.toBe(mockEnemy2); // Not second enemy
    });

    it('should handle single enemy in troop', () => {
      mockGlobal.$gameTroop.aliveMembers = jest.fn(() => [mockEnemy2]);

      const result = selector.selectSkillForActor(mockActor);

      expect(result.target).toBe(mockEnemy2); // Only enemy
    });

    it('should handle multiple enemies in troop (always picks first)', () => {
      const mockEnemy3 = { enemyId: 3, hp: 60, name: 'Goblin' };
      mockGlobal.$gameTroop.aliveMembers = jest.fn(() => [mockEnemy1, mockEnemy2, mockEnemy3]);

      const result = selector.selectSkillForActor(mockActor);

      expect(result.target).toBe(mockEnemy1); // Always first
    });
  });

  describe('edge cases', () => {
    it('should handle actor with maximum resources', () => {
      mockActor.hp = 9999;
      mockActor.mp = 9999;

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(1); // Attack
    });

    it('should handle actor with minimum resources (1 HP, 0 MP)', () => {
      mockActor.hp = 1;
      mockActor.mp = 0;
      (mockGlobal.$dataSkills[1] as any).hpCost = 0;
      mockGlobal.$dataSkills[1].mpCost = 0;

      const result = selector.selectSkillForActor(mockActor);

      expect(result.skillId).toBe(1); // Attack (no costs)
    });

    it('should handle $gameTroop.aliveMembers returning null (defensive)', () => {
      mockGlobal.$gameTroop.aliveMembers = jest.fn(() => null);

      expect(() => selector.selectSkillForActor(mockActor)).toThrow('No alive enemies found');
    });

    it('should handle $gameTroop.aliveMembers returning undefined (defensive)', () => {
      mockGlobal.$gameTroop.aliveMembers = jest.fn(() => undefined);

      expect(() => selector.selectSkillForActor(mockActor)).toThrow('No alive enemies found');
    });
  });

  describe('ADR-004 compliance', () => {
    it('should respect HP cost constraints', () => {
      mockActor.hp = 10;
      (mockGlobal.$dataSkills[1] as any).hpCost = 10;

      const result = selector.selectSkillForActor(mockActor);

      // Actor should not use skill that would kill them
      expect(result.skillId).toBe(2); // Guard
    });

    it('should respect MP cost constraints', () => {
      mockActor.mp = 5;
      mockGlobal.$dataSkills[1].mpCost = 10;

      const result = selector.selectSkillForActor(mockActor);

      // Actor should not use skill they cannot afford
      expect(result.skillId).toBe(2); // Guard
    });
  });

  describe('ADR-019 MVP compliance', () => {
    it('should implement basic attack selection (MVP requirement)', () => {
      const result = selector.selectSkillForActor(mockActor);

      // MVP: always select Attack (skill ID 1) when affordable
      expect(result.skillId).toBe(1);
    });

    it('should implement Guard fallback (MVP requirement)', () => {
      mockActor.mp = 0;
      mockGlobal.$dataSkills[1].mpCost = 10;

      const result = selector.selectSkillForActor(mockActor);

      // MVP: fallback to Guard (skill ID 2) when Attack unaffordable
      expect(result.skillId).toBe(2);
    });

    it('should implement first-enemy targeting (MVP requirement)', () => {
      const result = selector.selectSkillForActor(mockActor);

      // MVP: always target first alive enemy
      expect(result.target).toBe(mockEnemy1);
    });
  });
});
