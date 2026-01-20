/**
 * Validation Utilities Unit Tests
 *
 * Tests for ConfigurationPanel form validation utilities.
 *
 * @see packages/electron/src/renderer/src/components/ConfigurationPanel/validation.ts
 */

import { describe, it, expect } from '@jest/globals';

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

  it('should reject empty ID', () => {
    const invalidData = { ...validTrecho, id: '' };
    const result = validateTrechoForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.id?.message).toBeTruthy();
  });

  it('should reject ID with invalid characters', () => {
    const invalidData = { ...validTrecho, id: 'Invalid ID!' };
    const result = validateTrechoForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.id?.message).toContain('lowercase letters');
  });

  it('should reject level range with min > max', () => {
    const invalidData = { ...validTrecho, anchorLevelMin: 10, anchorLevelMax: 5 };
    const result = validateTrechoForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.anchorLevelMax?.message).toContain('greater than or equal');
  });

  it('should reject level range with min < 1', () => {
    const invalidData = { ...validTrecho, anchorLevelMin: 0 };
    const result = validateTrechoForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.anchorLevelMin?.message).toContain('at least 1');
  });

  it('should reject level range with max > 99', () => {
    const invalidData = { ...validTrecho, anchorLevelMax: 100 };
    const result = validateTrechoForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.anchorLevelMax?.message).toContain('cannot exceed 99');
  });

  it('should reject non-positive TTK turns', () => {
    const invalidData = { ...validTrecho, targetTtkTurns: 0 };
    const result = validateTrechoForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.targetTtkTurns?.message).toContain('positive');
  });

  it('should reject non-positive TTK actions', () => {
    const invalidData = { ...validTrecho, targetTtkActions: -1 };
    const result = validateTrechoForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.targetTtkActions?.message).toContain('positive');
  });

  it('should reject tolerance < 0', () => {
    const invalidData = { ...validTrecho, tolerancePercent: -1 };
    const result = validateTrechoForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.tolerancePercent?.message).toContain('at least 0');
  });

  it('should reject tolerance > 100', () => {
    const invalidData = { ...validTrecho, tolerancePercent: 101 };
    const result = validateTrechoForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.tolerancePercent?.message).toContain('cannot exceed 100');
  });

  it('should reject empty troop IDs', () => {
    const invalidData = { ...validTrecho, troopIds: [] };
    const result = validateTrechoForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.troopIds?.message).toBeTruthy();
  });

  it('should reject empty party members', () => {
    const invalidData = { ...validTrecho, party: { members: [] } };
    const result = validateTrechoForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors['party.members']?.message).toBeTruthy();
  });

  it('should reject party with more than 4 members', () => {
    const invalidData = {
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
    };
    const result = validateTrechoForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors['party.members']?.message).toContain('more than 4');
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

  it('should reject non-positive classId', () => {
    const invalidMember = { ...validMember, classId: 0 };
    const result = validatePartyMemberForm(invalidMember);
    expect(result.isValid).toBe(false);
    expect(result.errors.classId?.message).toContain('positive');
  });

  it('should reject level < 1', () => {
    const invalidMember = { ...validMember, level: 0 };
    const result = validatePartyMemberForm(invalidMember);
    expect(result.isValid).toBe(false);
    expect(result.errors.level?.message).toContain('at least 1');
  });

  it('should reject level > 99', () => {
    const invalidMember = { ...validMember, level: 100 };
    const result = validatePartyMemberForm(invalidMember);
    expect(result.isValid).toBe(false);
    expect(result.errors.level?.message).toContain('cannot exceed 99');
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

  it('should reject non-positive seed', () => {
    const invalidSettings = { ...validSettings, seed: 0 };
    const result = validateGlobalSettingsForm(invalidSettings);
    expect(result.isValid).toBe(false);
    expect(result.errors.seed?.message).toContain('positive');
  });

  it('should reject non-positive maxBattleTurns', () => {
    const invalidSettings = { ...validSettings, maxBattleTurns: -1 };
    const result = validateGlobalSettingsForm(invalidSettings);
    expect(result.isValid).toBe(false);
    expect(result.errors.maxBattleTurns?.message).toContain('positive');
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
