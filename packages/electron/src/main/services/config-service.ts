/**
 * ConfigService - Project Configuration Management
 *
 * @deprecated This service is being replaced by domain use cases for Clean Architecture compliance.
 * Use `loadProjectConfig` and `saveProjectConfig` from `@coreto/electron/domain/use-cases` instead.
 *
 * This service is kept for backward compatibility during migration and will be removed in a future version.
 *
 * Migration Guide:
 * - loadConfig() → loadProjectConfig() use case
 * - saveConfig() → saveProjectConfig() use case
 * - configExists() → IConfigStorage.exists() or use case
 *
 * Key Features:
 * - Loads/saves configs from temp/project.config.json (CLI-compatible)
 * - Schema normalization for backward compatibility (Technical Debt DT-003)
 * - Zod validation for type safety
 * - Auto-creates temp directory if missing
 *
 * Import Convention (CLAUDE-ARCH-CONVENTION):
 * - Domain imports: Use module aliases (@coreto/electron/domain/*)
 * - Infrastructure imports: Use relative paths (./schemas.js)
 *
 * @see planos/005-run-ttk-electron/tasks/04_task.md
 * @see planos/005-run-ttk-electron/TECHSPEC-round2.md (Section 1)
 * @see packages/electron/CLAUDE.md (Import Conventions)
 * @see packages/electron/src/domain/use-cases/load-project-config.ts
 * @see packages/electron/src/domain/use-cases/save-project-config.ts
 */

import path from 'node:path';
import fs from 'node:fs/promises';

// Domain layer (cross-layer - module aliases)
import { normalizeSchema } from '@coreto/electron/domain/services';
import { CURRENT_SCHEMA_VERSION } from '@coreto/electron/domain/schemas';

// Infrastructure layer (same layer - relative imports)
import { ProjectConfigSchema, type UIProjectConfig } from './schemas.js';

/**
 * Error thrown when project config file is not found.
 */
export class ConfigNotFoundError extends Error {
  constructor(configPath: string) {
    super(`Project config not found at ${configPath}`);
    this.name = 'ConfigNotFoundError';
  }
}

/**
 * Error thrown when config validation fails.
 */
