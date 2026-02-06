/**
 * IConfigStorage Port
 *
 * Port interface for project configuration storage operations.
 * Abstracts filesystem interactions to enable testability and Clean Architecture.
 *
 * Implementation examples:
 * - FileConfigStorageAdapter - Production adapter using Node.js fs/path
 * - InMemoryConfigStorageAdapter - Test adapter using Map
 *
 * @see packages/electron/src/main/adapters/file-config-storage-adapter.ts
 * @see packages/electron/src/domain/use-cases/load-project-config.ts
 */

/**
 * Port interface for configuration storage operations.
 *
 * This interface abstracts filesystem operations, allowing:
 * - Pure domain logic in use cases
 * - Easy testing with in-memory implementations
 * - Potential for remote storage adapters
 *
 * All methods use projectPath as the key, delegating path resolution
 * to the adapter implementation.
 */
export interface IConfigStorage {
  /**
   * Reads raw configuration content from storage.
   *
   * @param projectPath - Absolute path to the RPG Maker MZ project
   * @returns Raw JSON string from config file
   * @throws {Error} If file doesn't exist or read fails
   */
  read(projectPath: string): Promise<string>;

  /**
   * Writes configuration content to storage.
   *
   * Implementations should:
   * - Create parent directories if needed
   * - Write atomically when possible
   * - Handle permissions errors gracefully
   *
   * @param projectPath - Absolute path to the RPG Maker MZ project
   * @param content - JSON string to write
   * @throws {Error} If write operation fails
   */
  write(projectPath: string, content: string): Promise<void>;

  /**
   * Checks if configuration exists for a project.
   *
   * @param projectPath - Absolute path to the RPG Maker MZ project
   * @returns True if config file exists
   */
  exists(projectPath: string): Promise<boolean>;

  /**
   * Deletes configuration file for a project.
   *
   * Should NOT throw if file doesn't exist (idempotent operation).
   *
   * @param projectPath - Absolute path to the RPG Maker MZ project
   * @throws {Error} If deletion fails for reasons other than ENOENT
   */
  delete(projectPath: string): Promise<void>;

  /**
   * Gets the full path where config should be stored.
   *
   * This method allows adapters to control path conventions.
   * For filesystem adapters, this typically returns:
   * {projectPath}/temp/project.config.json
   *
   * @param projectPath - Absolute path to the RPG Maker MZ project
   * @returns Absolute path to the config file
   */
  getConfigPath(projectPath: string): string;
}
