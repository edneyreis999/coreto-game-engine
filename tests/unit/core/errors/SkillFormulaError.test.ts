import { SkillFormulaError } from '@coreto/core';
import { DomainError } from '@coreto/core';

describe('SkillFormulaError', () => {
  describe('constructor', () => {
    it('should create error with warning severity', () => {
      const skillId = 10;
      const formula = 'a.atk * 4 - b.def * 2';
      const errorMessage = 'ReferenceError: a is not defined';
      const error = new SkillFormulaError(skillId, formula, errorMessage);

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(SkillFormulaError);
      expect(error.message).toBe(`Skill formula error: ${errorMessage}`);
      expect(error.severity).toBe('warning');
      expect(error.name).toBe('SkillFormulaError');
    });

    it('should include skill ID, formula, and error message in context', () => {
      const skillId = 10;
      const formula = 'a.atk * 4 - b.def * 2';
      const errorMessage = 'ReferenceError: a is not defined';
      const error = new SkillFormulaError(skillId, formula, errorMessage);

      expect(error.context).toHaveProperty('skillId', skillId);
      expect(error.context).toHaveProperty('formula', formula);
      expect(error.context).toHaveProperty('errorMessage', errorMessage);
    });

    it('should format message with error description', () => {
      const errorMessage = 'SyntaxError: Unexpected token }';
      const error = new SkillFormulaError(5, 'invalid formula', errorMessage);

      expect(error.message).toContain(errorMessage);
    });
  });

  describe('toJSON', () => {
    it('should serialize with all skill formula context', () => {
      const skillId = 15;
      const formula = 'a.mat * 2.5 / b.mdf';
      const errorMessage = 'Division by zero';
      const error = new SkillFormulaError(skillId, formula, errorMessage);
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'SkillFormulaError');
      expect(json).toHaveProperty('message');
      expect((json.message as string).includes(errorMessage)).toBe(true);
      expect(json).toHaveProperty('severity', 'warning');
      expect(json.context).toHaveProperty('skillId', skillId);
      expect(json.context).toHaveProperty('formula', formula);
      expect(json.context).toHaveProperty('errorMessage', errorMessage);
    });
  });

  describe('Error inheritance', () => {
    it('should be instanceof DomainError', () => {
      const error = new SkillFormulaError(10, 'a.atk * 4', 'Error');

      expect(error instanceof DomainError).toBe(true);
    });

    it('should be instanceof SkillFormulaError', () => {
      const error = new SkillFormulaError(10, 'a.atk * 4', 'Error');

      expect(error instanceof SkillFormulaError).toBe(true);
    });

    it('should be throwable', () => {
      expect(() => {
        throw new SkillFormulaError(10, 'a.atk * 4', 'Error');
      }).toThrow('Skill formula error');
    });

    it('should be catchable as DomainError', () => {
      try {
        throw new SkillFormulaError(10, 'a.atk * 4', 'Error');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainError);
      }
    });
  });

  describe('context data', () => {
    it('should provide debugging context for formula issues', () => {
      const skillId = 42;
      const formula = 'Math.max(a.atk * 3, 50)';
      const errorMessage = 'Math is not defined';
      const error = new SkillFormulaError(skillId, formula, errorMessage);

      // Context should help debug formula evaluation errors
      expect(error.context.skillId).toBe(skillId);
      expect(error.context.formula).toBe(formula);
      expect(error.context.errorMessage).toBe(errorMessage);
    });

    it('should handle complex formulas in context', () => {
      const skillId = 100;
      const formula = '(a.atk * 4 - b.def * 2) * (1 + a.luck / 100) * Math.random()';
      const errorMessage = 'Unexpected identifier';
      const error = new SkillFormulaError(skillId, formula, errorMessage);

      expect(error.context.formula).toBe(formula);
      expect((error.context.formula as string).length).toBeGreaterThan(10);
    });
  });

  describe('severity level', () => {
    it('should be warning severity to allow system to continue', () => {
      const error = new SkillFormulaError(10, 'a.atk * 4', 'Error');

      // Warning allows system to skip this skill and continue
      expect(error.severity).toBe('warning');
    });

    it('should not be critical as battle can continue without this skill', () => {
      const error = new SkillFormulaError(10, 'a.atk * 4', 'Error');

      expect(error.severity).not.toBe('critical');
    });
  });
});
