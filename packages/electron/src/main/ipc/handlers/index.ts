/**
 * IPC Handlers Registry
 *
 * Central registry for all IPC handlers.
 * Registers handlers with ipcMain during main process initialization.
 */

import { ipcMain } from 'electron';

// Import all handler modules
import * as project from './project.js';
import * as simulation from './simulation.js';
import * as data from './data.js';
import * as config from './config.js';
import * as recent from './recent.js';
import * as preferences from './preferences.js';
import * as dialog from './dialog.js';
import * as history from './history-handlers.js';
import * as logs from './logs.js';

// Import external handler registries
import { CONFIG_IPC_HANDLERS } from '../config-handlers.js';
import { HISTORY_IPC_HANDLERS } from '../history-handlers.js';

// Import types
import type { IPCChannel, IPCResult } from '../protocol-types.js';

/**
 * Type-safe handler retrieval from external registries.
 * Throws if handler is not found (fail-fast during initialization).
 */
function getRegistryHandler<K extends IPCChannel>(
  registry: Record<string, (event: unknown, payload: unknown) => Promise<IPCResult>>,
  channel: K
): (event: unknown, payload: unknown) => Promise<IPCResult> {
  const handler = registry[channel];
  if (!handler) {
    throw new Error(`Handler not found for channel: ${channel}`);
  }
  return handler;
}

/**
 * Registers all IPC handlers with ipcMain.
 * Called during main process initialization.
 */
export function registerHandlers(): void {
  // Project handlers
  ipcMain.handle('project:open', project.handleProjectOpen);
  ipcMain.handle('project:validate', project.handleProjectValidate);

  // Simulation handlers
  ipcMain.handle('simulation:run', simulation.handleSimulationRun);
  ipcMain.handle('simulation:getProgress', simulation.handleSimulationGetProgress);
  ipcMain.handle('simulation:cancel', simulation.handleSimulationCancel);
  ipcMain.handle('simulation:getResults', simulation.handleSimulationGetResults);

  // Config handlers
  ipcMain.handle('config:load', config.handleConfigLoad);
  ipcMain.handle('config:save', getRegistryHandler(CONFIG_IPC_HANDLERS, 'config:save'));
  ipcMain.handle('config:exists', getRegistryHandler(CONFIG_IPC_HANDLERS, 'config:exists'));
  ipcMain.handle('config:getTrechos', config.handleConfigGetTrechos);
  ipcMain.handle('config:updateTrecho', config.handleConfigUpdateTrecho);
  ipcMain.handle('config:deleteTrecho', config.handleConfigDeleteTrecho);
  ipcMain.handle('config:updateGlobalSettings', config.handleConfigUpdateGlobalSettings);

  // Data handlers
  ipcMain.handle('data:getTroops', data.handleDataGetTroops);
  ipcMain.handle('data:getClasses', data.handleDataGetClasses);
  ipcMain.handle('data:getEnemies', data.handleDataGetEnemies);

  // Recent handlers
  ipcMain.handle('recent:list', recent.handleRecentList);
  ipcMain.handle('recent:add', recent.handleRecentAdd);

  // Preferences handlers
  ipcMain.handle('preferences:get', preferences.handlePreferencesGet);
  ipcMain.handle('preferences:set', preferences.handlePreferencesSet);

  // Dialog handlers
  ipcMain.handle('dialog:openDirectory', dialog.handleDialogOpenDirectory);

  // History handlers
  ipcMain.handle('history:export', history.handleHistoryExport);

  // Logs handlers
  ipcMain.handle('logs:export', logs.handleLogsExport);
  ipcMain.handle('logs:flushRendererLogs', logs.handleLogsFlushRenderer);

  // History handlers (from registry - for other history operations)
  ipcMain.handle('history:list', getRegistryHandler(HISTORY_IPC_HANDLERS, 'history:list'));
  ipcMain.handle('history:loadReport', getRegistryHandler(HISTORY_IPC_HANDLERS, 'history:loadReport'));
  ipcMain.handle('history:delete', getRegistryHandler(HISTORY_IPC_HANDLERS, 'history:delete'));
  ipcMain.handle('history:generateId', getRegistryHandler(HISTORY_IPC_HANDLERS, 'history:generateId'));
}

/**
 * Export simulation result management functions for external use.
 * These are used by history handlers to manage simulation results.
 */
export { setSimulationResults, clearSimulationResults } from './simulation.js';
