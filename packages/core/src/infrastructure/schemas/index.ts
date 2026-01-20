/**
 * Barrel export for infrastructure schemas
 *
 * Centralized exports for all Zod schemas and their inferred types.
 */

export {
  // Warning schemas
  WarningTypeSchema,
  WarningSeveritySchema,
  WarningSchema,
  type WarningType,
  type WarningSeverity,
  type Warning,

  // Battle action schemas
  ActorSchema,
  ActionSchema,
  TurnSchema,
  type Actor,
  type Action,
  type Turn,

  // Battle result schemas
  BattleResultSchema,
  type BattleResult,

  // Aggregation schemas
  TrechoAggregatesSchema,
  TrechoReportSchema,
  type TrechoAggregates,
  type TrechoReport,

  // Report metadata and summary schemas
  ReportMetadataSchema,
  ReportSummarySchema,
  type ReportMetadata,
  type ReportSummary,

  // Complete report schema
  ReportSchema,
  type Report,
} from './report.schema.js';
