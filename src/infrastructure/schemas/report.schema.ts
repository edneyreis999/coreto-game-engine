/**
 * Zod Schemas for Report Validation
 *
 * Provides runtime validation for report.json output.
 * Implements ADR-011 (JSON Output), ADR-012 (Aggregation), ADR-013 (Warnings).
 *
 * @see docs/adrs/REPORTER/ADR-011-json-file-based-report-output-format.md
 * @see docs/adrs/REPORTER/ADR-012-statistical-aggregation-metrics.md
 * @see docs/adrs/REPORTER/ADR-013-typed-warning-system-with-severity-levels.md
 */

import { z } from 'zod';

/**
 * WarningTypeSchema defines the enumeration of warning types.
 *
 * Types (ADR-013):
 * - troop_not_found: Troop ID referenced in config doesn't exist in Troops.json
 * - enemy_not_found: Enemy ID referenced in troop doesn't exist in Enemies.json
 * - class_not_found: Class ID referenced in config doesn't exist in Classes.json
 * - skill_not_found: Skill ID referenced in battle doesn't exist in Skills.json
 * - ttk_out_of_tolerance: TTK measurement outside configured tolerance window
 * - skill_formula_error: Error evaluating skill damage formula
 * - battle_timeout: Battle exceeded maximum turn limit
 */
export const WarningTypeSchema = z.enum([
  'troop_not_found',
  'enemy_not_found',
  'class_not_found',
  'skill_not_found',
  'ttk_out_of_tolerance',
  'skill_formula_error',
  'battle_timeout',
]);

/**
 * WarningSeveritySchema defines severity levels for warnings.
 *
 * Levels (ADR-013):
 * - critical: Blocking issues that prevent battle execution
 * - warning: Non-blocking issues that affect result validity
 * - info: Informational messages for debugging
 */
export const WarningSeveritySchema = z.enum(['critical', 'warning', 'info']);

/**
 * WarningSchema validates structured warning objects.
 *
 * Fields:
 * - type: Warning category for machine parsing and analytics
 * - severity: Graduated response level for CI/CD automation
 * - message: Human-readable description for designers
 * - context: Type-specific debugging information (troopId, enemyId, etc.)
 */
export const WarningSchema = z.object({
  type: WarningTypeSchema,
  severity: WarningSeveritySchema,
  message: z.string({
    required_error: 'warning.message is required',
    invalid_type_error: 'warning.message must be a string',
  }),
  context: z.record(z.unknown(), {
    required_error: 'warning.context is required',
    invalid_type_error: 'warning.context must be an object',
  }),
});

/**
 * ActorSchema validates battle participant references.
 *
 * Fields:
 * - type: 'player' for party members, 'enemy' for opponents
 * - index: 0-based index in respective array (0-3 for players, 0-7 for enemies)
 */
export const ActorSchema = z.object({
  type: z.enum(['player', 'enemy'], {
    required_error: 'actor.type is required',
    invalid_type_error: 'actor.type must be "player" or "enemy"',
  }),
  index: z
    .number({
      required_error: 'actor.index is required',
      invalid_type_error: 'actor.index must be a number',
    })
    .int('actor.index must be an integer')
    .nonnegative('actor.index must be non-negative'),
});

/**
 * ActionSchema validates individual battle actions.
 *
 * Fields:
 * - actor: Who performed the action
 * - skillId: ID of skill used (references Skills.json)
 * - target: Who received the action
 * - damage: Numeric damage dealt (negative for healing)
 * - critical: Whether action was a critical hit
 */
export const ActionSchema = z.object({
  actor: ActorSchema,
  skillId: z
    .number({
      required_error: 'action.skillId is required',
      invalid_type_error: 'action.skillId must be a number',
    })
    .int('action.skillId must be an integer')
    .positive('action.skillId must be a positive number'),
  target: ActorSchema,
  damage: z
    .number({
      required_error: 'action.damage is required',
      invalid_type_error: 'action.damage must be a number',
    })
    .int('action.damage must be an integer'),
  critical: z.boolean({
    required_error: 'action.critical is required',
    invalid_type_error: 'action.critical must be a boolean',
  }),
});

/**
 * TurnSchema validates battle turn records.
 *
 * Fields:
 * - turnNumber: Sequential turn counter starting at 1
 * - actions: All actions executed during this turn (party + enemies)
 */
export const TurnSchema = z.object({
  turnNumber: z
    .number({
      required_error: 'turn.turnNumber is required',
      invalid_type_error: 'turn.turnNumber must be a number',
    })
    .int('turn.turnNumber must be an integer')
    .positive('turn.turnNumber must be a positive number'),
  actions: z.array(ActionSchema, {
    required_error: 'turn.actions is required',
    invalid_type_error: 'turn.actions must be an array',
  }),
});

/**
 * BattleResultSchema validates individual battle execution results.
 *
 * Fields:
 * - trechoId: Reference to trecho configuration
 * - troopId: ID of troop from Troops.json
 * - troopName: Human-readable troop name (from Troops.json)
 * - seed: RNG seed used for deterministic execution
 * - ttkTurns: Time-to-Kill measured in battle turns (ADR-020)
 * - ttkActions: Time-to-Kill measured in party actions (ADR-020)
 * - victory: Whether party defeated all enemies
 * - expGained: Total EXP gained from this battle (victory only; 0 otherwise)
 * - turns: Complete battle log with all actions
 */
