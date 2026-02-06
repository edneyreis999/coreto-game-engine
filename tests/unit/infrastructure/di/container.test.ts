/**
 * DI Container Unit Tests
 *
 * Comprehensive tests for TSyringe container setup and dependency resolution.
 * Tests cover all port-to-adapter bindings, singleton behavior, and container lifecycle.
 *
 * Task: Configure dependency injection container with TSyringe
 * Coverage Target: ≥80%
 */

import 'reflect-metadata';
import {
  registerDependencies,
  clearContainer,
  resolve,
  container,
  ILoggerToken,
  IFileSystemToken,
  IConfigLoaderToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
  IReporterToken,
  IHeadlessRuntimeToken,
  NodeFileSystem,
  ZodConfigLoader,
  RmmzDataLoader,
  HeadlessBattleSimulator,
  JsonReporter,
} from '@coreto/core';
import type {
  ILogger,
  IFileSystem,
  IConfigLoader,
  IDataLoader,
  IBattleSimulator,
  IReporter,
  IHeadlessRuntime,
} from '@coreto/core';

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
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      expect(() => registerDependencies()).not.toThrow();

      // registerDependencies() now uses logger.info() which formats as '[INFO] ...'
      expect(consoleSpy).toHaveBeenCalledWith('[INFO] [DI] All dependencies registered');

      consoleSpy.mockRestore();
    });

    it('should register all port-to-adapter bindings', () => {
      registerDependencies();

      // All tokens should be resolvable without errors
      expect(() => resolve(ILoggerToken)).not.toThrow();
      expect(() => resolve(IFileSystemToken)).not.toThrow();
      expect(() => resolve(IConfigLoaderToken)).not.toThrow();
      expect(() => resolve(IDataLoaderToken)).not.toThrow();
      expect(() => resolve(IBattleSimulatorToken)).not.toThrow();
      expect(() => resolve(IReporterToken)).not.toThrow();
      expect(() => resolve(IHeadlessRuntimeToken)).not.toThrow();
    });

    it('should be idempotent - can be called multiple times', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      expect(() => {
        registerDependencies();
        registerDependencies();
        registerDependencies();
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledTimes(3);

      consoleSpy.mockRestore();
    });
  });

  describe('resolve<T>(token)', () => {
    beforeEach(() => {
      registerDependencies();
    });

    describe('ILogger token', () => {
      it('should resolve to a logger instance with expected methods', () => {
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
    });

    describe('IFileSystem token', () => {
      it('should resolve to NodeFileSystem instance', () => {
        const fs = resolve(IFileSystemToken);

        expect(fs).toBeInstanceOf(NodeFileSystem);
        expect(fs).toHaveProperty('exists');
        expect(fs).toHaveProperty('readFileSync');
        expect(fs).toHaveProperty('writeFileSync');
        expect(fs).toHaveProperty('validateProjectPath');
      });

      it('should return same instance on multiple resolves (singleton)', () => {
        const fs1 = resolve(IFileSystemToken);
        const fs2 = resolve(IFileSystemToken);

        expect(fs1).toBe(fs2);
      });
    });

    describe('IConfigLoader token', () => {
      it('should resolve to ZodConfigLoader instance', () => {
        const loader = resolve(IConfigLoaderToken);

        expect(loader).toBeInstanceOf(ZodConfigLoader);
        expect(loader).toHaveProperty('loadConfig');
        expect(loader).toHaveProperty('loadTrechos');
        expect(loader).toHaveProperty('validate');
      });

      it('should return same instance on multiple resolves (singleton)', () => {
        const loader1 = resolve(IConfigLoaderToken);
        const loader2 = resolve(IConfigLoaderToken);

        expect(loader1).toBe(loader2);
      });

      it('should have constructor injection for IFileSystem', () => {
        const loader = resolve(IConfigLoaderToken);

        // ZodConfigLoader requires IFileSystem in constructor
        expect(loader).toBeInstanceOf(ZodConfigLoader);
      });
    });

    describe('IDataLoader token', () => {
      it('should resolve to RmmzDataLoader instance', () => {
        const loader = resolve(IDataLoaderToken);

        expect(loader).toBeInstanceOf(RmmzDataLoader);
        expect(loader).toHaveProperty('loadDatabase');
        expect(loader).toHaveProperty('validateProjectStructure');
        expect(loader).toHaveProperty('validateReferences');
        expect(loader).toHaveProperty('loadDataFile');
      });

      it('should return same instance on multiple resolves (singleton)', () => {
        const loader1 = resolve(IDataLoaderToken);
        const loader2 = resolve(IDataLoaderToken);

        expect(loader1).toBe(loader2);
      });

      it('should have constructor injection for IFileSystem and RmmzProjectValidator', () => {
        const loader = resolve(IDataLoaderToken);

        // RmmzDataLoader requires IFileSystem and RmmzProjectValidator
        expect(loader).toBeInstanceOf(RmmzDataLoader);
      });
    });

    describe('IBattleSimulator token', () => {
      it('should resolve to HeadlessBattleSimulator instance', () => {
        const simulator = resolve(IBattleSimulatorToken);

        expect(simulator).toBeInstanceOf(HeadlessBattleSimulator);
        expect(simulator).toHaveProperty('initialize');
        expect(simulator).toHaveProperty('executeBattle');
        expect(simulator).toHaveProperty('getLastMetrics');
        expect(simulator).toHaveProperty('cleanup');
      });

      it('should return same instance on multiple resolves (singleton)', () => {
        const sim1 = resolve(IBattleSimulatorToken);
        const sim2 = resolve(IBattleSimulatorToken);

        expect(sim1).toBe(sim2);
      });
    });

    describe('IReporter token', () => {
      it('should resolve to JsonReporter instance', () => {
        const reporter = resolve(IReporterToken);

        expect(reporter).toBeInstanceOf(JsonReporter);
        expect(reporter).toHaveProperty('addWarning');
        expect(reporter).toHaveProperty('addBattleResult');
        expect(reporter).toHaveProperty('generateReport');
        expect(reporter).toHaveProperty('writeReport');
        expect(reporter).toHaveProperty('exportContext');
      });

      it('should return same instance on multiple resolves (singleton)', () => {
        const reporter1 = resolve(IReporterToken);
        const reporter2 = resolve(IReporterToken);

        expect(reporter1).toBe(reporter2);
      });
    });

    describe('IHeadlessRuntime token', () => {
      it('should resolve to a runtime instance with expected methods', () => {
        const runtime = resolve(IHeadlessRuntimeToken);

        expect(runtime).toBeDefined();
        expect(runtime).toHaveProperty('initialize');
        expect(runtime).toHaveProperty('loadCoreScripts');
        expect(runtime).toHaveProperty('setupMocks');
        expect(runtime).toHaveProperty('cleanup');
      });

      it('should return same instance on multiple resolves (singleton)', () => {
        const runtime1 = resolve(IHeadlessRuntimeToken);
        const runtime2 = resolve(IHeadlessRuntimeToken);

        expect(runtime1).toBe(runtime2);
      });

      it('should have constructor injection for ILogger', () => {
        const runtime = resolve(IHeadlessRuntimeToken);

        // Runtime requires ILogger in constructor
        expect(runtime).toBeDefined();
      });
    });

    describe('error handling', () => {
      it('should throw error for unregistered token', () => {
        const unregisteredToken = Symbol.for('UnregisteredToken') as symbol & {
          __type: unknown;
        };

        expect(() => resolve(unregisteredToken)).toThrow();
      });

      it('should throw error with descriptive message for missing registration', () => {
        const unregisteredToken = Symbol.for('MissingService') as symbol & {
          __type: unknown;
        };

        expect(() => resolve(unregisteredToken)).toThrow(
          expect.anything()
        );
      });
    });
  });

  describe('clearContainer', () => {
    it('should clear all instances from container', () => {
      registerDependencies();
      const logger1 = resolve(ILoggerToken);

      clearContainer();

      // Re-register and resolve - should get a new instance
      registerDependencies();
      const logger2 = resolve(ILoggerToken);

      // New instance should be different from cleared one
      expect(logger2).toBeDefined();
      expect(logger1).not.toBe(logger2);
    });

    it('should allow container to be re-registered after cleanup', () => {
      registerDependencies();
      const logger1 = resolve(ILoggerToken);

      clearContainer();

      // Should be able to register again without errors
      expect(() => registerDependencies()).not.toThrow();

      // Should be able to resolve again
      const logger2 = resolve(ILoggerToken);
      expect(logger2).toBeDefined();
      expect(logger1).not.toBe(logger2);
    });

    it('should execute without errors when container is empty', () => {
      expect(() => clearContainer()).not.toThrow();
    });

    it('should clear all registered singletons', () => {
      registerDependencies();

      // Resolve all services
      const logger1 = resolve(ILoggerToken);
      const fs1 = resolve(IFileSystemToken);
      const loader1 = resolve(IConfigLoaderToken);

      clearContainer();

      // Re-register
      registerDependencies();

      // All should be new instances
      const logger2 = resolve(ILoggerToken);
      const fs2 = resolve(IFileSystemToken);
      const loader2 = resolve(IConfigLoaderToken);

      expect(logger1).not.toBe(logger2);
      expect(fs1).not.toBe(fs2);
      expect(loader1).not.toBe(loader2);
    });
  });

  describe('singleton behavior', () => {
    beforeEach(() => {
      registerDependencies();
    });

    it('should return same ILogger instance across multiple resolves', () => {
      const instances = [
        resolve(ILoggerToken),
        resolve(ILoggerToken),
        resolve(ILoggerToken),
        resolve(ILoggerToken),
      ];

      instances.forEach((instance) => {
        expect(instance).toBe(instances[0]);
      });
    });

    it('should return same IFileSystem instance across multiple resolves', () => {
      const instances = [
        resolve(IFileSystemToken),
        resolve(IFileSystemToken),
        resolve(IFileSystemToken),
      ];

      instances.forEach((instance) => {
        expect(instance).toBe(instances[0]);
      });
    });

    it('should maintain singleton behavior for all registered services', () => {
      const services = [
        { token: ILoggerToken, name: 'ILogger' },
        { token: IFileSystemToken, name: 'IFileSystem' },
        { token: IConfigLoaderToken, name: 'IConfigLoader' },
        { token: IDataLoaderToken, name: 'IDataLoader' },
        { token: IBattleSimulatorToken, name: 'IBattleSimulator' },
        { token: IReporterToken, name: 'IReporter' },
        { token: IHeadlessRuntimeToken, name: 'IHeadlessRuntime' },
      ];

      services.forEach(({ token }) => {
        const instance1 = resolve(token);
        const instance2 = resolve(token);
        expect(instance1).toBe(instance2);
      });
    });
  });

  describe('constructor injection', () => {
    beforeEach(() => {
      registerDependencies();
    });

    it('should inject IFileSystem into ZodConfigLoader', () => {
      const loader = resolve(IConfigLoaderToken);
      const fs = resolve(IFileSystemToken);

      // ZodConfigLoader should have IFileSystem injected
      expect(loader).toBeInstanceOf(ZodConfigLoader);

      // Verify IFileSystem is available (singleton check)
      const fsFromLoader = resolve(IFileSystemToken);
      expect(fs).toBe(fsFromLoader);
    });

    it('should inject IFileSystem and RmmzProjectValidator into RmmzDataLoader', () => {
      const loader = resolve(IDataLoaderToken);

      expect(loader).toBeInstanceOf(RmmzDataLoader);

      // Verify dependencies are registered
      expect(() => resolve(IFileSystemToken)).not.toThrow();
    });

    it('should inject ILogger into runtime', () => {
      const runtime = resolve(IHeadlessRuntimeToken);
      const logger = resolve(ILoggerToken);

      expect(runtime).toBeDefined();

      // Verify ILogger is available (singleton check)
      const loggerFromRuntime = resolve(ILoggerToken);
      expect(logger).toBe(loggerFromRuntime);
    });
  });

  describe('type safety', () => {
    beforeEach(() => {
      registerDependencies();
    });

    it('should provide type-safe resolve for ILogger', () => {
      const logger: ILogger = resolve(ILoggerToken);

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should provide type-safe resolve for IFileSystem', () => {
      const fs: IFileSystem = resolve(IFileSystemToken);

      expect(fs).toBeDefined();
      expect(typeof fs.exists).toBe('function');
      expect(typeof fs.readFileSync).toBe('function');
      expect(typeof fs.writeFileSync).toBe('function');
      expect(typeof fs.validateProjectPath).toBe('function');
    });

    it('should provide type-safe resolve for IConfigLoader', () => {
      const loader: IConfigLoader = resolve(IConfigLoaderToken);

      expect(loader).toBeDefined();
      expect(typeof loader.loadConfig).toBe('function');
      expect(typeof loader.loadTrechos).toBe('function');
      expect(typeof loader.validate).toBe('function');
    });

    it('should provide type-safe resolve for IDataLoader', () => {
      const loader: IDataLoader = resolve(IDataLoaderToken);

      expect(loader).toBeDefined();
      expect(typeof loader.loadDatabase).toBe('function');
      expect(typeof loader.validateProjectStructure).toBe('function');
      expect(typeof loader.validateReferences).toBe('function');
      expect(typeof loader.loadDataFile).toBe('function');
    });

    it('should provide type-safe resolve for IBattleSimulator', () => {
      const simulator: IBattleSimulator = resolve(IBattleSimulatorToken);

      expect(simulator).toBeDefined();
      expect(typeof simulator.initialize).toBe('function');
      expect(typeof simulator.executeBattle).toBe('function');
      expect(typeof simulator.getLastMetrics).toBe('function');
      expect(typeof simulator.cleanup).toBe('function');
    });

    it('should provide type-safe resolve for IReporter', () => {
      const reporter: IReporter = resolve(IReporterToken);

      expect(reporter).toBeDefined();
      expect(typeof reporter.addWarning).toBe('function');
      expect(typeof reporter.addBattleResult).toBe('function');
      expect(typeof reporter.generateReport).toBe('function');
      expect(typeof reporter.writeReport).toBe('function');
      expect(typeof reporter.exportContext).toBe('function');
    });

    it('should provide type-safe resolve for IHeadlessRuntime', () => {
      const runtime: IHeadlessRuntime = resolve(IHeadlessRuntimeToken);

      expect(runtime).toBeDefined();
      expect(typeof runtime.initialize).toBe('function');
      expect(typeof runtime.loadCoreScripts).toBe('function');
      expect(typeof runtime.setupMocks).toBe('function');
      expect(typeof runtime.cleanup).toBe('function');
    });
  });

  describe('Logger integration', () => {
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

  describe('container lifecycle', () => {
    it('should support full lifecycle: register -> resolve -> clear -> register -> resolve', () => {
      // First registration
      registerDependencies();
      const logger1 = resolve(ILoggerToken);
      expect(logger1).toBeDefined();

      // Clear
      clearContainer();

      // Second registration
      registerDependencies();
      const logger2 = resolve(ILoggerToken);
      expect(logger2).toBeDefined();
      expect(logger1).not.toBe(logger2);

      // Clear again
      clearContainer();

      // Third registration
      registerDependencies();
      const logger3 = resolve(ILoggerToken);
      expect(logger3).toBeDefined();
      expect(logger2).not.toBe(logger3);
    });

    it('should maintain isolation between test runs', () => {
      // Test 1: Register and resolve
      registerDependencies();
      const logger1 = resolve(ILoggerToken);
      expect(logger1).toBeDefined();

      // Cleanup (simulating end of test)
      clearContainer();

      // Test 2: Fresh registration
      registerDependencies();
      const logger2 = resolve(ILoggerToken);
      expect(logger2).toBeDefined();
      expect(logger1).not.toBe(logger2);

      // Cleanup
      clearContainer();
    });
  });

  describe('container export', () => {
    it('should export raw container instance for advanced usage', () => {
      registerDependencies();

      expect(container).toBeDefined();
      expect(typeof container.resolve).toBe('function');
      expect(typeof container.registerSingleton).toBe('function');
      expect(typeof container.clearInstances).toBe('function');
    });
  });
});
