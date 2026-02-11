/**
 * RmmzProjectValidator - Validates RPG Maker MZ project structure
 *
 * Implements validation logic for validateProjectStructure method (Task 15).
 * Ensures project has valid directory structure before attempting data loading.
 *
 * @example
 * ```typescript
 * const validator = new RmmzProjectValidator(fileSystem);
 * await validator.validateProjectStructure('/path/to/project'); // Returns true or throws
 * ```
 */

import { injectable, inject } from 'tsyringe';
import { IFileSystemToken } from '../../di/tokens.js';
import type { IFileSystem } from '@coreto/core';
import { DataLoadError } from '@coreto/core';

/**
 * RmmzProjectValidator validates RPG Maker MZ project structure.
 * Checks for required marker files and directories.
 *
 * @trace HLD-SEC-3.3
 */
@injectable()
export class RmmzProjectValidator {
  constructor(@inject(IFileSystemToken) private readonly fileSystem: IFileSystem) {}

  /**
   * Validate RPG Maker MZ project structure.
   *
   * Checks:
   * - game.rmmzproject marker file exists
   * - data/ directory exists
   *
   * @param projectPath - Absolute path to RPG Maker MZ project
   * @returns true if valid project structure
   * @throws {DataLoadError} If structure is invalid (critical error)
   *
   * @example
   * ```typescript
   * await validator.validateProjectStructure('/path/to/project');
   * // Returns true if valid
   * // Throws DataLoadError if invalid
   * ```
   */
  async validateProjectStructure(projectPath: string): Promise<boolean> {
    // Validate using fileSystem which delegates to PathSanitizer
    // This handles path traversal, symlinks, and basic structure validation
    // We catch and re-throw as DataLoadError to maintain consistent error types
    try {
      this.fileSystem.validateProjectPath(projectPath);
    } catch (error: unknown) {
      // PathSanitizer already validated marker file, data/, and js/ directories
      // If it threw an error, convert it to DataLoadError
      if (error instanceof Error) {
        // Extract reason from error message if present
        let reason: string | undefined;
        if (error.message.includes('game.rmmzproject')) {
          reason = 'missing_marker_file';
        } else if (error.message.includes('data/')) {
          reason = 'missing_data_directory';
        } else if (error.message.includes('js/')) {
          reason = 'missing_js_directory';
        } else if (error.message.includes('not a directory')) {
          reason = 'not_a_directory';
        } else if (error.message.includes('does not exist')) {
          reason = 'path_not_found';
        }

        throw new DataLoadError(
          `Invalid RPG Maker MZ project structure: ${error.message}`,
          'critical',
          { projectPath, originalError: error.message, reason }
        );
      }
      throw error;
    }

    return true;
  }
}
