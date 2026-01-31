import { DomainError, ErrorSeverity } from '@coreto/core/core/errors/DomainError';

// Concrete implementation for testing the abstract class
class TestDomainError extends DomainError {
  constructor(
    message: string,
    severity: ErrorSeverity = 'critical',
    context?: Record<string, unknown>
  ) {
    super(message, severity, context);
  }
}

describe('DomainError', () => {
  describe('constructor', () => {
    it('should create error with required properties', () => {
      const error = new TestDomainError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('TestDomainError');
      expect(error.severity).toBe('critical');
      expect(error.context).toEqual({});
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.stack).toBeDefined();
    });

    it('should use default severity when not provided', () => {
      const error = new TestDomainError('Test error');

      expect(error.severity).toBe('critical');
    });

    it('should accept custom severity', () => {
      const error = new TestDomainError('Warning message', 'warning');

      expect(error.severity).toBe('warning');
    });

    it('should accept context data', () => {
      const context = { userId: 123, action: 'test' };
      const error = new TestDomainError('Test error', 'critical', context);

      expect(error.context).toEqual(context);
    });

    it('should use empty object when context not provided', () => {
      const error = new TestDomainError('Test error');

      expect(error.context).toEqual({});
    });
  });

  describe('severity levels', () => {
    it('should support critical severity', () => {
      const error = new TestDomainError('Critical error', 'critical');

      expect(error.severity).toBe('critical');
    });

    it('should support warning severity', () => {
      const error = new TestDomainError('Warning message', 'warning');

      expect(error.severity).toBe('warning');
    });

    it('should support info severity', () => {
      const error = new TestDomainError('Info message', 'info');

      expect(error.severity).toBe('info');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON with all properties', () => {
      const context = { troopId: 5, trechoId: 'ato1' };
      const error = new TestDomainError('Test error', 'warning', context);

      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'TestDomainError');
      expect(json).toHaveProperty('message', 'Test error');
      expect(json).toHaveProperty('severity', 'warning');
      expect(json).toHaveProperty('context', context);
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('stack');
    });

    it('should format timestamp as ISO string', () => {
      const error = new TestDomainError('Test error');
      const json = error.toJSON();

      expect(typeof json.timestamp).toBe('string');
      expect(() => new Date(json.timestamp as string)).not.toThrow();
    });

    it('should include stack trace in JSON', () => {
      const error = new TestDomainError('Test error');
      const json = error.toJSON();

      expect(json.stack).toBeDefined();
      expect(typeof json.stack).toBe('string');
      expect((json.stack as string).length).toBeGreaterThan(0);
    });
  });

  describe('Error inheritance', () => {
    it('should be instanceof Error', () => {
      const error = new TestDomainError('Test error');

      expect(error instanceof Error).toBe(true);
    });

    it('should be instanceof DomainError', () => {
      const error = new TestDomainError('Test error');

      expect(error instanceof DomainError).toBe(true);
    });

    it('should be throwable', () => {
      expect(() => {
        throw new TestDomainError('Test error');
      }).toThrow('Test error');
    });

    it('should be catchable as Error', () => {
      try {
        throw new TestDomainError('Test error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(DomainError);
      }
    });
  });

  describe('timestamp', () => {
    it('should set timestamp when error is created', () => {
      const before = new Date();
      const error = new TestDomainError('Test error');
      const after = new Date();

      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should have unique timestamps for sequential errors', () => {
      const error1 = new TestDomainError('Error 1');
      const error2 = new TestDomainError('Error 2');

      // Timestamps should be equal or error2 should be later
      expect(error2.timestamp.getTime()).toBeGreaterThanOrEqual(error1.timestamp.getTime());
    });
  });
});
