/**
 * Party Validation Tests
 *
 * Tests for party form validation using Zod schemas.
 *
 * @see packages/electron/src/domain/validation/party-validation.ts
 */

import { describe, it, expect } from 'vitest';
import {
  validatePartyMemberForm,
  PartyMemberFormSchema,
  PartyConfigFormSchema,
} from '@/domain/validation/party-validation';

describe('PartyMemberFormSchema', () => {
  describe('parse()', () => {
    it('should accept valid party member data', () => {
      const member = {
        classId: 1,
        level: 10,
      };
      const result = PartyMemberFormSchema.safeParse(member);
      expect(result.success).toBe(true);
    });

    it('should accept level 1', () => {
      const member = { classId: 1, level: 1 };
      const result = PartyMemberFormSchema.safeParse(member);
      expect(result.success).toBe(true);
    });

    it('should accept level 99', () => {
      const member = { classId: 1, level: 99 };
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

    it('should reject level below 1', () => {
      const member = { classId: 1, level: 0 };
      const result = PartyMemberFormSchema.safeParse(member);
      expect(result.success).toBe(false);
    });

    it('should reject level above 99', () => {
      const member = { classId: 1, level: 100 };
      const result = PartyMemberFormSchema.safeParse(member);
      expect(result.success).toBe(false);
    });

    it('should reject non-positive classId', () => {
      const member = { classId: 0, level: 10 };
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
      const config = {
        members: [{ classId: 1, level: 10 }],
      };
      const result = PartyConfigFormSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept valid party config with 4 members', () => {
      const config = {
        members: [
          { classId: 1, level: 10 },
          { classId: 2, level: 15 },
          { classId: 3, level: 20 },
          { classId: 4, level: 25 },
        ],
      };
      const result = PartyConfigFormSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject empty members array', () => {
      const config = { members: [] };
      const result = PartyConfigFormSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject more than 4 members', () => {
      const config = {
        members: [
          { classId: 1, level: 10 },
          { classId: 2, level: 15 },
          { classId: 3, level: 20 },
          { classId: 4, level: 25 },
          { classId: 5, level: 30 },
        ],
      };
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
    const member = { classId: 1, level: 10 };
    const result = validatePartyMemberForm(member);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should return isValid: false with errors for invalid member', () => {
    const member = { classId: 0, level: 0 };
    const result = validatePartyMemberForm(member);
    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors)).toHaveLength(2);
  });

  it('should include error messages for invalid fields', () => {
    const member = { classId: -1, level: 100 };
    const result = validatePartyMemberForm(member);
    expect(result.isValid).toBe(false);
    expect(result.errors['classId']).toBeDefined();
    expect(result.errors['level']).toBeDefined();
  });
});
