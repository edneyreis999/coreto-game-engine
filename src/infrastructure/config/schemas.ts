/**
 * Zod Schemas for Project Configuration
 *
 * Provides runtime validation for JSON configuration files.
 * Implements ADR-008 (Zod validation) and ADR-021 (JSON config format).
 *
 * @see docs/adrs/ADR-008-schema-validation-library.md
 * @see docs/adrs/ADR-021-json-based-configuration-format.md
 */

import { z } from 'zod';

/**
 * AnchorLevelRangeSchema validates character level ranges.
 *
 * Constraints:
 * - min/max: 1-99 (RPG Maker MZ level bounds)
 * - max must be >= min
 */
export const AnchorLevelRangeSchema = z
  .object({
    min: z
      .number({
        required_error: 'anchorLevelRange.min is required',
        invalid_type_error: 'anchorLevelRange.min must be a number',
      })
      .int('anchorLevelRange.min must be an integer')
      .min(1, 'anchorLevelRange.min must be at least 1')
      .max(99, 'anchorLevelRange.min cannot exceed 99'),
    max: z
      .number({
        required_error: 'anchorLevelRange.max is required',
        invalid_type_error: 'anchorLevelRange.max must be a number',
      })
      .int('anchorLevelRange.max must be an integer')
      .min(1, 'anchorLevelRange.max must be at least 1')
      .max(99, 'anchorLevelRange.max cannot exceed 99'),
  })
  .refine((data) => data.max >= data.min, {
    message: 'anchorLevelRange.max must be greater than or equal to min',
    path: ['max'],
  });

/**
 * TtkTargetSchema validates Time-to-Kill target metrics.
 *
 * Constraints:
 * - turns: positive integer (number of battle turns)
 * - actions: positive integer (number of party actions)
 * - tolerance: 0.0-1.0 (percentage), default 0.15 (15%)
 */
export const TtkTargetSchema = z.object({
  turns: z
    .number({
      required_error: 'ttkTarget.turns is required',
      invalid_type_error: 'ttkTarget.turns must be a number',
    })
    .int('ttkTarget.turns must be an integer')
    .positive('ttkTarget.turns must be a positive number'),
  actions: z
    .number({
      required_error: 'ttkTarget.actions is required',
      invalid_type_error: 'ttkTarget.actions must be a number',
    })
    .int('ttkTarget.actions must be an integer')
    .positive('ttkTarget.actions must be a positive number'),
  tolerance: z
    .number({
      invalid_type_error: 'ttkTarget.tolerance must be a number',
    })
    .min(0, 'ttkTarget.tolerance must be at least 0')
    .max(1, 'ttkTarget.tolerance cannot exceed 1')
    .default(0.15),
});

/**
 * PartyMemberSchema validates individual party member configuration.
 *
 * Constraints:
 * - classId: positive integer (references RPG Maker MZ Classes.json)
 * - level: 1-99 (RPG Maker MZ level bounds)
 */
export const PartyMemberSchema = z.object({
  classId: z
    .number({
      required_error: 'party.member.classId is required',
      invalid_type_error: 'party.member.classId must be a number',
    })
    .int('party.member.classId must be an integer')
    .positive('party.member.classId must be a positive number'),
  level: z
    .number({
      required_error: 'party.member.level is required',
      invalid_type_error: 'party.member.level must be a number',
    })
    .int('party.member.level must be an integer')
    .min(1, 'party.member.level must be at least 1')
    .max(99, 'party.member.level cannot exceed 99'),
});

/**
 * PartyConfigSchema validates party composition.
 *
 * Constraints:
 * - members: 1-4 party members (RPG Maker MZ max party size)
 */
export const PartyConfigSchema = z.object({
  members: z
    .array(PartyMemberSchema, {
      required_error: 'party.members is required',
      invalid_type_error: 'party.members must be an array',
    })
    .min(1, 'party.members must contain at least 1 member')
    .max(4, 'party.members cannot contain more than 4 members'),
});

/**
 * TrechoSchema validates story segment configuration.
 *
 * Constraints:
 * - id: non-empty string (unique identifier)
 * - name: optional descriptive name
 * - anchorLevelRange: validated level range
 * - ttkTarget: validated TTK metrics with tolerance
 * - troopIds: at least one troop ID (references Troops.json)
 * - party: validated party configuration
 */
export const TrechoSchema = z.object({
  id: z
    .string({
      required_error: 'trecho.id is required',
      invalid_type_error: 'trecho.id must be a string',
    })
    .min(1, 'trecho.id cannot be empty'),
  name: z
    .string({
      invalid_type_error: 'trecho.name must be a string',
    })
    .optional(),
  anchorLevelRange: AnchorLevelRangeSchema,
  ttkTarget: TtkTargetSchema,
  troopIds: z
    .array(
      z
        .number({
          invalid_type_error: 'trecho.troopIds must contain numbers',
        })
        .int('trecho.troopIds must contain integers')
        .positive('trecho.troopIds must contain positive numbers'),
      {
        required_error: 'trecho.troopIds is required',
        invalid_type_error: 'trecho.troopIds must be an array',
      }
    )
    .min(1, 'trecho.troopIds must contain at least 1 troop ID'),
  party: PartyConfigSchema,
});

/**
 * ProjectConfigSchema validates the root project configuration.
 *
 * Constraints:
 * - projectPath: non-empty string, no path traversal (..)
 * - reportOutputPath: non-empty string, directory for report output
 * - seed: integer RNG seed, default 12345 (ADR-018)
 * - maxBattleTurns: optional maximum battle turns before timeout
 * - trechos: at least one trecho configuration
 */
export const ProjectConfigSchema = z.object({
  projectPath: z
    .string({
      required_error: 'projectPath is required',
      invalid_type_error: 'projectPath must be a string',
    })
    .min(1, 'projectPath cannot be empty')
    .refine(
      (path) => !path.includes('..'),
      'projectPath must not contain path traversal sequences (..)'
    ),
  reportOutputPath: z
    .string({
      required_error: 'reportOutputPath is required',
      invalid_type_error: 'reportOutputPath must be a string',
    })
    .min(1, 'reportOutputPath cannot be empty'),
  seed: z
    .number({
      invalid_type_error: 'seed must be a number',
    })
    .int('seed must be an integer')
    .default(12345),
  maxBattleTurns: z
    .number({
      invalid_type_error: 'maxBattleTurns must be a number',
    })
    .int('maxBattleTurns must be an integer')
    .positive('maxBattleTurns must be positive')
    .optional(),
  trechos: z
    .array(TrechoSchema, {
      required_error: 'trechos is required',
      invalid_type_error: 'trechos must be an array',
    })
    .min(1, 'trechos must contain at least 1 trecho configuration'),
});

/**
 * Type inference from Zod schemas.
 *
 * These types are automatically derived from the schemas above,
 * ensuring perfect sync between validation logic and TypeScript types.
 */
export type AnchorLevelRange = z.infer<typeof AnchorLevelRangeSchema>;
export type TtkTarget = z.infer<typeof TtkTargetSchema>;
export type PartyMember = z.infer<typeof PartyMemberSchema>;
export type PartyConfig = z.infer<typeof PartyConfigSchema>;
export type TrechoConfig = z.infer<typeof TrechoSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
