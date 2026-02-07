/**
 * Zod Schemas for Project Configuration
 *
 * Re-exports domain schemas for backward compatibility.
 *
 * TODO: Refactor to use module alias for domain imports (CLAUDE-ARCH-CONVENTION)
 * - Change: export { ... } from '../../domain/schemas/ui-config.schema.js'
 * - To: export { ... } from '@coreto/electron/domain/schemas'
 *
 * @module main/services/schemas
 * @see packages/electron/src/domain/schemas/ui-config.schema.ts
 * @see packages/electron/CLAUDE.md (Import Conventions)
 *
 * @deprecated Import from @coreto/electron/domain instead.
 * This file is kept for backward compatibility during the domain extraction.
 */

export {
  TrechoConfigSchema,
  ProjectConfigSchema,
  type UIProjectConfig,
  type UITrechoConfig,
  CURRENT_SCHEMA_VERSION,
  LEGACY_SCHEMA_VERSIONS,
} from '../../domain/schemas/ui-config.schema.js';
