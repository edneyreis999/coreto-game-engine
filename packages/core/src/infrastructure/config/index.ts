/**
 * Configuration Module Barrel Export
 *
 * Re-exports all Zod schemas and types with DTO suffix.
 *
 * IMPORTANT: Use DTO suffix for Zod types to distinguish from Domain classes:
 * - AnchorLevelRangeDTO (Zod) vs AnchorLevelRange (Domain class)
 * - TtkTargetDTO (Zod) vs TtkTarget (Domain class)
 * - PartyConfigDTO (Zod) vs PartyConfig (Domain class)
 */

export {
  AnchorLevelRangeSchema,
  TtkTargetSchema,
  PartyMemberSchema,
  PartyConfigSchema,
  TrechoSchema,
  ProjectConfigSchema,
  type AnchorLevelRangeDTO,
  type TtkTargetDTO,
  type PartyMemberDTO,
  type PartyConfigDTO,
  type TrechoDTO,
  type ProjectConfigDTO,
} from './schemas.js';

export { ZodConfigLoader } from './ZodConfigLoader.js';
