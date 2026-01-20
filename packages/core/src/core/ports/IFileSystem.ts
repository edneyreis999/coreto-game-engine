/**
 * FileSystem port interface.
 * Provides abstraction for file system operations (read-only for projectPath).
 */
export interface IFileSystem {
  /**
   * Check if a file or directory exists.
   * @param filePath - Absolute path to check
   * @returns True if exists, false otherwise
   */
  exists(filePath: string): boolean;

  /**
   * Read file contents synchronously.
   * @param filePath - Absolute path to file
   * @returns File contents as string
   */
  readFileSync(filePath: string): string;

  /**
   * Write file contents synchronously.
   * WARNING: Must not be used on projectPath (read-only constraint ADR-001).
   * @param filePath - Absolute path to file
   * @param content - Content to write
   */
  writeFileSync(filePath: string, content: string): void;

  /**
   * Validate that path is a valid RPG Maker MZ project.
   * @param projectPath - Path to validate
   * @throws {Error} If invalid project structure
   */
  validateProjectPath(projectPath: string): void;
}
