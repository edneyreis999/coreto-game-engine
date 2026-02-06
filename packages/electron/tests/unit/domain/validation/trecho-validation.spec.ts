/**
 * Trecho Validation Tests
 *
 * Tests for trecho form validation using Zod schemas.
 *
 * @see packages/electron/src/domain/validation/trecho-validation.ts
 */

import { describe, it, expect } from 'vitest';
import {
  validateTrechoForm,
  validateTrechoField,
  TrechoFormSchema,
  TroopIdsFormSchema,
  getDefaultTrechoFormData,
  getFieldError,
} from '@/domain/validation/trecho-validation';
import type { FormErrors } from '@/domain/validation/types';

describe('TroopIdsFormSchema', () => {
  describe('parse()', () => {
    it('should accept valid troop IDs', () => {
      const troopIds = [1, 2, 3];
      const result = TroopIdsFormSchema.safeParse(troopIds);
      expect(result.success).toBe(true);
    });

    it('should accept single troop ID', () => {
      const troopIds = [1];
      const result = TroopIdsFormSchema.safeParse(troopIds);
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const troopIds = [];
      const result = TroopIdsFormSchema.safeParse(troopIds);
      expect(result.success).toBe(false);
    });

    it('should reject non-positive troop IDs', () => {
      const troopIds = [0, -1, 1];
      const result = TroopIdsFormSchema.safeParse(troopIds);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer troop IDs', () => {
      const troopIds = [1.5, 2];
      const result = TroopIdsFormSchema.safeParse(troopIds);
      expect(result.success).toBe(false);
    });
  });
});

describe('TrechoFormSchema', () => {
  describe('parse()', () => {
    const validTrecho = {
      id: 'ato1-nivel1-10',
      name: 'Test Trecho',
      anchorLevelMin: 1,
      anchorLevelMax: 10,
      targetTtkTurns: 3,
      targetTtkActions: 8,
      tolerancePercent: 15,
      troopIds: [1, 2],
      party: {
        members: [
          { classId: 1, level: 5 },
          { classId: 2, level: 6 },
        ],
      },
    };

    it('should accept valid trecho data', () => {
      const result = TrechoFormSchema.safeParse(validTrecho);
      expect(result.success).toBe(true);
    });

    it('should accept optional name field', () => {
      const trechoWithoutName = { ...validTrecho, name: undefined };
      const result = TrechoFormSchema.safeParse(trechoWithoutName);
      expect(result.success).toBe(true);
    });

    it('should reject empty id', () => {
      const trecho = { ...validTrecho, id: '' };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject id with invalid characters (uppercase)', () => {
      const trecho = { ...validTrecho, id: 'Ato1-Nivel1-10' };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject id with spaces', () => {
      const trecho = { ...validTrecho, id: 'ato 1 nivel 1' };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject inverted anchor levels (max < min)', () => {
      const trecho = { ...validTrecho, anchorLevelMin: 50, anchorLevelMax: 10 };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should accept equal anchor levels', () => {
      const trecho = { ...validTrecho, anchorLevelMin: 10, anchorLevelMax: 10 };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(true);
    });

    it('should reject anchor level below 1', () => {
      const trecho = { ...validTrecho, anchorLevelMin: 0 };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject anchor level above 99', () => {
      const trecho = { ...validTrecho, anchorLevelMax: 100 };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject negative target TTK turns', () => {
      const trecho = { ...validTrecho, targetTtkTurns: -1 };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject zero target TTK turns', () => {
      const trecho = { ...validTrecho, targetTtkTurns: 0 };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject tolerance below 0', () => {
      const trecho = { ...validTrecho, tolerancePercent: -1 };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject tolerance above 100', () => {
      const trecho = { ...validTrecho, tolerancePercent: 101 };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject empty troopIds array', () => {
      const trecho = { ...validTrecho, troopIds: [] };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject party with no members', () => {
      const trecho = { ...validTrecho, party: { members: [] } };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject party with more than 4 members', () => {
      const trecho = {
        ...validTrecho,
        party: {
          members: [
            { classId: 1, level: 5 },
            { classId: 2, level: 6 },
            { classId: 3, level: 7 },
            { classId: 4, level: 8 },
            { classId: 5, level: 9 },
          ],
        },
      };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });

    it('should reject party member with invalid level', () => {
      const trecho = {
        ...validTrecho,
        party: { members: [{ classId: 1, level: 0 }] },
      };
      const result = TrechoFormSchema.safeParse(trecho);
      expect(result.success).toBe(false);
    });
  });
});

