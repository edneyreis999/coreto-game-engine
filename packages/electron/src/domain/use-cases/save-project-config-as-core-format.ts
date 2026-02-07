/**
 * Save Project Config as Core Format Use Case
 *
 * Pure domain use case for transforming UI config to Core format and saving.
 * Follows Clean Architecture - no direct filesystem dependencies.
 *
 * Process:
 * 1. Transform ConfigurationPanel format to Core ProjectConfig format
 * 2. Serialize to JSON
 * 3. Write via storage adapter
 *
 * Transformation details:
 * - UI: anchorLevelMin, anchorLevelMax → Core: anchorLevelRange {min, max}
 * - UI: targetTtkTurns, targetTtkActions, tolerancePercent → Core: ttkTarget {turns, actions, tolerance}
 * - UI: tolerancePercent (0-100) → Core: tolerance (0.0-1.0 decimal)
 *
 * @see packages/electron/src/domain/ports/IConfigStorage.ts
 * @see packages/core/src/ports/IConfigLoader.ts (Core format)
 */

import type { IConfigStorage } from '../ports/IConfigStorage.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Party member configuration from UI.
 */
export interface UIPartyMember {
  classId: number;
  level: number;
}

/**
 * Party configuration from UI.
 */
export interface UIParty {
  members: UIPartyMember[];
}

/**
 * Trecho configuration from UI (ConfigurationPanel format).
 */
export interface UITrechoSaveConfig {
  id: string;
  name: string;
  anchorLevelMin: number;
  anchorLevelMax: number;
  targetTtkTurns: number;
  targetTtkActions: number;
  tolerancePercent: number;
  troopIds: number[];
  party: UIParty;
}

/**
 * Global settings from UI.
 */
export interface UIGlobalSettings {
  seed: number;
  maxBattleTurns?: number;
}

/**
 * UI configuration for saving (from ConfigurationPanel).
 */
export interface UIConfigSaveInput {
  version?: string;
  trechos: UITrechoSaveConfig[];
  globalSettings?: UIGlobalSettings;
  metadata?: {
    projectName?: string;
    lastModified?: number;
  };
}

/**
 * Core format party member (as used by @coreto/core).
 */
export interface CorePartyMember {
  classId: number;
  level: number;
}

/**
 * Core format party (as used by @coreto/core).
 */
export interface CoreParty {
  members: CorePartyMember[];
}

/**
 * Core format anchor level range.
 */
export interface CoreAnchorLevelRange {
  min: number;
  max: number;
}

/**
 * Core format TTK target.
 */
export interface CoreTtkTarget {
  turns: number;
  actions: number;
  tolerance: number; // Decimal (0.0-1.0), not percent
}

/**
 * Core format trecho (as used by @coreto/core).
 */
export interface CoreTrechoConfig {
  id: string;
  name: string;
  anchorLevelRange: CoreAnchorLevelRange;
  ttkTarget: CoreTtkTarget;
  troopIds: number[];
  party: CoreParty;
}

/**
 * Project config in Core format (as expected by @coreto/core).
 */
export interface CoreProjectConfig {
  projectPath: string;
  reportOutputPath: string;
  seed: number;
  maxBattleTurns?: number;
  trechos: CoreTrechoConfig[];
}

/**
 * Input for saving project config in Core format.
 */
export interface SaveProjectConfigAsCoreFormatInput {
  /**
   * Absolute path to the RPG Maker MZ project directory.
   */
  projectPath: string;

  /**
   * UI configuration to transform and save.
   */
  config: UIConfigSaveInput;
}

/**
 * Output from saving project config in Core format.
 */
export interface SaveProjectConfigAsCoreFormatOutput {
  /**
   * Indicates if save operation was successful.
   */
  success: boolean;

  /**
   * Full path where config was saved.
   */
  configPath: string;
}

/**
 * Dependencies required by the use case.
 * Injected via dependency injection to maintain purity.
 */
export interface SaveProjectConfigAsCoreFormatDeps {
  /**
   * Storage adapter for writing config files.
   */
  storage: IConfigStorage;
}

