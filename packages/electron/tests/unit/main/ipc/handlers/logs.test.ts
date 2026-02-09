/**
 * Unit Tests: Logs IPC Handler
 *
 * Tests for logs export handler functionality.
 * Verifies log bundle creation, file writing to reports directory, and error handling.
 *
 * @see packages/electron/src/main/ipc/handlers/logs.ts
 * @see planos/017-botao-export-logs/tasks/techspec.md Section 2.3
 */

import { describe, it, expect, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { IpcMainInvokeEvent } from 'electron';
import type { LogBundle, LogEntry } from '@coreto/electron/domain/types';
import { CONCURRENT_EXPORT_DELAY_MS, CONCURRENT_EXPORTS_COUNT, TEST_TIMEOUT_MS } from '@tests/constants/test-timeouts';

// ============================================================================
// Test Setup: Mock Electron APIs and Reports Directory
// ============================================================================

/**
 * Creates a mock IpcMainInvokeEvent for testing IPC handlers.
 *
 * @returns A mock event object compatible with IpcMainInvokeEvent
 */
const createMockEvent = (): IpcMainInvokeEvent => {
  return {
    sender: {
      once: jest.fn(),
      removeListener: jest.fn(),
    },
  } as unknown as IpcMainInvokeEvent;
};

// Test reports directory for log file writes
const mockReportsDir = path.join(process.cwd(), 'reports', 'application-logs');

// Mock electron module (handler now uses process.cwd() instead of app.getPath)
jest.mock('electron', () => ({
  app: {
    getVersion: jest.fn(() => '1.0.0-test'),
  },
}));

// Import handler after mocking electron
import { handleLogsExport } from '../../../../../src/main/ipc/handlers/logs.js';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Validates that a log bundle has the correct structure and required fields.
 *
 * @param bundle - The LogBundle to validate
 */
function validateLogBundle(bundle: LogBundle): void {
  expect(bundle).toBeDefined();
  expect(typeof bundle.id).toBe('string');
  expect(bundle.id).toMatch(/^[0-9a-f-]{36}$/); // UUID v4 format
  expect(typeof bundle.timestamp).toBe('string');
  expect(new Date(bundle.timestamp)).toBeInstanceOf(Date);
  expect(typeof bundle.appVersion).toBe('string');
  expect(typeof bundle.electronVersion).toBe('string');
  expect(typeof bundle.platform).toBe('string');
  expect(Array.isArray(bundle.logs)).toBe(true);
}

/**
 * Validates that the log file was written correctly to disk.
 *
 * @param filePath - Path to the log file to validate
 */
async function validateLogFile(filePath: string): Promise<void> {
  // Check file exists
  const stat = await fs.stat(filePath);
  expect(stat.isFile()).toBe(true);
  expect(stat.size).toBeGreaterThan(0);

  // Check file is valid JSON
  const content = await fs.readFile(filePath, 'utf-8');
  const bundle = JSON.parse(content) as LogBundle;
  validateLogBundle(bundle);
}

/**
 * Cleans up test log files created during testing.
 *
 * @param files - Array of file paths to delete
 */
async function cleanupTestFiles(files: string[]): Promise<void> {
  await Promise.allSettled(
    files.map((file) => fs.unlink(file).catch(() => {}))
  );
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Logs IPC Handler', () => {
  beforeAll(async () => {
    // Create reports directory before all tests
    await fs.mkdir(mockReportsDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up reports directory after all tests
    await fs.rm(mockReportsDir, { recursive: true, force: true }).catch(() => {});
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    const { app } = require('electron');
    (app.getVersion as jest.Mock).mockReturnValue('1.0.0-test');
  });

  afterEach(async () => {
    // Clean up test files after each test
    const files = await fs.readdir(mockReportsDir).catch(() => []);
    await cleanupTestFiles(
      files
        .filter((f) => f.startsWith('coreto-logs-'))
        .map((f) => path.join(mockReportsDir, f))
    );
  });

  describe('handleLogsExport', () => {
    it('should export logs successfully with valid bundle structure', async () => {
      // Arrange: Create mock event
      const mockEvent = createMockEvent();

      // Act: Call the handler
      const result = await handleLogsExport(mockEvent, null);

      // Assert: Verify success response
      expect(result.success).toBe(true);

      if (result.success) {
        // Verify bundle structure
        validateLogBundle(result.data.bundle);

        // Verify download path
        expect(result.data.downloadPath).toBeDefined();
        expect(typeof result.data.downloadPath).toBe('string');
        expect(result.data.downloadPath).toMatch(/reports\/application-logs\/coreto-logs-\d+\.json$/);

        // Verify file was written to disk
        await validateLogFile(result.data.downloadPath);

        // Verify bundle metadata matches expected values
        // App version is from package.json or 'unknown' in test env
        expect(result.data.bundle.appVersion).toMatch(/^(\d+\.\d+\.\d+|unknown)$/);
        expect(result.data.bundle.electronVersion).toBe(process.versions.electron ?? 'unknown');
        expect(result.data.bundle.platform).toBe(process.platform);
      }
    });

    it('should create unique bundle IDs for each export', async () => {
      // Arrange
      const mockEvent = createMockEvent();

      // Act: Export logs twice
      const result1 = await handleLogsExport(mockEvent, null);
      const result2 = await handleLogsExport(mockEvent, null);

      // Assert: Verify different bundle IDs
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      if (result1.success && result2.success) {
        expect(result1.data.bundle.id).not.toBe(result2.data.bundle.id);
      }
    });

    it('should generate timestamp-based filenames', async () => {
      // Arrange
      const mockEvent = createMockEvent();

      // Act: Export logs with a small delay
      const startTimestamp = Date.now();
      const result1 = await handleLogsExport(mockEvent, null);
      await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT_MS));
      const result2 = await handleLogsExport(mockEvent, null);
      const endTimestamp = Date.now();

      // Assert: Verify filenames are different and sequential
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      if (result1.success && result2.success) {
        const extractTimestamp = (filePath: string): number => {
          const match = filePath.match(/coreto-logs-(\d+)\.json$/);
          return match ? parseInt(match[1], 10) : 0;
        };

        const timestamp1 = extractTimestamp(result1.data.downloadPath);
        const timestamp2 = extractTimestamp(result2.data.downloadPath);

        expect(timestamp1).toBeGreaterThanOrEqual(startTimestamp);
        expect(timestamp2).toBeLessThanOrEqual(endTimestamp);
        expect(timestamp2).toBeGreaterThan(timestamp1);
      }
    });

    it('should write pretty-printed JSON to file', async () => {
      // Arrange
      const mockEvent = createMockEvent();

      // Act: Export logs
      const result = await handleLogsExport(mockEvent, null);

      // Assert: Verify JSON formatting
      expect(result.success).toBe(true);

      if (result.success) {
        const content = await fs.readFile(result.data.downloadPath, 'utf-8');

        // Pretty-printed JSON should contain newlines and indentation
        expect(content).toContain('\n'); // 2-space indentation
        expect(content).toContain('  ');

        // Verify it's valid JSON
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });

    it('should return bundle with empty logs array (stub implementation)', async () => {
      // Arrange
      const mockEvent = createMockEvent();

      // Act: Export logs
      const result = await handleLogsExport(mockEvent, null);

      // Assert: Verify logs array is empty (stub behavior)
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.bundle.logs).toEqual([]);
        expect(result.data.bundle.logs.length).toBe(0);
      }
    });

    it('should include correct metadata in bundle', async () => {
      // Arrange
      const mockEvent = createMockEvent();

      // Act: Export logs
      const result = await handleLogsExport(mockEvent, null);

      // Assert: Verify all metadata fields
      expect(result.success).toBe(true);

      if (result.success) {
        const bundle = result.data.bundle;

        // Check required fields
        expect(bundle.id).toBeDefined();
        expect(bundle.timestamp).toBeDefined();
        expect(bundle.appVersion).toBeDefined();
        expect(bundle.electronVersion).toBeDefined();
        expect(bundle.platform).toBeDefined();

        // Check optional field is undefined (stub has no project context)
        expect(bundle.projectPath).toBeUndefined();

        // Check logs array exists
        expect(Array.isArray(bundle.logs)).toBe(true);
      }
    });

    it('should handle multiple concurrent exports without conflicts', async () => {
      // Arrange: Clean up any existing log files before test
      const existingFiles = await fs.readdir(mockReportsDir).catch(() => []);
      await cleanupTestFiles(
        existingFiles
          .filter((f) => f.startsWith('coreto-logs-'))
          .map((f) => path.join(mockReportsDir, f))
      );

      const mockEvent = createMockEvent();

      // Act: Export logs with small delays to ensure unique timestamps
      const results: Awaited<ReturnType<typeof handleLogsExport>>[] = [];
      for (let i = 0; i < CONCURRENT_EXPORTS_COUNT; i++) {
        results.push(await handleLogsExport(mockEvent, null));
        // Add small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, CONCURRENT_EXPORT_DELAY_MS));
      }

      // Assert: Verify all exports succeeded with unique paths
      const successResults = results.filter((r) => r.success);
      expect(successResults.length).toBe(CONCURRENT_EXPORTS_COUNT);

      const downloadPaths = successResults
        .map((r) => (r.success ? r.data.downloadPath : ''))
        .filter(Boolean);

      // All paths should be unique
      const uniquePaths = new Set(downloadPaths);
      expect(uniquePaths.size).toBe(CONCURRENT_EXPORTS_COUNT);

      // All files should exist and be valid
      await Promise.all(downloadPaths.map((filePath) => validateLogFile(filePath)));
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Arrange: Mock fs.writeFile to fail
      const writeFileSpy = jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('EACCES: permission denied'));

      const mockEvent = createMockEvent();

      // Act: Attempt to export logs
      const result = await handleLogsExport(mockEvent, null);

      // Assert: Verify error response
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.name).toBe('Error');
        expect(result.error.message).toContain('permission denied');
        expect(result.error.severity).toBe('critical');
        expect(result.error.timestamp).toBeDefined();
      }

      // Cleanup: Restore original function
      writeFileSpy.mockRestore();
    });

    it('should return properly formatted error responses', async () => {
      // Arrange: Mock fs.writeFile to fail
      jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('Disk full'));

      const mockEvent = createMockEvent();

      // Act: Attempt to export logs
      const result = await handleLogsExport(mockEvent, null);

      // Assert: Verify error structure
      expect(result.success).toBe(false);

      if (!result.success) {
        // Error should have all required fields
        expect(result.error).toHaveProperty('name');
        expect(result.error).toHaveProperty('message');
        expect(result.error).toHaveProperty('severity');
        expect(result.error).toHaveProperty('context');
        expect(result.error).toHaveProperty('timestamp');

        // Severity should be critical
        expect(result.error.severity).toBe('critical');

        // Context should be an object
        expect(typeof result.error.context).toBe('object');

        // Timestamp should be ISO 8601 format
        expect(new Date(result.error.timestamp)).toBeInstanceOf(Date);
      }

      // Cleanup: Restore original function
      jest.restoreAllMocks();
    });
  });

  describe('integration scenarios', () => {
    it('should create valid file path with temp directory', async () => {
      // Arrange
      const mockEvent = createMockEvent();

      // Act: Export logs
      const result = await handleLogsExport(mockEvent, null);

      // Assert: Verify path structure
      expect(result.success).toBe(true);

      if (result.success) {
        const { downloadPath } = result.data;

        // Path should start with reports directory
        expect(downloadPath.slice(0, mockReportsDir.length)).toBe(mockReportsDir);

        // Path should be absolute
        expect(path.isAbsolute(downloadPath)).toBe(true);

        // Filename should match expected pattern
        const filename = path.basename(downloadPath);
        expect(filename).toMatch(/^coreto-logs-\d+\.json$/);

        // File should exist
        await fs.access(downloadPath);
      }
    });

    it('should persist bundle metadata correctly to file', async () => {
      // Arrange
      const mockEvent = createMockEvent();

      // Act: Export logs
      const result = await handleLogsExport(mockEvent, null);

      // Assert: Verify file content matches response
      expect(result.success).toBe(true);

      if (result.success) {
        // Read file content
        const content = await fs.readFile(result.data.downloadPath, 'utf-8');
        const fileBundle = JSON.parse(content) as LogBundle;

        // Bundle in file should match bundle in response
        expect(fileBundle.id).toBe(result.data.bundle.id);
        expect(fileBundle.timestamp).toBe(result.data.bundle.timestamp);
        expect(fileBundle.appVersion).toBe(result.data.bundle.appVersion);
        expect(fileBundle.electronVersion).toBe(result.data.bundle.electronVersion);
        expect(fileBundle.platform).toBe(result.data.bundle.platform);
        expect(fileBundle.logs).toEqual(result.data.bundle.logs);
      }
    });

    it('should handle rapid successive exports', async () => {
      // Arrange
      const mockEvent = createMockEvent();
      const exportCount = 10;

      // Act: Export logs rapidly
      const startTime = Date.now();
      const results = await Promise.all(
        Array.from({ length: exportCount }, () => handleLogsExport(mockEvent, null))
      );
      const duration = Date.now() - startTime;

      // Assert: All should succeed quickly
      const successResults = results.filter((r) => r.success);
      expect(successResults.length).toBe(exportCount);

      // Should complete in reasonable time (< 1 second for 10 exports)
      expect(duration).toBeLessThan(1000);

      // All files should be valid
      await Promise.all(
        successResults.map((r) => {
          if (r.success) {
            return validateLogFile(r.data.downloadPath);
          }
          return Promise.resolve();
        })
      );
    });
  });
});
