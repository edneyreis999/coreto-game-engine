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
    /**
     * Data-driven equality tests using test.each.
     * Tests various scenarios for Warning equality comparison.
     *
     * @param description - Test description
     * @param builder1 - First warning builder configuration
     * @param builder2 - Second warning builder configuration
     * @param expected - Expected equality result
     */
    const buildWarning = (config: {
      type?: string;
      severity?: string;
      message: string;
      context?: Record<string, unknown>;
    }) => {
      const builder = new WarningFakeBuilder().withMessage(config.message);
      if (config.type) builder.withType(config.type as any);
      if (config.severity) builder.withSeverity(config.severity as 'critical' | 'warning' | 'info');
      if (config.context) builder.withContext(config.context);
      return builder.build();
    };

    test.each([
      [
        'identical warnings',
        { message: 'Test', context: { troopId: 1 } },
        { message: 'Test', context: { troopId: 1 } },
        true,
      ],
      [
        'different type',
        { type: 'ttk_out_of_tolerance', message: 'Test' },
        { type: 'troop_not_found', message: 'Test' },
        false,
      ],
      [
        'different severity',
        { severity: 'warning', message: 'Test' },
        { severity: 'critical', message: 'Test' },
        false,
      ],
      [
        'different message',
        { message: 'Test 1' },
        { message: 'Test 2' },
        false,
      ],
      [
        'different context',
        { message: 'Test', context: { troopId: 1 } },
        { message: 'Test', context: { troopId: 2 } },
        false,
      ],
      [
        'nested objects in context - equal',
        {
          type: 'skill_formula_error',
          message: 'Test',
          context: {
            skill: { id: 1, name: 'Attack' },
            enemy: { id: 2, name: 'Slime' },
          },
        },
        {
          type: 'skill_formula_error',
          message: 'Test',
          context: {
            skill: { id: 1, name: 'Attack' },
            enemy: { id: 2, name: 'Slime' },
          },
        },
        true,
      ],
      [
        'nested objects in context - different',
        {
          type: 'skill_formula_error',
          message: 'Test',
          context: { skill: { id: 1, name: 'Attack' } },
        },
        {
          type: 'skill_formula_error',
          message: 'Test',
          context: { skill: { id: 2, name: 'Attack' } },
        },
        false,
      ],
      [
        'arrays in context - equal',
        {
          type: 'battle_timeout',
          severity: 'info',
          message: 'Test',
          context: { turns: [1, 2, 3, 4, 5] },
        },
        {
          type: 'battle_timeout',
          severity: 'info',
          message: 'Test',
          context: { turns: [1, 2, 3, 4, 5] },
        },
        true,
      ],
      [
        'arrays in context - different values',
        {
          type: 'battle_timeout',
          severity: 'info',
          message: 'Test',
          context: { turns: [1, 2, 3] },
        },
        {
          type: 'battle_timeout',
          severity: 'info',
          message: 'Test',
          context: { turns: [1, 2, 4] },
        },
        false,
      ],
      [
        'arrays in context - different length',
        {
          type: 'battle_timeout',
          severity: 'info',
          message: 'Test',
          context: { turns: [1, 2, 3] },
        },
        {
          type: 'battle_timeout',
          severity: 'info',
          message: 'Test',
          context: { turns: [1, 2] },
        },
        false,
      ],
      [
        'null values in context - equal',
        { type: 'skill_formula_error', message: 'Test', context: { error: null } },
        { type: 'skill_formula_error', message: 'Test', context: { error: null } },
        true,
      ],
      [
        'null vs undefined in context',
        { type: 'skill_formula_error', message: 'Test', context: { error: null } },
        { type: 'skill_formula_error', message: 'Test', context: { error: undefined } },
        false,
      ],
      [
        'deeply nested structures - equal',
        {
          type: 'skill_formula_error',
          message: 'Test',
          context: {
            battle: {
              troop: {
                id: 1,
                members: [{ enemyId: 1, x: 100, y: 200 }],
              },
            },
          },
        },
        {
          type: 'skill_formula_error',
          message: 'Test',
          context: {
            battle: {
              troop: {
                id: 1,
                members: [{ enemyId: 1, x: 100, y: 200 }],
              },
            },
          },
        },
        true,
      ],
      [
        'array vs object in context',
        { type: 'skill_formula_error', message: 'Test', context: { data: [1, 2, 3] } },
        { type: 'skill_formula_error', message: 'Test', context: { data: { 0: 1, 1: 2, 2: 3 } } },
        false,
      ],
    ])('should return %p for %s', (_description, config1, config2, expected) => {
      const warning1 = buildWarning(config1 as any);
      const warning2 = buildWarning(config2 as any);
      expect(warning1.equals(warning2)).toBe(expected);
    });

    it('should return true for same warning instance', () => {
      const warning = new WarningFakeBuilder()
        .withMessage('Test')
        .build();

      expect(warning.equals(warning)).toBe(true);
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
