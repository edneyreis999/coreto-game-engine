/**
 * IPC Type Definitions
 *
 * Type-safe definitions for all IPC channels, payloads, and responses.
 * Uses Zod schemas for runtime validation of inbound payloads.
 *
 * This file defines the contract between renderer and main processes,
 * ensuring type safety across the IPC boundary.
 *
 * IPC protocol types (IPCResult, IPCError, IPCChannel) are now imported from
 * protocol-types.ts (transport layer).
 *
 * @see main/ipc/protocol-types.ts for IPC protocol types
 * @see domain/types for domain DTOs
 * @see packages/electron/CLAUDE.md (Import Conventions)
 */

import { z } from 'zod';

// ============================================================================
// IPC Protocol Types (Transport Layer)
// ============================================================================

/**
 * Import IPC protocol types from protocol-types.ts.
 * These types define the serialization contracts for IPC communication.
 */
export type {
  IPCChannel,
  IPCError,
  IPCSuccessResponse,
  IPCErrorResponse,
  IPCResult,
} from './protocol-types.js';

/**
 * Re-export domain entities from protocol-types.ts.
 * (protocol-types.ts re-exports them from domain layer)
 */
export type {
  TroopData,
  ClassData,
  EnemyData,
  ProjectInfo,
  SimulationSummary,
  SimulationReport,
} from './protocol-types.js';

// ============================================================================
// Domain Type Re-exports
// ============================================================================

/**
 * Re-export core domain types from the domain layer.
 * These types are framework-agnostic and used across IPC boundaries.
 *
 * Import Convention (CLAUDE-ARCH-CONVENTION):
 * - Domain imports use module aliases (@coreto/electron/domain/*)
 *
 * @see packages/electron/src/domain/types
 * @see packages/electron/CLAUDE.md (Import Conventions)
 */
export type {
  BattleOutcome,
  BattleResultData,
  ReportBattleResult,
  WarningData,
  TrechoSummaryData,
  ReportData,
  ValidationResult,
  SimulationConfig,
  SimulationProgress,
  SimulationResult,
  SimulationHistoryEntry,
} from '@coreto/electron/domain/types';

/**
 * Import domain types for use within this file (e.g., in response types).
 * Import Convention (CLAUDE-ARCH-CONVENTION):
 * - Domain imports use module aliases (@coreto/electron/domain/*)
 */
import type {
  SimulationHistoryEntry,
  SimulationReport,
  ValidationResult,
  SimulationResult,
  ReportData,
  TrechoData,
  ProjectConfigResponse,
  ProjectInfo,
  TroopData,
  ClassData,
  EnemyData,
  RecentProject,
  UserPreferences,
} from '@coreto/electron/domain/types';

/**
 * Domain DTOs also exported from domain layer.
 * Re-export them here for convenience.
 * Import Convention (CLAUDE-ARCH-CONVENTION):
 * - Domain imports use module aliases (@coreto/electron/domain/*)
 */
export type {
  PartyMemberData,
  PartyConfigData,
  TrechoData,
  ProjectInfo,
  ProjectConfigResponse,
  TroopData,
  ClassData,
  EnemyData,
  RecentProject,
  UserPreferences,
  LogEntry,
  LogBundle,
} from '@coreto/electron/domain/types';

// ============================================================================
// Error Serialization
// ============================================================================

/**
 * Import IPCError from protocol-types.ts.
 */
import type { IPCError } from './protocol-types.js';

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
// Project Handlers
// ============================================================================

/**
 * ProjectInfo is re-exported from domain layer above.
 *
 * Zod schema for project:open payload.
 */
export const ProjectOpenPayloadSchema = z.object({
  path: z
    .string()
    .min(1, 'Project path cannot be empty')
    .refine((p) => !p.includes('..'), 'Path traversal not allowed'),
});

export type ProjectOpenPayload = z.infer<typeof ProjectOpenPayloadSchema>;

// ValidationResult is now exported from domain/types/index.js

/**
 * Zod schema for project:validate payload.
 */
