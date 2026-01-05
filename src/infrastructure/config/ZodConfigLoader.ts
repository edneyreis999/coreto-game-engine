/**
 * ZodConfigLoader - Configuration loader with Zod validation
 *
 * Implements IConfigLoader interface using Zod schemas for runtime validation.
 * Handles loading and validation of project.config.json and trecho configurations.
 *
 * @see docs/adrs/ADR-008-schema-validation-library.md
 * @see docs/adrs/ADR-021-json-based-configuration-format.md
 */

import { injectable, inject } from 'tsyringe';
import { z } from 'zod';

import type { IConfigLoader, ProjectConfig, IFileSystem } from '@/core/ports/index.js';
import type { Trecho } from '@/core/domain/Trecho.js';
import { IFileSystemToken } from '@/infrastructure/di/tokens.js';
import {
  ConfigError,
  ConfigFileNotFoundError,
  ConfigParseError,
} from '@/core/errors/ConfigError.js';
import { ValidationError } from '@/core/errors/ValidationError.js';
import { TrechoSchema } from './schemas.js';

/**
 * Extended ProjectConfig schema for validation.
 * Aligns with IConfigLoader.ProjectConfig interface.
 */
const ProjectConfigLoaderSchema = z.object({
  projectPath: z
    .string({
      required_error: 'projectPath is required',
      invalid_type_error: 'projectPath must be a string',
    })
    .min(1, 'projectPath cannot be empty')
    .refine(
      (path) => !path.includes('..'),
      'projectPath must not contain path traversal sequences (..)'
    ),
  reportOutputPath: z
    .string({
      required_error: 'reportOutputPath is required',
      invalid_type_error: 'reportOutputPath must be a string',
    })
    .min(1, 'reportOutputPath cannot be empty'),
  seed: z
    .number({
      invalid_type_error: 'seed must be a number',
    })
    .int('seed must be an integer')
    .optional(),
  maxBattleTurns: z
    .number({
      invalid_type_error: 'maxBattleTurns must be a number',
    })
    .int('maxBattleTurns must be an integer')
    .positive('maxBattleTurns must be positive')
    .optional(),
});

/**
 * ZodConfigLoader implementation.
 * Loads and validates configuration using Zod schemas.
 */
@injectable()
export class ZodConfigLoader implements IConfigLoader {
  /**
   * Cache for raw config to preserve trechos array.
   * Maps config path to raw config object.
   */
  private rawConfigCache: Map<string, unknown> = new Map();

  constructor(@inject(IFileSystemToken) private readonly fileSystem: IFileSystem) {}

  /**
   * Load and validate project configuration from JSON file.
   *
   * @param configPath - Absolute path to project.config.json
   * @returns Validated project configuration
   * @throws {ConfigFileNotFoundError} If file not found
   * @throws {ConfigParseError} If JSON parsing fails
   * @throws {ValidationError} If schema validation fails
   */
  async loadConfig(configPath: string): Promise<ProjectConfig> {
    // 1. Check if file exists
    if (!this.fileSystem.exists(configPath)) {
      throw new ConfigFileNotFoundError(configPath);
    }

    // 2. Read file content
    let fileContent: string;
    try {
      fileContent = this.fileSystem.readFileSync(configPath);
    } catch (error) {
      throw new ConfigError(`Failed to read config file: ${configPath}`, {
        configPath,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 3. Parse JSON
    let rawConfig: unknown;
    try {
      rawConfig = JSON.parse(fileContent);
    } catch (error) {
      throw new ConfigParseError(configPath, error as Error);
    }

    // 4. Cache raw config for trecho loading
    this.rawConfigCache.set(configPath, rawConfig);

    // 5. Validate with Zod schema
    return this.validate(rawConfig);
  }

  /**
   * Load and parse trecho configurations.
   *
   * Trechos can be:
   * 1. Embedded in the config file under "trechos" key
   * 2. In a separate file referenced by "trechosPath" in config
   * 3. In a default "trechos.json" file next to the config
   *
   * @param config - Project configuration with paths
   * @returns Array of validated Trecho domain entities
   * @throws {ValidationError} If trecho validation fails
   * @throws {ConfigError} If trechos file not found
   */
  async loadTrechos(config: ProjectConfig): Promise<Trecho[]> {
    // Try to load from cached raw config first
    for (const [_path, rawConfig] of this.rawConfigCache.entries()) {
      const rawConfigObj = rawConfig as { trechos?: unknown[] };
      if (rawConfigObj.trechos && Array.isArray(rawConfigObj.trechos)) {
        return this.validateTrechos(rawConfigObj.trechos);
      }
    }

    // Fallback: Try to cast config (for unit tests that pass objects directly)
    const configWithTrechos = config as ProjectConfig & { trechos?: unknown[] };
    if (configWithTrechos.trechos && Array.isArray(configWithTrechos.trechos)) {
      return this.validateTrechos(configWithTrechos.trechos);
    }

    // If no embedded trechos, look for external file
    // This is a placeholder - actual implementation would need trechosPath in config
    // For now, throw error if no trechos found
    throw new ConfigError(
      'No trechos found in configuration. Trechos must be embedded in config file.',
      { config }
    );
  }

  /**
   * Validate configuration object against schema.
   *
   * @param config - Raw configuration object to validate
   * @returns Validated ProjectConfig object
   * @throws {ValidationError} If validation fails
   */
  validate(config: unknown): ProjectConfig {
    try {
      const validated = ProjectConfigLoaderSchema.parse(config);

      // Build result object with exactOptionalPropertyTypes compatibility
      // Only include optional fields if they are present
      const result: ProjectConfig = {
        projectPath: validated.projectPath,
        reportOutputPath: validated.reportOutputPath,
      };

      if (validated.seed !== undefined) {
        result.seed = validated.seed;
      }

      if (validated.maxBattleTurns !== undefined) {
        result.maxBattleTurns = validated.maxBattleTurns;
      }

      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw ValidationError.fromZodError(error);
      }
      throw error;
    }
  }

  /**
   * Validate array of trecho configurations.
   *
   * @param trechosData - Raw trecho array to validate
   * @returns Array of validated Trecho domain entities
   * @throws {ValidationError} If validation fails
   */
  private validateTrechos(trechosData: unknown[]): Trecho[] {
    const validatedTrechos: Trecho[] = [];

    for (let i = 0; i < trechosData.length; i++) {
      try {
        const trechoData = TrechoSchema.parse(trechosData[i]);

        // Convert validated Zod data to Trecho domain entity
        // Note: This requires importing PartyConfig and constructing Trecho
        // For now, we'll return the validated data as-is
        // TODO: Convert to proper Trecho domain entities
        validatedTrechos.push(trechoData as unknown as Trecho);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError(`Validation failed for trecho at index ${i}`, {
            index: i,
            issues: error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
          });
        }
        throw error;
      }
    }

    return validatedTrechos;
  }
}
