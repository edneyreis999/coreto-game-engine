/**
 * DI Container Unit Tests
 *
 * Tests for TSyringe container setup and dependency resolution.
 */

import 'reflect-metadata';
import {
  registerDependencies,
  clearContainer,
  resolve,
} from '../../../../packages/core/src/infrastructure/di/container.js';
import { ILoggerToken } from '../../../../packages/core/src/infrastructure/di/tokens.js';
import type { ILogger } from '../../../../packages/core/src/core/ports/ILogger.js';

describe('DI Container', () => {
  beforeEach(() => {
    // Clear container before each test to ensure clean state
    clearContainer();
  });

  afterEach(() => {
    // Clean up after each test
    clearContainer();
  });

  describe('registerDependencies', () => {
    it('should execute without errors', () => {
      // Capture console.log to verify registration message
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      expect(() => registerDependencies()).not.toThrow();

      // Verify registration message was logged
      expect(consoleSpy).toHaveBeenCalledWith('[DI] All dependencies registered');

      consoleSpy.mockRestore();
    });

    it('should register ConsoleLogger implementation', () => {
      registerDependencies();

      // Should be able to resolve ILogger without throwing
      expect(() => resolve(ILoggerToken)).not.toThrow();
    });
  });

  describe('container.resolve', () => {
    beforeEach(() => {
      registerDependencies();
    });

    it('should resolve ILogger token to ConsoleLogger instance', () => {
      const logger = resolve(ILoggerToken);

      expect(logger).toBeDefined();
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('debug');
    });

    it('should return same instance on multiple resolves (singleton)', () => {
      const logger1 = resolve(ILoggerToken);
      const logger2 = resolve(ILoggerToken);

      expect(logger1).toBe(logger2);
    });

    it('should resolve logger that implements ILogger interface', () => {
      const logger = resolve(ILoggerToken);

      // Test all methods exist and are callable
      expect(() => logger.info('test')).not.toThrow();
      expect(() => logger.warn('test')).not.toThrow();
      expect(() => logger.error('test')).not.toThrow();
      expect(() => logger.debug('test')).not.toThrow();
    });
  });

  describe('clearContainer', () => {
    it('should clear all instances from container', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      registerDependencies();
      const logger1 = resolve(ILoggerToken);

      clearContainer();

      // Verify clear message was logged
      expect(consoleSpy).toHaveBeenCalledWith('[DI] Container cleared');

      // Re-register and resolve - should get a new instance
      registerDependencies();
      const logger2 = resolve(ILoggerToken);

      // New instance should be different from cleared one
      expect(logger2).toBeDefined();
      expect(logger1).not.toBe(logger2);

      consoleSpy.mockRestore();
    });
  });

  describe('ConsoleLogger integration', () => {
    beforeEach(() => {
      registerDependencies();
    });

    it('should log info messages with prefix', () => {
      const logger = resolve(ILoggerToken);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.info('test message');

      expect(consoleSpy).toHaveBeenCalledWith('[INFO] test message');

      consoleSpy.mockRestore();
    });

    it('should log info messages with metadata', () => {
      const logger = resolve(ILoggerToken);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.info('test message', { key: 'value' });

      expect(consoleSpy).toHaveBeenCalledWith('[INFO] test message', { key: 'value' });

      consoleSpy.mockRestore();
    });

    it('should log warn messages with prefix', () => {
      const logger = resolve(ILoggerToken);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      logger.warn('test warning');

      expect(consoleSpy).toHaveBeenCalledWith('[WARN] test warning');

      consoleSpy.mockRestore();
    });

    it('should log error messages with prefix', () => {
      const logger = resolve(ILoggerToken);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      logger.error('test error');

      expect(consoleSpy).toHaveBeenCalledWith('[ERROR] test error');

      consoleSpy.mockRestore();
    });

    it('should log debug messages with prefix', () => {
      const logger = resolve(ILoggerToken);
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

      logger.debug('test debug');

      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] test debug');

      consoleSpy.mockRestore();
    });
  });

  describe('TypeScript type safety', () => {
    it('should provide type-safe resolve function', () => {
      registerDependencies();

      // TypeScript should infer ILogger type from token
      const logger: ILogger = resolve(ILoggerToken);

      // Type assertion to verify interface compliance
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });
});
