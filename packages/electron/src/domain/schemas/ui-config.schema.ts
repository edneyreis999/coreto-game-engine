/**
 * UI Config Schema - Zod Schemas for UI Project Configuration
 *
 * Defines validation schemas for UI-facing project configuration files.
 * This format uses party/troopIds structure aligned with form-types.ts.
 *
 * For CLI compatibility format (with heroTeam/enemyTeam structure), see cli-config.schema.ts.
 * Use config-format-mapper.ts to convert between formats.
 *
 * @see planos/014-arrumando-testes/electron/codebase/PLAN.md Task 2.5
 * @see domain/types/form-types.ts for corresponding runtime types
 */

import { z } from 'zod';

/**
 * Zod schema for a party member configuration.
 * Matches PartyMemberFormData from form-types.ts.
 */
export const UIPartyMemberSchema = z.object({
  classId: z.number().int().positive('Class ID must be positive'),
  level: z.number().int().min(1).max(99, 'Level must be between 1 and 99'),
});

/**
 * Zod schema for a party configuration.
 * Matches PartyFormData from form-types.ts.
 */
export const UIPartySchema = z.object({
  members: z.array(UIPartyMemberSchema).min(1, 'At least one party member is required').max(4, 'Maximum 4 party members allowed'),
});

/**
 * Zod schema for a single trecho configuration (UI format).
 *
 * A trecho represents a game segment with specific party composition,
 * enemy troops to test, and TTK (Time To Kill) validation criteria.
 * Matches TrechoFormData from form-types.ts.
 */
export const UITrechoSchema = z
  .object({
    /**
     * Unique identifier for this trecho (e.g., "ato1-nivel1-10").
     */
    id: z.string().min(1, 'Trecho ID is required'),

    /**
     * Human-readable name for this trecho.
     */
    name: z.string().min(1, 'Trecho name is required'),

    /**
     * Minimum level in the anchor level range (1-99).
     */
    anchorLevelMin: z.number().int().min(1).max(99, 'Minimum anchor level must be between 1 and 99'),

    /**
     * Maximum level in the anchor level range (1-99).
     */
    anchorLevelMax: z.number().int().min(1).max(99, 'Maximum anchor level must be between 1 and 99'),

    /**
     * Target TTK measured in turns.
     */
    targetTtkTurns: z.number().int().positive('Target TTK turns must be positive'),

    /**
     * Target TTK measured in actions.
     */
    targetTtkActions: z.number().int().positive('Target TTK actions must be positive'),

    /**
     * Tolerance percentage (0-100, e.g., 15 = ±15%).
     */
    tolerancePercent: z.number().min(0).max(100, 'Tolerance percentage must be between 0 and 100'),

    /**
     * Array of troop IDs to test in this trecho.
     */
    troopIds: z.array(z.number().int().positive()).min(1, 'At least one troop ID is required'),

    /**
     * Party configuration for this trecho.
     */
    party: UIPartySchema,
  })
  .refine((data) => data.anchorLevelMax >= data.anchorLevelMin, {
    message: 'Maximum anchor level must be greater than or equal to minimum level',
    path: ['anchorLevelMax'],
  });

/**
 * Zod schema for the complete project configuration (UI format).
 *
 * This schema validates the project.config.json file in UI format.
 * Used by the ConfigurationPanel component.
 */
export const UIProjectConfigSchema = z.object({
  /**
   * Schema version for normalization support.
   */
  version: z.string().default('1.0'),

  /**
   * Array of trechos to test.
   */
  trechos: z.array(UITrechoSchema).default([]),

  /**
   * Optional metadata about the project.
   */
  metadata: z
    .object({
      projectName: z.string().optional(),
      lastModified: z.number().int().nonnegative().optional(),
    })
    .optional(),

  /**
   * Global settings for simulation.
   */
  globalSettings: z
    .object({
      /**
       * RNG seed for deterministic simulation.
       */
      seed: z.number().int().nonnegative('Seed must be non-negative'),

      /**
       * Maximum battle turns before timeout.
       */
      maxBattleTurns: z.number().int().positive().optional(),
    })
    .optional(),
});

/**
 * TypeScript type inferred from UIProjectConfigSchema.
 *
 * This type represents a valid UI project configuration after Zod validation.
 * Used throughout the Electron app for type-safe config handling.
 */
export type UIProjectConfig = z.infer<typeof UIProjectConfigSchema>;

/**
 * TypeScript type inferred from UITrechoSchema.
 *
 * This type represents a valid UI trecho configuration after Zod validation.
 */
export type UITrechoConfig = z.infer<typeof UITrechoSchema>;

/**
 * TypeScript type inferred from UIPartySchema.
 */
export type UIPartyConfig = z.infer<typeof UIPartySchema>;

/**
 * TypeScript type inferred from UIPartyMemberSchema.
 */
export type UIPartyMemberConfig = z.infer<typeof UIPartyMemberSchema>;

/**
 * Schema version for UI format.
 */
export const UI_SCHEMA_VERSION = '1.0';

/**
 * Legacy schema versions that need normalization.
 */
export const LEGACY_UI_SCHEMA_VERSIONS: string[] = [];

/**
 * Re-exports for backward compatibility.
 *
 * NOTE: These aliases exist for smooth migration from the old
 * project-config.schema.ts. New code should use the UI-prefixed names.
 */
export const ProjectConfigSchema = UIProjectConfigSchema;
export const TrechoConfigSchema = UITrechoSchema;
export const CURRENT_SCHEMA_VERSION = UI_SCHEMA_VERSION;
export const LEGACY_SCHEMA_VERSIONS = LEGACY_UI_SCHEMA_VERSIONS;

// Type aliases (type-only exports)
export type { UIProjectConfig as ProjectConfig, UITrechoConfig as TrechoConfig };
