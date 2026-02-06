/**
 * Load Project Config Use Case
 *
 * Pure domain use case for loading and normalizing project configurations.
 * Follows Clean Architecture - no direct filesystem dependencies.
 *
 * Process:
 * 1. Check if config exists
 * 2. Read raw JSON from storage
 * 3. Parse and normalize schema
 * 4. Validate with Zod
 * 5. Return config + migration status
 *
 * @see packages/electron/src/domain/ports/IConfigStorage.ts
 * @see packages/electron/src/domain/services/config-migrator.ts
 */

import type { UIProjectConfig } from '../schemas/project-config.schema.js';
import type { IConfigStorage } from '../ports/IConfigStorage.js';
import { CURRENT_SCHEMA_VERSION } from '../schemas/project-config.schema.js';

/**
 * Input for loading a project configuration.
 */
export interface LoadProjectConfigInput {
  /**
   * Absolute path to the RPG Maker MZ project directory.
   */
  projectPath: string;
}

/**
 * Output from loading a project configuration.
 */
export interface LoadProjectConfigOutput {
  /**
   * Validated and normalized project configuration.
   */
  config: UIProjectConfig;

  /**
   * Indicates if the loaded config needed schema migration.
   * If true, consider saving to upgrade to current version.
   */
  needsMigration: boolean;
}

/**
 * Dependencies required by the use case.
 * Injected via dependency injection to maintain purity.
 */
export interface LoadProjectConfigDeps {
  /**
   * Storage adapter for reading config files.
   */
  storage: IConfigStorage;

  /**
   * Schema normalizer for backward compatibility.
   * Transforms legacy formats to current version.
   */
  normalizeSchema: (raw: unknown) => unknown;

  /**
   * Zod validator for type-safe config parsing.
   * Should return validated UIProjectConfig or throw.
   */
  validateSchema: (data: unknown) => UIProjectConfig;

  /**
   * Factory for creating default configs when none exists.
   */
  createDefaultConfig: () => UIProjectConfig;
}

/**
 * Loads and validates a project configuration from storage.
 *
 * This use case handles:
 * - Missing config files (returns default)
 * - Schema normalization (backward compatibility)
 * - Validation errors (throws with details)
 * - Migration detection (reports if schema was old)
 *
 * @param input - Project path to load config from
 * @param deps - Injected dependencies (storage, validators)
 * @returns Validated config and migration status
 * @throws {Error} If validation fails after normalization
 *
 * @example
 * ```typescript
 * const result = await loadProjectConfig(
 *   { projectPath: '/path/to/project' },
 *   {
 *     storage: fileConfigStorage,
 *     normalizeSchema,
 *     validateSchema: (data) => ProjectConfigSchema.parse(data),
 *     createDefaultConfig
 *   }
 * );
 *
 * if (result.needsMigration) {
 *   console.log('Config was migrated from old version');
 * }
 * ```
 */
export async function loadProjectConfig(
  input: LoadProjectConfigInput,
  deps: LoadProjectConfigDeps
): Promise<LoadProjectConfigOutput> {
  const { projectPath } = input;
  const { storage, normalizeSchema, validateSchema, createDefaultConfig } = deps;

  // Check if config exists
  const exists = await storage.exists(projectPath);

  if (!exists) {
    // Return default config for new projects
    return {
      config: createDefaultConfig(),
      needsMigration: false,
    };
  }

  // Read raw JSON from storage
  const json = await storage.read(projectPath);
  const raw = JSON.parse(json) as { version?: string };

  // Capture original version before normalization
  const originalVersion = raw.version;

  // Normalize schema for backward compatibility
  const normalized = normalizeSchema(raw);

  // Validate with Zod (throws on validation errors)
  const config = validateSchema(normalized);

  // Detect if migration was needed
  const needsMigration = originalVersion !== CURRENT_SCHEMA_VERSION;

  return {
    config,
    needsMigration,
  };
}
