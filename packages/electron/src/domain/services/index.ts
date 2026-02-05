/**
 * Domain Services Index
 *
 * Re-exports all domain services for convenient importing.
 *
 * @example
 * import { normalizeSchema, validateAndNormalizeConfig } from '@/domain/services';
 */

export {
  normalizeSchema,
  normalizeTrechoSchema,
} from './config-migrator.js';

export {
  validateAndNormalizeConfig,
} from './config-validator.js';
