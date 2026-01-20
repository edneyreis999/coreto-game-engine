import { DomainError } from './DomainError.js';

/**
 * Base error for configuration-related failures.
 * Used when loading, parsing, or validating configuration files.
 */
export class ConfigError extends DomainError {
  /**
   * Creates a new ConfigError.
   *
   * @param message - Human-readable error message
   * @param context - Additional configuration context
   */
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'critical', context);
  }
}

/**
 * Error thrown when a configuration file is not found.
 *
 * @example
 * ```typescript
 * if (!fs.existsSync(configPath)) {
 *   throw new ConfigFileNotFoundError(configPath);
 * }
 * ```
 */
export class ConfigFileNotFoundError extends ConfigError {
  /**
   * Creates a new ConfigFileNotFoundError.
   *
   * @param configPath - Path to the missing configuration file
   */
  constructor(configPath: string) {
    super(`Configuration file not found: ${configPath}`, { configPath });
  }
}

/**
 * Error thrown when a configuration file cannot be parsed.
 * Wraps the original parsing error for debugging.
 *
 * @example
 * ```typescript
 * try {
 *   JSON.parse(configData);
 * } catch (error) {
 *   throw new ConfigParseError(configPath, error as Error);
 * }
 * ```
 */
export class ConfigParseError extends ConfigError {
  /**
   * Creates a new ConfigParseError.
   *
   * @param configPath - Path to the configuration file
   * @param parseError - The original parsing error
   */
  constructor(configPath: string, parseError: Error) {
    super(`Failed to parse configuration: ${parseError.message}`, {
      configPath,
      originalError: parseError.message,
    });
  }
}