export class ConfigValidationError extends Error {
  constructor(validationErrors: string[]) {
    super(`Config validation failed:\n${validationErrors.join('\n')}`);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Service class for managing project configuration files.
 *
 * Provides methods for loading and saving project configurations
 * with automatic schema normalization and validation.
 *
 * Schema normalization is delegated to domain layer services.
 */
export class ConfigService {
  /**
   * Gets the configuration file path for a project.
   *
   * IMPORTANT: This path MUST match CLI expectation to ensure
   * CLI-GUI compatibility. Config is stored in temp/project.config.json.
   *
   * @param projectPath - Absolute path to the RPG Maker MZ project
   * @returns Absolute path to the config file
   */
  private getConfigPath(projectPath: string): string {
    // Match CLI expectation: temp/project.config.json
    return path.join(projectPath, 'temp', 'project.config.json');
  }

  /**
   * Loads a project configuration from disk.
   *
   * @deprecated Use `loadProjectConfig` from `@coreto/electron/domain/use-cases` instead.
   * This method is kept for backward compatibility and will be removed in a future version.
   *
   * Process:
   * 1. Read file from temp/project.config.json
   * 2. Normalize schema (handle legacy formats)
   * 3. Validate with Zod
   * 4. Return typed ProjectConfig
   *
   * @param projectPath - Absolute path to the RPG Maker MZ project
   * @returns Validated project configuration
   * @throws {ConfigNotFoundError} If config file doesn't exist
   * @throws {ConfigValidationError} If validation fails after normalization
   *
   * @example
   * ```typescript
   * // NEW: Use domain use case
   * import { loadProjectConfig } from '@coreto/electron/domain/use-cases';
   * const result = await loadProjectConfig({ projectPath }, { storage, ...deps });
   *
   * // OLD: Deprecated
   * import { configService } from './services/config-service';
   * const config = await configService.loadConfig(projectPath);
   * ```
   */
  async loadConfig(projectPath: string): Promise<UIProjectConfig> {
    const configPath = this.getConfigPath(projectPath);

    try {
      // Read config file
      const json = await fs.readFile(configPath, 'utf-8');
      const raw = JSON.parse(json);

      // Normalize before validation (Technical Debt DT-003)
      // Delegates to domain migration service
      const normalized = normalizeSchema(raw);

      // Validate with Zod
      const result = ProjectConfigSchema.safeParse(normalized);

      if (!result.success) {
        const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        throw new ConfigValidationError(errors);
      }

      return result.data;
    } catch (error) {
      if (error instanceof ConfigNotFoundError) {
        throw error;
      }

      if (error instanceof ConfigValidationError) {
        throw error;
      }

      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new ConfigNotFoundError(configPath);
      }

      // Re-throw unknown errors
      throw error;
    }
  }

  /**
   * Saves a project configuration to disk.
   *
   * @deprecated Use `saveProjectConfig` from `@coreto/electron/domain/use-cases` instead.
   * This method is kept for backward compatibility and will be removed in a future version.
   *
   * Process:
   * 1. Ensure temp directory exists
   * 2. Validate with Zod
   * 3. Write with pretty formatting (human-readable)
   * 4. Update metadata (lastModified timestamp)
   *
   * @param projectPath - Absolute path to the RPG Maker MZ project
   * @param config - Configuration to save
   * @throws {ConfigValidationError} If validation fails
   *
   * @example
   * ```typescript
   * // NEW: Use domain use case
   * import { saveProjectConfig } from '@coreto/electron/domain/use-cases';
   * const result = await saveProjectConfig({ projectPath, config }, { storage, ...deps });
   *
   * // OLD: Deprecated
   * import { configService } from './services/config-service';
   * await configService.saveConfig(projectPath, config);
   * ```
   */
  async saveConfig(projectPath: string, config: UIProjectConfig): Promise<void> {
    const configPath = this.getConfigPath(projectPath);

    // Validate before saving
    const result = ProjectConfigSchema.safeParse(config);

    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ConfigValidationError(errors);
    }

    // Ensure temp directory exists
    const tempDir = path.dirname(configPath);
    await fs.mkdir(tempDir, { recursive: true });

    // Update metadata
    const configToSave: UIProjectConfig = {
      ...result.data,
      metadata: {
        ...result.data.metadata,
        lastModified: Date.now(),
      },
    };

    // Write with formatting for human-readability (CLI-compatible)
    await fs.writeFile(configPath, JSON.stringify(configToSave, null, 2), 'utf-8');
  }

  /**
   * Checks if a config file exists for the given project.
   *
   * @param projectPath - Absolute path to the RPG Maker MZ project
   * @returns True if config file exists
   */
  async configExists(projectPath: string): Promise<boolean> {
    const configPath = this.getConfigPath(projectPath);

    try {
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalizes old config schemas to current version.
   *
   * Delegates to domain migration service.
   *
   * @param raw - Raw config object (from file or user input)
   * @returns Normalized config object
   *
   * @see ../../domain/services/config-migrator.ts
   */
  normalizeSchema(raw: unknown): unknown {
    return normalizeSchema(raw);
  }

  /**
   * Creates a default project configuration.
   *
   * Returns a minimal valid config that can be used as a starting point.
   *
   * @returns Default project configuration
   */
  createDefaultConfig(): UIProjectConfig {
    return {
      version: CURRENT_SCHEMA_VERSION,
      trechos: [],
      metadata: {
        projectName: 'New Project',
        lastModified: Date.now(),
      },
    };
  }

  /**
   * Deletes a project configuration file.
   *
   * Use with caution - this permanently removes the config.
   *
   * @param projectPath - Absolute path to the RPG Maker MZ project
   * @throws {Error} If deletion fails
   */
  async deleteConfig(projectPath: string): Promise<void> {
    const configPath = this.getConfigPath(projectPath);

    try {
      await fs.unlink(configPath);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        // File doesn't exist, that's okay
        return;
      }
      throw error;
    }
  }
}

/**
 * Singleton instance of ConfigService.
 *
 * Use this instance throughout the application instead of
 * creating new instances to ensure consistent behavior.
 */
export const configService = new ConfigService();
