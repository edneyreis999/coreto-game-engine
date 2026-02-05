import { SkillSelector } from '@coreto/core';
import type { SkillData } from '@coreto/core';

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
    test.each([
      // [actorHP, actorMP, skillHPCost, skillMPCost, expectedSkillId, description]
      [100, 50, 0, 0, 1, 'default sufficient HP/MP'],
      [5, 5, 0, 10, 2, 'insufficient MP for skill'],
      [10, 50, 10, 0, 2, 'insufficient HP for skill'],
      [10, 10, 0, 10, 1, 'exact MP cost'],
      [10, 10, 10, 0, 2, 'exact HP cost (would kill)'],
      [11, 50, 10, 0, 1, 'HP > HP cost'],
    ])('should select skill %p with HP:%p, MP:%p, HPCost:%p, MPCost:%p - %s',
      (actorHP, actorMP, skillHPCost, skillMPCost, expectedSkillId, _description) => {
        mockActor.hp = actorHP;
        mockActor.mp = actorMP;

        if (skillHPCost > 0) {
          (mockGlobal.$dataSkills[1] as any).hpCost = skillHPCost;
        } else {
          delete (mockGlobal.$dataSkills[1] as any).hpCost;
        }

        mockGlobal.$dataSkills[1].mpCost = skillMPCost;

        const result = selector.selectSkillForActor(mockActor);
        expect(result.skillId).toBe(expectedSkillId);
      }
    );

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
    test.each([
      // [actorHP, skillHPCost, expectedSkillId, description]
      [5, 5, 2, 'HP equals HP cost (should reject)'],
      [6, 5, 1, 'HP > HP cost (should accept)'],
      [1, 0, 1, 'HP cost is 0 (should accept)'],
      [1, undefined, 1, 'HP cost is undefined (should accept)'],
    ])('HP: %p, Cost: %p -> Skill: %p (%s)',
      (actorHP, skillHPCost, expectedSkillId, _description) => {
        mockActor.hp = actorHP;

        if (skillHPCost === undefined) {
          delete (mockGlobal.$dataSkills[1] as any).hpCost;
        } else {
          (mockGlobal.$dataSkills[1] as any).hpCost = skillHPCost;
        }

        const result = selector.selectSkillForActor(mockActor);
        expect(result.skillId).toBe(expectedSkillId);
      }
    );
  });

  describe('MP cost validation (ADR-004)', () => {
    test.each([
      // [actorMP, skillMPCost, expectedSkillId, description]
      [9, 10, 2, 'MP < MP cost (should reject)'],
      [10, 10, 1, 'MP >= MP cost (should accept)'],
      [0, 0, 1, 'MP cost is 0 (should accept)'],
      [0, undefined, 1, 'MP cost is undefined (should accept)'],
    ])('MP: %p, Cost: %p -> Skill: %p (%s)',
      (actorMP, skillMPCost, expectedSkillId, _description) => {
        mockActor.mp = actorMP;

        if (skillMPCost === undefined) {
          delete mockGlobal.$dataSkills[1].mpCost;
        } else {
          mockGlobal.$dataSkills[1].mpCost = skillMPCost;
        }

        const result = selector.selectSkillForActor(mockActor);
        expect(result.skillId).toBe(expectedSkillId);
      }
    );
  });

  describe('combined HP/MP validation', () => {
    test.each([
      // [actorHP, actorMP, skillHPCost, skillMPCost, expectedSkillId, description]
      [5, 5, 5, 10, 2, 'both HP and MP insufficient'],
      [20, 20, 10, 10, 1, 'both HP and MP sufficient'],
      [100, 5, 0, 10, 2, 'HP sufficient but MP insufficient'],
      [5, 100, 5, 0, 2, 'MP sufficient but HP insufficient'],
    ])('HP:%p, MP:%p, HPCost:%p, MPCost:%p -> Skill: %p (%s)',
      (actorHP, actorMP, skillHPCost, skillMPCost, expectedSkillId, _description) => {
        mockActor.hp = actorHP;
        mockActor.mp = actorMP;

        (mockGlobal.$dataSkills[1] as any).hpCost = skillHPCost;
        mockGlobal.$dataSkills[1].mpCost = skillMPCost;

        const result = selector.selectSkillForActor(mockActor);
        expect(result.skillId).toBe(expectedSkillId);
      }
    );
  });

  describe('target selection (ADR-019 MVP)', () => {
    test.each([
      // [aliveMembers, expectedTarget, description]
      [[mockEnemy1, mockEnemy2], mockEnemy1, 'multiple enemies, pick first'],
      [[mockEnemy2], mockEnemy2, 'single enemy'],
      [[mockEnemy1, mockEnemy2, { enemyId: 3, hp: 60, name: 'Goblin' }], mockEnemy1, 'multiple enemies, always first'],
    ])('should target first alive enemy from %p - %s',
      (aliveMembers, expectedTarget, _description) => {
        mockGlobal.$gameTroop.aliveMembers = jest.fn(() => aliveMembers);

        const result = selector.selectSkillForActor(mockActor);
        expect(result.target).toBe(expectedTarget);
      }
    );
  });

  describe('edge cases', () => {
    test.each([
      // [actorHP, actorMP, skillHPCost, skillMPCost, expectedSkillId, description]
      [9999, 9999, 0, 0, 1, 'maximum resources'],
      [1, 0, 0, 0, 1, 'minimum resources'],
    ])('HP:%p, MP:%p, HPCost:%p, MPCost:%p -> Skill: %p (%s)',
      (actorHP, actorMP, skillHPCost, skillMPCost, expectedSkillId, _description) => {
        mockActor.hp = actorHP;
        mockActor.mp = actorMP;

        (mockGlobal.$dataSkills[1] as any).hpCost = skillHPCost;
        mockGlobal.$dataSkills[1].mpCost = skillMPCost;

        const result = selector.selectSkillForActor(mockActor);
        expect(result.skillId).toBe(expectedSkillId);
      }
    );

    test.each([
      // [aliveMembersValue, expectedError]
      [null, 'No alive enemies found'],
      [undefined, 'No alive enemies found'],
    ])('should handle $gameTroop.aliveMembers returning %p',
      (aliveMembersValue, expectedError) => {
        mockGlobal.$gameTroop.aliveMembers = jest.fn(() => aliveMembersValue);
        expect(() => selector.selectSkillForActor(mockActor)).toThrow(expectedError);
      }
    );
  });

  describe('ADR-004 compliance', () => {
    test.each([
      // [actorHP, actorMP, skillHPCost, skillMPCost, expectedSkillId, constraint]
      [10, 50, 10, 0, 2, 'HP cost constraint'],
      [50, 5, 0, 10, 2, 'MP cost constraint'],
    ])('should respect %s - HP:%p, MP:%p, HPCost:%p, MPCost:%p -> Skill: %p',
      (actorHP, actorMP, skillHPCost, skillMPCost, expectedSkillId, _constraint) => {
        mockActor.hp = actorHP;
        mockActor.mp = actorMP;

        (mockGlobal.$dataSkills[1] as any).hpCost = skillHPCost;
        mockGlobal.$dataSkills[1].mpCost = skillMPCost;

        const result = selector.selectSkillForActor(mockActor);
        expect(result.skillId).toBe(expectedSkillId);
      }
    );
  });

  describe('ADR-019 MVP compliance', () => {
    test.each([
      // [actorMP, skillMPCost, expectedSkillId, behavior]
      [50, 0, 1, 'basic attack selection when affordable'],
      [0, 10, 2, 'Guard fallback when unaffordable'],
    ])('should implement %s - MP:%p, MPCost:%p -> Skill: %p',
      (actorMP, skillMPCost, expectedSkillId, _behavior) => {
        mockActor.mp = actorMP;
        mockGlobal.$dataSkills[1].mpCost = skillMPCost;

        const result = selector.selectSkillForActor(mockActor);
        expect(result.skillId).toBe(expectedSkillId);
      }
    );

    it('should implement first-enemy targeting (MVP requirement)', () => {
      const result = selector.selectSkillForActor(mockActor);
      expect(result.target).toBe(mockEnemy1); // Always first alive enemy
    });
  });
});
