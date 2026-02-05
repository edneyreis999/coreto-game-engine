/**
 * Zod Schemas for Project Configuration
 *
 * Re-exports domain schemas for backward compatibility.
 *
 * @module main/services/schemas
 * @see packages/electron/src/domain/schemas/project-config.schema.ts
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
} from '../../domain/schemas/project-config.schema.js';
