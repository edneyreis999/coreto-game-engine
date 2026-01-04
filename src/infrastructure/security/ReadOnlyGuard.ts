/**
 * ReadOnlyGuard - Runtime protection against writes to protected paths
 *
 * Implements defense-in-depth for ADR-001 read-only constraint.
 * Intercepts fs.writeFileSync calls to prevent accidental writes to
 * RPG Maker MZ project directory.
 *
 * @example
 * ```typescript
 * const guard = new ReadOnlyGuard();
 * guard.protect('/path/to/project');
 * guard.enable();
 *
 * // This will throw an error
 * fs.writeFileSync('/path/to/project/data/test.json', '{}');
 *
 * // Cleanup (for tests)
 * guard.disable();
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * ReadOnlyGuard class.
 * Manages runtime protection for read-only paths.
 */
export class ReadOnlyGuard {
  private protectedPaths: Set<string> = new Set();
  private originalWriteFileSync: typeof fs.writeFileSync | null = null;
  private enabled: boolean = false;

  /**
   * Add a path to the protection list.
   * All write attempts to files within this path will be blocked when enabled.
   *
   * @param projectPath - Path to protect (will be resolved to absolute)
   *
   * @example
   * ```typescript
   * guard.protect('/path/to/project');
   * guard.protect('../relative/path'); // Will be resolved to absolute
   * ```
   */
  protect(projectPath: string): void {
    const resolvedPath = path.resolve(projectPath);
    this.protectedPaths.add(resolvedPath);
  }

  /**
   * Remove a path from the protection list.
   *
   * @param projectPath - Path to unprotect
   *
   * @example
   * ```typescript
   * guard.unprotect('/path/to/project');
   * ```
   */
  unprotect(projectPath: string): void {
    const resolvedPath = path.resolve(projectPath);
    this.protectedPaths.delete(resolvedPath);
  }

  /**
   * Enable the guard by intercepting fs.writeFileSync.
   * Once enabled, any write attempt to protected paths will throw an error.
   *
   * This method is idempotent - calling it multiple times has no effect.
   *
   * @example
   * ```typescript
   * guard.enable();
   * fs.writeFileSync('/protected/path/file.txt', 'data'); // throws Error
   * ```
   */
  enable(): void {
    if (this.enabled) {
      return;
    }

    // Store original function
    this.originalWriteFileSync = fs.writeFileSync;

    // Create reference to this instance for closure
    const guard = this;

    // Create wrapper function
    const guardedWriteFileSync = function (
      filePath: fs.PathOrFileDescriptor,
      data: string | NodeJS.ArrayBufferView,
      options?:
        | fs.WriteFileOptions
        | BufferEncoding
        | { encoding?: BufferEncoding | null; mode?: number | string; flag?: string }
    ): void {
      // Only check string paths (not file descriptors)
      if (typeof filePath === 'string') {
        const resolvedPath = path.resolve(filePath);

        // Check if path is within any protected path
        for (const protectedPath of guard.protectedPaths) {
          const normalizedTarget = path.normalize(resolvedPath);
          const normalizedProtected = path.normalize(protectedPath);

          if (normalizedTarget.startsWith(normalizedProtected)) {
            throw new Error(
              `CRITICAL: Attempted write to protected path (read-only constraint violation - ADR-001)\n` +
                `Target file: ${resolvedPath}\n` +
                `Protected path: ${protectedPath}\n` +
                `This violates the read-only constraint for RPG Maker MZ project directory.`
            );
          }
        }
      }

      // Path is safe, call original function
      if (!guard.originalWriteFileSync) {
        throw new Error('INTERNAL ERROR: originalWriteFileSync not stored');
      }

      return guard.originalWriteFileSync.call(fs, filePath, data, options as any);
    };

    // Override fs.writeFileSync using Object.defineProperty
    Object.defineProperty(fs, 'writeFileSync', {
      value: guardedWriteFileSync,
      writable: true,
      configurable: true,
      enumerable: true,
    });

    this.enabled = true;
  }

  /**
   * Disable the guard by restoring original fs.writeFileSync.
   * Used primarily in tests to clean up after guard usage.
   *
   * This method is idempotent - calling it multiple times has no effect.
   *
   * @example
   * ```typescript
   * guard.disable();
   * fs.writeFileSync('/protected/path/file.txt', 'data'); // works normally
   * ```
   */
  disable(): void {
    if (!this.enabled) {
      return;
    }

    if (!this.originalWriteFileSync) {
      throw new Error('INTERNAL ERROR: Cannot disable guard - originalWriteFileSync not stored');
    }

    // Restore original function using Object.defineProperty
    Object.defineProperty(fs, 'writeFileSync', {
      value: this.originalWriteFileSync,
      writable: true,
      configurable: true,
      enumerable: true,
    });

    this.originalWriteFileSync = null;
    this.enabled = false;
  }

  /**
   * Check if guard is currently enabled.
   *
   * @returns True if guard is active, false otherwise
   *
   * @example
   * ```typescript
   * if (guard.isEnabled()) {
   *   console.log('Guard is protecting paths');
   * }
   * ```
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get list of currently protected paths.
   *
   * @returns Array of absolute paths being protected
   *
   * @example
   * ```typescript
   * const paths = guard.getProtectedPaths();
   * console.log('Protected:', paths);
   * ```
   */
  getProtectedPaths(): string[] {
    return Array.from(this.protectedPaths);
  }

  /**
   * Clear all protected paths.
   * Guard must be disabled before clearing.
   *
   * @throws {Error} If guard is currently enabled
   *
   * @example
   * ```typescript
   * guard.disable();
   * guard.clear();
   * ```
   */
  clear(): void {
    if (this.enabled) {
      throw new Error('Cannot clear protected paths while guard is enabled. Disable first.');
    }
    this.protectedPaths.clear();
  }
}
