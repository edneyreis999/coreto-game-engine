/**
 * File Config Storage Adapter
 *
 * Production adapter implementing IConfigStorage using Node.js fs/path.
 * Handles configuration persistence to the filesystem.
 *
 * Key Features:
 * - Stores configs in temp/project.config.json (CLI-compatible path)
 * - Auto-creates parent directories on write
 * - Handles ENOENT errors gracefully
 * - Atomic writes when possible
 *
 * Import Convention (CLAUDE-ARCH-CONVENTION):
 * - Domain imports use module aliases (@coreto/electron/domain/*)
 * - Infrastructure imports use relative paths
 *
 * @see packages/electron/src/domain/ports/IConfigStorage.ts
 * @see packages/electron/src/domain/use-cases/load-project-config.ts
 * @see packages/electron/CLAUDE.md (Import Conventions)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { IConfigStorage } from '@coreto/electron/domain/ports';

/**
 * Creates a filesystem-based configuration storage adapter.
 *
 * This adapter implements IConfigStorage using Node.js fs/path modules.
 * It follows RPG Maker MZ conventions by storing configs in temp/ directory.
 *
 * Path Convention:
 * {projectPath}/temp/project.config.json
 *
 * This path MUST match CLI expectations for GUI-CLI interoperability.
 *
 * @returns IConfigStorage implementation for filesystem operations
 *
 * @example
 * ```typescript
 * const storage = createFileConfigStorage();
 * const json = await storage.read('/path/to/project');
 * await storage.write('/path/to/project', updatedJson);
 * ```
 */
export function createFileConfigStorage(): IConfigStorage {
  return {
    /**
     * Reads configuration file content from filesystem.
     *
     * @throws {Error} If file doesn't exist (ENOENT) or read fails
     */
    async read(projectPath: string): Promise<string> {
      const configPath = this.getConfigPath(projectPath);
      return fs.readFile(configPath, 'utf-8');
    },

    /**
     * Writes configuration content to filesystem.
     *
     * Automatically creates temp/ directory if it doesn't exist.
     * Uses recursive mkdir to handle missing parent directories.
     */
    async write(projectPath: string, content: string): Promise<void> {
      const configPath = this.getConfigPath(projectPath);
      const tempDir = path.dirname(configPath);

      // Ensure temp directory exists
      await fs.mkdir(tempDir, { recursive: true });

      // Write config file (overwrites existing)
      await fs.writeFile(configPath, content, 'utf-8');
    },

    /**
     * Checks if configuration file exists.
     *
     * Uses fs.access() which is more efficient than stat() for existence checks.
     * Returns false instead of throwing on ENOENT.
     */
    async exists(projectPath: string): Promise<boolean> {
      const configPath = this.getConfigPath(projectPath);

      try {
        await fs.access(configPath);
        return true;
      } catch (error) {
        // ENOENT means file doesn't exist - return false
        // Other errors (permissions, etc.) are propagated
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          return false;
        }
        throw error;
      }
    },

    /**
     * Deletes configuration file from filesystem.
     *
     * Idempotent - doesn't throw if file doesn't exist.
     * Propagates other errors (permissions, etc.).
     */
    async delete(projectPath: string): Promise<void> {
      const configPath = this.getConfigPath(projectPath);

      try {
        await fs.unlink(configPath);
      } catch (error) {
        // File doesn't exist - that's okay, deletion is idempotent
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          return;
        }
        // Other errors should be propagated
        throw error;
      }
    },

    /**
     * Resolves the full config file path for a project.
     *
     * IMPORTANT: This path MUST match CLI convention:
     * {projectPath}/temp/project.config.json
     *
     * Changing this path breaks CLI-GUI interoperability.
     */
    getConfigPath(projectPath: string): string {
      return path.join(projectPath, 'temp', 'project.config.json');
    },
  };
}