export const ProjectValidatePayloadSchema = ProjectOpenPayloadSchema;

export type ProjectValidatePayload = z.infer<typeof ProjectValidatePayloadSchema>;

// ============================================================================
// Simulation Handlers
// ============================================================================

// SimulationConfig is now exported from domain/types/index.js

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

// SimulationResult, SimulationProgress are now exported from domain/types/index.js
// WarningData, ReportBattleResult, TrechoSummaryData, ReportData are now exported from domain/types/index.js

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
 * ProjectConfigResponse is re-exported from domain layer above.
 *
 * No payload for config:getTrechos (takes no parameters)
 */

/**
 * Zod schema for config:save payload.
 * Updated to match ConfigurationPanel format (TrechoFormData).
 */
export const ConfigSavePayloadSchema = z.object({
  projectPath: z
    .string()
    .min(1, 'Project path cannot be empty')
    .refine((p) => !p.includes('..'), 'Path traversal not allowed'),
  config: z.object({
    version: z.string().default('1.0'),
    trechos: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          anchorLevelMin: z.number().int().min(1).max(99),
          anchorLevelMax: z.number().int().min(1).max(99),
          targetTtkTurns: z.number().int().nonnegative(),
          targetTtkActions: z.number().int().nonnegative(),
          tolerancePercent: z.number().int().min(0).max(100),
          troopIds: z.array(z.number().int().positive()).min(1),
          party: z.object({
            members: z
              .array(
                z.object({
                  classId: z.number().int().positive(),
                  level: z.number().int().min(1).max(99),
                })
              )
              .min(1)
              .max(4),
          }),
        })
      )
      .default([]),
    globalSettings: z
      .object({
        seed: z.number().int().nonnegative(),
        maxBattleTurns: z.number().int().positive().optional(),
      })
      .optional(),
    metadata: z
      .object({
        projectName: z.string().optional(),
        lastModified: z.number().int().nonnegative().optional(),
      })
      .optional(),
  }),
});

export type ConfigSavePayload = z.infer<typeof ConfigSavePayloadSchema>;

/**
 * Response format for config:save handler.
 */
export interface ConfigSaveResponse {
  success: boolean;
  configPath: string;
}

/**
 * Zod schema for config:exists payload.
 */
export const ConfigExistsPayloadSchema = z.object({
  projectPath: z
    .string()
    .min(1, 'Project path cannot be empty')
    .refine((p) => !p.includes('..'), 'Path traversal not allowed'),
});

export type ConfigExistsPayload = z.infer<typeof ConfigExistsPayloadSchema>;

/**
 * Response format for config:exists handler.
 */
export interface ConfigExistsResponse {
  exists: boolean;
  configPath: string;
}

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
      members: z
        .array(
          z.object({
            classId: z.number().int().positive(),
            level: z.number().int().min(1).max(99),
          })
        )
        .min(1)
        .max(4),
    }),
  }),
});

export type ConfigUpdateTrechoPayload = z.infer<typeof ConfigUpdateTrechoPayloadSchema>;

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

export type ConfigDeleteTrechoPayload = z.infer<typeof ConfigDeleteTrechoPayloadSchema>;

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
 * TroopData, ClassData, EnemyData are re-exported from domain layer above.
 *
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
 * RecentProject is re-exported from domain layer above.
 *
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

// SimulationSummary, SimulationHistoryEntry, SimulationReport are now exported from domain/types/index.js

// ============================================================================
// Preferences Handlers
// ============================================================================

/**
 * UserPreferences is re-exported from domain layer above.
 *
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
// History Handlers
// ============================================================================

// SimulationSummary, SimulationHistoryEntry, SimulationReport are now exported from domain/types/index.js

/**
 * Zod schema for history:list payload.
 */
export const HistoryListPayloadSchema = z.object({
  projectPath: z.string().optional(),
  limit: z.number().int().positive().optional(),
});

export type HistoryListPayload = z.infer<typeof HistoryListPayloadSchema>;

/**
 * Response format for history:list handler.
 */
