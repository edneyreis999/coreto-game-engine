import { ValidationError } from '@coreto/core';
import { DomainError } from '@coreto/core';
import { z, ZodError } from 'zod';

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

  describe('fromZodError', () => {
    it('should create ValidationError from ZodError', () => {
      const schema = z.object({
        id: z.string(),
        value: z.number(),
      });

      try {
        schema.parse({ id: 123, value: 'not a number' });
      } catch (zodError) {
        const error = ValidationError.fromZodError(zodError as ZodError);

        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('Schema validation failed');
        expect(error.severity).toBe('critical');
      }
    });

    it('should extract issues from ZodError', () => {
      const schema = z.object({
        id: z.string(),
        count: z.number().positive(),
      });

      try {
        schema.parse({ id: 123, count: -5 });
      } catch (zodError) {
        const error = ValidationError.fromZodError(zodError as ZodError);

        expect(error.context).toHaveProperty('issues');
        expect(Array.isArray(error.context.issues)).toBe(true);
        expect((error.context.issues as unknown[]).length).toBeGreaterThan(0);
      }
    });

    it('should format issues with path, message, and code', () => {
      const schema = z.object({
        trecho: z.object({
          id: z.string(),
        }),
      });

      try {
        schema.parse({ trecho: { id: 123 } });
      } catch (zodError) {
        const error = ValidationError.fromZodError(zodError as ZodError);
        const issues = error.context.issues as Array<{
          path: string;
          message: string;
          code: string;
        }>;

        expect(issues.length).toBeGreaterThan(0);
        expect(issues[0]).toHaveProperty('path');
        expect(issues[0]).toHaveProperty('message');
        expect(issues[0]).toHaveProperty('code');
        expect(issues[0]?.path).toBe('trecho.id');
      }
    });

    it('should handle multiple validation issues', () => {
      const schema = z.object({
        id: z.string(),
        name: z.string().min(3),
        count: z.number().positive(),
      });

      try {
        schema.parse({ id: 123, name: 'ab', count: -1 });
      } catch (zodError) {
        const error = ValidationError.fromZodError(zodError as ZodError);
        const issues = error.context.issues as unknown[];

        expect(issues.length).toBe(3);
      }
    });

    it('should handle nested path in issues', () => {
      const schema = z.object({
        config: z.object({
          trechos: z.array(
            z.object({
              id: z.string(),
            })
          ),
        }),
      });

      try {
        schema.parse({
          config: {
            trechos: [{ id: 'valid' }, { id: 123 }],
          },
        });
      } catch (zodError) {
        const error = ValidationError.fromZodError(zodError as ZodError);
        const issues = error.context.issues as Array<{ path: string }>;

        expect(issues.length).toBeGreaterThan(0);
        expect(issues[0]?.path).toBe('config.trechos.1.id');
      }
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

    it('should serialize Zod-derived error to JSON', () => {
      const schema = z.object({ id: z.string() });

      try {
        schema.parse({ id: 123 });
      } catch (zodError) {
        const error = ValidationError.fromZodError(zodError as ZodError);
        const json = error.toJSON();

        expect(json).toHaveProperty('name', 'ValidationError');
        expect(json).toHaveProperty('message', 'Schema validation failed');
        expect(json.context).toHaveProperty('issues');
      }
    });
  });

  });
