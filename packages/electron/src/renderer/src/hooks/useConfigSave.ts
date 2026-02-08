/**
 * useConfigSave Hook
 *
 * Custom React hook for saving project configuration.
 * Extracts business logic from App.tsx handleConfigSaved callback.
 *
 * @see packages/electron/src/renderer/src/App.tsx
 */

import { useCallback } from 'react';
import type { Logger } from './useLogger';

// Import types from domain layer
import type { SimulationConfigData } from '@coreto/electron/domain/services';
import { extractProjectName, mapToSimulationConfig } from '@coreto/electron/domain/services';

// Import form types
import type { ProjectConfigFormData } from '@/components/ConfigurationPanel';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a config save operation.
 */
interface ConfigSaveResult {
  success: boolean;
  simConfig: SimulationConfigData | null;
  error: string | null;
}

/**
 * Parameters for the saveConfig function.
 */
interface SaveConfigParams {
  config: ProjectConfigFormData;
  logger: Logger;
}

// ============================================================================
// Hook Return Value
// ============================================================================

interface ConfigSaveReturn {
  /**
   * Saves project configuration via IPC and returns simulation config.
   * @param params - Configuration data and logger instance
   * @returns Promise resolving to save result with simulation config
   */
  saveConfig: (params: SaveConfigParams) => Promise<ConfigSaveResult>;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Custom hook for saving project configuration.
 *
 * Handles the complete config save flow:
 * - Validates configuration data
 * - Calls IPC to persist config to file
 * - Maps form data to simulation config format
 * - Handles errors and logging
 *
 * Separated from App.tsx to improve testability and reduce component complexity.
 *
 * @example
 * const { saveConfig } = useConfigSave();
 *
 * const result = await saveConfig({
 *   config: formData,
 *   logger: useLogger()
 * });
 *
 * if (result.success && result.simConfig) {
 *   setSimulationConfig(result.simConfig);
 * }
 */
export function useConfigSave(): ConfigSaveReturn {
  /**
   * Saves project configuration and returns simulation config for UI state.
   */
  const saveConfig = useCallback(async (params: SaveConfigParams): Promise<ConfigSaveResult> => {
    const { config, logger } = params;

    try {
      // Call IPC to save config with the full trecho data
      const response = await window.coreto.config.save(config.projectPath, {
        version: '1.0',
        trechos: config.trechos,
        globalSettings: config.globalSettings,
        metadata: {
          projectName: extractProjectName(config.projectPath),
          lastModified: Date.now(),
        },
      });

      if (response.success) {
        // Convert to SimulationConfigData using domain mapper
        const simConfig = mapToSimulationConfig(
          config.projectPath,
          response.data.configPath,
          config.trechos.map((t) => ({
            id: t.id,
            name: t.name,
            troopIds: t.troopIds,
          })),
          config.globalSettings
        );

        return {
          success: true,
          simConfig,
          error: null,
        };
      } else {
        const errorMessage = `Failed to save configuration: ${JSON.stringify(response.error)}`;
        logger.error(errorMessage);
        return {
          success: false,
          simConfig: null,
          error: errorMessage,
        };
      }
    } catch (error) {
      const errorMessage = `Error saving configuration: ${String(error)}`;
      logger.error(errorMessage);
      return {
        success: false,
        simConfig: null,
        error: errorMessage,
      };
    }
  }, []);

  return {
    saveConfig,
  };
}

export default useConfigSave;
