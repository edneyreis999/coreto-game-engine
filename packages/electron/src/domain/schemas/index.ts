/**
 * Domain Schemas Index
 *
 * Re-exports all domain schemas for convenient importing.
 *
 * @example
 * import { ProjectConfigSchema, TrechoConfigSchema, type UIProjectConfig } from '@/domain/schemas';
 */

export {
  TrechoConfigSchema,
  ProjectConfigSchema,
  type UIProjectConfig,
  type UITrechoConfig,
  CURRENT_SCHEMA_VERSION,
  LEGACY_SCHEMA_VERSIONS,
} from './project-config.schema.js';
