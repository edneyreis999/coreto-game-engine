/**
 * Global Settings Validation Tests
 *
 * Tests for global settings form validation using Zod schemas.
 *
 * @see packages/electron/src/domain/validation/global-settings-validation.ts
 */

import { describe, it, expect } from 'vitest';
import {
  validateGlobalSettingsForm,
  GlobalSettingsFormSchema,
  getDefaultGlobalSettingsFormData,
} from '@/domain/validation/global-settings-validation';

describe('GlobalSettingsFormSchema', () => {
  describe('parse()', () => {
    const validSettings = {
      seed: 12345,
      maxBattleTurns: 100,
    };

    it('should accept valid global settings', () => {
      const result = GlobalSettingsFormSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it('should accept settings without maxBattleTurns', () => {
      const settings = { seed: 12345 };
      const result = GlobalSettingsFormSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it('should reject missing seed', () => {
      const settings = { maxBattleTurns: 100 };
      const result = GlobalSettingsFormSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject zero seed', () => {
      const settings = { seed: 0 };
      const result = GlobalSettingsFormSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject negative seed', () => {
      const settings = { seed: -1 };
      const result = GlobalSettingsFormSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer seed', () => {
      const settings = { seed: 1.5 };
      const result = GlobalSettingsFormSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject zero maxBattleTurns', () => {
      const settings = { seed: 12345, maxBattleTurns: 0 };
      const result = GlobalSettingsFormSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject negative maxBattleTurns', () => {
      const settings = { seed: 12345, maxBattleTurns: -1 };
      const result = GlobalSettingsFormSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer maxBattleTurns', () => {
      const settings = { seed: 12345, maxBattleTurns: 100.5 };
      const result = GlobalSettingsFormSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });
  });
});

describe('validateGlobalSettingsForm()', () => {
  const validSettings = {
    seed: 12345,
    maxBattleTurns: 100,
  };

  it('should return isValid: true for valid settings', () => {
    const result = validateGlobalSettingsForm(validSettings);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should return isValid: true for settings without optional fields', () => {
    const settings = { seed: 12345 };
    const result = validateGlobalSettingsForm(settings);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should return isValid: false with errors for invalid settings', () => {
    const invalidSettings = { seed: -1 };
    const result = validateGlobalSettingsForm(invalidSettings);
    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });

  it('should include error messages for invalid seed', () => {
    const invalidSettings = { seed: 0 };
    const result = validateGlobalSettingsForm(invalidSettings);
    expect(result.isValid).toBe(false);
    expect(result.errors['seed']).toBeDefined();
  });

  it('should include error messages for invalid maxBattleTurns', () => {
    const invalidSettings = { seed: 12345, maxBattleTurns: -1 };
    const result = validateGlobalSettingsForm(invalidSettings);
    expect(result.isValid).toBe(false);
    expect(result.errors['maxBattleTurns']).toBeDefined();
  });
});

describe('getDefaultGlobalSettingsFormData()', () => {
  it('should return default global settings', () => {
    const defaults = getDefaultGlobalSettingsFormData();
    expect(defaults).toEqual({
      seed: 12345,
      maxBattleTurns: 100,
    });
  });

  it('should have positive default seed', () => {
    const defaults = getDefaultGlobalSettingsFormData();
    expect(defaults.seed).toBeGreaterThan(0);
  });

  it('should have reasonable default maxBattleTurns', () => {
    const defaults = getDefaultGlobalSettingsFormData();
    expect(defaults.maxBattleTurns).toBe(100);
  });
});
