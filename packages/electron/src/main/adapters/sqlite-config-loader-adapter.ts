/**
 * SQLite Config Loader Adapter
 *
 * Adapter implementing IConfigLoader port using SQLite storage.
 * Bridges the gap between @coreto/core domain layer and @coreto/electron SQLite storage.
 *
 * Key Design Decision (ADR D009-ARCH Option B):
 * - Creates a wrapper adapter that maintains clean architecture
 * - No breaking changes to IConfigLoader interface from @coreto/core
 * - Preserves layer isolation between core domain and electron infrastructure
 *
 * Architecture:
 * - IConfigLoader port (core/ports/) - defines the contract
 * - SQLiteConfigLoaderAdapter (electron/main/adapters/) - implements using SQLite
 * - IConfigStorage port (electron/domain/ports/) - abstracts storage operations
 *
 * Transformation Flow:
 * 1. SQLite (UIProjectConfig format) → JSON string via IConfigStorage.read()
 * 2. JSON string → Parsed object with UI format
 * 3. UI format → Core domain format (ProjectConfig + Trecho entities)
 *
 * @see packages/core/src/core/ports/IConfigLoader.ts
 * @see packages/electron/src/domain/ports/IConfigStorage.ts
 * @see packages/electron/src/domain/schemas/ui-config.schema.ts
 */

import type { IConfigLoader, ProjectConfig } from '@coreto/core';
import { PartyConfig, Trecho, ValidationError } from '@coreto/core';
import type { IConfigStorage } from '@coreto/electron/domain/ports';
import type { UIProjectConfig } from '@coreto/electron/domain/schemas';
import { UIProjectConfigSchema } from '@coreto/electron/domain/schemas';

/**
 * Creates a SQLite-based configuration loader adapter.
 *
 * This adapter implements IConfigLoader using IConfigStorage (SQLite).
 * It handles the transformation between UI config format (stored in SQLite)
 * and core domain format (expected by @coreto/core).
 *
 * @param storage - IConfigStorage implementation (typically SQLite)
 * @returns IConfigLoader implementation for SQLite operations
 *
 * @example
 * ```typescript
 * const storage = createSQLiteConfigStorage(db);
 * const configLoader = createSQLiteConfigLoader(storage);
 *
 * // Load config from SQLite using project path
 * const config = await configLoader.loadConfig('/path/to/project');
 * const trechos = await configLoader.loadTrechos(config);
 * ```
 */
export function createSQLiteConfigLoader(storage: IConfigStorage): IConfigLoader {
  /**
   * Cache for loaded configs to avoid repeated SQLite reads.
   * Maps project path to parsed UI config object.
   */
  const configCache = new Map<string, UIProjectConfig>();

  return {
    /**
     * Load and validate project configuration from SQLite.
     *
     * If no config exists in database, creates a default empty config.
     *
     * @param projectPath - Absolute path to RPG Maker MZ project
     * @returns Validated project configuration in core domain format
     */
    async loadConfig(projectPath: string): Promise<ProjectConfig> {
      // Check if config exists in SQLite
      const configExists = await storage.exists(projectPath);

      let uiConfig: UIProjectConfig;

      if (configExists) {
        try {
          // Read JSON from SQLite
          const json = await storage.read(projectPath);
          const rawConfig = JSON.parse(json) as unknown;

          // Validate with UI schema
          uiConfig = UIProjectConfigSchema.parse(rawConfig) as UIProjectConfig;
        } catch (error) {
          // If validation fails (incomplete/corrupt data), log and use empty config
          console.warn(`[SQLiteConfigLoader] Config validation failed for ${projectPath}, using empty config:`, error);
          uiConfig = {
            version: '1.0',
            trechos: [],
            globalSettings: {},
            metadata: {
              projectName: projectPath,
              lastModified: Date.now(),
            },
          };
        }
      } else {
        // Create default empty config
        uiConfig = {
          version: '1.0',
          trechos: [],
          globalSettings: {},
          metadata: {
            projectName: projectPath,
            lastModified: Date.now(),
          },
        };
      }

      // Cache for trecho loading
      configCache.set(projectPath, uiConfig);

      // Transform UI format to core domain format
      // UI format: { version, trechos, globalSettings, metadata }
      // Core format: { projectPath, reportOutputPath, seed?, maxBattleTurns? }
      const projectConfig: ProjectConfig = {
        projectPath,
        reportOutputPath: `${projectPath}/reports`, // Default report path
      };

      // Extract optional global settings
      if (uiConfig.globalSettings?.seed !== undefined) {
        projectConfig.seed = uiConfig.globalSettings.seed;
      }

      if (uiConfig.globalSettings?.maxBattleTurns !== undefined) {
        projectConfig.maxBattleTurns = uiConfig.globalSettings.maxBattleTurns;
      }

      return projectConfig;
    },

    /**
     * Load and parse trecho configurations from cached UI config.
     *
     * @param config - Project configuration (from loadConfig)
     * @returns Array of validated Trecho domain entities
     * @throws {ValidationError} If trecho validation fails or config not cached
     */
    async loadTrechos(config: ProjectConfig): Promise<Trecho[]> {
      const projectPath = config.projectPath;

      // Retrieve from cache
      const uiConfig = configCache.get(projectPath);
      if (!uiConfig) {
        throw new ValidationError(
          `Config not loaded for project: ${projectPath}. Call loadConfig first.`,
          { projectPath }
        );
      }

      // Transform UI trechos to core domain Trecho entities
      // UI format: { id, name, anchorLevelMin, anchorLevelMax, targetTtkTurns, targetTtkActions, tolerancePercent, troopIds, party }
      // Core format: Trecho class with flat properties from nested anchorLevelRange and ttkTarget
      const trechos: Trecho[] = uiConfig.trechos.map((uiTrecho) => {
        return new Trecho({
          id: uiTrecho.id,
          name: uiTrecho.name,
          anchorLevelMin: uiTrecho.anchorLevelMin,
          anchorLevelMax: uiTrecho.anchorLevelMax,
          targetTtkTurns: uiTrecho.targetTtkTurns,
          targetTtkActions: uiTrecho.targetTtkActions,
          tolerancePercent: uiTrecho.tolerancePercent,
          troopIds: uiTrecho.troopIds,
          party: new PartyConfig(uiTrecho.party.members),
        });
      });

      return trechos;
    },

    /**
     * Validate configuration object against UI schema.
     *
     * Note: This validates the UI format schema, not the core format.
     * The adapter handles transformation between formats.
     *
     * @param config - Raw configuration object to validate
     * @returns Validated ProjectConfig object in core domain format
     * @throws {ZodError} If validation fails
     */
    validate(config: unknown): ProjectConfig {
      // Validate with UI schema first
      const uiConfig = UIProjectConfigSchema.parse(config) as UIProjectConfig & { projectPath?: string };

      // Extract project path if present (for direct validation scenarios)
      const projectPath = uiConfig.projectPath || uiConfig.metadata?.projectName || '';

      // Transform to core domain format
      const projectConfig: ProjectConfig = {
        projectPath,
        reportOutputPath: `${projectPath}/reports`,
      };

      if (uiConfig.globalSettings?.seed !== undefined) {
        projectConfig.seed = uiConfig.globalSettings.seed;
      }

      if (uiConfig.globalSettings?.maxBattleTurns !== undefined) {
        projectConfig.maxBattleTurns = uiConfig.globalSettings.maxBattleTurns;
      }

      return projectConfig;
    },
  };
}
