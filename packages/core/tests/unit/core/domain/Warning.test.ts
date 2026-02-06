import { ValidationError } from '@coreto/core';
import { WarningFakeBuilder } from '../../../fakes';

describe('Warning', () => {
  describe('constructor', () => {
    it('should create valid warning with all fields', () => {
      const warning = new WarningFakeBuilder()
        .withTtkOutOfTolerance(1, 12, 10)
        .withMessage('TTK fora da tolerância')
        .build();

      expect(warning.type).toBe('ttk_out_of_tolerance');
      expect(warning.severity).toBe('warning');
      expect(warning.message).toBe('TTK fora da tolerância');
      expect(warning.context).toEqual({ troopId: 1, ttkTurns: 12, targetTurns: 10 });
    });

    it('should create warning with critical severity', () => {
      const warning = new WarningFakeBuilder()
        .withTroopNotFound(999)
        .withMessage('Troop not found')
        .build();

      expect(warning.severity).toBe('critical');
    });

    it('should create warning with info severity', () => {
      const warning = new WarningFakeBuilder()
        .withType('battle_timeout')
        .withInfoSeverity()
        .withMessage('Battle timed out')
        .withContext({ turns: 100 })
        .build();

      expect(warning.severity).toBe('info');
    });

    it('should create warning with empty context', () => {
      const warning = new WarningFakeBuilder()
        .withType('skill_formula_error')
        .withMessage('Formula error')
        .build();

      expect(warning.context).toEqual({});
    });

    it('should throw ValidationError if message is empty string', () => {
      expect(() => new WarningFakeBuilder().withEmptyMessage().build()).toThrow(ValidationError);
      expect(() => new WarningFakeBuilder().withEmptyMessage().build()).toThrow('Warning message cannot be empty');
    });

    it('should throw ValidationError if message is whitespace only', () => {
      expect(() => new WarningFakeBuilder().withWhitespaceMessage().build()).toThrow(ValidationError);
      expect(() =>
        new WarningFakeBuilder().withWhitespaceMessage().build(),
      ).toThrow('Warning message cannot be empty');
    });

    it('should include context in ValidationError when message is invalid', () => {
      try {
        new WarningFakeBuilder().withEmptyMessage().build();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context).toHaveProperty('data');
      }
    });

    it('should create shallow copy of context to prevent mutation', () => {
      const context = { troopId: 1 };
      const warning = new WarningFakeBuilder()
        .withContext(context)
        .withMessage('Test')
        .build();

      // Mutate original context
      context.troopId = 999;

      // Warning context should be unchanged
      expect(warning.context.troopId).toBe(1);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const warning = new WarningFakeBuilder()
        .withMessage('Test')
        .build();

      expect(Object.isFrozen(warning)).toBe(true);
    });

    it('should have frozen context', () => {
      const warning = new WarningFakeBuilder()
        .withMessage('Test')
        .withContext({ troopId: 1 })
        .build();

      expect(Object.isFrozen(warning.context)).toBe(true);
    });

    it('should prevent modification of warning properties', () => {
      const warning = new WarningFakeBuilder()
        .withMessage('Test')
        .build();

      expect(() => {
        (warning as any).message = 'Modified';
      }).toThrow();
    });
  });

  describe('isCritical', () => {
    it('should return true for critical severity', () => {
      const warning = new WarningFakeBuilder()
        .withCriticalSeverity()
        .withMessage('Critical issue')
        .build();

      expect(warning.isCritical()).toBe(true);
    });

    it('should return false for warning severity', () => {
      const warning = new WarningFakeBuilder()
        .withWarningSeverity()
        .withMessage('Warning issue')
        .build();

      expect(warning.isCritical()).toBe(false);
    });

    it('should return false for info severity', () => {
      const warning = new WarningFakeBuilder()
        .withInfoSeverity()
        .withMessage('Info message')
        .build();

      expect(warning.isCritical()).toBe(false);
    });
  });

  describe('isType', () => {
    it('should return true for matching type', () => {
      const warning = new WarningFakeBuilder()
        .withType('ttk_out_of_tolerance')
        .withMessage('Test')
        .build();

      expect(warning.isType('ttk_out_of_tolerance')).toBe(true);
    });

    it('should return false for non-matching type', () => {
      const warning = new WarningFakeBuilder()
        .withType('ttk_out_of_tolerance')
        .withMessage('Test')
        .build();

      expect(warning.isType('troop_not_found')).toBe(false);
    });

    it('should work with all warning types', () => {
      const types = [
        'troop_not_found',
        'enemy_not_found',
        'ttk_out_of_tolerance',
        'skill_formula_error',
        'battle_timeout',
      ] as const;

      for (const type of types) {
        const warning = new WarningFakeBuilder()
          .withType(type)
          .withMessage('Test')
          .build();

        expect(warning.isType(type)).toBe(true);
      }
    });
  });

  describe('equals', () => {
    it('should return true for identical warnings', () => {
      const warning1 = new WarningFakeBuilder()
        .withMessage('Test')
        .withContext({ troopId: 1 })
        .build();

      const warning2 = new WarningFakeBuilder()
        .withMessage('Test')
        .withContext({ troopId: 1 })
        .build();

      expect(warning1.equals(warning2)).toBe(true);
    });

    it('should return false for different type', () => {
      const warning1 = new WarningFakeBuilder()
        .withType('ttk_out_of_tolerance')
        .withMessage('Test')
        .build();

      const warning2 = new WarningFakeBuilder()
        .withType('troop_not_found')
        .withMessage('Test')
        .build();

      expect(warning1.equals(warning2)).toBe(false);
    });

    it('should return false for different severity', () => {
      const warning1 = new WarningFakeBuilder()
        .withWarningSeverity()
        .withMessage('Test')
        .build();

      const warning2 = new WarningFakeBuilder()
        .withCriticalSeverity()
        .withMessage('Test')
        .build();

      expect(warning1.equals(warning2)).toBe(false);
    });

    it('should return false for different message', () => {
      const warning1 = new WarningFakeBuilder()
        .withMessage('Test 1')
        .build();

      const warning2 = new WarningFakeBuilder()
        .withMessage('Test 2')
        .build();

      expect(warning1.equals(warning2)).toBe(false);
    });

    it('should return false for different context', () => {
      const warning1 = new WarningFakeBuilder()
        .withMessage('Test')
        .withContext({ troopId: 1 })
        .build();

      const warning2 = new WarningFakeBuilder()
        .withMessage('Test')
        .withContext({ troopId: 2 })
        .build();

      expect(warning1.equals(warning2)).toBe(false);
    });

    it('should return true for same warning instance', () => {
      const warning = new WarningFakeBuilder()
        .withMessage('Test')
        .build();

      expect(warning.equals(warning)).toBe(true);
    });

    it('should handle nested objects in context', () => {
      const warning1 = new WarningFakeBuilder()
        .withType('skill_formula_error')
        .withMessage('Test')
        .withContext({
          skill: { id: 1, name: 'Attack' },
          enemy: { id: 2, name: 'Slime' },
        })
        .build();

      const warning2 = new WarningFakeBuilder()
        .withType('skill_formula_error')
        .withMessage('Test')
        .withContext({
          skill: { id: 1, name: 'Attack' },
          enemy: { id: 2, name: 'Slime' },
        })
        .build();

      expect(warning1.equals(warning2)).toBe(true);
    });

    it('should detect differences in nested objects', () => {
      const warning1 = new WarningFakeBuilder()
        .withType('skill_formula_error')
        .withMessage('Test')
        .withContext({
          skill: { id: 1, name: 'Attack' },
        })
        .build();

      const warning2 = new WarningFakeBuilder()
        .withType('skill_formula_error')
        .withMessage('Test')
        .withContext({
          skill: { id: 2, name: 'Attack' },
        })
        .build();

      expect(warning1.equals(warning2)).toBe(false);
    });

    it('should handle arrays in context', () => {
      const warning1 = new WarningFakeBuilder()
        .withType('battle_timeout')
        .withSeverity('info')
        .withMessage('Test')
        .withContext({
          turns: [1, 2, 3, 4, 5],
        })
        .build();

      const warning2 = new WarningFakeBuilder()
        .withType('battle_timeout')
        .withSeverity('info')
        .withMessage('Test')
        .withContext({
          turns: [1, 2, 3, 4, 5],
        })
        .build();

      expect(warning1.equals(warning2)).toBe(true);
    });

    it('should detect differences in arrays', () => {
      const warning1 = new WarningFakeBuilder()
        .withType('battle_timeout')
        .withSeverity('info')
        .withMessage('Test')
        .withContext({
          turns: [1, 2, 3],
        })
        .build();

      const warning2 = new WarningFakeBuilder()
        .withType('battle_timeout')
        .withSeverity('info')
        .withMessage('Test')
        .withContext({
          turns: [1, 2, 4],
        })
        .build();

      expect(warning1.equals(warning2)).toBe(false);
    });

    it('should detect array length differences', () => {
      const warning1 = new WarningFakeBuilder()
        .withType('battle_timeout')
        .withSeverity('info')
        .withMessage('Test')
        .withContext({
          turns: [1, 2, 3],
        })
        .build();

      const warning2 = new WarningFakeBuilder()
        .withType('battle_timeout')
        .withSeverity('info')
        .withMessage('Test')
        .withContext({
          turns: [1, 2],
        })
        .build();

      expect(warning1.equals(warning2)).toBe(false);
    });

    it('should handle null values in context', () => {
      const warning1 = new WarningFakeBuilder()
        .withType('skill_formula_error')
        .withMessage('Test')
        .withContext({
          error: null,
        })
        .build();

      const warning2 = new WarningFakeBuilder()
        .withType('skill_formula_error')
        .withMessage('Test')
        .withContext({
          error: null,
        })
        .build();

      expect(warning1.equals(warning2)).toBe(true);
    });

    it('should distinguish null from undefined', () => {
      const warning1 = new WarningFakeBuilder()
        .withType('skill_formula_error')
        .withMessage('Test')
        .withContext({
          error: null,
        })
        .build();

      const warning2 = new WarningFakeBuilder()
        .withType('skill_formula_error')
        .withMessage('Test')
        .withContext({
          error: undefined,
        })
        .build();

      expect(warning1.equals(warning2)).toBe(false);
    });

    it('should handle deeply nested structures', () => {
      const warning1 = new WarningFakeBuilder()
        .withType('skill_formula_error')
        .withMessage('Test')
        .withContext({
          battle: {
            troop: {
              id: 1,
              members: [{ enemyId: 1, x: 100, y: 200 }],
            },
          },
        })
        .build();

      const warning2 = new WarningFakeBuilder()
        .withType('skill_formula_error')
        .withMessage('Test')
        .withContext({
          battle: {
            troop: {
              id: 1,
              members: [{ enemyId: 1, x: 100, y: 200 }],
            },
          },
        })
        .build();

      expect(warning1.equals(warning2)).toBe(true);
    });

    it('should distinguish between array and object', () => {
      const warning1 = new WarningFakeBuilder()
        .withType('skill_formula_error')
        .withMessage('Test')
        .withContext({
          data: [1, 2, 3],
        })
        .build();

      const warning2 = new WarningFakeBuilder()
        .withType('skill_formula_error')
        .withMessage('Test')
        .withContext({
          data: { 0: 1, 1: 2, 2: 3 },
        })
        .build();

      expect(warning1.equals(warning2)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return plain object with all fields', () => {
      const warning = new WarningFakeBuilder()
        .withMessage('Test')
        .withContext({ troopId: 1, ttkTurns: 12 })
        .build();

      const json = warning.toJSON();

      expect(json).toEqual({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: { troopId: 1, ttkTurns: 12 },
      });
    });

    it('should return new object (not reference)', () => {
      const warning = new WarningFakeBuilder()
        .withMessage('Test')
        .withContext({ troopId: 1 })
        .build();

      const json = warning.toJSON();

      // Mutate JSON
      json.context.troopId = 999;

      // Original should be unchanged
      expect(warning.context.troopId).toBe(1);
    });

    it('should be suitable for JSON.stringify', () => {
      const warning = new WarningFakeBuilder()
        .withMessage('Test')
        .withContext({ troopId: 1 })
        .build();

      const jsonString = JSON.stringify(warning);
      const parsed = JSON.parse(jsonString);

      expect(parsed.type).toBe('ttk_out_of_tolerance');
      expect(parsed.severity).toBe('warning');
      expect(parsed.message).toBe('Test');
      expect(parsed.context).toEqual({ troopId: 1 });
    });
  });

  describe('toString', () => {
    it('should return formatted string with severity, type, and message', () => {
      const warning = new WarningFakeBuilder()
        .withMessage('TTK fora da tolerância')
        .build();

      expect(warning.toString()).toBe('[warning] ttk_out_of_tolerance: TTK fora da tolerância');
    });

    it('should format critical warnings', () => {
      const warning = new WarningFakeBuilder()
        .withTroopNotFound()
        .withMessage('Troop not found')
        .build();

      expect(warning.toString()).toBe('[critical] troop_not_found: Troop not found');
    });

    it('should format info warnings', () => {
      const warning = new WarningFakeBuilder()
        .withType('battle_timeout')
        .withInfoSeverity()
        .withMessage('Battle timed out')
        .build();

      expect(warning.toString()).toBe('[info] battle_timeout: Battle timed out');
    });
  });
});
