/**
 * Config Migration Service
 *
 * Provides schema normalization functions for backward compatibility.
 * These functions handle legacy config formats and apply migrations.
 *
 * This is a domain-level service - framework-agnostic and pure.
 *
 * @module domain/services
 */

import { CURRENT_SCHEMA_VERSION } from '../schemas/project-config.schema.js';

/**
 * Normalizes a raw config object.
 *
 * This function handles backward compatibility by:
 * 1. Adding missing fields with defaults
 * 2. Migrating renamed fields (backward compatibility)
 * 3. Updating version field
 *
 * Migration Rules:
 * - missing version → set to '1.0'
 * - missing metadata → set to {}
 * - maxTurns → maxBattleTurns (legacy field rename)
 *
 * @param raw - Raw config object (from file or user input)
 * @returns Normalized config object (MUTATES the input object)
 */
export function normalizeSchema(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  // Type assertion for mutation
  const config = raw as Record<string, unknown>;

  // Add missing version field
  if (!config.version) {
    config.version = CURRENT_SCHEMA_VERSION;
  }

  // Add missing metadata field
  if (!config.metadata) {
    config.metadata = {};
  }

  // Migration: maxTurns → maxBattleTurns (legacy field rename)
  // This handles configs from older versions
  if ('maxTurns' in config && !('maxBattleTurns' in config)) {
    config.maxBattleTurns = config.maxTurns;
    delete config.maxTurns;
  }

  // Migration: Ensure trechos is an array
  if (!config.trechos || !Array.isArray(config.trechos)) {
    config.trechos = [];
  }

  // Normalize each trecho
  if (Array.isArray(config.trechos)) {
    config.trechos = config.trechos.map((trecho: unknown) =>
      normalizeTrechoSchema(trecho)
    );
  }

  return config;
}

/**
 * Normalizes a single trecho schema.
 *
 * Handles trecho-specific migrations and default values.
 *
 * @param raw - Raw trecho object
 * @returns Normalized trecho object (MUTATES the input object)
 */
export function normalizeTrechoSchema(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const trecho = raw as Record<string, unknown>;

  // Ensure required fields exist
  if (!trecho.id) {
    trecho.id = `trecho-${Date.now()}`;
  }

  if (!trecho.description) {
    trecho.description = 'Unnamed Trecho';
  }

  // Normalize heroTeam
  if (!trecho.heroTeam) {
    trecho.heroTeam = {
      level: 1,
      actors: [],
      weapons: {},
      armors: {},
    };
  }

  // Normalize enemyTeam
  if (!trecho.enemyTeam) {
    trecho.enemyTeam = {
      troopId: 1,
    };
  }

  return trecho;
}
