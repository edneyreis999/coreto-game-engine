/**
 * PathSanitizer - Advanced path validation and sanitization
 *
 * Provides security utilities to prevent path traversal attacks and validate
 * paths against a base directory. Implements ADR-001 read-only constraint.
 *
 * @example
 * ```typescript
 * // Sanitize and validate path
 * const safePath = PathSanitizer.sanitize('/path/to/file', '/path/to');
 *
 * // Validate RPG Maker MZ project
 * PathSanitizer.validateRPGMakerMZProject('/path/to/project');
 * ```
 */

import * as path from 'path';
import * as fs from 'fs';
import { ValidationError } from '@coreto/core';

/**
 * PathSanitizer utility class.
 * Provides static methods for path validation and sanitization.
 *
 * @trace HLD-SEC-8
 */
export class PathSanitizer {
  /**
   * Sanitize and validate a path, rejecting path traversal attempts.
   *
   * Security checks:
   * - Rejects paths containing '..' (path traversal)
   * - Resolves to absolute path
   * - If basePath provided, ensures result is within basePath
   * - Rejects symlinks pointing outside basePath
   *
   * @param inputPath - Path to sanitize
   * @param basePath - Optional base directory to constrain path within
   * @returns Sanitized absolute path
   * @throws {ValidationError} If path is unsafe or outside basePath
   *
   * @example
   * ```typescript
   * // Safe path
   * PathSanitizer.sanitize('foo/bar.txt', '/base') // -> '/base/foo/bar.txt'
   *
   * // Path traversal rejected
   * PathSanitizer.sanitize('../etc/passwd', '/base') // -> throws ValidationError
   *
   * // Outside basePath rejected
   * PathSanitizer.sanitize('/etc/passwd', '/base') // -> throws ValidationError
   * ```
   */
  static sanitize(inputPath: string, basePath?: string): string {
    // 1. Resolve to absolute path first
    let resolvedPath: string;
    if (path.isAbsolute(inputPath)) {
      resolvedPath = path.resolve(inputPath);
    } else if (basePath) {
      resolvedPath = path.resolve(basePath, inputPath);
    } else {
      resolvedPath = path.resolve(inputPath);
    }

    // 2. Check for '..' in the ORIGINAL input path (before resolution)
    // This detects explicit path traversal attempts in user input
    if (inputPath.includes('..')) {
      // Allow if the resolved path is still valid (e.g., relative paths that resolve correctly)
      // But check if it's suspicious (trying to escape basePath)
      if (basePath) {
        const normalizedPath = path.normalize(resolvedPath);
        const normalizedBase = path.normalize(path.resolve(basePath));

        if (!normalizedPath.startsWith(normalizedBase)) {
          throw new ValidationError('Path traversal detected: path contains ".."', {
            inputPath,
            reason: 'path_traversal',
          });
        }
      } else {
        // No basePath constraint, but still reject explicit '..' in input
        throw new ValidationError('Path traversal detected: path contains ".."', {
          inputPath,
          reason: 'path_traversal',
        });
      }
    }

    // 3. Check for symlink and resolve if exists (do this before basePath check)
    let isSymlink = false;
    if (fs.existsSync(resolvedPath)) {
      const stats = fs.lstatSync(resolvedPath);

      if (stats.isSymbolicLink()) {
        isSymlink = true;
        // Resolve symlink to real path
        resolvedPath = fs.realpathSync(resolvedPath);
      }
    }

    // 4. If basePath provided, ensure result is within basePath
    // This check happens AFTER symlink resolution to compare final paths
    if (basePath) {
      let resolvedBase = path.resolve(basePath);
      let finalResolvedPath = resolvedPath;

      // Resolve both to realpath if they exist, for consistent comparison
      const baseExists = fs.existsSync(resolvedBase);
      const pathExists = fs.existsSync(finalResolvedPath);

      if (baseExists && pathExists) {
        // Both exist: resolve both to realpath for comparison
        resolvedBase = fs.realpathSync(resolvedBase);
        finalResolvedPath = fs.realpathSync(finalResolvedPath);
      } else if (baseExists) {
        // Only base exists: resolve base to realpath, construct target path relative to it
        const realBase = fs.realpathSync(resolvedBase);
        // Replace the resolved base prefix with the real base prefix in target path
        if (finalResolvedPath.startsWith(resolvedBase)) {
          finalResolvedPath = path.join(realBase, finalResolvedPath.slice(resolvedBase.length));
        }
        resolvedBase = realBase;
      }

      // Normalize paths for comparison (handle trailing slashes)
      const normalizedPath = path.normalize(finalResolvedPath);
      const normalizedBase = path.normalize(resolvedBase);

      // Check if resolved path starts with base path
      if (!normalizedPath.startsWith(normalizedBase)) {
        throw new ValidationError(
          isSymlink ? 'Symlink points outside base directory' : 'Path is outside base directory',
          {
            inputPath,
            resolvedPath: normalizedPath,
            basePath: normalizedBase,
            reason: isSymlink ? 'symlink_escape' : 'outside_base_directory',
          }
        );
      }
    }

    return resolvedPath;
  }

