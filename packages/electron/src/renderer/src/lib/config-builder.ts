/**
 * Config Builder Utilities
 *
 * Pure functions for building configuration objects.
 * Extracts data transformation logic from ConfigurationPanel component.
 *
 * @see Task #7 - Extract business logic from ConfigurationPanel
 */

import type {
  TrechoFormData,
  GlobalSettingsFormData,
  ProjectConfigFormData,
} from '../components/ConfigurationPanel/types';

/**
 * Builds a complete project configuration from trechos and settings.
 *
 * Pure function that transforms form data into the structure expected
 * by the configuration persistence layer.
 *
 * @param projectPath - Path to RPG Maker MZ project
 * @param trechos - Configured trechos
 * @param globalSettings - Global settings (seed, maxBattleTurns)
 * @returns Complete project configuration
 *
 * @example
 * ```typescript
 * const config = buildProjectConfig(
 *   '/path/to/project',
 *   [trecho1, trecho2],
 *   { seed: 12345, maxBattleTurns: 100 }
 * );
 *
 * await saveConfig(config);
 * ```
 */
export function buildProjectConfig(
  projectPath: string,
  trechos: TrechoFormData[],
  globalSettings: GlobalSettingsFormData
): ProjectConfigFormData {
  return {
    projectPath,
    trechos: trechos.map((trecho) => ({
      id: trecho.id,
      name: trecho.name,
      anchorLevelMin: trecho.anchorLevelMin,
      anchorLevelMax: trecho.anchorLevelMax,
      targetTtkTurns: trecho.targetTtkTurns,
      targetTtkActions: trecho.targetTtkActions,
      tolerancePercent: trecho.tolerancePercent,
      troopIds: [...trecho.troopIds],
      party: {
        members: trecho.party.members.map((member) => ({
          classId: member.classId,
          level: member.level,
        })),
      },
    })),
    globalSettings: {
      seed: globalSettings.seed,
      maxBattleTurns: globalSettings.maxBattleTurns,
    },
  };
}