export const BattleResultSchema = z.object({
  trechoId: z.string({
    required_error: 'battleResult.trechoId is required',
    invalid_type_error: 'battleResult.trechoId must be a string',
  }),
  troopId: z
    .number({
      required_error: 'battleResult.troopId is required',
      invalid_type_error: 'battleResult.troopId must be a number',
    })
    .int('battleResult.troopId must be an integer')
    .positive('battleResult.troopId must be a positive number'),
  troopName: z.string({
    required_error: 'battleResult.troopName is required',
    invalid_type_error: 'battleResult.troopName must be a string',
  }),
  seed: z
    .number({
      required_error: 'battleResult.seed is required',
      invalid_type_error: 'battleResult.seed must be a number',
    })
    .int('battleResult.seed must be an integer'),
  ttkTurns: z
    .number({
      required_error: 'battleResult.ttkTurns is required',
      invalid_type_error: 'battleResult.ttkTurns must be a number',
    })
    .int('battleResult.ttkTurns must be an integer')
    .nonnegative('battleResult.ttkTurns must be non-negative'),
  ttkActions: z
    .number({
      required_error: 'battleResult.ttkActions is required',
      invalid_type_error: 'battleResult.ttkActions must be a number',
    })
    .int('battleResult.ttkActions must be an integer')
    .nonnegative('battleResult.ttkActions must be non-negative'),
  victory: z.boolean({
    required_error: 'battleResult.victory is required',
    invalid_type_error: 'battleResult.victory must be a boolean',
  }),
  expGained: z
    .number({
      required_error: 'battleResult.expGained is required',
      invalid_type_error: 'battleResult.expGained must be a number',
    })
    .int('battleResult.expGained must be an integer')
    .nonnegative('battleResult.expGained must be non-negative'),
  turns: z.array(TurnSchema, {
    required_error: 'battleResult.turns is required',
    invalid_type_error: 'battleResult.turns must be an array',
  }),
});

/**
 * TrechoAggregatesSchema validates statistical aggregation metrics.
 *
 * Fields (ADR-012):
 * - avgTtkTurns: Mean TTK in turns across all battles in trecho
 * - p95TtkTurns: 95th percentile TTK in turns (worst-case scenarios)
 * - avgTtkActions: Mean TTK in actions across all battles in trecho
 * - p95TtkActions: 95th percentile TTK in actions (worst-case scenarios)
 *
 * All metrics must be non-negative.
 */
export const TrechoAggregatesSchema = z.object({
  avgTtkTurns: z
    .number({
      required_error: 'aggregates.avgTtkTurns is required',
      invalid_type_error: 'aggregates.avgTtkTurns must be a number',
    })
    .nonnegative('aggregates.avgTtkTurns must be non-negative'),
  p95TtkTurns: z
    .number({
      required_error: 'aggregates.p95TtkTurns is required',
      invalid_type_error: 'aggregates.p95TtkTurns must be a number',
    })
    .nonnegative('aggregates.p95TtkTurns must be non-negative'),
  avgTtkActions: z
    .number({
      required_error: 'aggregates.avgTtkActions is required',
      invalid_type_error: 'aggregates.avgTtkActions must be a number',
    })
    .nonnegative('aggregates.avgTtkActions must be non-negative'),
  p95TtkActions: z
    .number({
      required_error: 'aggregates.p95TtkActions is required',
      invalid_type_error: 'aggregates.p95TtkActions must be a number',
    })
    .nonnegative('aggregates.p95TtkActions must be non-negative'),
});

/**
 * TrechoReportSchema validates per-trecho validation results.
 *
 * Fields:
 * - trechoId: Reference to trecho configuration
 * - results: All battle executions for this trecho
 * - aggregates: Statistical metrics computed from results
 * - warnings: All warnings generated during trecho validation
 */
export const TrechoReportSchema = z.object({
  trechoId: z.string({
    required_error: 'trechoReport.trechoId is required',
    invalid_type_error: 'trechoReport.trechoId must be a string',
  }),
  results: z.array(BattleResultSchema, {
    required_error: 'trechoReport.results is required',
    invalid_type_error: 'trechoReport.results must be an array',
  }),
  aggregates: TrechoAggregatesSchema,
  warnings: z.array(WarningSchema, {
    required_error: 'trechoReport.warnings is required',
    invalid_type_error: 'trechoReport.warnings must be an array',
  }),
});

/**
 * ReportMetadataSchema validates report metadata for execution context.
 *
 * Fields:
 * - timestamp: ISO 8601 timestamp of report generation
 * - seed: RNG seed used for all battles (ADR-018)
 * - projectPath: Absolute path to RPG Maker MZ project
 */
