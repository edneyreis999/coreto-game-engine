import { ValidationError, ValidationIssue } from '@coreto/core';
import { DomainError } from '@coreto/core';

describe('ValidationError', () => {
  describe('constructor', () => {
    it('should create error with message and severity critical', () => {
      const error = new ValidationError('Validation failed');

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation failed');
      expect(error.severity).toBe('critical');
      expect(error.name).toBe('ValidationError');
    });

    it('should accept context data', () => {
      const context = { field: 'trechoId', value: 'invalid' };
      const error = new ValidationError('Invalid field', context);

      expect(error.context).toEqual(context);
    });

    it('should use empty object when context not provided', () => {
      const error = new ValidationError('Validation failed');

      expect(error.context).toEqual({});
    });
  });

  describe('fromValidationIssues', () => {
    it('should create ValidationError from validation issues', () => {
      const issues: ValidationIssue[] = [
        { path: 'id', message: 'Expected string, received number', code: 'invalid_type' },
        { path: 'value', message: 'Expected number, received string', code: 'invalid_type' },
      ];
      const error = ValidationError.fromValidationIssues(issues);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Schema validation failed');
      expect(error.severity).toBe('critical');
    });

    it('should extract issues from validation issues array', () => {
      const issues: ValidationIssue[] = [
        { path: 'id', message: 'Expected string, received number', code: 'invalid_type' },
        { path: 'count', message: 'Number must be positive', code: 'too_small' },
      ];
      const error = ValidationError.fromValidationIssues(issues);

      expect(error.context).toHaveProperty('issues');
      expect(Array.isArray(error.context.issues)).toBe(true);
      expect((error.context.issues as unknown[]).length).toBeGreaterThan(0);
    });

    it('should format issues with path, message, and code', () => {
      const issues: ValidationIssue[] = [
        { path: 'trecho.id', message: 'Expected string, received number', code: 'invalid_type' },
      ];
      const error = ValidationError.fromValidationIssues(issues);
      const errorIssues = error.context.issues as Array<{
        path: string;
        message: string;
        code: string;
      }>;

      expect(errorIssues.length).toBe(1);
      expect(errorIssues[0]).toHaveProperty('path');
      expect(errorIssues[0]).toHaveProperty('message');
      expect(errorIssues[0]).toHaveProperty('code');
      expect(errorIssues[0]?.path).toBe('trecho.id');
    });

    it('should handle multiple validation issues', () => {
      const issues: ValidationIssue[] = [
        { path: 'id', message: 'Expected string, received number', code: 'invalid_type' },
        { path: 'name', message: 'String must contain at least 3 character(s)', code: 'too_small' },
        { path: 'count', message: 'Number must be positive', code: 'too_small' },
      ];
      const error = ValidationError.fromValidationIssues(issues);
      const errorIssues = error.context.issues as unknown[];

      expect(errorIssues.length).toBe(3);
    });

    it('should handle nested path in issues', () => {
      const issues: ValidationIssue[] = [
        { path: 'config.trechos.1.id', message: 'Expected string, received number', code: 'invalid_type' },
      ];
      const error = ValidationError.fromValidationIssues(issues);
      const errorIssues = error.context.issues as Array<{ path: string }>;

      expect(errorIssues.length).toBe(1);
      expect(errorIssues[0]?.path).toBe('config.trechos.1.id');
    });
  });

  describe('toJSON', () => {
    it('should serialize validation error to JSON', () => {
      const error = new ValidationError('Invalid input', {
        field: 'email',
        value: 'invalid',
      });

      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'ValidationError');
      expect(json).toHaveProperty('message', 'Invalid input');
      expect(json).toHaveProperty('severity', 'critical');
      expect(json.context).toEqual({ field: 'email', value: 'invalid' });
    });

    it('should serialize validation-issue-derived error to JSON', () => {
      const issues: ValidationIssue[] = [
        { path: 'id', message: 'Expected string, received number', code: 'invalid_type' },
      ];
      const error = ValidationError.fromValidationIssues(issues);
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'ValidationError');
      expect(json).toHaveProperty('message', 'Schema validation failed');
      expect(json.context).toHaveProperty('issues');
    });
  });

  });
