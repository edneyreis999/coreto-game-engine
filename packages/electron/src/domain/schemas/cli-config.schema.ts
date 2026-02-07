/**
 * CLI Config Schema - Zod Schemas for CLI Project Configuration
 *
 * Defines validation schemas for CLI format project configuration files.
 * This format uses heroTeam/enemyTeam structure and is the original format.
 *
 * For UI-facing format (with party/troopIds structure), see ui-config.schema.ts.
 * Use config-format-mapper.ts to convert between formats.
 *
 * @see planos/014-arrumando-testes/electron/codebase/PLAN.md Task 2.5
 */

import { z } from 'zod';

/**
 * Zod schema for a single trecho configuration (CLI format).
 *
 * A trecho represents a game segment with specific party composition,
 * enemy troops, and TTK (Time To Kill) validation criteria.
 */
export const CLITrechoConfigSchema = z.object({
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
  expectedTTK: z
    .object({
      min: z.number().int().nonnegative('Minimum TTK cannot be negative'),
      max: z.number().int().nonnegative('Maximum TTK cannot be negative'),
    })
    .optional(),
});

/**
 * Zod schema for the complete project configuration (CLI format).
 *
 * This schema validates the project.config.json file in CLI format.
 */
export const CLIProjectConfigSchema = z.object({
  version: z.string().default('1.0'),
  trechos: z.array(CLITrechoConfigSchema).default([]),
  metadata: z
    .object({
      projectName: z.string().optional(),
      lastModified: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

/**
 * TypeScript type inferred from CLIProjectConfigSchema.
 */
export type CLIProjectConfig = z.infer<typeof CLIProjectConfigSchema>;

/**
 * TypeScript type inferred from CLITrechoConfigSchema.
 */
export type CLITrechoConfig = z.infer<typeof CLITrechoConfigSchema>;

/**
 * Schema version for CLI format.
 */
export const CLI_SCHEMA_VERSION = '1.0';

/**
 * Legacy schema versions that need normalization.
 */
export const LEGACY_CLI_SCHEMA_VERSIONS: string[] = [];
