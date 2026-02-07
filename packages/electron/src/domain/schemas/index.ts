/**
 * Domain Schemas Index
 *
 * Re-exports all domain schemas for convenient importing.
 *
 * UI Config Format (default):
 * import { ProjectConfigSchema, TrechoConfigSchema, type UIProjectConfig } from '@/domain/schemas';
 *
 * CLI Config Format:
 * import { CLIProjectConfigSchema, CLITrechoConfigSchema, type CLIProjectConfig } from '@/domain/schemas';
 */

// UI Config Format (default - used by Electron app)
export {
  // Primary exports (UI-prefixed)
  UIProjectConfigSchema,
  UITrechoSchema,
  UIPartySchema,
  UIPartyMemberSchema,
  type UIProjectConfig,
  type UITrechoConfig,
  type UIPartyConfig,
  type UIPartyMemberConfig,
  UI_SCHEMA_VERSION,
  LEGACY_UI_SCHEMA_VERSIONS,
  // Backward compatibility aliases
  ProjectConfigSchema,
  TrechoConfigSchema,
  CURRENT_SCHEMA_VERSION,
  LEGACY_SCHEMA_VERSIONS,
} from './ui-config.schema.js';

// CLI Config Format (used for CLI compatibility)
export {
  CLIProjectConfigSchema,
  CLITrechoConfigSchema,
  type CLIProjectConfig,
  type CLITrechoConfig,
  CLI_SCHEMA_VERSION,
  LEGACY_CLI_SCHEMA_VERSIONS,
} from './cli-config.schema.js';