export interface HistoryListResponse {
  simulations: SimulationHistoryEntry[];
}

/**
 * Zod schema for history:loadReport payload.
 */
export const HistoryLoadReportPayloadSchema = z.object({
  simulationId: z.string().uuid(),
});

export type HistoryLoadReportPayload = z.infer<typeof HistoryLoadReportPayloadSchema>;

/**
 * Response format for history:loadReport handler.
 */
export interface HistoryLoadReportResponse {
  report: SimulationReport | null;
}

/**
 * Zod schema for history:export payload.
 */
// Report data schemas
const BattleOutcomeSchema = z.enum(['victory', 'defeat', 'timeout']);

const WarningDataSchema = z.object({
  type: z.string(),
  severity: z.enum(['critical', 'warning', 'info']),
  message: z.string(),
  context: z.record(z.unknown()),
});

const ReportBattleResultSchema = z.object({
  troopId: z.number(),
  troopName: z.string(),
  outcome: BattleOutcomeSchema,
  ttkTurns: z.number(),
  ttkActions: z.number(),
  durationMs: z.number(),
  seed: z.number(),
  expGained: z.number(),
});

const TrechoSummaryDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  passed: z.boolean(),
  battleCount: z.number(),
  avgTtkTurns: z.number(),
  avgTtkActions: z.number(),
  p95TtkTurns: z.number(),
  p95TtkActions: z.number(),
  successRate: z.number(),
  battles: z.array(ReportBattleResultSchema),
  warnings: z.array(WarningDataSchema),
});

const ReportDataSchema = z.object({
  trechos: z.array(TrechoSummaryDataSchema),
  totalBattles: z.number(),
  timestamp: z.string(),
});

export const HistoryExportPayloadSchema = z.object({
  simulationId: z.string().uuid(),
  result: ReportDataSchema,
  projectPath: z.string().min(1),
});

export type HistoryExportPayload = z.infer<typeof HistoryExportPayloadSchema>;

/**
 * Response format for history:export handler.
 */
export interface HistoryExportResponse {
  filePath: string;
}

/**
 * Zod schema for history:delete payload.
 */
export const HistoryDeletePayloadSchema = z.object({
  simulationId: z.string().uuid(),
});

export type HistoryDeletePayload = z.infer<typeof HistoryDeletePayloadSchema>;

/**
 * Response format for history:delete handler.
 */
export interface HistoryDeleteResponse {
  deletedId: string;
}

/**
 * Response format for history:generateId handler.
 */
export interface HistoryGenerateIdResponse {
  simulationId: string;
}

// No payload for history:generateId

// ============================================================================
// Logs Handlers
// ============================================================================

/**
 * Response format for logs:export handler.
 */
export interface LogsExportResponse {
  bundle: LogBundle;
  downloadPath: string;
}

// No payload for logs:export

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
  | ConfigSaveResponse
  | ConfigExistsResponse
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
  | OpenDirectoryResponse
  | HistoryListResponse
  | HistoryLoadReportResponse
  | HistoryExportResponse
  | HistoryDeleteResponse
  | HistoryGenerateIdResponse
  | LogsExportResponse;

/**
 * IPCErrorResponse, IPCSuccessResponse, IPCResult are re-exported from domain layer above.
 * Note: IPCResult is already typed with generic parameter in domain layer.
 */

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
  'config:save': ConfigSavePayloadSchema,
  'config:exists': ConfigExistsPayloadSchema,
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
  'history:list': HistoryListPayloadSchema,
  'history:loadReport': HistoryLoadReportPayloadSchema,
  'history:export': HistoryExportPayloadSchema,
  'history:delete': HistoryDeletePayloadSchema,
  'history:generateId': z.void(), // No payload
  'logs:export': z.void(), // No payload
} as const satisfies Record<IPCChannel, z.ZodTypeAny>;

/**
 * Type-safe payload extraction for each channel.
 */
export type ChannelPayload<T extends IPCChannel> = z.infer<(typeof IPCPayloadSchemas)[T]>;
