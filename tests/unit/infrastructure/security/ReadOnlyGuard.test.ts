/**
 * ReadOnlyGuard unit tests.
 *
 * Tests path protection logic and guard state management.
 *
 * NOTE: Full integration testing of fs.writeFileSync interception is not possible
 * in Jest/ESM environment due to module system limitations. The guard works in
 * production runtime but cannot be fully tested here.
 *
 * These tests verify:
 * - Path registration and management
 * - Guard enable/disable state
 * - Protected path tracking
 */

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { ReadOnlyGuard } from '../../../packages/core/src/infrastructure/security/ReadOnlyGuard.js';

describe('ReadOnlyGuard', () => {
  let guard: ReadOnlyGuard;
  let testPath1: string;
  let testPath2: string;
  const fsCjs = require('fs') as typeof import('fs');
  let originalWriteFileSync: typeof fsCjs.writeFileSync;

  beforeEach(() => {
    guard = new ReadOnlyGuard();
    testPath1 = path.join(os.tmpdir(), 'protected1');
    testPath2 = path.join(os.tmpdir(), 'protected2');
    originalWriteFileSync = fsCjs.writeFileSync;
  });

  afterEach(() => {
    // Ensure guard is disabled after each test
    if (guard.isEnabled()) {
      guard.disable();
    }
    // Ensure fs.writeFileSync is restored even if a test corrupts guard internals
    (fsCjs as any).writeFileSync = originalWriteFileSync;
  });

  describe('protect/unprotect', () => {
    it('should add path to protected list', () => {
      guard.protect(testPath1);
      const paths = guard.getProtectedPaths();
      expect(paths).toContain(path.resolve(testPath1));
    });

    it('should resolve relative paths to absolute', () => {
      const relativePath = 'relative/path';
      guard.protect(relativePath);

      const paths = guard.getProtectedPaths();
      const absolutePath = path.resolve(relativePath);
      expect(paths).toContain(absolutePath);
    });

    it('should allow multiple protected paths', () => {
      guard.protect(testPath1);
      guard.protect(testPath2);

      const paths = guard.getProtectedPaths();
      expect(paths).toHaveLength(2);
      expect(paths).toContain(path.resolve(testPath1));
      expect(paths).toContain(path.resolve(testPath2));
    });

    it('should remove path from protected list', () => {
      guard.protect(testPath1);
      guard.unprotect(testPath1);

      const paths = guard.getProtectedPaths();
      expect(paths).not.toContain(path.resolve(testPath1));
    });

    it('should handle protecting the same path multiple times', () => {
      guard.protect(testPath1);
      guard.protect(testPath1);
      guard.protect(testPath1);

      const paths = guard.getProtectedPaths();
      // Set should deduplicate
      expect(paths.filter((p) => p === path.resolve(testPath1))).toHaveLength(1);
    });
  });

  describe('enable/disable', () => {
    it('should start disabled', () => {
      expect(guard.isEnabled()).toBe(false);
    });

    it('should enable guard successfully', () => {
      expect(guard.isEnabled()).toBe(false);
      guard.enable();
      expect(guard.isEnabled()).toBe(true);
    });

    it('should disable guard successfully', () => {
      guard.enable();
      expect(guard.isEnabled()).toBe(true);
      guard.disable();
      expect(guard.isEnabled()).toBe(false);
    });

    it('should be idempotent when enabling multiple times', () => {
      guard.enable();
      guard.enable();
      guard.enable();
      expect(guard.isEnabled()).toBe(true);

      // Should be able to disable normally
      guard.disable();
      expect(guard.isEnabled()).toBe(false);
    });

    it('should be idempotent when disabling multiple times', () => {
      guard.enable();
      guard.disable();
      guard.disable();
      guard.disable();
      expect(guard.isEnabled()).toBe(false);
    });

    it('should handle enable-disable cycles', () => {
      guard.enable();
      guard.disable();
      guard.enable();
      guard.disable();
      expect(guard.isEnabled()).toBe(false);
    });

    it('should block writes to protected paths and allow writes elsewhere', () => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'roguard-'));
      const protectedDir = path.join(tmp, 'protected');
      const safeDir = path.join(tmp, 'safe');
      fs.mkdirSync(protectedDir, { recursive: true });
      fs.mkdirSync(safeDir, { recursive: true });

      guard.protect(protectedDir);
      guard.enable();

      expect(() => {
        fs.writeFileSync(path.join(protectedDir, 'data.json'), '{}', 'utf-8');
      }).toThrow(/Attempted write to protected path/);

      const safeFile = path.join(safeDir, 'ok.txt');
      expect(() => {
        fs.writeFileSync(safeFile, 'ok', 'utf-8');
      }).not.toThrow();
      expect(fs.readFileSync(safeFile, 'utf-8')).toBe('ok');

      // Cleanup
      guard.disable();
      fs.rmSync(tmp, { recursive: true, force: true });
    });

    it('should not apply path checks for file descriptors (non-string paths)', () => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'roguard-fd-'));
      const protectedDir = path.join(tmp, 'protected');
      fs.mkdirSync(protectedDir, { recursive: true });

      guard.protect(protectedDir);
      guard.enable();

      const file = path.join(protectedDir, 'fd-write.txt');
      const fd = fs.openSync(file, 'w');

      expect(() => {
        fs.writeFileSync(fd, 'via-fd');
      }).not.toThrow();

      fs.closeSync(fd);
      guard.disable();
      expect(fs.readFileSync(file, 'utf-8')).toBe('via-fd');
      fs.rmSync(tmp, { recursive: true, force: true });
    });

    it('should throw internal error if originalWriteFileSync is missing while enabled', () => {
      guard.enable();
      // Simulate corruption of internal state (defense-in-depth)
      (guard as any).originalWriteFileSync = null;

      expect(() => {
        fs.writeFileSync(path.join(os.tmpdir(), 'roguard-internal.txt'), 'x', 'utf-8');
      }).toThrow(/originalWriteFileSync not stored/);

      // Cleanup: restore by disabling guard state manually
      (guard as any).enabled = false;
    });

    it('should throw internal error if disabling without originalWriteFileSync', () => {
      guard.enable();
      (guard as any).originalWriteFileSync = null;
      expect(() => guard.disable()).toThrow(/originalWriteFileSync not stored/);
      (guard as any).enabled = false;
    });

    it('should follow descriptor branches when overriding/restoring fs.writeFileSync', () => {
      const originalGetDesc = Object.getOwnPropertyDescriptor;

      // Force enable() into assignment branch (configurable=false, writable=true)
      jest.spyOn(Object, 'getOwnPropertyDescriptor').mockImplementation((obj: any, prop: any) => {
        if (obj === (require('fs') as any) && prop === 'writeFileSync') {
          return { configurable: false, writable: true, enumerable: true, value: (require('fs') as any).writeFileSync } as any;
        }
        return originalGetDesc(obj, prop);
      });

      expect(() => guard.enable()).not.toThrow();
      expect(guard.isEnabled()).toBe(true);

      // Restore descriptor implementation and cleanup
      (Object.getOwnPropertyDescriptor as any).mockRestore?.();
      guard.disable();
    });

    it('should throw if fs.writeFileSync is neither configurable nor writable', () => {
      const originalGetDesc = Object.getOwnPropertyDescriptor;
      jest.spyOn(Object, 'getOwnPropertyDescriptor').mockImplementation((obj: any, prop: any) => {
        if (obj === (require('fs') as any) && prop === 'writeFileSync') {
          return { configurable: false, writable: false, enumerable: true, value: (require('fs') as any).writeFileSync } as any;
        }
        return originalGetDesc(obj, prop);
      });

      expect(() => guard.enable()).toThrow(/cannot be overridden/);

      (Object.getOwnPropertyDescriptor as any).mockRestore?.();
    });

    it('should throw internal error if fs.writeFileSync cannot be restored', () => {
      guard.enable();

      const originalGetDesc = Object.getOwnPropertyDescriptor;
      jest.spyOn(Object, 'getOwnPropertyDescriptor').mockImplementation((obj: any, prop: any) => {
        if (obj === (require('fs') as any) && prop === 'writeFileSync') {
          return { configurable: false, writable: false, enumerable: true, value: (require('fs') as any).writeFileSync } as any;
        }
        return originalGetDesc(obj, prop);
      });

      expect(() => guard.disable()).toThrow(/cannot be restored/);

      (Object.getOwnPropertyDescriptor as any).mockRestore?.();
      expect(() => guard.disable()).not.toThrow();
    });
  });

  describe('getProtectedPaths', () => {
    it('should return empty array initially', () => {
      expect(guard.getProtectedPaths()).toEqual([]);
    });

    it('should return array of protected paths', () => {
      guard.protect(testPath1);
      guard.protect(testPath2);

      const paths = guard.getProtectedPaths();
      expect(paths).toHaveLength(2);
      expect(paths).toContain(path.resolve(testPath1));
      expect(paths).toContain(path.resolve(testPath2));
    });

    it('should return copy of internal array', () => {
      guard.protect(testPath1);

      const paths1 = guard.getProtectedPaths();
      const paths2 = guard.getProtectedPaths();

      expect(paths1).not.toBe(paths2); // Different array instances
      expect(paths1).toEqual(paths2); // But same content
    });

    it('should not allow modification of internal state via returned array', () => {
      guard.protect(testPath1);

      const paths = guard.getProtectedPaths();
      paths.push('/malicious/path');

      // Internal state should not be affected
      const actualPaths = guard.getProtectedPaths();
      expect(actualPaths).not.toContain('/malicious/path');
      expect(actualPaths).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should clear all protected paths when disabled', () => {
      guard.protect(testPath1);
      guard.protect(testPath2);

      expect(guard.getProtectedPaths()).toHaveLength(2);

      guard.clear();

      expect(guard.getProtectedPaths()).toHaveLength(0);
    });

    it('should throw if trying to clear while enabled', () => {
      guard.protect(testPath1);
      guard.enable();

      expect(() => {
        guard.clear();
      }).toThrow('Cannot clear protected paths while guard is enabled');
    });

    it('should allow protecting paths again after clear', () => {
      guard.protect(testPath1);
      guard.clear();
      guard.protect(testPath2);

      const paths = guard.getProtectedPaths();
      expect(paths).toHaveLength(1);
      expect(paths).toContain(path.resolve(testPath2));
      expect(paths).not.toContain(path.resolve(testPath1));
    });
  });

  describe('path normalization', () => {
    it('should normalize paths with trailing slashes', () => {
      guard.protect(testPath1 + '/');
      const paths = guard.getProtectedPaths();

      // Should resolve to same path without trailing slash
      expect(paths).toContain(path.resolve(testPath1));
    });

    it('should normalize paths with redundant separators', () => {
      const weirdPath = testPath1 + '//subdir//..//';
      guard.protect(weirdPath);

      const paths = guard.getProtectedPaths();
      // Should be normalized
      expect(paths.length).toBe(1);
      expect(paths[0]).toBe(path.resolve(weirdPath));
    });

    it('should handle current directory references', () => {
      guard.protect('./relative/path');
      const paths = guard.getProtectedPaths();

      expect(paths).toHaveLength(1);
      expect(paths[0]).toBeDefined();
      expect(path.isAbsolute(paths[0]!)).toBe(true);
    });
  });

  describe('multiple instances', () => {
    it('should allow multiple guard instances independently', () => {
      const guard1 = new ReadOnlyGuard();
      const guard2 = new ReadOnlyGuard();

      guard1.protect(testPath1);
      guard2.protect(testPath2);

      expect(guard1.getProtectedPaths()).toHaveLength(1);
      expect(guard2.getProtectedPaths()).toHaveLength(1);

      expect(guard1.getProtectedPaths()).toContain(path.resolve(testPath1));
      expect(guard2.getProtectedPaths()).toContain(path.resolve(testPath2));

      // Cleanup
      if (guard1.isEnabled()) guard1.disable();
      if (guard2.isEnabled()) guard2.disable();
    });
  });
});
