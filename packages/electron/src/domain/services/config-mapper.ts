/**
 * Config Mapper Service
 *
 * Maps configuration data between different formats (form → simulation).
 * Domain layer - pure transformations without framework dependencies.
 */

// Re-export form data types from renderer for type compatibility
// TODO: Move these types to domain in a future phase
export type { TrechoFormData, GlobalSettingsFormData } from '../../../renderer/src/components/ConfigurationPanel/types';

// SimulationConfigData is defined in ExecutionPanel, re-exported here for domain consistency
export interface SimulationConfigData {
  projectPath: string;
  configPath?: string;
  trechos: Array<{
    id: string;
    name: string;
    troopIds: number[];
  }>;
  globalSettings: {
    seed?: number;
    maxBattleTurns?: number;
  };
}

/**
 * Maps project configuration form data to simulation config format.
 *
 * @param projectPath - Path to the RPG Maker MZ project
 * @param configPath - Optional path to the saved config file
 * @param trechos - Array of trecho configurations
 * @param globalSettings - Global simulation settings
 * @returns Simulation config data for the Execution Panel
 *
 * @example
 * const simConfig = mapToSimulationConfig(
 *   '/path/to/project',
 *   '/path/to/project/config.json',
 *   trechos,
 *   globalSettings
 * );
 */
export function mapToSimulationConfig(
  projectPath: string,
  configPath: string | undefined,
  trechos: Array<{
    id: string;
    name: string;
    troopIds: number[];
  }>,
  globalSettings: { seed?: number; maxBattleTurns?: number }
): SimulationConfigData {
  return {
    projectPath,
    configPath,
    trechos: trechos.map((t) => ({
      id: t.id,
      name: t.name,
      troopIds: t.troopIds,
    })),
    globalSettings,
  };
}