// ============================================================================
// Transformation Helpers
// ============================================================================

/**
 * Converts tolerance percent to decimal (15% -> 0.15).
 * Ensures value is clamped between 0 and 1.
 */
function tolerancePercentToDecimal(percent: number): number {
  return Math.max(0, Math.min(1, percent / 100));
}

/**
 * Transforms UI party to Core party format.
 */
function toCoreParty(party: UIParty): CoreParty {
  return {
    members: party.members.map((m) => ({
      classId: m.classId,
      level: m.level,
    })),
  };
}

/**
 * Transforms UI trecho to Core trecho format.
 */
function toCoreTrecho(uiTrecho: UITrechoSaveConfig): CoreTrechoConfig {
  return {
    id: uiTrecho.id,
    name: uiTrecho.name,
    anchorLevelRange: {
      min: uiTrecho.anchorLevelMin,
      max: uiTrecho.anchorLevelMax,
    },
    ttkTarget: {
      turns: uiTrecho.targetTtkTurns,
      actions: uiTrecho.targetTtkActions,
      tolerance: tolerancePercentToDecimal(uiTrecho.tolerancePercent),
    },
    troopIds: [...uiTrecho.troopIds],
    party: toCoreParty(uiTrecho.party),
  };
}

/**
 * Transforms UI config to Core ProjectConfig format.
 */
function toCoreProjectConfig(
  projectPath: string,
  uiConfig: UIConfigSaveInput
): CoreProjectConfig {
  return {
    projectPath,
    reportOutputPath: 'temp/reports',
    seed: uiConfig.globalSettings?.seed ?? 12345,
    maxBattleTurns: uiConfig.globalSettings?.maxBattleTurns,
    trechos: uiConfig.trechos.map(toCoreTrecho),
  };
}

// ============================================================================
// Use Case
// ============================================================================

/**
 * Transforms UI configuration to Core format and saves to storage.
 *
 * This use case handles:
 * - Transformation from ConfigurationPanel format to Core format
 * - Schema conversion (anchorLevelMin/Max → anchorLevelRange, etc.)
 * - Tolerance conversion (percent to decimal)
 * - JSON serialization (pretty formatting)
 * - Storage delegation (adapter handles filesystem)
 *
 * @param input - Project path and UI configuration to transform and save
 * @param deps - Injected dependencies (storage)
 * @returns Success status and config path
 * @throws {Error} If write operation fails
 *
 * @example
 * ```typescript
 * const result = await saveProjectConfigAsCoreFormat(
 *   {
 *     projectPath: '/path/to/project',
 *     config: {
 *       trechos: [
 *         {
 *           id: 'trecho-1',
 *           name: 'Tutorial Battle',
 *           anchorLevelMin: 1,
 *           anchorLevelMax: 5,
 *           targetTtkTurns: 3,
 *           targetTtkActions: 5,
 *           tolerancePercent: 15,
 *           troopIds: [1, 2],
 *           party: { members: [{ classId: 1, level: 1 }] }
 *         }
 *       ],
 *       globalSettings: { seed: 12345 }
 *     }
 *   },
 *   {
 *     storage: fileConfigStorage
 *   }
 * );
 *
 * console.log(`Config saved to: ${result.configPath}`);
 * ```
 */
export async function saveProjectConfigAsCoreFormat(
  input: SaveProjectConfigAsCoreFormatInput,
  deps: SaveProjectConfigAsCoreFormatDeps
): Promise<SaveProjectConfigAsCoreFormatOutput> {
  const { projectPath, config } = input;
  const { storage } = deps;

  // Transform UI config to Core ProjectConfig format
  const coreProjectConfig = toCoreProjectConfig(projectPath, config);

  // Serialize to pretty JSON (human-readable, CLI-compatible)
  const json = JSON.stringify(coreProjectConfig, null, 2);

  // Write via storage adapter (handles directory creation, permissions)
  await storage.write(projectPath, json);

  // Return success with config path
  const configPath = storage.getConfigPath(projectPath);

  return {
    success: true,
    configPath,
  };
}
