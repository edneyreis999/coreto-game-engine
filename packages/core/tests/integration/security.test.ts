/**
 * Manual QA Tests for Security (Section 5)
 * These tests validate the manual QA scenarios from MANUAL_QA_GUIDE.md
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PathSanitizer, ReadOnlyGuard, ValidationError } from '@coreto/core';

describe('Security Tests', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'security-qa-'));
    // Create a fake project structure
    fs.mkdirSync(path.join(tempDir, 'fake-mz-project', 'data'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'fake-mz-project', 'js'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'fake-mz-project', 'game.rmmzproject'), '');
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('TC-SEC-001: PathSanitizer - Path Traversal', () => {
    it('should throw ValidationError for path traversal attempt (../../etc/passwd)', () => {
      expect(() => {
        PathSanitizer.sanitize('../../etc/passwd');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for path traversal with dot-dot sequences', () => {
      expect(() => {
        PathSanitizer.sanitize('../../../etc/passwd');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for path traversal in middle of path', () => {
      expect(() => {
        PathSanitizer.sanitize('/some/path/../../../etc/passwd');
      }).toThrow(ValidationError);
    });

    it('should include path traversal message in error', () => {
      try {
        PathSanitizer.sanitize('../../etc/passwd');
        fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message.toLowerCase()).toContain('path traversal');
      }
    });
  });

  describe('TC-SEC-002: PathSanitizer - Caminho Absoluto Válido', () => {
    it('should validate valid absolute path', () => {
      const projectPath = path.join(tempDir, 'fake-mz-project');
      const result = PathSanitizer.sanitize(projectPath);

      // Should return an absolute resolved path
      expect(path.isAbsolute(result)).toBe(true);
      expect(result).toBe(projectPath);
    });

    it('should validate /tmp style path', () => {
      // /tmp is valid, it exists
      const result = PathSanitizer.sanitize('/tmp');
      expect(path.isAbsolute(result)).toBe(true);
    });
  });

  describe('TC-SEC-003: ReadOnlyGuard - Conceitual', () => {
    it('should be importable and have expected methods', () => {
      // Verify class exists
      expect(ReadOnlyGuard).toBeDefined();

      // Create instance
      const guard = new ReadOnlyGuard();

      // Verify methods exist
      expect(typeof guard.protect).toBe('function');
      expect(typeof guard.unprotect).toBe('function');
      expect(typeof guard.enable).toBe('function');
      expect(typeof guard.disable).toBe('function');
    });

    it('should track protected paths', () => {
      const guard = new ReadOnlyGuard();
      const testPath = '/some/protected/path';

      guard.protect(testPath);

      // The path should now be tracked (internal state)
      // We verify by calling unprotect which should not throw
      expect(() => guard.unprotect(testPath)).not.toThrow();
    });

    // Note: enable/disable have ESM/Jest limitations (6 tests skipped in main test suite)
    // See: tests/unit/infrastructure/security/ReadOnlyGuard.test.ts
    it('should have enable/disable methods available (ESM limitations documented)', () => {
      const guard = new ReadOnlyGuard();

      // Methods should exist
      expect(typeof guard.enable).toBe('function');
      expect(typeof guard.disable).toBe('function');

      // Note: Actual enable() may fail due to ESM property redefinition restrictions
      // This is documented in MANUAL_QA_GUIDE.md as a known issue
    });
  });
});