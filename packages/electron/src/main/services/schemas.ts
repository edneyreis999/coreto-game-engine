/**
 * Zod Schemas for Project Configuration
 *
 * Defines validation schemas for TTK project configuration files.
 * These schemas ensure CLI-GUI compatibility and support schema normalization.
 *
 * @see packages/electron/src/main/services/config-service.ts
 * @see planos/005-run-ttk-electron/tasks/04_task.md
 */

import { z } from 'zod';

/**
 * Zod schema for a single trecho configuration.
 *
 * A trecho represents a game segment with specific party composition,
 * enemy troops, and TTK (Time To Kill) validation criteria.
 */
export const TrechoConfigSchema = z.object({
  id: z.string().min(1, 'Trecho ID is required'),
  description: z.string().min(1, 'Description is required'),
  heroTeam: z.object({
    level: z.number().int().min(1).max(99, 'Hero level must be between 1 and 99'),
    actors: z.array(z.number().int().positive()).min(1, 'At least one actor is required'),
    weapons: z.record(z.number().int().nonnegative()),
    armors: z.record(z.number().int().nonnegative()),
  }),
  enemyTeam: z.object({
    troopId: z.number().int().positive('Troop ID must be positive'),
    count: z.number().int().positive().optional(),
  }),
  expectedTTK: z.object({
    min: z.number().int().nonnegative('Minimum TTK cannot be negative'),
    max: z.number().int().nonnegative('Maximum TTK cannot be negative'),
  }).optional(),
});

/**
 * Zod schema for the complete project configuration.
 *
 * This schema validates the project.config.json file stored in
 * the project's temp directory, ensuring CLI-GUI compatibility.
 */
export const ProjectConfigSchema = z.object({
  version: z.string().default('1.0'),
  trechos: z.array(TrechoConfigSchema).default([]),
  metadata: z.object({
    projectName: z.string().optional(),
    lastModified: z.number().int().nonnegative().optional(),
  }).optional(),
});

/**
 * TypeScript type inferred from ProjectConfigSchema.
 * Represents a valid project configuration after Zod validation.
 */
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

/**
 * TypeScript type inferred from TrechoConfigSchema.
 * Represents a valid trecho configuration after Zod validation.
 */
export type TrechoConfig = z.infer<typeof TrechoConfigSchema>;

/**
 * Schema version for normalization support.
 * When schema changes, increment this version and update normalizeSchema.
 */
export const CURRENT_SCHEMA_VERSION = '1.0';

/**
 * Legacy schema versions that need normalization.
 */
export const LEGACY_SCHEMA_VERSIONS: string[] = [];

/**
 * Validates and normalizes a raw config object.
 *
 * This helper function combines schema normalization with Zod validation
 * to ensure backward compatibility with older config file formats.
 *
 * @param raw - Raw configuration object (from file or user input)
 * @returns Validated and normalized ProjectConfig
 * @throws {z.ZodError} If validation fails after normalization
 */
export function validateAndNormalizeConfig(raw: unknown): ProjectConfig {
  // Import normalizeSchema dynamically to avoid circular dependency
  const { ConfigService } = require('./config-service.js');
  const service = new ConfigService();

  // First normalize the schema (handle legacy formats)
  const normalized = service.normalizeSchema(raw);

  // Then validate with Zod
  return ProjectConfigSchema.parse(normalized);
}
