/**
 * NodeFileSystem - Node.js implementation of IFileSystem
 *
 * Provides filesystem operations using Node.js fs module.
 * Implements read-only constraint for RPG Maker MZ project directory (ADR-001).
 */

import { injectable } from 'tsyringe';
import * as fs from 'fs';
import type { IFileSystem } from '@/core/ports/index.js';
import { ConfigError } from '@/core/errors/ConfigError.js';
import { PathSanitizer } from '@/infrastructure/security/index.js';

/**
 * NodeFileSystem implementation.
 * Wraps Node.js fs module with IFileSystem interface.
 */
@injectable()
export class NodeFileSystem implements IFileSystem {
  /**
   * Check if a file or directory exists.
   *
   * @param filePath - Absolute path to check
   * @returns True if exists, false otherwise
   */
  exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Read file contents synchronously.
   *
   * @param filePath - Absolute path to file
   * @returns File contents as string (UTF-8 encoding)
   * @throws {Error} If file cannot be read
   */
  readFileSync(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Write file contents synchronously.
   * WARNING: Must not be used on projectPath (read-only constraint ADR-001).
   *
   * @param filePath - Absolute path to file
   * @param content - Content to write
   * @throws {Error} If file cannot be written
   */
  writeFileSync(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Validate that path is a valid RPG Maker MZ project.
   * Delegates to PathSanitizer for comprehensive validation.
   *
   * @param projectPath - Path to validate
   * @throws {ValidationError} If invalid project structure or path traversal detected
   */
  validateProjectPath(projectPath: string): void {
    try {
      PathSanitizer.validateRPGMakerMZProject(projectPath);
    } catch (error: unknown) {
      // Convert ValidationError to ConfigError for consistency with IFileSystem interface
      if (error instanceof Error) {
        throw new ConfigError(error.message, { projectPath, originalError: error });
      }
      throw error;
    }
  }
}