  /**
   * Validate that a path is a valid RPG Maker MZ project.
   *
   * Checks:
   * - Path exists and is a directory
   * - Contains game.rmmzproject marker file
   * - Contains data/ directory
   * - Contains js/ directory
   *
   * @param projectPath - Path to validate
   * @throws {ValidationError} If not a valid RPG Maker MZ project
   *
   * @example
   * ```typescript
   * PathSanitizer.validateRPGMakerMZProject('/path/to/project');
   * // If valid, no error thrown
   * // If invalid, throws ValidationError with details
   * ```
   */
  static validateRPGMakerMZProject(projectPath: string): void {
    // Sanitize path first (no basePath constraint for project root)
    const sanitizedPath = PathSanitizer.sanitize(projectPath);

    // Check if path exists
    if (!fs.existsSync(sanitizedPath)) {
      throw new ValidationError('Project path does not exist', {
        projectPath: sanitizedPath,
        reason: 'path_not_found',
      });
    }

    // Check if it's a directory
    const stats = fs.statSync(sanitizedPath);
    if (!stats.isDirectory()) {
      throw new ValidationError('Project path is not a directory', {
        projectPath: sanitizedPath,
        reason: 'not_a_directory',
      });
    }

    // Check for game.rmmzproject marker file
    const markerFile = path.join(sanitizedPath, 'game.rmmzproject');
    if (!fs.existsSync(markerFile)) {
      throw new ValidationError('Invalid RPG Maker MZ project: game.rmmzproject not found', {
        projectPath: sanitizedPath,
        markerFile,
        reason: 'missing_marker_file',
      });
    }

    // Check for data/ directory
    const dataDir = path.join(sanitizedPath, 'data');
    if (!fs.existsSync(dataDir)) {
      throw new ValidationError('Invalid RPG Maker MZ project: data/ directory not found', {
        projectPath: sanitizedPath,
        dataDir,
        reason: 'missing_data_directory',
      });
    }

    // Verify data/ is actually a directory
    const dataStats = fs.statSync(dataDir);
    if (!dataStats.isDirectory()) {
      throw new ValidationError('Invalid RPG Maker MZ project: data/ is not a directory', {
        projectPath: sanitizedPath,
        dataDir,
        reason: 'data_not_a_directory',
      });
    }

    // Check for js/ directory
    const jsDir = path.join(sanitizedPath, 'js');
    if (!fs.existsSync(jsDir)) {
      throw new ValidationError('Invalid RPG Maker MZ project: js/ directory not found', {
        projectPath: sanitizedPath,
        jsDir,
        reason: 'missing_js_directory',
      });
    }

    // Verify js/ is actually a directory
    const jsStats = fs.statSync(jsDir);
    if (!jsStats.isDirectory()) {
      throw new ValidationError('Invalid RPG Maker MZ project: js/ is not a directory', {
        projectPath: sanitizedPath,
        jsDir,
        reason: 'js_not_a_directory',
      });
    }
  }
}
