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
  | 'simulation:getResults'
  | 'config:load'
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
  | 'dialog:openDirectory';

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

/**
 * Warning data structure for Report.
 */
export interface WarningData {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  context: Record<string, unknown>;
}

/**
 * Battle result data in Report format.
 */
export interface ReportBattleResult {
  troopId: number;
  troopName: string;
  outcome: BattleOutcome;
  ttkTurns: number;
  ttkActions: number;
  durationMs: number;
  seed: number;
  expGained: number;
}

/**
 * Trecho summary data in Report format.
 */
export interface TrechoSummaryData {
  id: string;
  name: string;
  passed: boolean;
  battleCount: number;
  avgTtkTurns: number;
  avgTtkActions: number;
  p95TtkTurns: number;
  p95TtkActions: number;
  successRate: number;
  battles: ReportBattleResult[];
  warnings: WarningData[];
}

/**
 * Report data structure returned by simulation:getResults handler.
 */
export interface ReportData {
  trechos: TrechoSummaryData[];
  totalBattles: number;
  timestamp: string;
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

/**
 * Zod schema for config:updateTrecho payload.
 */
export const ConfigUpdateTrechoPayloadSchema = z.object({
  projectPath: z
    .string()
    .min(1, 'Project path cannot be empty')
    .refine((p) => !p.includes('..'), 'Path traversal not allowed'),
  trecho: z.object({
    id: z.string().min(1, 'Trecho ID cannot be empty'),
    name: z.string().optional(),
    anchorLevelMin: z.number().int().min(1).max(99),
    anchorLevelMax: z.number().int().min(1).max(99),
    targetTtkTurns: z.number().int().positive(),
    targetTtkActions: z.number().int().positive(),
    tolerancePercent: z.number().min(0).max(100),
    troopIds: z.array(z.number().int().positive()).min(1),
    party: z.object({
      members: z.array(
        z.object({
          classId: z.number().int().positive(),
          level: z.number().int().min(1).max(99),
        })
      ).min(1).max(4),
    }),
  }),
});

export type ConfigUpdateTrechoPayload = z.infer<
  typeof ConfigUpdateTrechoPayloadSchema
>;

/**
 * Response format for config:updateTrecho handler.
 */
export interface ConfigUpdateTrechoResponse {
  trecho: TrechoData;
}

/**
 * Zod schema for config:deleteTrecho payload.
 */
export const ConfigDeleteTrechoPayloadSchema = z.object({
  projectPath: z
    .string()
    .min(1, 'Project path cannot be empty')
    .refine((p) => !p.includes('..'), 'Path traversal not allowed'),
  trechoId: z.string().min(1, 'Trecho ID cannot be empty'),
});

export type ConfigDeleteTrechoPayload = z.infer<
  typeof ConfigDeleteTrechoPayloadSchema
>;

/**
 * Response format for config:deleteTrecho handler.
 */
export interface ConfigDeleteTrechoResponse {
  deletedTrechoId: string;
}

/**
 * Zod schema for config:updateGlobalSettings payload.
 */
export const ConfigUpdateGlobalSettingsPayloadSchema = z.object({
  projectPath: z
    .string()
    .min(1, 'Project path cannot be empty')
    .refine((p) => !p.includes('..'), 'Path traversal not allowed'),
  seed: z.number().int().positive().optional(),
  maxBattleTurns: z.number().int().positive().optional(),
});

export type ConfigUpdateGlobalSettingsPayload = z.infer<
  typeof ConfigUpdateGlobalSettingsPayloadSchema
>;

/**
 * Response format for config:updateGlobalSettings handler.
 */
export interface ConfigUpdateGlobalSettingsResponse {
  seed: number;
  maxBattleTurns?: number;
}

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
// Recent Projects Handlers
// ============================================================================

/**
 * Recent project response format.
 */
export interface RecentProject {
  path: string;
  name: string;
  lastOpened: string;
}

/**
 * Zod schema for recent:list payload.
 */
export const RecentListPayloadSchema = z
  .object({
    limit: z.number().int().positive().optional(),
  })
  .optional();

export type RecentListPayload = z.infer<typeof RecentListPayloadSchema>;

/**
 * Zod schema for recent:add payload.
 */
export const RecentAddPayloadSchema = z.object({
  path: z
    .string()
    .min(1, 'Project path cannot be empty')
    .refine((p) => !p.includes('..'), 'Path traversal not allowed'),
  name: z.string().min(1, 'Project name cannot be empty'),
});

export type RecentAddPayload = z.infer<typeof RecentAddPayloadSchema>;

/**
 * Response format for recent:list handler.
 */
export type RecentListResponse = RecentProject[];

/**
 * Response format for recent:add handler.
 */
export type RecentAddResponse = RecentProject;

// ============================================================================
// Preferences Handlers
// ============================================================================

/**
 * User preferences format.
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  lastProjectPath: string | null;
}

/**
 * Zod schema for preferences:set payload.
 */
export const PreferencesSetPayloadSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  lastProjectPath: z.string().nullable().optional(),
});

export type PreferencesSetPayload = z.infer<typeof PreferencesSetPayloadSchema>;

/**
 * Response format for preferences:get handler.
 */
export type PreferencesGetResponse = UserPreferences;

/**
 * Response format for preferences:set handler.
 */
export type PreferencesSetResponse = UserPreferences;

// ============================================================================
// Dialog Handlers
// ============================================================================

/**
 * Response format for dialog:openDirectory handler.
 */
export interface OpenDirectoryResult {
  canceled: boolean;
  filePaths: string[];
}

/**
 * Zod schema for dialog:openDirectory payload.
 */
export const OpenDirectoryPayloadSchema = z.void();

export type OpenDirectoryPayload = z.infer<typeof OpenDirectoryPayloadSchema>;

/**
 * Response format for dialog:openDirectory handler.
 */
export type OpenDirectoryResponse = OpenDirectoryResult;

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
  | ReportData // For simulation:getResults
  | ProjectConfigResponse
  | TrechoData[]
  | ConfigUpdateTrechoResponse
  | ConfigDeleteTrechoResponse
  | ConfigUpdateGlobalSettingsResponse
  | TroopData[]
  | ClassData[]
  | EnemyData[]
  | RecentListResponse
  | RecentAddResponse
  | PreferencesGetResponse
  | PreferencesSetResponse
  | OpenDirectoryResponse;

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
  'simulation:getResults': z.void(), // No payload
  'config:load': ConfigLoadPayloadSchema,
  'config:getTrechos': z.void(), // No payload
  'config:updateTrecho': ConfigUpdateTrechoPayloadSchema,
  'config:deleteTrecho': ConfigDeleteTrechoPayloadSchema,
  'config:updateGlobalSettings': ConfigUpdateGlobalSettingsPayloadSchema,
  'data:getTroops': DataGetTroopsPayloadSchema,
  'data:getClasses': DataGetClassesPayloadSchema,
  'data:getEnemies': DataGetEnemiesPayloadSchema,
  'recent:list': RecentListPayloadSchema,
  'recent:add': RecentAddPayloadSchema,
  'preferences:get': z.void(), // No payload
  'preferences:set': PreferencesSetPayloadSchema,
  'dialog:openDirectory': OpenDirectoryPayloadSchema,
} as const satisfies Record<IPCChannel, z.ZodTypeAny>;

/**
 * Type-safe payload extraction for each channel.
 */
export type ChannelPayload<T extends IPCChannel> = z.infer<
  (typeof IPCPayloadSchemas)[T]
>;
