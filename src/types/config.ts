/**
 * Configuration Types
 *
 * Type definitions for project configuration (will be implemented with Zod in Task 04).
 * Placeholder types to enable DI container testing.
 */

/**
 * Project configuration object.
 * Full implementation with Zod schema will be added in Task 04.
 */
export interface ProjectConfig {
  projectPath: string;
  trechos: TrechoConfig[];
  seed?: number;
}

/**
 * Trecho (story segment) configuration.
 */
export interface TrechoConfig {
  id: string;
  anchorLevelRange: {
    min: number;
    max: number;
  };
  ttkTarget: {
    turns: number;
    actions: number;
  };
  tolerance: {
    turns: number;
    actions: number;
  };
  troopIds: number[];
}
