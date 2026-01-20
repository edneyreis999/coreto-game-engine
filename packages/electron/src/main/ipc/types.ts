/**
 * IPC Type Definitions
 *
 * Type-safe definitions for all IPC channels, payloads, and responses.
 * Uses Zod schemas for runtime validation of inbound payloads.
 *
 * This file defines the contract between renderer and main processes,
 * ensuring type safety across the IPC boundary.
 *
 * @see packages/electron/src/main/ipc/handlers.ts
 * @see packages/electron/src/preload/index.ts
 */

import { z } from 'zod';

// ============================================================================
// Domain Type Imports
// ============================================================================

/**
 * Re-export core domain types for IPC serialization.
 * These types are used in IPC responses and must be JSON-serializable.
 */

export type PartyMemberData = {
  classId: number;
  level: number;
};

export type PartyConfigData = {
  members: PartyMemberData[];
};

export type BattleOutcome = 'victory' | 'defeat' | 'timeout';

export type BattleResultData = {
  troopId: number;
  troopName: string;
  outcome: BattleOutcome;
  ttkTurns: number;
  ttkActions: number;
  durationMs: number;
  seed: number;
  expGained: number;
};

export type TrechoData = {
  id: string;
  name: string;
  anchorLevelMin: number;
  anchorLevelMax: number;
  targetTtkTurns: number;
  targetTtkActions: number;
  tolerancePercent: number;
  troopIds: number[];
  party: PartyConfigData;
};

// ============================================================================
// Error Serialization
// ============================================================================

/**
 * Serialized error format for IPC responses.
 * Errors are converted to this safe format before sending across IPC.
 */
export interface IPCError {
  name: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  context: Record<string, unknown>;
  timestamp: string;
}

/**
 * Zod schema for validating IPC error format.
 */
export const IPCErrorSchema: z.ZodType<IPCError> = z.object({
  name: z.string(),
  message: z.string(),
  severity: z.enum(['critical', 'warning', 'info']),
  context: z.record(z.unknown()),
  timestamp: z.string(),
});

// ============================================================================
// IPC Channel Definitions
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
  | 'config:load'
  | 'config:getTrechos'
  | 'data:getTroops'
  | 'data:getClasses'
  | 'data:getEnemies';

// ============================================================================
// Project Handlers
// ============================================================================

/**
 * Response format for project:open handler.
 */
export interface ProjectInfo {
  path: string;
  name: string;
  isValid: boolean;
  troopsCount?: number;
  classesCount?: number;
  enemiesCount?: number;
}

/**
 * Zod schema for project:open payload.
 */
export const ProjectOpenPayloadSchema = z.object({
  path: z
    .string()
    .min(1, 'Project path cannot be empty')
    .refine((p) => !p.includes('..'), 'Path traversal not allowed'),
});

export type ProjectOpenPayload = z.infer<typeof ProjectOpenPayloadSchema>;

/**
 * Response format for project:validate handler.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Zod schema for project:validate payload.
 */
export const ProjectValidatePayloadSchema = ProjectOpenPayloadSchema;

export type ProjectValidatePayload = z.infer<typeof ProjectValidatePayloadSchema>;

// ============================================================================
// Simulation Handlers
// ============================================================================

/**
 * Payload format for simulation:run handler.
 */
export interface SimulationConfig {
  projectPath: string;
  configPath?: string;
  trechoId?: string;
  troopId?: number;
  seed?: number;
  maxTurns?: number;
}

/**
 * Zod schema for simulation:run payload.
 */
export const SimulationRunPayloadSchema = z.object({
  projectPath: z
    .string()
    .min(1, 'Project path cannot be empty')
    .refine((p) => !p.includes('..'), 'Path traversal not allowed'),
  configPath: z.string().optional(),
  trechoId: z.string().optional(),
  troopId: z.number().int().positive().optional(),
  seed: z.number().int().optional(),
  maxTurns: z.number().int().positive().optional(),
});

export type SimulationRunPayload = z.infer<typeof SimulationRunPayloadSchema>;

/**
 * Response format for simulation:run handler.
 */
export interface SimulationResult {
  trechoId: string;
  troopId: number;
  troopName: string;
  battleResult: BattleResultData;
  passed: boolean;
  warnings: string[];
}

/**
 * Progress state for simulation tracking.
 */
export interface SimulationProgress {
  current: number;
  total: number;
  percentage: number;
  isRunning: boolean;
  currentTrecho?: string;
  currentTroop?: number;
}

