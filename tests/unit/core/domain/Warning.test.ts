import { Warning, type WarningData } from '@/core/domain/Warning';
import { ValidationError } from '@/core/errors/ValidationError';

describe('Warning', () => {
  describe('constructor', () => {
    it('should create valid warning with all fields', () => {
      const data: WarningData = {
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'TTK fora da tolerância',
        context: { troopId: 1, ttkTurns: 12, targetTurns: 10 },
      };

      const warning = new Warning(data);

      expect(warning.type).toBe('ttk_out_of_tolerance');
      expect(warning.severity).toBe('warning');
      expect(warning.message).toBe('TTK fora da tolerância');
      expect(warning.context).toEqual({ troopId: 1, ttkTurns: 12, targetTurns: 10 });
    });

    it('should create warning with critical severity', () => {
      const data: WarningData = {
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Troop not found',
        context: { troopId: 999 },
      };

      const warning = new Warning(data);

      expect(warning.severity).toBe('critical');
    });

    it('should create warning with info severity', () => {
      const data: WarningData = {
        type: 'battle_timeout',
        severity: 'info',
        message: 'Battle timed out',
        context: { turns: 100 },
      };

      const warning = new Warning(data);

      expect(warning.severity).toBe('info');
    });

    it('should create warning with empty context', () => {
      const data: WarningData = {
        type: 'skill_formula_error',
        severity: 'warning',
        message: 'Formula error',
        context: {},
      };

      const warning = new Warning(data);

      expect(warning.context).toEqual({});
    });

    it('should throw ValidationError if message is empty string', () => {
      const data: WarningData = {
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: '',
        context: {},
      };

      expect(() => new Warning(data)).toThrow(ValidationError);
      expect(() => new Warning(data)).toThrow('Warning message cannot be empty');
    });

    it('should throw ValidationError if message is whitespace only', () => {
      const data: WarningData = {
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: '   ',
        context: {},
      };

      expect(() => new Warning(data)).toThrow(ValidationError);
      expect(() => new Warning(data)).toThrow('Warning message cannot be empty');
    });

    it('should include context in ValidationError when message is invalid', () => {
      const data: WarningData = {
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: '',
        context: {},
      };

      try {
        new Warning(data);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context).toHaveProperty('data');
      }
    });

    it('should create shallow copy of context to prevent mutation', () => {
      const context = { troopId: 1 };
      const data: WarningData = {
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context,
      };

      const warning = new Warning(data);

      // Mutate original context
      context.troopId = 999;

      // Warning context should be unchanged
      expect(warning.context.troopId).toBe(1);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const warning = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: { troopId: 1 },
      });

      expect(Object.isFrozen(warning)).toBe(true);
    });

    it('should have frozen context', () => {
      const warning = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: { troopId: 1 },
      });

      expect(Object.isFrozen(warning.context)).toBe(true);
    });

    it('should prevent modification of warning properties', () => {
      const warning = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: { troopId: 1 },
      });

      expect(() => {
        (warning as any).message = 'Modified';
      }).toThrow();
    });
  });

  describe('isCritical', () => {
    it('should return true for critical severity', () => {
      const warning = new Warning({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Critical issue',
        context: {},
      });

      expect(warning.isCritical()).toBe(true);
    });

    it('should return false for warning severity', () => {
      const warning = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning issue',
        context: {},
      });

      expect(warning.isCritical()).toBe(false);
    });

    it('should return false for info severity', () => {
      const warning = new Warning({
        type: 'battle_timeout',
        severity: 'info',
        message: 'Info message',
        context: {},
      });

      expect(warning.isCritical()).toBe(false);
    });
  });

  describe('isType', () => {
    it('should return true for matching type', () => {
      const warning = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: {},
      });

      expect(warning.isType('ttk_out_of_tolerance')).toBe(true);
    });

    it('should return false for non-matching type', () => {
      const warning = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: {},
      });

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
        const warning = new Warning({
          type,
          severity: 'warning',
          message: 'Test',
          context: {},
        });

        expect(warning.isType(type)).toBe(true);
      }
    });
  });

  describe('equals', () => {
    it('should return true for identical warnings', () => {
      const data: WarningData = {
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: { troopId: 1 },
      };

      const warning1 = new Warning(data);
      const warning2 = new Warning(data);

      expect(warning1.equals(warning2)).toBe(true);
    });

    it('should return false for different type', () => {
      const warning1 = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: {},
      });

      const warning2 = new Warning({
        type: 'troop_not_found',
        severity: 'warning',
        message: 'Test',
        context: {},
      });

      expect(warning1.equals(warning2)).toBe(false);
    });

    it('should return false for different severity', () => {
      const warning1 = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: {},
      });

      const warning2 = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'critical',
        message: 'Test',
        context: {},
      });

      expect(warning1.equals(warning2)).toBe(false);
    });

    it('should return false for different message', () => {
      const warning1 = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test 1',
        context: {},
      });

      const warning2 = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test 2',
        context: {},
      });

      expect(warning1.equals(warning2)).toBe(false);
    });

    it('should return false for different context', () => {
      const warning1 = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: { troopId: 1 },
      });

      const warning2 = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: { troopId: 2 },
      });

      expect(warning1.equals(warning2)).toBe(false);
    });

    it('should return true for same warning instance', () => {
      const warning = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: {},
      });

      expect(warning.equals(warning)).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should return plain object with all fields', () => {
      const data: WarningData = {
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: { troopId: 1, ttkTurns: 12 },
      };

      const warning = new Warning(data);
      const json = warning.toJSON();

      expect(json).toEqual({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: { troopId: 1, ttkTurns: 12 },
      });
    });

    it('should return new object (not reference)', () => {
      const warning = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: { troopId: 1 },
      });

      const json = warning.toJSON();

      // Mutate JSON
      json.context.troopId = 999;

      // Original should be unchanged
      expect(warning.context.troopId).toBe(1);
    });

    it('should be suitable for JSON.stringify', () => {
      const warning = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: { troopId: 1 },
      });

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
      const warning = new Warning({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'TTK fora da tolerância',
        context: {},
      });

      expect(warning.toString()).toBe('[warning] ttk_out_of_tolerance: TTK fora da tolerância');
    });

    it('should format critical warnings', () => {
      const warning = new Warning({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Troop not found',
        context: {},
      });

      expect(warning.toString()).toBe('[critical] troop_not_found: Troop not found');
    });

    it('should format info warnings', () => {
      const warning = new Warning({
        type: 'battle_timeout',
        severity: 'info',
        message: 'Battle timed out',
        context: {},
      });

      expect(warning.toString()).toBe('[info] battle_timeout: Battle timed out');
    });
  });
});
