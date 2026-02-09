/**
 * Integration Test: Logs Export Flow
 *
 * This test verifies the critical flow:
 * 1. IPC handler logs:export completes successfully
 * 2. LogAggregator creates LogBundle with metadata
 * 3. LogBundle is written to reports/application-logs directory
 * 4. Response contains bundle and downloadPath
 * 5. LogBundle structure matches expected interface
 * 6. Error handling on IPC failure
 *
 * @see packages/electron/src/main/ipc/handlers/logs.ts
 * @see packages/electron/src/domain/types/logs.ts
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import path from 'node:path';
import fs from 'node:fs/promises';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import type { ILogger } from '@coreto/core';
import { ILoggerToken } from '@coreto/core';
import type { LogBundle } from '@coreto/electron/domain/types';
import { registerMainDependencies } from '../../src/main/di/container.js';

// Mock Electron APIs
const mockApp = {
  getVersion: jest.fn().mockReturnValue('1.0.0-test'),
};

const mockElectron = {
  app: mockApp,
};

// Mock electron module
jest.mock('electron', () => mockElectron, { virtual: true });

describe('Logs Export Flow Integration', () => {
  let mockLogger: ILogger;
  let reportsDir: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handleLogsExport: any; // Handler type is complex, using any for simplicity

  // Setup and teardown - run once for all tests
  beforeAll(async () => {
    // Setup reports directory for tests (relative to project root)
    // The handler uses process.cwd() + 'reports/application-logs'
    // For tests, we create a test reports directory
    reportsDir = path.join(process.cwd(), 'reports', 'application-logs');
    await fs.mkdir(reportsDir, { recursive: true });

    // Register main dependencies BEFORE importing handler
    registerMainDependencies();

    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    // Register mock logger in DI container BEFORE importing handler
    container.registerInstance<ILogger>(ILoggerToken, mockLogger);

    // Import handler AFTER dependencies are registered
    const logsModule = await import('../../src/main/ipc/handlers/logs.js');
    handleLogsExport = logsModule.handleLogsExport;
  });

  afterAll(async () => {
    // Cleanup reports directory
    try {
      await fs.rm(reportsDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    // Clear all mocks before each test (but not DI container)
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up any test files created
    try {
      const files = await fs.readdir(reportsDir);
      for (const file of files) {
        await fs.unlink(path.join(reportsDir, file));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('logs:export IPC handler', () => {
    it('should export logs successfully with valid LogBundle structure', async () => {
      // Act: Call logs export handler
      const result = await handleLogsExport(null, null);

      // Assert: Handler returns success
      expect(result.success).toBe(true);

      // Assert: Response contains bundle and downloadPath
      if (result.success && result.data) {
        const { bundle, downloadPath } = result.data;

        // Assert: LogBundle has all required top-level fields
        expect(bundle.id).toBeDefined(); // Bundle should have unique identifier
        expect(bundle.timestamp).toBeDefined(); // Bundle should have ISO 8601 timestamp
        expect(bundle.appVersion).toBeDefined(); // Bundle should have app version
        expect(bundle.electronVersion).toBeDefined(); // Bundle should have Electron version
        expect(bundle.platform).toBeDefined(); // Bundle should have platform identifier
        expect(bundle.logs).toBeDefined(); // Bundle should have logs array

        // Assert: LogBundle field types are correct
        expect(typeof bundle.id).toBe('string');
        expect(typeof bundle.timestamp).toBe('string');
        expect(typeof bundle.appVersion).toBe('string');
        expect(typeof bundle.electronVersion).toBe('string');
        expect(typeof bundle.platform).toBe('string');
        expect(Array.isArray(bundle.logs)).toBe(true);

        // Assert: LogBundle id is a valid UUID
        expect(bundle.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

        // Assert: LogBundle timestamp is valid ISO 8601
        expect(new Date(bundle.timestamp).toISOString()).toBe(bundle.timestamp);

        // Assert: LogBundle platform is valid Node.js platform
        expect(['darwin', 'linux', 'win32']).toContain(bundle.platform);

        // Assert: downloadPath is provided and valid
        expect(downloadPath).toBeDefined();
        expect(typeof downloadPath).toBe('string');
        expect(downloadPath).toContain('coreto-logs-');
        expect(downloadPath).toContain('.json');

        // Assert: Filename follows pattern (extract basename for validation)
        const filename = path.basename(downloadPath);
        expect(filename).toMatch(/^coreto-logs-\d+\.json$/);

        // Assert: File was actually created at downloadPath
        const fileExists = await fs.access(downloadPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);

        // Assert: File content is valid JSON matching bundle
        const fileContent = await fs.readFile(downloadPath, 'utf-8');
        const parsedBundle = JSON.parse(fileContent) as LogBundle;

        expect(parsedBundle.id).toBe(bundle.id);
        expect(parsedBundle.timestamp).toBe(bundle.timestamp);
        expect(parsedBundle.appVersion).toBe(bundle.appVersion);
        expect(parsedBundle.electronVersion).toBe(bundle.electronVersion);
        expect(parsedBundle.platform).toBe(bundle.platform);
        expect(parsedBundle.logs).toEqual(bundle.logs);
      } else {
        throw new Error('Expected successful result with data');
      }
    });

    it('should create LogBundle with empty logs array (stub implementation)', async () => {
      // Act: Call logs export handler
      const result = await handleLogsExport(null, null);

      // Assert: Handler returns success
      expect(result.success).toBe(true);

      if (result.success && result.data) {
        const { bundle } = result.data;

        // Assert: Logs array is present but empty (stub behavior)
        expect(bundle.logs).toEqual([]);
        expect(bundle.logs).toHaveLength(0);

        // Assert: Other metadata fields are populated
        expect(bundle.id).toBeTruthy();
        expect(bundle.timestamp).toBeTruthy();
        expect(bundle.appVersion).toBeTruthy();
        expect(bundle.electronVersion).toBeTruthy();
        expect(bundle.platform).toBeTruthy();
      }
    });

    it('should create unique log files for multiple exports', async () => {
      // Act: Call logs export handler multiple times with small delays to ensure unique timestamps
      const result1 = await handleLogsExport(null, null);
      await new Promise(resolve => setTimeout(resolve, 2)); // Small delay to ensure unique timestamp
      const result2 = await handleLogsExport(null, null);
      await new Promise(resolve => setTimeout(resolve, 2)); // Small delay to ensure unique timestamp
      const result3 = await handleLogsExport(null, null);

      // Assert: All exports succeed
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      if (result1.success && result2.success && result3.success &&
          result1.data && result2.data && result3.data) {
        const { downloadPath: path1 } = result1.data;
        const { downloadPath: path2 } = result2.data;
        const { downloadPath: path3 } = result3.data;

        // Assert: Each export creates a unique file
        expect(path1).not.toBe(path2);
        expect(path2).not.toBe(path3);
        expect(path1).not.toBe(path3);

        // Assert: All files exist
        const exists1 = await fs.access(path1).then(() => true).catch(() => false);
        const exists2 = await fs.access(path2).then(() => true).catch(() => false);
        const exists3 = await fs.access(path3).then(() => true).catch(() => false);

        expect(exists1).toBe(true);
        expect(exists2).toBe(true);
        expect(exists3).toBe(true);

        // Assert: Each bundle has unique ID
        const { bundle: bundle1 } = result1.data;
        const { bundle: bundle2 } = result2.data;
        const { bundle: bundle3 } = result3.data;

        expect(bundle1.id).not.toBe(bundle2.id);
        expect(bundle2.id).not.toBe(bundle3.id);
        expect(bundle1.id).not.toBe(bundle3.id);
      }
    });

    it('should preserve LogBundle structure when written to file', async () => {
      // Act: Call logs export handler
      const result = await handleLogsExport(null, null);

      // Assert: Handler returns success
      expect(result.success).toBe(true);

      if (result.success && result.data) {
        const { bundle, downloadPath } = result.data;

        // Read file and verify structure
        const fileContent = await fs.readFile(downloadPath, 'utf-8');
        const parsedBundle = JSON.parse(fileContent) as LogBundle;

        // Verify all required fields exist in file
        expect(parsedBundle).toHaveProperty('id');
        expect(parsedBundle).toHaveProperty('timestamp');
        expect(parsedBundle).toHaveProperty('appVersion');
        expect(parsedBundle).toHaveProperty('electronVersion');
        expect(parsedBundle).toHaveProperty('platform');
        expect(parsedBundle).toHaveProperty('logs');

        // Verify field types match
        expect(typeof parsedBundle.id).toBe(typeof bundle.id);
        expect(typeof parsedBundle.timestamp).toBe(typeof bundle.timestamp);
        expect(typeof parsedBundle.appVersion).toBe(typeof bundle.appVersion);
        expect(typeof parsedBundle.electronVersion).toBe(typeof bundle.electronVersion);
        expect(typeof parsedBundle.platform).toBe(typeof bundle.platform);
        expect(Array.isArray(parsedBundle.logs)).toBe(true);

        // Verify JSON is pretty-printed (contains newlines and indentation)
        expect(fileContent).toContain('\n');
        expect(fileContent).toContain('  ');
      }
    });

    it('should include Electron metadata in LogBundle', async () => {
      // Act: Call logs export handler
      const result = await handleLogsExport(null, null);

      // Assert: Handler returns success
      expect(result.success).toBe(true);

      if (result.success && result.data) {
        const { bundle } = result.data;

        // Assert: Electron version is from process.versions (or 'unknown' in test env)
        expect(['33.0.0', process.versions.electron ?? 'unknown', 'unknown']).toContain(bundle.electronVersion);

        // Assert: Platform matches current process
        expect(bundle.platform).toBe(process.platform);

        // Assert: App version is from package.json or 'unknown' if not found
        // In test environment, package.json may not be resolvable
        expect(bundle.appVersion).toMatch(/^(\d+\.\d+\.\d+|unknown)$/);
      }
    });
  });

  describe('error handling', () => {
    it('should handle empty payload gracefully', async () => {
      // Act: Call logs export handler with null payload
      const result = await handleLogsExport(null, null);

      // Assert: Handler returns success (payload is ignored)
      expect(result.success).toBe(true);

      if (result.success && result.data) {
        expect(result.data.bundle).toBeDefined();
        expect(result.data.downloadPath).toBeDefined();
      }
    });

    it('should handle undefined payload gracefully', async () => {
      // Act: Call logs export handler with undefined payload
      const result = await handleLogsExport(null, undefined);

      // Assert: Handler returns success (payload is ignored)
      expect(result.success).toBe(true);

      if (result.success && result.data) {
        expect(result.data.bundle).toBeDefined();
        expect(result.data.downloadPath).toBeDefined();
      }
    });
  });

  describe('LogBundle structure validation', () => {
    it('should export LogBundle with valid ISO 8601 timestamps', async () => {
      // Act: Call logs export handler
      const result = await handleLogsExport(null, null);

      // Assert: Handler returns success
      expect(result.success).toBe(true);

      if (result.success && result.data) {
        const { bundle } = result.data;

        // Assert: Timestamp is valid ISO 8601 format
        const timestamp = new Date(bundle.timestamp);
        expect(timestamp.toISOString()).toBe(bundle.timestamp);
        expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
        expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds
      }
    });

    it('should export LogBundle with valid UUID v4', async () => {
      // Act: Call logs export handler
      const result = await handleLogsExport(null, null);

      // Assert: Handler returns success
      expect(result.success).toBe(true);

      if (result.success && result.data) {
        const { bundle } = result.data;

        // Assert: ID is valid UUID v4 format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(bundle.id).toMatch(uuidRegex);
      }
    });

    it('should export LogBundle with platform-specific values', async () => {
      // Act: Call logs export handler
      const result = await handleLogsExport(null, null);

      // Assert: Handler returns success
      expect(result.success).toBe(true);

      if (result.success && result.data) {
        const { bundle } = result.data;

        // Assert: Platform is valid Node.js platform
        const validPlatforms = ['darwin', 'linux', 'win32', 'android', 'aix', 'freebsd', 'openbsd', 'sunos', 'cygwin'];
        expect(validPlatforms).toContain(bundle.platform);
      }
    });
  });

  describe('file creation verification', () => {
    it('should create log file with correct naming pattern', async () => {
      // Act: Call logs export handler
      const result = await handleLogsExport(null, null);

      // Assert: Handler returns success
      expect(result.success).toBe(true);

      if (result.success && result.data) {
        const { downloadPath } = result.data;

        // Assert: Filename follows pattern: coreto-logs-{timestamp}.json
        const filename = path.basename(downloadPath);
        expect(filename).toMatch(/^coreto-logs-\d+\.json$/);

        // Assert: Extract and validate timestamp from filename
        const match = filename.match(/^coreto-logs-(\d+)\.json$/);
        expect(match).not.toBeNull();
        if (match) {
          const fileTimestamp = parseInt(match[1] ?? '0', 10);
          expect(fileTimestamp).toBeLessThanOrEqual(Date.now());
          expect(fileTimestamp).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds
        }
      }
    });

    it('should create log file in reports/application-logs directory', async () => {
      // Act: Call logs export handler
      const result = await handleLogsExport(null, null);

      // Assert: Handler returns success
      expect(result.success).toBe(true);

      if (result.success && result.data) {
        const { downloadPath } = result.data;

        // Assert: File is in reports/application-logs directory
        const dir = path.dirname(downloadPath);
        expect(dir).toBe(reportsDir);

        // Assert: File exists in reports directory
        const files = await fs.readdir(reportsDir);
        const filename = path.basename(downloadPath);
        expect(files).toContain(filename);
      }
    });

    it('should create readable JSON file', async () => {
      // Act: Call logs export handler
      const result = await handleLogsExport(null, null);

      // Assert: Handler returns success
      expect(result.success).toBe(true);

      if (result.success && result.data) {
        const { downloadPath } = result.data;

        // Assert: File can be read and parsed
        const fileContent = await fs.readFile(downloadPath, 'utf-8');
        expect(() => JSON.parse(fileContent)).not.toThrow();

        // Assert: File is valid JSON
        const parsed = JSON.parse(fileContent);
        expect(parsed).toBeDefined();
        expect(typeof parsed).toBe('object');
      }
    });
  });
});
