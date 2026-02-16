/**
 * IPC Protocol Types (Transport Layer)
 *
 * These types define the serialization contracts for IPC communication.
 * Domain entities are imported and re-exported here for IPC usage.
 *
 * This file is located in main/ipc/ (infrastructure layer) because it defines
 * the transport protocol between main and renderer processes, not core domain concepts.
 */

// Re-export domain entities for IPC serialization
export type { TroopData, ClassData, EnemyData } from '@coreto/electron/domain/entities';
export type { ProjectInfo } from '@coreto/electron/domain/entities';
export type { SimulationSummary, SimulationReport } from '@coreto/electron/domain/entities';

// ============================================================================
// IPC Protocol Types
// ============================================================================

/**
 * Union type of all IPC channel names.
 * Used for type-safe channel routing.
 */
export type IPCChannel =
  | 'project:open'
  | 'project:validate'
  | 'simulation:run'
  | 'simulation:getProgress'
  | 'simulation:cancel'
  | 'simulation:getResults'
  | 'config:load'
  | 'config:save'
  | 'config:exists'
  | 'config:getTrechos'
  | 'config:updateTrecho'
  | 'config:deleteTrecho'
  | 'config:updateGlobalSettings'
  | 'data:getTroops'
  | 'data:getClasses'
  | 'data:getEnemies'
  | 'recent:list'
  | 'recent:add'
  | 'preferences:get'
  | 'preferences:set'
  | 'dialog:openDirectory'
  | 'history:list'
  | 'history:loadReport'
  | 'history:export'
  | 'history:delete'
  | 'history:generateId'
  | 'logs:export'
  | 'oracle-mcp:start'
  | 'oracle-mcp:generate-prompt'
  | 'oracle-mcp:health'
  | 'oracle-mcp:analyze-project'
  | 'oracle-mcp:test-analyze-project'
  | 'nsd:upload'
  | 'test-analyze:prepare-directory';

/**
 * IPC error structure.
 * Used for serializing errors across process boundaries.
 */
export interface IPCError {
  name: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  context: Record<string, unknown>;
  timestamp: string;
}

/**
 * Success response wrapper.
 */
export interface IPCSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Error response wrapper.
 */
export interface IPCErrorResponse {
  success: false;
  error: IPCError;
}

/**
 * Union type for all IPC responses.
 */
export type IPCResult<T> = IPCSuccessResponse<T> | IPCErrorResponse;
