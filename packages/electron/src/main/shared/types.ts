/**
 * Shared Types Module (Main Process Infrastructure)
 *
 * Prevents circular dependencies between main/services and main/ipc.
 * Pure type re-exports from domain layer.
 *
 * **Purpose:**
 * - Break circular dependency cycle: main/services ↔ main/ipc
 * - Provide single import point for commonly used types
 * - Avoid deep imports from domain layer in services
 *
 * **Usage:**
 * ```typescript
 * // BEFORE (circular dependency risk)
 * import type { ReportData } from '../ipc/types'; // services importing from ipc
 *
 * // AFTER (shared module breaks cycle)
 * import type { ReportData } from '../shared/types';
 * ```
 */

// =============================================================================
// Pure type re-exports from domain layer
// =============================================================================

export type {
  // Project Types
  ProjectInfo,
  ValidationResult,
  // Report Types
  ReportData,
  ReportBattleResult,
  TrechoSummaryData,
  WarningData,
  // Configuration Types
  TrechoData,
  ProjectConfigResponse,
  // Simulation Types
  SimulationResult,
  SimulationSummary,
  SimulationReport,
  HistoryEntry,
  // RPG Maker Data Types
  TroopData,
  ClassData,
  EnemyData,
  // Application State Types
  RecentProject,
  UserPreferences,
  // IPC Protocol Types
  IPCResult,
  IPCError,
  IPCSuccessResponse,
  IPCErrorResponse,
} from '@coreto/electron/domain/types';

// =============================================================================
// Worker Communication Types (from domain)
// =============================================================================

export type {
  ProgressPayload,
  ErrorPayload,
  SimulationResultPayload,
  ProgressStage,
} from '@coreto/electron/domain/types';