// ============================================================================
// Configuration Handlers
// ============================================================================

/**
 * Zod schema for config:load payload.
 */
export const ConfigLoadPayloadSchema = z.object({
  configPath: z
    .string()
    .min(1, 'Config path cannot be empty')
    .refine((p) => !p.includes('..'), 'Path traversal not allowed'),
});

export type ConfigLoadPayload = z.infer<typeof ConfigLoadPayloadSchema>;

/**
 * Response format for config:load handler.
 * Returns the loaded project configuration with all trechos.
 */
export interface ProjectConfigResponse {
  projectPath: string;
  reportOutputPath: string;
  seed: number;
  maxBattleTurns?: number;
  trechos: TrechoData[];
}

// No payload for config:getTrechos (takes no parameters)

// ============================================================================
// Data Handlers
// ============================================================================

/**
 * Troop data from RPG Maker MZ Troops.json.
 */
export interface TroopData {
  id: number;
  name: string;
  members: Array<{
    enemyId: number;
    x: number;
    y: number;
    hidden: boolean;
  }>;
}

/**
 * Class data from RPG Maker MZ Classes.json.
 */
export interface ClassData {
  id: number;
  name: string;
  expTable: number[];
}

/**
 * Enemy data from RPG Maker MZ Enemies.json.
 */
export interface EnemyData {
  id: number;
  name: string;
  params: number[]; // MHP, MMP, ATK, DEF, AGI, LUK
  dropItems: Array<{ kind: number; dataId: number; denominator: number }>;
}

/**
 * Zod schema for data:getTroops payload.
 */
export const DataGetTroopsPayloadSchema = z.object({
  projectPath: z
    .string()
    .min(1, 'Project path cannot be empty')
    .refine((p) => !p.includes('..'), 'Path traversal not allowed'),
});

export type DataGetTroopsPayload = z.infer<typeof DataGetTroopsPayloadSchema>;

/**
 * Zod schema for data:getClasses payload.
 */
export const DataGetClassesPayloadSchema = DataGetTroopsPayloadSchema;

export type DataGetClassesPayload = z.infer<typeof DataGetClassesPayloadSchema>;

/**
 * Zod schema for data:getEnemies payload.
 */
export const DataGetEnemiesPayloadSchema = DataGetTroopsPayloadSchema;

export type DataGetEnemiesPayload = z.infer<typeof DataGetEnemiesPayloadSchema>;

// ============================================================================
// Handler Response Types
// ============================================================================

/**
 * Union type of all successful IPC handler responses.
 * Each channel maps to its specific response type.
 */
export type IPCResponse =
  | ProjectInfo
  | ValidationResult
  | SimulationResult
  | number // For simulation:getProgress
  | void // For simulation:cancel
  | ProjectConfigResponse
  | TrechoData[]
  | TroopData[]
  | ClassData[]
  | EnemyData[];

/**
 * Error response format for all IPC handlers.
 */
export interface IPCErrorResponse {
  success: false;
  error: IPCError;
}

/**
 * Success response format for all IPC handlers.
 */
export interface IPCSuccessResponse<T = IPCResponse> {
  success: true;
  data: T;
}

/**
 * Union type for all IPC responses (success or error).
 */
export type IPCResult<T = IPCResponse> = IPCSuccessResponse<T> | IPCErrorResponse;

// ============================================================================
// Channel-to-Payload Mapping
// ============================================================================

/**
 * Maps each IPC channel to its payload schema.
 */
export const IPCPayloadSchemas = {
  'project:open': ProjectOpenPayloadSchema,
  'project:validate': ProjectValidatePayloadSchema,
  'simulation:run': SimulationRunPayloadSchema,
  'simulation:getProgress': z.void(), // No payload
  'simulation:cancel': z.void(), // No payload
  'config:load': ConfigLoadPayloadSchema,
  'config:getTrechos': z.void(), // No payload
  'data:getTroops': DataGetTroopsPayloadSchema,
  'data:getClasses': DataGetClassesPayloadSchema,
  'data:getEnemies': DataGetEnemiesPayloadSchema,
} as const satisfies Record<IPCChannel, z.ZodTypeAny>;

/**
 * Type-safe payload extraction for each channel.
 */
export type ChannelPayload<T extends IPCChannel> = z.infer<
  (typeof IPCPayloadSchemas)[T]
>;
