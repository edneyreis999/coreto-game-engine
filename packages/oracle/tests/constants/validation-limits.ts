/**
 * Semantic constants for validation limits used in Oracle MCP tests.
 * These constants define the maximum allowed values for various inputs.
 */
export const VALIDATION_LIMITS = {
  /** Maximum bytes allowed for NSD (Novel Scene Description) content */
  NSD_MAX_BYTES: 1024 * 1024,

  /** Maximum characters allowed for scene names */
  SCENE_NAME_MAX_CHARS: 200,
} as const;