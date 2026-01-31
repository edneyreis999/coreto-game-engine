/**
 * Unit Tests for Zod Configuration Schemas
 *
 * Tests all validation rules, custom error messages, refinements,
 * default values, and type inference.
 *
 * Coverage target: 100%
 */

import { ZodError } from 'zod';
import {
  AnchorLevelRangeSchema,
  TtkTargetSchema,
  PartyMemberSchema,
  PartyConfigSchema,
  TrechoSchema,
  ProjectConfigSchema,
  type AnchorLevelRange,
  type TtkTarget,
  type PartyMember,
  type PartyConfig,
  type TrechoConfig,
  type ProjectConfig,
} from '@coreto/core/infrastructure/config/schemas.js';

describe('AnchorLevelRangeSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid level range (min = max)', () => {
      const input = { min: 10, max: 10 };
      const result = AnchorLevelRangeSchema.parse(input);
      expect(result).toEqual(input);
    });

    it('should accept valid level range (min < max)', () => {
      const input = { min: 5, max: 15 };
      const result = AnchorLevelRangeSchema.parse(input);
      expect(result).toEqual(input);
    });

    it('should accept boundary values (1-99)', () => {
      const input = { min: 1, max: 99 };
      const result = AnchorLevelRangeSchema.parse(input);
      expect(result).toEqual(input);
    });
  });

  describe('invalid inputs', () => {
    it('should reject min < 1', () => {
      const input = { min: 0, max: 10 };
      expect(() => AnchorLevelRangeSchema.parse(input)).toThrow(ZodError);
      expect(() => AnchorLevelRangeSchema.parse(input)).toThrow(
        'anchorLevelRange.min must be at least 1'
      );
    });

    it('should reject max > 99', () => {
      const input = { min: 1, max: 100 };
      expect(() => AnchorLevelRangeSchema.parse(input)).toThrow(ZodError);
      expect(() => AnchorLevelRangeSchema.parse(input)).toThrow(
        'anchorLevelRange.max cannot exceed 99'
      );
    });

    it('should reject max < min (refinement)', () => {
      const input = { min: 20, max: 10 };
      expect(() => AnchorLevelRangeSchema.parse(input)).toThrow(ZodError);
      expect(() => AnchorLevelRangeSchema.parse(input)).toThrow(
        'anchorLevelRange.max must be greater than or equal to min'
      );
    });

    it('should reject non-integer values', () => {
      const input = { min: 5.5, max: 10.5 };
      expect(() => AnchorLevelRangeSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject missing min field', () => {
      const input = { max: 10 };
      expect(() => AnchorLevelRangeSchema.parse(input)).toThrow(ZodError);
      expect(() => AnchorLevelRangeSchema.parse(input)).toThrow(
        'anchorLevelRange.min is required'
      );
    });

    it('should reject missing max field', () => {
      const input = { min: 5 };
      expect(() => AnchorLevelRangeSchema.parse(input)).toThrow(ZodError);
      expect(() => AnchorLevelRangeSchema.parse(input)).toThrow(
        'anchorLevelRange.max is required'
      );
    });

    it('should reject non-number types', () => {
      const input = { min: '5', max: '10' };
      expect(() => AnchorLevelRangeSchema.parse(input)).toThrow(ZodError);
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript type', () => {
      const validRange: AnchorLevelRange = { min: 1, max: 99 };
      expect(validRange.min).toBe(1);
      expect(validRange.max).toBe(99);
    });
  });
});

