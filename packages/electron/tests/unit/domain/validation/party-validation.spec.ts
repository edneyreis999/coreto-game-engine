/**
 * Party Validation Tests
 *
 * Tests for party form validation using Zod schemas.
 *
 * @see packages/electron/src/domain/validation/party-validation.ts
 */

import {
  validatePartyMemberForm,
  PartyMemberFormSchema,
  PartyConfigFormSchema,
} from '@/domain/validation/party-validation';
import { PartyMemberFormBuilder, PartyConfigFormBuilder } from '@tests/helpers/builders/domain';

describe('PartyMemberFormSchema', () => {
  describe('parse()', () => {
    it('should accept valid party member data', () => {
      const member = PartyMemberFormBuilder.create().withClassId(1).withLevel(10).build();
      const result = PartyMemberFormSchema.safeParse(member);
      expect(result.success).toBe(true);
    });

    it.each([
      [1, 'level 1 (minimum boundary)'],
      [99, 'level 99 (maximum boundary)'],
    ])('should accept level %i (%s)', (level, description) => {
      const member = PartyMemberFormBuilder.create().withClassId(1).withLevel(level).build();
      const result = PartyMemberFormSchema.safeParse(member);
      expect(result.success).toBe(true);
    });

    it('should reject missing classId', () => {
      const member = { level: 10 };
      const result = PartyMemberFormSchema.safeParse(member);
      expect(result.success).toBe(false);
    });

    it('should reject missing level', () => {
      const member = { classId: 1 };
      const result = PartyMemberFormSchema.safeParse(member);
      expect(result.success).toBe(false);
    });

    it.each([
      [0, 'level 0 (below minimum)'],
      [100, 'level 100 (above maximum)'],
    ])('should reject level %i (%s)', (level, description) => {
      const member = PartyMemberFormBuilder.create().withClassId(1).withLevel(level).build();
      const result = PartyMemberFormSchema.safeParse(member);
      expect(result.success).toBe(false);
    });

    it('should reject non-positive classId', () => {
      const member = PartyMemberFormBuilder.create().withClassId(0).withLevel(10).build();
      const result = PartyMemberFormSchema.safeParse(member);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer classId', () => {
      const member = { classId: 1.5, level: 10 };
      const result = PartyMemberFormSchema.safeParse(member);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer level', () => {
      const member = { classId: 1, level: 10.5 };
      const result = PartyMemberFormSchema.safeParse(member);
      expect(result.success).toBe(false);
    });
  });
});

describe('PartyConfigFormSchema', () => {
  describe('parse()', () => {
    it('should accept valid party config with 1 member', () => {
      const config = PartyConfigFormBuilder.create().withMinimalParty().build();
      const result = PartyConfigFormSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept valid party config with 4 members', () => {
      const config = PartyConfigFormBuilder.create().withBalancedParty().build();
      const result = PartyConfigFormSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject empty members array', () => {
      const config = PartyConfigFormBuilder.create().withMembers([]).build();
      const result = PartyConfigFormSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject more than 4 members', () => {
      const config = PartyConfigFormBuilder.create().withCustomParty([
        { classId: 1, level: 10 },
        { classId: 2, level: 15 },
        { classId: 3, level: 20 },
        { classId: 4, level: 25 },
        { classId: 5, level: 30 },
      ]).build();
      const result = PartyConfigFormSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject missing members array', () => {
      const config = {};
      const result = PartyConfigFormSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });
});

describe('validatePartyMemberForm()', () => {
  it('should return isValid: true for valid member', () => {
    const member = PartyMemberFormBuilder.create().withClassId(1).withLevel(10).build();
    const result = validatePartyMemberForm(member);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should return isValid: false with errors for invalid member', () => {
    const member = PartyMemberFormBuilder.create().withClassId(0).withLevel(0).build();
    const result = validatePartyMemberForm(member);
    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors)).toHaveLength(2);
  });

  it('should include error messages for invalid fields', () => {
    const member = PartyMemberFormBuilder.create().withClassId(-1).withLevel(100).build();
    const result = validatePartyMemberForm(member);
    expect(result.isValid).toBe(false);
    expect(result.errors['classId']).toBeDefined();
    expect(result.errors['level']).toBeDefined();
  });
});
