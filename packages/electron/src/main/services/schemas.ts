/**
 * Zod Schemas for Project Configuration
 *
 * Re-exports domain schemas for backward compatibility.
 *
 * Import Convention (CLAUDE-ARCH-CONVENTION):
 * - Domain imports use module aliases (@coreto/electron/domain/*)
 *
 * @module main/services/schemas
 * @see packages/electron/src/domain/schemas/ui-config.schema.ts
 * @see packages/electron/CLAUDE.md (Import Conventions)
 *
 * @deprecated Import from @coreto/electron/domain/schemas instead.
 * This file is kept for backward compatibility during the domain extraction.
 */

export {
  TrechoConfigSchema,
  ProjectConfigSchema,
  type UIProjectConfig,
  type UITrechoConfig,
  CURRENT_SCHEMA_VERSION,
  LEGACY_SCHEMA_VERSIONS,
} from '@coreto/electron/domain/schemas';