describe('validateTrechoForm()', () => {
  const validTrecho = {
    id: 'ato1-nivel1-10',
    name: 'Test Trecho',
    anchorLevelMin: 1,
    anchorLevelMax: 10,
    targetTtkTurns: 3,
    targetTtkActions: 8,
    tolerancePercent: 15,
    troopIds: [1, 2],
    party: {
      members: [
        { classId: 1, level: 5 },
        { classId: 2, level: 6 },
      ],
    },
  };

  it('should return isValid: true for valid trecho', () => {
    const result = validateTrechoForm(validTrecho);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should return isValid: false with errors for invalid trecho', () => {
    const invalidTrecho = { id: '', name: '', anchorLevelMin: 0, anchorLevelMax: 100, targetTtkTurns: -1, targetTtkActions: 0, tolerancePercent: 101, troopIds: [], party: { members: [] } };
    const result = validateTrechoForm(invalidTrecho);
    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });

  it('should include error messages for each invalid field', () => {
    const invalidTrecho = { ...validTrecho, id: '', anchorLevelMin: 0 };
    const result = validateTrechoForm(invalidTrecho);
    expect(result.isValid).toBe(false);
    expect(result.errors['id']).toBeDefined();
    expect(result.errors['anchorLevelMin']).toBeDefined();
  });
});

describe('validateTrechoField()', () => {
  it('should return undefined for valid field', () => {
    const error = validateTrechoField('id', 'ato1-nivel1-10');
    expect(error).toBeUndefined();
  });

  it('should return error message for invalid id', () => {
    const error = validateTrechoField('id', '');
    expect(error).toBeDefined();
    expect(error).toContain('cannot be empty');
  });

  it('should return error message for invalid level', () => {
    const error = validateTrechoField('anchorLevelMin', 0);
    expect(error).toBeDefined();
  });

  it('should return undefined for unsupported field', () => {
    const error = validateTrechoField('unsupportedField', 'value');
    expect(error).toBeUndefined();
  });

  it('should validate nested party member fields', () => {
    const error = validateTrechoField('party.members.0.classId', 0);
    expect(error).toBeDefined();
  });
});

describe('getFieldError()', () => {
  it('should return error message for field with error', () => {
    const errors: FormErrors = {
      'id': { message: 'ID is required' },
      'anchorLevelMin': { message: 'Level too low' },
    };
    const error = getFieldError(errors, 'id');
    expect(error).toBe('ID is required');
  });

  it('should return undefined for field without error', () => {
    const errors: FormErrors = {
      'id': { message: 'ID is required' },
    };
    const error = getFieldError(errors, 'name');
    expect(error).toBeUndefined();
  });

  it('should return undefined for empty errors object', () => {
    const error = getFieldError({}, 'id');
    expect(error).toBeUndefined();
  });
});

describe('getDefaultTrechoFormData()', () => {
  it('should return default trecho form data', () => {
    const defaults = getDefaultTrechoFormData();
    expect(defaults).toEqual({
      id: '',
      name: '',
      anchorLevelMin: 1,
      anchorLevelMax: 10,
      targetTtkTurns: 3,
      targetTtkActions: 8,
      tolerancePercent: 15,
      troopIds: [],
      party: {
        members: [
          { classId: 1, level: 1 },
          { classId: 1, level: 1 },
          { classId: 1, level: 1 },
          { classId: 1, level: 1 },
        ],
      },
    });
  });

  it('should have 4 default party members', () => {
    const defaults = getDefaultTrechoFormData();
    expect(defaults.party.members).toHaveLength(4);
  });
});