describe('TtkTargetSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid TTK target with explicit tolerance', () => {
      const input = { turns: 10, actions: 40, tolerance: 0.2 };
      const result = TtkTargetSchema.parse(input);
      expect(result).toEqual(input);
    });

    it('should apply default tolerance (0.15)', () => {
      const input = { turns: 10, actions: 40 };
      const result = TtkTargetSchema.parse(input);
      expect(result.tolerance).toBe(0.15);
    });

    it('should accept tolerance boundary values (0.0 and 1.0)', () => {
      const input1 = { turns: 5, actions: 20, tolerance: 0.0 };
      const result1 = TtkTargetSchema.parse(input1);
      expect(result1.tolerance).toBe(0.0);

      const input2 = { turns: 5, actions: 20, tolerance: 1.0 };
      const result2 = TtkTargetSchema.parse(input2);
      expect(result2.tolerance).toBe(1.0);
    });
  });

  describe('invalid inputs', () => {
    it('should reject turns <= 0', () => {
      const input = { turns: 0, actions: 40 };
      expect(() => TtkTargetSchema.parse(input)).toThrow(ZodError);
      expect(() => TtkTargetSchema.parse(input)).toThrow(
        'ttkTarget.turns must be a positive number'
      );
    });

    it('should reject actions <= 0', () => {
      const input = { turns: 10, actions: -5 };
      expect(() => TtkTargetSchema.parse(input)).toThrow(ZodError);
      expect(() => TtkTargetSchema.parse(input)).toThrow(
        'ttkTarget.actions must be a positive number'
      );
    });

    it('should reject tolerance < 0', () => {
      const input = { turns: 10, actions: 40, tolerance: -0.1 };
      expect(() => TtkTargetSchema.parse(input)).toThrow(ZodError);
      expect(() => TtkTargetSchema.parse(input)).toThrow(
        'ttkTarget.tolerance must be at least 0'
      );
    });

    it('should reject tolerance > 1', () => {
      const input = { turns: 10, actions: 40, tolerance: 1.5 };
      expect(() => TtkTargetSchema.parse(input)).toThrow(ZodError);
      expect(() => TtkTargetSchema.parse(input)).toThrow(
        'ttkTarget.tolerance cannot exceed 1'
      );
    });

    it('should reject non-integer turns/actions', () => {
      const input = { turns: 10.5, actions: 40.5 };
      expect(() => TtkTargetSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject missing required fields', () => {
      const input1 = { actions: 40 };
      expect(() => TtkTargetSchema.parse(input1)).toThrow(ZodError);
      expect(() => TtkTargetSchema.parse(input1)).toThrow(
        'ttkTarget.turns is required'
      );

      const input2 = { turns: 10 };
      expect(() => TtkTargetSchema.parse(input2)).toThrow(ZodError);
      expect(() => TtkTargetSchema.parse(input2)).toThrow(
        'ttkTarget.actions is required'
      );
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript type', () => {
      const validTarget: TtkTarget = { turns: 10, actions: 40, tolerance: 0.15 };
      expect(validTarget.turns).toBe(10);
      expect(validTarget.actions).toBe(40);
      expect(validTarget.tolerance).toBe(0.15);
    });
  });
});

describe('PartyMemberSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid party member', () => {
      const input = { classId: 1, level: 10 };
      const result = PartyMemberSchema.parse(input);
      expect(result).toEqual(input);
    });

    it('should accept boundary values', () => {
      const input = { classId: 1, level: 1 };
      const result1 = PartyMemberSchema.parse(input);
      expect(result1.level).toBe(1);

      const input2 = { classId: 999, level: 99 };
      const result2 = PartyMemberSchema.parse(input2);
      expect(result2.level).toBe(99);
    });
  });

  describe('invalid inputs', () => {
    it('should reject classId <= 0', () => {
      const input = { classId: 0, level: 10 };
      expect(() => PartyMemberSchema.parse(input)).toThrow(ZodError);
      expect(() => PartyMemberSchema.parse(input)).toThrow(
        'party.member.classId must be a positive number'
      );
    });

    it('should reject level < 1', () => {
      const input = { classId: 1, level: 0 };
      expect(() => PartyMemberSchema.parse(input)).toThrow(ZodError);
      expect(() => PartyMemberSchema.parse(input)).toThrow(
        'party.member.level must be at least 1'
      );
    });

    it('should reject level > 99', () => {
      const input = { classId: 1, level: 100 };
      expect(() => PartyMemberSchema.parse(input)).toThrow(ZodError);
      expect(() => PartyMemberSchema.parse(input)).toThrow(
        'party.member.level cannot exceed 99'
      );
    });

    it('should reject non-integer values', () => {
      const input = { classId: 1.5, level: 10.5 };
      expect(() => PartyMemberSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject missing fields', () => {
      const input1 = { level: 10 };
      expect(() => PartyMemberSchema.parse(input1)).toThrow(ZodError);

      const input2 = { classId: 1 };
      expect(() => PartyMemberSchema.parse(input2)).toThrow(ZodError);
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript type', () => {
      const validMember: PartyMember = { classId: 1, level: 10 };
      expect(validMember.classId).toBe(1);
      expect(validMember.level).toBe(10);
    });
  });
});

