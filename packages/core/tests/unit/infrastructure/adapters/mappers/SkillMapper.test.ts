import { SkillMapper } from '../../../../../src/infrastructure/adapters/mappers/SkillMapper.js';

describe('SkillMapper', () => {
  describe('fromRmmzData', () => {
    it('should create Skill from RMMZ SkillData with hp_damage', () => {
      const rmmzData = {
        id: 1,
        name: 'Fireball',
        description: 'Deals fire damage',
        damage: {
          type: 1, // hp_damage
          elementId: 2,
          formula: 'a.mat * 4 - b.mdf * 2',
          variance: 20,
          critical: true,
        },
        hitType: 2, // magical
        scope: 1, // one_enemy
        mpCost: 5,
        tpCost: 0,
        successRate: 100,
        repeats: 1,
        speed: 0,
        animationId: 1,
        iconIndex: 0,
        message1: '',
        message2: '',
        note: '',
        occasion: 1,
        requiredWtypeId1: 0,
        requiredWtypeId2: 0,
        stypeId: 1,
        tpGain: 0,
        messageType: 0,
        effects: [],
      };

      const skill = SkillMapper.fromRmmzData(rmmzData);

      expect(skill.id).toBe(1);
      expect(skill.name).toBe('Fireball');
      expect(skill.damage.type).toBe('hp_damage');
      expect(skill.hitType).toBe('magical');
      expect(skill.scope).toBe('one_enemy');
    });

    it('should create Skill from RMMZ SkillData with healing', () => {
      const rmmzData = {
        id: 2,
        name: 'Heal',
        description: 'Restores HP',
        damage: {
          type: 3, // hp_recover
          elementId: 0,
          formula: '200',
          variance: 20,
          critical: false,
        },
        hitType: 0, // certain
        scope: 7, // one_ally
        mpCost: 10,
        tpCost: 0,
        successRate: 100,
        repeats: 1,
        speed: 0,
        animationId: 1,
        iconIndex: 0,
        message1: '',
        message2: '',
        note: '',
        occasion: 1,
        requiredWtypeId1: 0,
        requiredWtypeId2: 0,
        stypeId: 1,
        tpGain: 0,
        messageType: 0,
        effects: [],
      };

      const skill = SkillMapper.fromRmmzData(rmmzData);

      expect(skill.damage.type).toBe('hp_recover');
      expect(skill.hitType).toBe('certain');
      expect(skill.scope).toBe('one_ally');
    });

    it('should create Skill from RMMZ SkillData with user scope', () => {
      const rmmzData = {
        id: 3,
        name: 'Self Buff',
        description: 'Buff yourself',
        damage: {
          type: 0, // none
          elementId: 0,
          formula: '0',
          variance: 0,
          critical: false,
        },
        hitType: 0, // certain
        scope: 11, // user
        mpCost: 0,
        tpCost: 0,
        successRate: 100,
        repeats: 1,
        speed: 0,
        animationId: 0,
        iconIndex: 0,
        message1: '',
        message2: '',
        note: '',
        occasion: 0,
        requiredWtypeId1: 0,
        requiredWtypeId2: 0,
        stypeId: 1,
        tpGain: 0,
        messageType: 0,
        effects: [],
      };

      const skill = SkillMapper.fromRmmzData(rmmzData);

      expect(skill.damage.type).toBe('none');
      expect(skill.scope).toBe('user');
    });
  });
});
