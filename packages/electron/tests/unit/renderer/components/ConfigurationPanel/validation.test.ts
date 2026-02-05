/**
 * Validation Utilities Unit Tests
 *
 * Tests for ConfigurationPanel form validation utilities.
 *
 * @see packages/electron/src/renderer/src/components/ConfigurationPanel/validation.ts
 */


import {
  validateTrechoForm,
  validatePartyMemberForm,
  validateGlobalSettingsForm,
  validateTrechoField,
  getDefaultTrechoFormData,
  getDefaultGlobalSettingsFormData,
} from '@/components/ConfigurationPanel/validation';
import type { TrechoFormData, PartyMemberFormData, GlobalSettingsFormData } from '@/components/ConfigurationPanel/types';

// ============================================================================
// validateTrechoForm Tests
// ============================================================================

describe('validateTrechoForm', () => {
  const validTrecho: TrechoFormData = {
    id: 'ato1-florest',
    name: 'Ato 1 - Forest',
    anchorLevelMin: 1,
    anchorLevelMax: 10,
    targetTtkTurns: 3,
    targetTtkActions: 8,
    tolerancePercent: 15,
    troopIds: [1, 2, 3],
    party: {
      members: [
        { classId: 1, level: 5 },
        { classId: 2, level: 5 },
      ],
    },
  };

  it('should validate a correct trecho form', () => {
    const result = validateTrechoForm(validTrecho);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  describe('invalid input rejection', () => {
    test.each([
      [
        'empty ID',
        { ...validTrecho, id: '' },
        'id',
        undefined,
      ],
      [
        'ID with invalid characters',
        { ...validTrecho, id: 'Invalid ID!' },
        'id',
        'lowercase letters',
      ],
      [
        'level range with min > max',
        { ...validTrecho, anchorLevelMin: 10, anchorLevelMax: 5 },
        'anchorLevelMax',
        'greater than or equal',
      ],
      [
        'level range with min < 1',
        { ...validTrecho, anchorLevelMin: 0 },
        'anchorLevelMin',
        'at least 1',
      ],
      [
        'level range with max > 99',
        { ...validTrecho, anchorLevelMax: 100 },
        'anchorLevelMax',
        'cannot exceed 99',
      ],
      [
        'non-positive TTK turns',
        { ...validTrecho, targetTtkTurns: 0 },
        'targetTtkTurns',
        'positive',
      ],
      [
        'non-positive TTK actions',
        { ...validTrecho, targetTtkActions: -1 },
        'targetTtkActions',
        'positive',
      ],
      [
        'tolerance < 0',
        { ...validTrecho, tolerancePercent: -1 },
        'tolerancePercent',
        'at least 0',
      ],
      [
        'tolerance > 100',
        { ...validTrecho, tolerancePercent: 101 },
        'tolerancePercent',
        'cannot exceed 100',
      ],
      [
        'empty troop IDs',
        { ...validTrecho, troopIds: [] },
        'troopIds',
        undefined,
      ],
      [
        'empty party members',
        { ...validTrecho, party: { members: [] } },
        'party.members',
        undefined,
      ],
      [
        'party with more than 4 members',
        {
          ...validTrecho,
          party: {
            members: [
              { classId: 1, level: 1 },
              { classId: 1, level: 1 },
              { classId: 1, level: 1 },
              { classId: 1, level: 1 },
              { classId: 1, level: 1 },
            ],
          },
        },
        'party.members',
        'more than 4',
      ],
    ] as const)('should reject %s', (_name, invalidData, errorField, expectedMessage) => {
      const result = validateTrechoForm(invalidData);
      expect(result.isValid).toBe(false);
      if (expectedMessage === undefined) {
        expect(result.errors[errorField]?.message).toBeTruthy();
      } else {
        expect(result.errors[errorField]?.message).toContain(expectedMessage);
      }
    });
  });
});

// ============================================================================
// validatePartyMemberForm Tests
// ============================================================================

describe('validatePartyMemberForm', () => {
  const validMember: PartyMemberFormData = {
    classId: 1,
    level: 5,
  };

  it('should validate a correct party member', () => {
    const result = validatePartyMemberForm(validMember);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  describe('invalid input rejection', () => {
    test.each([
      [
        'non-positive classId',
        { ...validMember, classId: 0 },
        'classId',
        'positive',
      ],
      [
        'level < 1',
        { ...validMember, level: 0 },
        'level',
        'at least 1',
      ],
      [
        'level > 99',
        { ...validMember, level: 100 },
        'level',
        'cannot exceed 99',
      ],
    ] as const)('should reject %s', (_name, invalidMember, errorField, expectedMessage) => {
      const result = validatePartyMemberForm(invalidMember);
      expect(result.isValid).toBe(false);
      expect(result.errors[errorField]?.message).toContain(expectedMessage);
    });
  });
});

// ============================================================================
// validateGlobalSettingsForm Tests
// ============================================================================

describe('validateGlobalSettingsForm', () => {
  const validSettings: GlobalSettingsFormData = {
    seed: 12345,
    maxBattleTurns: 100,
  };

  it('should validate correct global settings', () => {
    const result = validateGlobalSettingsForm(validSettings);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should validate settings without maxBattleTurns', () => {
    const settingsWithoutMax = { seed: 12345 };
    const result = validateGlobalSettingsForm(settingsWithoutMax);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  describe('invalid input rejection', () => {
    test.each([
      [
        'non-positive seed',
        { ...validSettings, seed: 0 },
        'seed',
        'positive',
      ],
      [
        'non-positive maxBattleTurns',
        { ...validSettings, maxBattleTurns: -1 },
        'maxBattleTurns',
        'positive',
      ],
    ] as const)('should reject %s', (_name, invalidSettings, errorField, expectedMessage) => {
      const result = validateGlobalSettingsForm(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors[errorField]?.message).toContain(expectedMessage);
    });
  });
});

// ============================================================================
// validateTrechoField Tests
// ============================================================================

describe('validateTrechoField', () => {
  it('should validate ID field', () => {
    expect(validateTrechoField('id', '')).toBe('ID cannot be empty');
    expect(validateTrechoField('id', 'valid-id')).toBeUndefined();
  });

  it('should validate anchorLevelMin field', () => {
    expect(validateTrechoField('anchorLevelMin', 0)).toBeDefined();
    expect(validateTrechoField('anchorLevelMin', 100)).toBeDefined();
    expect(validateTrechoField('anchorLevelMin', 5)).toBeUndefined();
  });

  it('should validate targetTtkTurns field', () => {
    expect(validateTrechoField('targetTtkTurns', 0)).toBeDefined();
    expect(validateTrechoField('targetTtkTurns', -1)).toBeDefined();
    expect(validateTrechoField('targetTtkTurns', 3)).toBeUndefined();
  });

  it('should validate tolerancePercent field', () => {
    expect(validateTrechoField('tolerancePercent', -1)).toBeDefined();
    expect(validateTrechoField('tolerancePercent', 101)).toBeDefined();
    expect(validateTrechoField('tolerancePercent', 15)).toBeUndefined();
  });

  it('should return undefined for unhandled fields', () => {
    expect(validateTrechoField('unknownField', 'value')).toBeUndefined();
  });
});

// ============================================================================
// getDefaultTrechoFormData Tests
// ============================================================================

describe('getDefaultTrechoFormData', () => {
  it('should return default trecho form data', () => {
    const data = getDefaultTrechoFormData();
    expect(data.id).toBe('');
    expect(data.name).toBe('');
    expect(data.anchorLevelMin).toBe(1);
    expect(data.anchorLevelMax).toBe(10);
    expect(data.targetTtkTurns).toBe(3);
    expect(data.targetTtkActions).toBe(8);
    expect(data.tolerancePercent).toBe(15);
    expect(data.troopIds).toEqual([]);
    expect(data.party.members).toHaveLength(4);
  });
});

// ============================================================================
// getDefaultGlobalSettingsFormData Tests
// ============================================================================

describe('getDefaultGlobalSettingsFormData', () => {
  it('should return default global settings', () => {
    const data = getDefaultGlobalSettingsFormData();
    expect(data.seed).toBe(12345);
    expect(data.maxBattleTurns).toBe(100);
  });
});