describe('PartyConfigSchema', () => {
  describe('valid inputs', () => {
    it('should accept 1 party member', () => {
      const input = { members: [{ classId: 1, level: 10 }] };
      const result = PartyConfigSchema.parse(input);
      expect(result.members).toHaveLength(1);
    });

    it('should accept 4 party members (max)', () => {
      const input = {
        members: [
          { classId: 1, level: 10 },
          { classId: 2, level: 15 },
          { classId: 3, level: 20 },
          { classId: 4, level: 25 },
        ],
      };
      const result = PartyConfigSchema.parse(input);
      expect(result.members).toHaveLength(4);
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty members array', () => {
      const input = { members: [] };
      expect(() => PartyConfigSchema.parse(input)).toThrow(ZodError);
      expect(() => PartyConfigSchema.parse(input)).toThrow(
        'party.members must contain at least 1 member'
      );
    });

    it('should reject more than 4 members', () => {
      const input = {
        members: [
          { classId: 1, level: 10 },
          { classId: 2, level: 10 },
          { classId: 3, level: 10 },
          { classId: 4, level: 10 },
          { classId: 5, level: 10 },
        ],
      };
      expect(() => PartyConfigSchema.parse(input)).toThrow(ZodError);
      expect(() => PartyConfigSchema.parse(input)).toThrow(
        'party.members cannot contain more than 4 members'
      );
    });

    it('should reject invalid member objects', () => {
      const input = { members: [{ classId: 0, level: 10 }] };
      expect(() => PartyConfigSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject missing members field', () => {
      const input = {};
      expect(() => PartyConfigSchema.parse(input)).toThrow(ZodError);
      expect(() => PartyConfigSchema.parse(input)).toThrow(
        'party.members is required'
      );
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript type', () => {
      const validParty: PartyConfig = {
        members: [{ classId: 1, level: 10 }],
      };
      expect(validParty.members[0]?.classId).toBe(1);
    });
  });
});

describe('TrechoSchema', () => {
  const validTrechoBase = {
    id: 'ato1-nivel1-10',
    anchorLevelRange: { min: 1, max: 10 },
    ttkTarget: { turns: 10, actions: 40 },
    troopIds: [1, 2, 3],
    party: { members: [{ classId: 1, level: 5 }] },
  };

  describe('valid inputs', () => {
    it('should accept valid trecho without optional name', () => {
      const result = TrechoSchema.parse(validTrechoBase);
      expect(result.id).toBe('ato1-nivel1-10');
      expect(result.name).toBeUndefined();
    });

    it('should accept valid trecho with optional name', () => {
      const input = { ...validTrechoBase, name: 'Ato 1: Níveis 1-10' };
      const result = TrechoSchema.parse(input);
      expect(result.name).toBe('Ato 1: Níveis 1-10');
    });

    it('should apply default tolerance in nested ttkTarget', () => {
      const result = TrechoSchema.parse(validTrechoBase);
      expect(result.ttkTarget.tolerance).toBe(0.15);
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty id', () => {
      const input = { ...validTrechoBase, id: '' };
      expect(() => TrechoSchema.parse(input)).toThrow(ZodError);
      expect(() => TrechoSchema.parse(input)).toThrow(
        'trecho.id cannot be empty'
      );
    });

    it('should reject missing id', () => {
      const input = { ...validTrechoBase };
      delete (input as any).id;
      expect(() => TrechoSchema.parse(input)).toThrow(ZodError);
      expect(() => TrechoSchema.parse(input)).toThrow('trecho.id is required');
    });

    it('should reject invalid anchorLevelRange', () => {
      const input = {
        ...validTrechoBase,
        anchorLevelRange: { min: 20, max: 10 },
      };
      expect(() => TrechoSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject invalid ttkTarget', () => {
      const input = { ...validTrechoBase, ttkTarget: { turns: -5, actions: 40 } };
      expect(() => TrechoSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject empty troopIds array', () => {
      const input = { ...validTrechoBase, troopIds: [] };
      expect(() => TrechoSchema.parse(input)).toThrow(ZodError);
      expect(() => TrechoSchema.parse(input)).toThrow(
        'trecho.troopIds must contain at least 1 troop ID'
      );
    });

    it('should reject invalid troopId values', () => {
      const input = { ...validTrechoBase, troopIds: [1, -2, 3] };
      expect(() => TrechoSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject invalid party', () => {
      const input = { ...validTrechoBase, party: { members: [] } };
      expect(() => TrechoSchema.parse(input)).toThrow(ZodError);
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript type', () => {
      // Parse to get inferred type with defaults applied
      const validTrecho: TrechoConfig = TrechoSchema.parse(validTrechoBase);
      expect(validTrecho.id).toBe('ato1-nivel1-10');
      expect(validTrecho.troopIds).toHaveLength(3);
      expect(validTrecho.ttkTarget.tolerance).toBe(0.15);
    });
  });
});

describe('ProjectConfigSchema', () => {
  const validProjectBase = {
    projectPath: '/Users/edney/projects/mz-game',
    reportOutputPath: '/Users/edney/projects/mz-game/reports',
    trechos: [
      {
        id: 'ato1-nivel1-10',
        anchorLevelRange: { min: 1, max: 10 },
        ttkTarget: { turns: 10, actions: 40 },
        troopIds: [1, 2, 3],
        party: { members: [{ classId: 1, level: 5 }] },
      },
    ],
  };

  describe('valid inputs', () => {
    it('should accept valid project config without seed (default 12345)', () => {
      const result = ProjectConfigSchema.parse(validProjectBase);
      expect(result.seed).toBe(12345);
    });

    it('should accept valid project config with custom seed', () => {
      const input = { ...validProjectBase, seed: 99999 };
      const result = ProjectConfigSchema.parse(input);
      expect(result.seed).toBe(99999);
    });

    it('should accept multiple trechos', () => {
      const input = {
        ...validProjectBase,
        trechos: [
          ...validProjectBase.trechos,
          {
            id: 'ato2-nivel11-20',
            anchorLevelRange: { min: 11, max: 20 },
            ttkTarget: { turns: 15, actions: 60 },
            troopIds: [4, 5],
            party: { members: [{ classId: 2, level: 15 }] },
          },
        ],
      };
      const result = ProjectConfigSchema.parse(input);
      expect(result.trechos).toHaveLength(2);
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty projectPath', () => {
      const input = { ...validProjectBase, projectPath: '' };
      expect(() => ProjectConfigSchema.parse(input)).toThrow(ZodError);
      expect(() => ProjectConfigSchema.parse(input)).toThrow(
        'projectPath cannot be empty'
      );
    });

    it('should reject projectPath with path traversal (..)', () => {
      const input = { ...validProjectBase, projectPath: '/path/../malicious' };
      expect(() => ProjectConfigSchema.parse(input)).toThrow(ZodError);
      expect(() => ProjectConfigSchema.parse(input)).toThrow(
        'projectPath must not contain path traversal sequences (..)'
      );
    });

    it('should reject non-integer seed', () => {
      const input = { ...validProjectBase, seed: 12345.67 };
      expect(() => ProjectConfigSchema.parse(input)).toThrow(ZodError);
      expect(() => ProjectConfigSchema.parse(input)).toThrow(
        'seed must be an integer'
      );
    });

    it('should reject empty trechos array', () => {
      const input = { ...validProjectBase, trechos: [] };
      expect(() => ProjectConfigSchema.parse(input)).toThrow(ZodError);
      expect(() => ProjectConfigSchema.parse(input)).toThrow(
        'trechos must contain at least 1 trecho configuration'
      );
    });

    it('should reject missing projectPath', () => {
      const input = { ...validProjectBase };
      delete (input as any).projectPath;
      expect(() => ProjectConfigSchema.parse(input)).toThrow(ZodError);
      expect(() => ProjectConfigSchema.parse(input)).toThrow(
        'projectPath is required'
      );
    });

    it('should reject missing trechos', () => {
      const input = { ...validProjectBase };
      delete (input as any).trechos;
      expect(() => ProjectConfigSchema.parse(input)).toThrow(ZodError);
      expect(() => ProjectConfigSchema.parse(input)).toThrow(
        'trechos is required'
      );
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript type', () => {
      // Parse to get inferred type with defaults applied
      const validProject: ProjectConfig = ProjectConfigSchema.parse(validProjectBase);
      expect(validProject.projectPath).toBe('/Users/edney/projects/mz-game');
      expect(validProject.trechos).toHaveLength(1);
      expect(validProject.seed).toBe(12345);
    });
  });
});

describe('Integration: Full Configuration Validation', () => {
  it('should validate complete realistic configuration', () => {
    const fullConfig = {
      projectPath: '/Users/edney/projects/rpg-maker-mz-project',
      reportOutputPath: '/Users/edney/projects/rpg-maker-mz-project/reports',
      seed: 42,
      trechos: [
        {
          id: 'ato1-nivel1-10',
          name: 'Ato 1: Tutorial e Primeiros Combates',
          anchorLevelRange: { min: 1, max: 10 },
          ttkTarget: { turns: 8, actions: 32, tolerance: 0.2 },
          troopIds: [1, 2, 3, 4],
          party: {
            members: [
              { classId: 1, level: 5 },
              { classId: 2, level: 5 },
            ],
          },
        },
        {
          id: 'ato2-nivel11-20',
          name: 'Ato 2: Dungeon Principal',
          anchorLevelRange: { min: 11, max: 20 },
          ttkTarget: { turns: 12, actions: 48 }, // Uses default tolerance
          troopIds: [5, 6, 7, 8, 9],
          party: {
            members: [
              { classId: 1, level: 15 },
              { classId: 2, level: 15 },
              { classId: 3, level: 15 },
            ],
          },
        },
        {
          id: 'ato3-boss-final',
          name: 'Ato 3: Boss Final',
          anchorLevelRange: { min: 30, max: 30 },
          ttkTarget: { turns: 25, actions: 100, tolerance: 0.1 },
          troopIds: [10],
          party: {
            members: [
              { classId: 1, level: 30 },
              { classId: 2, level: 30 },
              { classId: 3, level: 30 },
              { classId: 4, level: 30 },
            ],
          },
        },
      ],
    };

    const result = ProjectConfigSchema.parse(fullConfig);

    expect(result.projectPath).toBe('/Users/edney/projects/rpg-maker-mz-project');
    expect(result.seed).toBe(42);
    expect(result.trechos).toHaveLength(3);
    expect(result.trechos[0]?.ttkTarget.tolerance).toBe(0.2);
    expect(result.trechos[1]?.ttkTarget.tolerance).toBe(0.15); // Default
    expect(result.trechos[2]?.party.members).toHaveLength(4);
  });
});
