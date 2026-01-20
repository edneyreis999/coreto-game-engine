import type { Trecho } from '../domain/Trecho.js';

/**
 * Project configuration object loaded from JSON file.
 */
export interface ProjectConfig {
  /** Absolute path to RPG Maker MZ project directory */
  projectPath: string;
  /** Absolute path to report output directory */
  reportOutputPath: string;
  /** Optional RNG seed for deterministic execution (ADR-018) */
  seed?: number;
  /** Maximum number of battle turns before timeout (default: 100) */
  maxBattleTurns?: number;
}

/**
 * ConfigLoader port interface.
 * Responsible for loading and validating project configuration (ADR-008, ADR-021).
 */
export interface IConfigLoader {
  /**
   * Load and validate project configuration from JSON file.
   * @param configPath - Absolute path to project.config.json
   * @returns Validated project configuration
   * @throws {ConfigError} If file not found or validation fails
   */
  loadConfig(configPath: string): Promise<ProjectConfig>;

  /**
   * Load and parse trecho configurations from config file.
   * @param config - Project configuration with paths
   * @returns Array of validated Trecho domain entities
   * @throws {ValidationError} If trecho validation fails
   */
  loadTrechos(config: ProjectConfig): Promise<Trecho[]>;

  /**
   * Validate configuration object against schema (ADR-008 Zod validation).
   * @param config - Raw configuration object to validate
   * @returns Validated ProjectConfig object
   * @throws {ZodError} If validation fails
   */
  validate(config: unknown): ProjectConfig;
}
