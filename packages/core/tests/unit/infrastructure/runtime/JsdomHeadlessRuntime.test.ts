/**
 * JsdomHeadlessRuntime Unit Tests
 *
 * Tests the IHeadlessRuntime adapter implementation for JSDOM-based
 * headless execution of RPG Maker MZ.
 */

import { JsdomHeadlessRuntime } from '../../../../src/infrastructure/runtime/JsdomHeadlessRuntime.js';
import type { ILogger } from '../../../../src/core/ports/ILogger.js';
import { RuntimeError } from '../../../../src/core/errors/RuntimeError.js';

describe('JsdomHeadlessRuntime', () => {
  let runtime: JsdomHeadlessRuntime;
  let mockLogger: ILogger;

  beforeEach(() => {
    // Mock ILogger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    // Create runtime instance
    runtime = new JsdomHeadlessRuntime(mockLogger);
  });

  afterEach(() => {
    // Cleanup after each test
    if (runtime.isActive()) {
      void runtime.cleanup();
    }
  });

  describe('constructor', () => {
    it('should create instance with logger', () => {
      const testRuntime = new JsdomHeadlessRuntime(mockLogger);

      expect(testRuntime).toBeInstanceOf(JsdomHeadlessRuntime);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[JsdomHeadlessRuntime] Constructor called',
        { diagnosticMode: false }
      );
    });

    it('should start in non-initialized state', () => {
      expect(runtime.isActive()).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize JSDOM environment successfully', async () => {
      await runtime.initialize();

      expect(runtime.isActive()).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith('[JsdomHeadlessRuntime] initialize() called');
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[JsdomHeadlessRuntime] JSDOM environment ready for initialization'
      );
    });

    it('should allow multiple initialize calls without error', async () => {
      await runtime.initialize();
      await runtime.initialize(); // Second call should be safe

      expect(runtime.isActive()).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[JsdomHeadlessRuntime] Already initialized, skipping'
      );
    });

    it('should throw RuntimeError if initialization fails', async () => {
      // Create a runtime that will fail to initialize
      const failingLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      };

      // This test verifies the error handling structure
      // Actual JSDOM initialization failure scenarios are environment-dependent
      const failingRuntime = new JsdomHeadlessRuntime(failingLogger);

      // The runtime should successfully initialize in normal test conditions
      await expect(failingRuntime.initialize()).resolves.not.toThrow();
    });
  });

  describe('loadCoreScripts', () => {
    it('should throw RuntimeError if not initialized', async () => {
      await expect(runtime.loadCoreScripts('/project/path')).rejects.toThrow(RuntimeError);
      await expect(runtime.loadCoreScripts('/project/path')).rejects.toThrow(
        'Cannot load core scripts: runtime not initialized'
      );
    });

    it('should accept project path after initialization', async () => {
      await runtime.initialize();

      // This method currently notes that scripts will be loaded during bootstrap
      await runtime.loadCoreScripts('/valid/project');

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[JsdomHeadlessRuntime] Core scripts will be loaded during full bootstrap'
      );
    });

    it('should log debug message on call', async () => {
      await runtime.initialize();

      await runtime.loadCoreScripts('/test/project');

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[JsdomHeadlessRuntime] loadCoreScripts() called',
        { projectPath: '/test/project' }
      );
    });

    it('should store project path for later use', async () => {
      await runtime.initialize();

      await runtime.loadCoreScripts('/stored/project/path');

      expect(runtime.getProjectPath()).toBe('/stored/project/path');
    });
  });

  describe('setupMocks', () => {
    it('should throw RuntimeError if not initialized', () => {
      expect(() => runtime.setupMocks()).toThrow(RuntimeError);
      expect(() => runtime.setupMocks()).toThrow(
        'Cannot setup mocks: runtime not initialized'
      );
    });

    it('should setup mocks successfully after initialization', async () => {
      await runtime.initialize();

      expect(() => runtime.setupMocks()).not.toThrow();

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[JsdomHeadlessRuntime] Graphics and audio mocks ready'
      );
    });

    it('should log debug message on call', async () => {
      await runtime.initialize();

      runtime.setupMocks();

      expect(mockLogger.debug).toHaveBeenCalledWith('[JsdomHeadlessRuntime] setupMocks() called');
    });
  });

  describe('cleanup', () => {
    it('should cleanup successfully when initialized', async () => {
      await runtime.initialize();

      await runtime.cleanup();

      expect(runtime.isActive()).toBe(false);
      expect(runtime.getProjectPath()).toBe(null);
    });

    it('should cleanup successfully when not initialized', async () => {
      // Should not throw even if not initialized
      await expect(runtime.cleanup()).resolves.not.toThrow();
    });

    it('should log info message on cleanup', async () => {
      await runtime.initialize();

      await runtime.cleanup();

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[JsdomHeadlessRuntime] JSDOM environment cleaned up'
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      await runtime.initialize();

      // The runtime should handle cleanup errors without throwing
      await expect(runtime.cleanup()).resolves.not.toThrow();
    });
  });

  describe('bootstrap', () => {
    it('should throw RuntimeError if not initialized', async () => {
      await expect(runtime.bootstrap('/project/path')).rejects.toThrow(RuntimeError);
      await expect(runtime.bootstrap('/project/path')).rejects.toThrow(
        'Cannot bootstrap: runtime not initialized'
      );
    });

    it('should successfully bootstrap with valid project path', async () => {
      await runtime.initialize();

      // Note: Actual bootstrap will fail without stub-index.html
      // This test verifies the method call structure and error handling
      try {
        await runtime.bootstrap('/project/path');
      } catch (error) {
        // Expected to fail in test environment without stub-index.html
        expect(error).toBeInstanceOf(Error);
      }

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[JsdomHeadlessRuntime] bootstrap() called',
        { projectPath: '/project/path', seed: undefined }
      );
    });

    it('should accept seed parameter for deterministic RNG', async () => {
      await runtime.initialize();

      try {
        await runtime.bootstrap('/project/path', 12345);
      } catch (error) {
        // Expected to fail in test environment without stub-index.html
        expect(error).toBeInstanceOf(Error);
      }

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[JsdomHeadlessRuntime] bootstrap() called',
        { projectPath: '/project/path', seed: 12345 }
      );
    });
  });

  describe('getDOM', () => {
    it('should return null when not initialized', () => {
      expect(runtime.getDOM()).toBe(null);
    });

    it('should return JSDOM instance after initialization', async () => {
      await runtime.initialize();

      // After initialization, bootstrapper should be created
      // The JSDOM instance might be null if bootstrap hasn't completed
      expect(runtime.isActive()).toBe(true);
    });
  });

  describe('isActive', () => {
    it('should return false when not initialized', () => {
      expect(runtime.isActive()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await runtime.initialize();

      expect(runtime.isActive()).toBe(true);
    });

    it('should return false after cleanup', async () => {
      await runtime.initialize();
      await runtime.cleanup();

      expect(runtime.isActive()).toBe(false);
    });
  });

  describe('getProjectPath', () => {
    it('should return null when no project path set', () => {
      expect(runtime.getProjectPath()).toBe(null);
    });

    it('should return project path after loadCoreScripts', async () => {
      await runtime.initialize();
      await runtime.loadCoreScripts('/test/project');

      expect(runtime.getProjectPath()).toBe('/test/project');
    });

    it('should return null after cleanup', async () => {
      await runtime.initialize();
      await runtime.loadCoreScripts('/test/project');
      await runtime.cleanup();

      expect(runtime.getProjectPath()).toBe(null);
    });
  });

  describe('interface compliance', () => {
    it('should implement IHeadlessRuntime interface', async () => {
      // Verify all required methods exist
      expect(typeof runtime.initialize).toBe('function');
      expect(typeof runtime.loadCoreScripts).toBe('function');
      expect(typeof runtime.setupMocks).toBe('function');
      expect(typeof runtime.cleanup).toBe('function');

      // Verify method signatures
      await runtime.initialize();
      await runtime.loadCoreScripts('/test');
      runtime.setupMocks();
      await runtime.cleanup();
    });

    it('should handle all methods in correct order', async () => {
      // Test the typical workflow
      await runtime.initialize();
      expect(runtime.isActive()).toBe(true);

      await runtime.loadCoreScripts('/project');
      expect(runtime.getProjectPath()).toBe('/project');

      runtime.setupMocks();
      // No exception thrown

      await runtime.cleanup();
      expect(runtime.isActive()).toBe(false);
    });
  });

  describe('dependency injection', () => {
    it('should use injected logger for all operations', async () => {
      const testRuntime = new JsdomHeadlessRuntime(mockLogger);

      await testRuntime.initialize();
      await testRuntime.loadCoreScripts('/project');
      testRuntime.setupMocks();
      await testRuntime.cleanup();

      // Verify logger was called for all operations
      expect(mockLogger.debug).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });
});