export const ReportMetadataSchema = z.object({
  timestamp: z
    .string({
      required_error: 'metadata.timestamp is required',
      invalid_type_error: 'metadata.timestamp must be a string',
    })
    .datetime('metadata.timestamp must be a valid ISO 8601 timestamp'),
  seed: z
    .number({
      required_error: 'metadata.seed is required',
      invalid_type_error: 'metadata.seed must be a number',
    })
    .int('metadata.seed must be an integer'),
  projectPath: z
    .string({
      required_error: 'metadata.projectPath is required',
      invalid_type_error: 'metadata.projectPath must be a string',
    })
    .min(1, 'metadata.projectPath cannot be empty'),
});

/**
 * ReportSummarySchema validates execution summary metrics.
 *
 * Fields:
 * - executionTimeMs: Total execution time in milliseconds
 * - totalTrechos: Count of trechos validated
 * - totalBattles: Count of battles executed
 * - totalWarnings: Total warning count across all severities
 * - warningsByType: Warning counts grouped by type (ADR-013)
 * - successRate: Percentage of battles without critical warnings (0.0-1.0)
 * - peakMemoryMB: Peak memory usage in megabytes
 */
export const ReportSummarySchema = z.object({
  executionTimeMs: z
    .number({
      required_error: 'summary.executionTimeMs is required',
      invalid_type_error: 'summary.executionTimeMs must be a number',
    })
    .nonnegative('summary.executionTimeMs must be non-negative'),
  totalTrechos: z
    .number({
      required_error: 'summary.totalTrechos is required',
      invalid_type_error: 'summary.totalTrechos must be a number',
    })
    .int('summary.totalTrechos must be an integer')
    .nonnegative('summary.totalTrechos must be non-negative'),
  totalBattles: z
    .number({
      required_error: 'summary.totalBattles is required',
      invalid_type_error: 'summary.totalBattles must be a number',
    })
    .int('summary.totalBattles must be an integer')
    .nonnegative('summary.totalBattles must be non-negative'),
  totalWarnings: z
    .number({
      required_error: 'summary.totalWarnings is required',
      invalid_type_error: 'summary.totalWarnings must be a number',
    })
    .int('summary.totalWarnings must be an integer')
    .nonnegative('summary.totalWarnings must be non-negative'),
  warningsByType: z.record(
    z
      .number({
        invalid_type_error: 'summary.warningsByType values must be numbers',
      })
      .int('summary.warningsByType values must be integers')
      .nonnegative('summary.warningsByType values must be non-negative'),
    {
      required_error: 'summary.warningsByType is required',
      invalid_type_error: 'summary.warningsByType must be an object',
    }
  ),
  successRate: z
    .number({
      required_error: 'summary.successRate is required',
      invalid_type_error: 'summary.successRate must be a number',
    })
    .min(0, 'summary.successRate must be at least 0')
    .max(1, 'summary.successRate cannot exceed 1'),
  peakMemoryMB: z
    .number({
      required_error: 'summary.peakMemoryMB is required',
      invalid_type_error: 'summary.peakMemoryMB must be a number',
    })
    .nonnegative('summary.peakMemoryMB must be non-negative'),
});

/**
 * ReportSchema validates the complete report.json output.
 *
 * Structure (ADR-011):
 * - timestamp, seed, projectPath: Execution context metadata
 * - summary: High-level metrics and aggregated statistics
 * - trechos: Detailed per-trecho results with battle logs
 *
 * This is the root schema for validating report.json generated by the REPORTER module.
 */
export const ReportSchema = z.object({
  timestamp: z
    .string({
      required_error: 'report.timestamp is required',
      invalid_type_error: 'report.timestamp must be a string',
    })
    .datetime('report.timestamp must be a valid ISO 8601 timestamp'),
  seed: z
    .number({
      required_error: 'report.seed is required',
      invalid_type_error: 'report.seed must be a number',
    })
    .int('report.seed must be an integer'),
  projectPath: z
    .string({
      required_error: 'report.projectPath is required',
      invalid_type_error: 'report.projectPath must be a string',
    })
    .min(1, 'report.projectPath cannot be empty'),
  summary: ReportSummarySchema,
  trechos: z.array(TrechoReportSchema, {
    required_error: 'report.trechos is required',
    invalid_type_error: 'report.trechos must be an array',
  }),
});

/**
 * Type inference from Zod schemas.
 *
 * These types are automatically derived from the schemas above,
 * ensuring perfect sync between validation logic and TypeScript types.
 */
export type WarningType = z.infer<typeof WarningTypeSchema>;
export type WarningSeverity = z.infer<typeof WarningSeveritySchema>;
export type Warning = z.infer<typeof WarningSchema>;
export type Actor = z.infer<typeof ActorSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type Turn = z.infer<typeof TurnSchema>;
export type BattleResult = z.infer<typeof BattleResultSchema>;
export type TrechoAggregates = z.infer<typeof TrechoAggregatesSchema>;
export type TrechoReport = z.infer<typeof TrechoReportSchema>;
export type ReportMetadata = z.infer<typeof ReportMetadataSchema>;
export type ReportSummary = z.infer<typeof ReportSummarySchema>;
export type Report = z.infer<typeof ReportSchema>;
