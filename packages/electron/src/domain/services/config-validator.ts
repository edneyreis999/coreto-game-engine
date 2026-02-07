/**
 * Config Validation Service
 *
 * Provides validation functions that combine schema normalization
 * with Zod validation for type safety.
 *
 * This is a domain-level service - framework-agnostic and pure.
 *
 * @module domain/services
 */

import { UIProjectConfigSchema as ProjectConfigSchema, type UIProjectConfig } from '../schemas/index.js';
import { normalizeSchema } from './config-migrator.js';

/**
 * Validates and normalizes a raw config object.
 *
 * This helper function combines schema normalization with Zod validation
 * to ensure backward compatibility with older config file formats.
 *
 * @param raw - Raw configuration object (from file or user input)
 * @returns Validated and normalized ProjectConfig
 * @throws {z.ZodError} If validation fails after normalization
 */
export function validateAndNormalizeConfig(raw: unknown): UIProjectConfig {
  // First normalize the schema (handle legacy formats)
  const normalized = normalizeSchema(raw);

  // Then validate with Zod
  return ProjectConfigSchema.parse(normalized);
}
