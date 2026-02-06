/**
 * Save Project Config Use Case
 *
 * Pure domain use case for saving project configurations.
 * Follows Clean Architecture - no direct filesystem dependencies.
 *
 * Process:
 * 1. Validate config with Zod
 * 2. Update metadata (lastModified timestamp)
 * 3. Serialize to JSON
 * 4. Write via storage adapter
 *
 * @see packages/electron/src/domain/ports/IConfigStorage.ts
 * @see packages/electron/src/domain/schemas/project-config.schema.ts
 */

import type { UIProjectConfig } from '../schemas/project-config.schema.js';
import type { IConfigStorage } from '../ports/IConfigStorage.js';

/**
 * Input for saving a project configuration.
 */
export interface SaveProjectConfigInput {
  /**
   * Absolute path to the RPG Maker MZ project directory.
   */
  projectPath: string;

  /**
   * Configuration to validate and save.
   */
  config: UIProjectConfig;
}

/**
 * Output from saving a project configuration.
 */
export interface SaveProjectConfigOutput {
  /**
   * Indicates if save operation was successful.
   */
  success: boolean;

  /**
   * Full path where config was saved.
   */
  configPath: string;
}

/**
 * Dependencies required by the use case.
 * Injected via dependency injection to maintain purity.
 */
export interface SaveProjectConfigDeps {
  /**
   * Storage adapter for writing config files.
   */
  storage: IConfigStorage;

  /**
   * Zod validator for type-safe config validation.
   * Should return validated UIProjectConfig or throw.
   */
  validateSchema: (data: unknown) => UIProjectConfig;
}

/**
 * Validates and saves a project configuration to storage.
 *
 * This use case handles:
 * - Pre-save validation (ensures valid data)
 * - Metadata updates (lastModified timestamp)
 * - JSON serialization (pretty formatting)
 * - Storage delegation (adapter handles filesystem)
 *
 * @param input - Project path and config to save
 * @param deps - Injected dependencies (storage, validator)
 * @returns Success status and config path
 * @throws {Error} If validation or write operation fails
 *
 * @example
 * ```typescript
 * const result = await saveProjectConfig(
 *   {
 *     projectPath: '/path/to/project',
 *     config: { version: '1.0', trechos: [...] }
 *   },
 *   {
 *     storage: fileConfigStorage,
 *     validateSchema: (data) => ProjectConfigSchema.parse(data)
 *   }
 * );
 *
 * console.log(`Config saved to: ${result.configPath}`);
 * ```
 */
export async function saveProjectConfig(
  input: SaveProjectConfigInput,
  deps: SaveProjectConfigDeps
): Promise<SaveProjectConfigOutput> {
  const { projectPath, config } = input;
  const { storage, validateSchema } = deps;

  // Validate config before saving (throws on validation errors)
  const validated = validateSchema(config);

  // Update metadata with current timestamp
  const configToSave: UIProjectConfig = {
    ...validated,
    metadata: {
      ...validated.metadata,
      lastModified: Date.now(),
    },
  };

  // Serialize to pretty JSON (human-readable, CLI-compatible)
  const json = JSON.stringify(configToSave, null, 2);

  // Write via storage adapter (handles directory creation, permissions)
  await storage.write(projectPath, json);

  // Return success with config path
  const configPath = storage.getConfigPath(projectPath);

  return {
    success: true,
    configPath,
  };
}
