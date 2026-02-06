/**
 * Zod Schemas for Project Configuration
 *
 * Defines validation schemas for TTK project configuration files.
 * These schemas ensure CLI-GUI compatibility and support schema normalization.
 *
 * This is a domain-level schema definition - framework-agnostic and pure.
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
  expectedTTK: z
    .object({
      min: z.number().int().nonnegative('Minimum TTK cannot be negative'),
      max: z.number().int().nonnegative('Maximum TTK cannot be negative'),
    })
    .optional(),
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
  metadata: z
    .object({
      projectName: z.string().optional(),
      lastModified: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

/**
 * TypeScript type inferred from ProjectConfigSchema.
 * Represents a valid UI project configuration after Zod validation.
 *
 * NOTE: Renamed from ProjectConfig to UIProjectConfig to avoid
 * naming collision with @coreto/core's ProjectConfig port interface.
 * This type represents the UI-facing config format (with version,
 * metadata) while Core's format is execution-ready (with projectPath,
 * reportOutputPath, trechos).
 *
 * @see packages/core/src/core/ports/IConfigLoader.ts
 * @see IMPORT_GUIDE.md
 */
export type UIProjectConfig = z.infer<typeof ProjectConfigSchema>;

/**
 * TypeScript type inferred from TrechoConfigSchema.
 * Represents a valid UI trecho configuration after Zod validation.
 *
 * NOTE: Renamed from TrechoConfig to UITrechoConfig to avoid
 * naming collision with Core's TrechoDTO type.
 *
 * @see packages/core/src/infrastructure/config/schemas.ts
 */
export type UITrechoConfig = z.infer<typeof TrechoConfigSchema>;

/**
 * Schema version for normalization support.
 * When schema changes, increment this version and update normalizeSchema.
 */
export const CURRENT_SCHEMA_VERSION = '1.0';

/**
 * Legacy schema versions that need normalization.
 */
export const LEGACY_SCHEMA_VERSIONS: string[] = [];
