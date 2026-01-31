/**
 * ConfigService - Project Configuration Management
 *
 * Handles loading, saving, and normalizing project configuration files.
 * Ensures CLI-GUI compatibility and supports schema versioning.
 *
 * Key Features:
 * - Loads/saves configs from temp/project.config.json (CLI-compatible)
 * - Schema normalization for backward compatibility (Technical Debt DT-003)
 * - Zod validation for type safety
 * - Auto-creates temp directory if missing
 *
 * @see planos/005-run-ttk-electron/tasks/04_task.md
 * @see planos/005-run-ttk-electron/TECHSPEC-round2.md (Section 1)
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { ProjectConfigSchema, type ProjectConfig, CURRENT_SCHEMA_VERSION } from './schemas.js';

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
   */
  async loadConfig(projectPath: string): Promise<ProjectConfig> {
    const configPath = this.getConfigPath(projectPath);

    try {
      // Read config file
      const json = await fs.readFile(configPath, 'utf-8');
      const raw = JSON.parse(json);

      // Normalize before validation (Technical Debt DT-003)
      const normalized = this.normalizeSchema(raw);

      // Validate with Zod
      const result = ProjectConfigSchema.safeParse(normalized);

      if (!result.success) {
        const errors = result.error.errors.map(
          (e) => `${e.path.join('.')}: ${e.message}`
        );
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
   * Process:
   * 1. Ensure temp directory exists
   * 2. Validate with Zod
   * 3. Write with pretty formatting (human-readable)
   * 4. Update metadata (lastModified timestamp)
   *
   * @param projectPath - Absolute path to the RPG Maker MZ project
   * @param config - Configuration to save
   * @throws {ConfigValidationError} If validation fails
   */
  async saveConfig(projectPath: string, config: ProjectConfig): Promise<void> {
    const configPath = this.getConfigPath(projectPath);

    // Validate before saving
    const result = ProjectConfigSchema.safeParse(config);

    if (!result.success) {
      const errors = result.error.errors.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      );
      throw new ConfigValidationError(errors);
    }

    // Ensure temp directory exists
    const tempDir = path.dirname(configPath);
    await fs.mkdir(tempDir, { recursive: true });

    // Update metadata
    const configToSave: ProjectConfig = {
      ...result.data,
      metadata: {
        ...result.data.metadata,
        lastModified: Date.now(),
      },
    };

    // Write with formatting for human-readability (CLI-compatible)
    await fs.writeFile(
      configPath,
      JSON.stringify(configToSave, null, 2),
      'utf-8'
    );
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
   * This method implements Technical Debt DT-003 (Schema Normalization).
   * It prevents breaking changes when schema evolves by:
   *
   * 1. Adding missing fields with defaults
   * 2. Migrating renamed fields (backward compatibility)
   * 3. Updating version field
   *
   * Migration Rules:
   * - missing version → set to '1.0'
   * - missing metadata → set to {}
   * - maxTurns → maxBattleTurns (legacy field rename)
   *
   * @param raw - Raw config object (from file or user input)
   * @returns Normalized config object
   */
  normalizeSchema(raw: unknown): unknown {
    if (!raw || typeof raw !== 'object') {
      return raw;
    }

    // Type assertion for mutation
    const config = raw as Record<string, unknown>;

    // Add missing version field
    if (!config.version) {
      config.version = CURRENT_SCHEMA_VERSION;
    }

    // Add missing metadata field
    if (!config.metadata) {
      config.metadata = {};
    }

    // Migration: maxTurns → maxBattleTurns (legacy field rename)
    // This handles configs from older versions
    if ('maxTurns' in config && !('maxBattleTurns' in config)) {
      config.maxBattleTurns = config.maxTurns;
      delete config.maxTurns;
    }

    // Migration: Ensure trechos is an array
    if (!config.trechos || !Array.isArray(config.trechos)) {
      config.trechos = [];
    }

    // Normalize each trecho
    if (Array.isArray(config.trechos)) {
      config.trechos = config.trechos.map((trecho: unknown) =>
        this.normalizeTrechoSchema(trecho)
      );
    }

    return config;
  }

  /**
   * Normalizes a single trecho schema.
   *
   * Handles trecho-specific migrations and default values.
   *
   * @param raw - Raw trecho object
   * @returns Normalized trecho object
   */
  private normalizeTrechoSchema(raw: unknown): unknown {
    if (!raw || typeof raw !== 'object') {
      return raw;
    }

    const trecho = raw as Record<string, unknown>;

    // Ensure required fields exist
    if (!trecho.id) {
      trecho.id = `trecho-${Date.now()}`;
    }

    if (!trecho.description) {
      trecho.description = 'Unnamed Trecho';
    }

    // Normalize heroTeam
    if (!trecho.heroTeam) {
      trecho.heroTeam = {
        level: 1,
        actors: [],
        weapons: {},
        armors: {},
      };
    }

    // Normalize enemyTeam
    if (!trecho.enemyTeam) {
      trecho.enemyTeam = {
        troopId: 1,
      };
    }

    return trecho;
  }

  /**
   * Creates a default project configuration.
   *
   * Returns a minimal valid config that can be used as a starting point.
   *
   * @returns Default project configuration
   */
  createDefaultConfig(): ProjectConfig {
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
