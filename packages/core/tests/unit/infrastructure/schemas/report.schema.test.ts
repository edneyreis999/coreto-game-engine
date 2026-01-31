/**
 * Unit Tests for Report Schema Validation
 *
 * Tests Zod schemas for report.json validation.
 * Covers valid/invalid scenarios for all schema components.
 *
 * @see src/infrastructure/schemas/report.schema.ts
 */

import {
  WarningTypeSchema,
  WarningSeveritySchema,
  WarningSchema,
  ActorSchema,
  ActionSchema,
  TurnSchema,
  BattleResultSchema,
  TrechoAggregatesSchema,
  TrechoReportSchema,
  ReportMetadataSchema,
  ReportSummarySchema,
  ReportSchema,
  type Warning,
  type Actor,
  type Action,
  type Turn,
  type BattleResult,
  type TrechoAggregates,
  type TrechoReport,
  type ReportMetadata,
  type ReportSummary,
  type Report,
} from '@coreto/core/infrastructure/schemas/report.schema';

describe('Report Schema Validation', () => {
  describe('WarningTypeSchema', () => {
    it('should accept valid warning types', () => {
      expect(() => WarningTypeSchema.parse('troop_not_found')).not.toThrow();
      expect(() => WarningTypeSchema.parse('enemy_not_found')).not.toThrow();
      expect(() =>
        WarningTypeSchema.parse('ttk_out_of_tolerance')
      ).not.toThrow();
      expect(() =>
        WarningTypeSchema.parse('skill_formula_error')
      ).not.toThrow();
      expect(() => WarningTypeSchema.parse('battle_timeout')).not.toThrow();
    });

    it('should reject invalid warning types', () => {
      expect(() => WarningTypeSchema.parse('invalid_type')).toThrow();
      expect(() => WarningTypeSchema.parse('')).toThrow();
      expect(() => WarningTypeSchema.parse(123)).toThrow();
    });
  });

  describe('WarningSeveritySchema', () => {
    it('should accept valid severity levels', () => {
      expect(() => WarningSeveritySchema.parse('critical')).not.toThrow();
      expect(() => WarningSeveritySchema.parse('warning')).not.toThrow();
      expect(() => WarningSeveritySchema.parse('info')).not.toThrow();
    });

    it('should reject invalid severity levels', () => {
      expect(() => WarningSeveritySchema.parse('error')).toThrow();
      expect(() => WarningSeveritySchema.parse('debug')).toThrow();
      expect(() => WarningSeveritySchema.parse('')).toThrow();
    });
  });

  describe('WarningSchema', () => {
    it('should accept valid warning object', () => {
      const validWarning: Warning = {
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Troop ID 999 not found in Troops.json',
        context: { troopId: 999, trechoId: 'ato1-nivel1-10' },
      };

      expect(() => WarningSchema.parse(validWarning)).not.toThrow();
    });

    it('should reject warning with missing required fields', () => {
      expect(() =>
        WarningSchema.parse({
          type: 'troop_not_found',
          severity: 'critical',
          message: 'Error message',
        })
      ).toThrow(/context is required/);

      expect(() =>
        WarningSchema.parse({
          type: 'troop_not_found',
          severity: 'critical',
          context: {},
        })
      ).toThrow(/message is required/);
    });

    it('should reject warning with invalid type or severity', () => {
      expect(() =>
        WarningSchema.parse({
          type: 'invalid_type',
          severity: 'critical',
          message: 'Error',
          context: {},
        })
      ).toThrow();

      expect(() =>
        WarningSchema.parse({
          type: 'troop_not_found',
          severity: 'invalid_severity',
          message: 'Error',
          context: {},
        })
      ).toThrow();
    });

    it('should accept warning with complex context', () => {
      const warning: Warning = {
        type: 'skill_formula_error',
        severity: 'warning',
        message: 'Failed to evaluate skill formula',
        context: {
          skillId: 42,
          formula: 'a.atk * 4 - b.def * 2',
          error: 'Invalid formula syntax',
          troopId: 5,
        },
      };

      expect(() => WarningSchema.parse(warning)).not.toThrow();
    });
  });

  describe('ActorSchema', () => {
    it('should accept valid player actor', () => {
      const validActor: Actor = { type: 'player', index: 0 };
      expect(() => ActorSchema.parse(validActor)).not.toThrow();
    });

    it('should accept valid enemy actor', () => {
      const validActor: Actor = { type: 'enemy', index: 3 };
      expect(() => ActorSchema.parse(validActor)).not.toThrow();
    });

    it('should reject invalid actor type', () => {
      expect(() =>
        ActorSchema.parse({ type: 'npc', index: 0 })
      ).toThrow();
    });

    it('should reject negative index', () => {
      expect(() =>
        ActorSchema.parse({ type: 'player', index: -1 })
      ).toThrow(/must be non-negative/);
    });

    it('should reject non-integer index', () => {
      expect(() =>
        ActorSchema.parse({ type: 'player', index: 1.5 })
      ).toThrow(/must be an integer/);
    });
  });

  describe('ActionSchema', () => {
    it('should accept valid action', () => {
      const validAction: Action = {
        actor: { type: 'player', index: 0 },
        skillId: 1,
        target: { type: 'enemy', index: 2 },
        damage: 150,
        critical: false,
      };

      expect(() => ActionSchema.parse(validAction)).not.toThrow();
    });

    it('should accept negative damage (healing)', () => {
      const healingAction: Action = {
        actor: { type: 'player', index: 1 },
        skillId: 3,
        target: { type: 'player', index: 0 },
        damage: -80,
        critical: false,
      };

      expect(() => ActionSchema.parse(healingAction)).not.toThrow();
    });

    it('should accept critical hit', () => {
      const criticalAction: Action = {
        actor: { type: 'enemy', index: 0 },
        skillId: 5,
        target: { type: 'player', index: 2 },
        damage: 300,
        critical: true,
      };

      expect(() => ActionSchema.parse(criticalAction)).not.toThrow();
    });

    it('should reject invalid skillId', () => {
      expect(() =>
        ActionSchema.parse({
          actor: { type: 'player', index: 0 },
          skillId: 0,
          target: { type: 'enemy', index: 0 },
          damage: 100,
          critical: false,
        })
      ).toThrow(/must be a positive number/);
    });

    it('should reject missing required fields', () => {
      expect(() =>
        ActionSchema.parse({
          actor: { type: 'player', index: 0 },
          skillId: 1,
          target: { type: 'enemy', index: 0 },
          damage: 100,
        })
      ).toThrow(/critical is required/);
    });
  });

  describe('TurnSchema', () => {
    it('should accept valid turn with multiple actions', () => {
      const validTurn: Turn = {
        turnNumber: 1,
        actions: [
          {
            actor: { type: 'player', index: 0 },
            skillId: 1,
            target: { type: 'enemy', index: 0 },
            damage: 120,
            critical: false,
          },
          {
            actor: { type: 'enemy', index: 0 },
            skillId: 2,
            target: { type: 'player', index: 1 },
            damage: 80,
            critical: true,
          },
        ],
      };

      expect(() => TurnSchema.parse(validTurn)).not.toThrow();
    });

    it('should accept turn with empty actions array', () => {
      const emptyTurn: Turn = {
        turnNumber: 5,
        actions: [],
      };

      expect(() => TurnSchema.parse(emptyTurn)).not.toThrow();
    });

    it('should reject invalid turn number', () => {
      expect(() =>
        TurnSchema.parse({
          turnNumber: 0,
          actions: [],
        })
      ).toThrow(/must be a positive number/);

      expect(() =>
        TurnSchema.parse({
          turnNumber: -1,
          actions: [],
        })
      ).toThrow(/must be a positive number/);
    });
  });

  describe('BattleResultSchema', () => {
    it('should accept valid battle result', () => {
      const validResult: BattleResult = {
        trechoId: 'ato1-nivel1-10',
        troopId: 5,
        troopName: 'Slimes',
        seed: 12345,
        ttkTurns: 3,
        ttkActions: 8,
        victory: true,
        expGained: 12,
        turns: [
          {
            turnNumber: 1,
            actions: [
              {
                actor: { type: 'player', index: 0 },
                skillId: 1,
                target: { type: 'enemy', index: 0 },
                damage: 150,
                critical: false,
              },
            ],
          },
        ],
      };

      expect(() => BattleResultSchema.parse(validResult)).not.toThrow();
    });

    it('should accept battle with negative seed', () => {
      const result: BattleResult = {
        trechoId: 'test',
        troopId: 1,
        troopName: 'Test Troop',
        seed: -999,
        ttkTurns: 0,
        ttkActions: 0,
        victory: false,
        expGained: 0,
        turns: [],
      };

      expect(() => BattleResultSchema.parse(result)).not.toThrow();
    });

    it('should reject negative TTK values', () => {
      expect(() =>
        BattleResultSchema.parse({
          trechoId: 'test',
          troopId: 1,
          troopName: 'Test Troop',
          seed: 12345,
          ttkTurns: -1,
          ttkActions: 5,
          victory: true,
          expGained: 10,
          turns: [],
        })
      ).toThrow(/must be non-negative/);
    });

    it('should reject invalid troopId', () => {
      expect(() =>
        BattleResultSchema.parse({
          trechoId: 'test',
          troopId: 0,
          troopName: 'Test Troop',
          seed: 12345,
          ttkTurns: 3,
          ttkActions: 5,
          victory: true,
          expGained: 10,
          turns: [],
        })
      ).toThrow(/must be a positive number/);
    });
  });

  describe('TrechoAggregatesSchema', () => {
    it('should accept valid aggregates', () => {
      const validAggregates: TrechoAggregates = {
        avgTtkTurns: 3.5,
        p95TtkTurns: 5.0,
        avgTtkActions: 8.2,
        p95TtkActions: 12.0,
      };

      expect(() =>
        TrechoAggregatesSchema.parse(validAggregates)
      ).not.toThrow();
    });

    it('should accept zero values', () => {
      const zeroAggregates: TrechoAggregates = {
        avgTtkTurns: 0,
        p95TtkTurns: 0,
        avgTtkActions: 0,
        p95TtkActions: 0,
      };

      expect(() =>
        TrechoAggregatesSchema.parse(zeroAggregates)
      ).not.toThrow();
    });

    it('should reject negative values', () => {
      expect(() =>
        TrechoAggregatesSchema.parse({
          avgTtkTurns: -1,
          p95TtkTurns: 5,
          avgTtkActions: 8,
          p95TtkActions: 12,
        })
      ).toThrow(/must be non-negative/);
    });

    it('should reject missing required fields', () => {
      expect(() =>
        TrechoAggregatesSchema.parse({
          avgTtkTurns: 3,
          p95TtkTurns: 5,
          avgTtkActions: 8,
        })
      ).toThrow(/p95TtkActions is required/);
    });
  });

  describe('TrechoReportSchema', () => {
    it('should accept valid trecho report', () => {
      const validReport: TrechoReport = {
        trechoId: 'ato1-nivel1-10',
        results: [
          {
            trechoId: 'ato1-nivel1-10',
            troopId: 5,
            troopName: 'Slimes',
            seed: 12345,
            ttkTurns: 3,
            ttkActions: 8,
            victory: true,
            expGained: 12,
            turns: [],
          },
        ],
        aggregates: {
          avgTtkTurns: 3.0,
          p95TtkTurns: 3.0,
          avgTtkActions: 8.0,
          p95TtkActions: 8.0,
        },
        warnings: [],
      };

      expect(() => TrechoReportSchema.parse(validReport)).not.toThrow();
    });

    it('should accept trecho report with warnings', () => {
      const reportWithWarnings: TrechoReport = {
        trechoId: 'ato2',
        results: [],
        aggregates: {
          avgTtkTurns: 0,
          p95TtkTurns: 0,
          avgTtkActions: 0,
          p95TtkActions: 0,
        },
        warnings: [
          {
            type: 'troop_not_found',
            severity: 'critical',
            message: 'Troop not found',
            context: { troopId: 999 },
          },
        ],
      };

      expect(() =>
        TrechoReportSchema.parse(reportWithWarnings)
      ).not.toThrow();
    });
  });

  describe('ReportMetadataSchema', () => {
    it('should accept valid metadata', () => {
      const validMetadata: ReportMetadata = {
        timestamp: '2026-01-05T12:00:00.000Z',
        seed: 12345,
        projectPath: '/Users/edney/projects/coreto/projectX',
      };

      expect(() => ReportMetadataSchema.parse(validMetadata)).not.toThrow();
    });

    it('should reject invalid ISO 8601 timestamp', () => {
      expect(() =>
        ReportMetadataSchema.parse({
          timestamp: '2026-01-05 12:00:00',
          seed: 12345,
          projectPath: '/path/to/project',
        })
      ).toThrow(/must be a valid ISO 8601 timestamp/);
    });

    it('should reject empty projectPath', () => {
      expect(() =>
        ReportMetadataSchema.parse({
          timestamp: '2026-01-05T12:00:00.000Z',
          seed: 12345,
          projectPath: '',
        })
      ).toThrow(/cannot be empty/);
    });

    it('should accept negative seed', () => {
      const metadata: ReportMetadata = {
        timestamp: '2026-01-05T12:00:00.000Z',
        seed: -42,
        projectPath: '/path',
      };

      expect(() => ReportMetadataSchema.parse(metadata)).not.toThrow();
    });
  });

  describe('ReportSummarySchema', () => {
    it('should accept valid summary', () => {
      const validSummary: ReportSummary = {
        executionTimeMs: 5432.1,
        totalTrechos: 3,
        totalBattles: 15,
        totalWarnings: 2,
        warningsByType: {
          troop_not_found: 1,
          ttk_out_of_tolerance: 1,
        },
        successRate: 0.87,
        peakMemoryMB: 128.5,
      };

      expect(() => ReportSummarySchema.parse(validSummary)).not.toThrow();
    });

    it('should accept summary with zero values', () => {
      const zeroSummary: ReportSummary = {
        executionTimeMs: 0,
        totalTrechos: 0,
        totalBattles: 0,
        totalWarnings: 0,
        warningsByType: {},
        successRate: 0,
        peakMemoryMB: 0,
      };

      expect(() => ReportSummarySchema.parse(zeroSummary)).not.toThrow();
    });

    it('should accept summary with 100% success rate', () => {
      const perfectSummary: ReportSummary = {
        executionTimeMs: 1000,
        totalTrechos: 1,
        totalBattles: 5,
        totalWarnings: 0,
        warningsByType: {},
        successRate: 1.0,
        peakMemoryMB: 64,
      };

      expect(() => ReportSummarySchema.parse(perfectSummary)).not.toThrow();
    });

    it('should reject invalid success rate', () => {
      expect(() =>
        ReportSummarySchema.parse({
          executionTimeMs: 1000,
          totalTrechos: 1,
          totalBattles: 5,
          totalWarnings: 0,
          warningsByType: {},
          successRate: 1.5,
          peakMemoryMB: 64,
        })
      ).toThrow(/cannot exceed 1/);

      expect(() =>
        ReportSummarySchema.parse({
          executionTimeMs: 1000,
          totalTrechos: 1,
          totalBattles: 5,
          totalWarnings: 0,
          warningsByType: {},
          successRate: -0.1,
          peakMemoryMB: 64,
        })
      ).toThrow(/must be at least 0/);
    });

    it('should reject negative counts', () => {
      expect(() =>
        ReportSummarySchema.parse({
          executionTimeMs: 1000,
          totalTrechos: -1,
          totalBattles: 5,
          totalWarnings: 0,
          warningsByType: {},
          successRate: 1.0,
          peakMemoryMB: 64,
        })
      ).toThrow(/must be non-negative/);
    });
  });

  describe('ReportSchema', () => {
    it('should accept valid complete report', () => {
      const validReport: Report = {
        timestamp: '2026-01-05T12:00:00.000Z',
        seed: 12345,
        projectPath: '/Users/edney/projects/coreto/projectX',
        summary: {
          executionTimeMs: 5432.1,
          totalTrechos: 1,
          totalBattles: 3,
          totalWarnings: 0,
          warningsByType: {},
          successRate: 1.0,
          peakMemoryMB: 128.5,
        },
        trechos: [
          {
            trechoId: 'ato1-nivel1-10',
            results: [
              {
                trechoId: 'ato1-nivel1-10',
                troopId: 5,
                troopName: 'Slimes',
                seed: 12345,
                ttkTurns: 3,
                ttkActions: 8,
                victory: true,
                expGained: 12,
                turns: [
                  {
                    turnNumber: 1,
                    actions: [
                      {
                        actor: { type: 'player', index: 0 },
                        skillId: 1,
                        target: { type: 'enemy', index: 0 },
                        damage: 150,
                        critical: false,
                      },
                    ],
                  },
                ],
              },
            ],
            aggregates: {
              avgTtkTurns: 3.0,
              p95TtkTurns: 3.0,
              avgTtkActions: 8.0,
              p95TtkActions: 8.0,
            },
            warnings: [],
          },
        ],
      };

      expect(() => ReportSchema.parse(validReport)).not.toThrow();
    });

    it('should accept report with multiple trechos and warnings', () => {
      const complexReport: Report = {
        timestamp: '2026-01-05T14:30:00.000Z',
        seed: 99999,
        projectPath: '/path/to/project',
        summary: {
          executionTimeMs: 12000,
          totalTrechos: 2,
          totalBattles: 6,
          totalWarnings: 3,
          warningsByType: {
            ttk_out_of_tolerance: 2,
            skill_formula_error: 1,
          },
          successRate: 0.5,
          peakMemoryMB: 256,
        },
        trechos: [
          {
            trechoId: 'ato1',
            results: [],
            aggregates: {
              avgTtkTurns: 0,
              p95TtkTurns: 0,
              avgTtkActions: 0,
              p95TtkActions: 0,
            },
            warnings: [
              {
                type: 'ttk_out_of_tolerance',
                severity: 'warning',
                message: 'TTK exceeds target',
                context: { troopId: 5 },
              },
            ],
          },
          {
            trechoId: 'ato2',
            results: [],
            aggregates: {
              avgTtkTurns: 5.5,
              p95TtkTurns: 8.0,
              avgTtkActions: 12.3,
              p95TtkActions: 16.0,
            },
            warnings: [
              {
                type: 'skill_formula_error',
                severity: 'critical',
                message: 'Formula error',
                context: { skillId: 42 },
              },
              {
                type: 'ttk_out_of_tolerance',
                severity: 'info',
                message: 'Minor deviation',
                context: {},
              },
            ],
          },
        ],
      };

      expect(() => ReportSchema.parse(complexReport)).not.toThrow();
    });

    it('should accept report with empty trechos array', () => {
      expect(() =>
        ReportSchema.parse({
          timestamp: '2026-01-05T12:00:00.000Z',
          seed: 12345,
          projectPath: '/path',
          summary: {
            executionTimeMs: 0,
            totalTrechos: 0,
            totalBattles: 0,
            totalWarnings: 0,
            warningsByType: {},
            successRate: 0,
            peakMemoryMB: 0,
          },
          trechos: [],
        })
      ).not.toThrow(); // Empty reports are valid
    });

    it('should reject report with missing required fields', () => {
      expect(() =>
        ReportSchema.parse({
          timestamp: '2026-01-05T12:00:00.000Z',
          seed: 12345,
          projectPath: '/path',
          summary: {
            executionTimeMs: 0,
            totalTrechos: 0,
            totalBattles: 0,
            totalWarnings: 0,
            warningsByType: {},
            successRate: 0,
            peakMemoryMB: 0,
          },
        })
      ).toThrow(/trechos is required/);
    });
  });

  describe('Type Inference', () => {
    it('should infer correct TypeScript types', () => {
      const warning: Warning = {
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Test',
        context: {},
      };

      const actor: Actor = { type: 'player', index: 0 };

      const action: Action = {
        actor,
        skillId: 1,
        target: actor,
        damage: 100,
        critical: false,
      };

      const turn: Turn = { turnNumber: 1, actions: [action] };

      const battleResult: BattleResult = {
        trechoId: 'test',
        troopId: 1,
        troopName: 'Test Troop',
        seed: 12345,
        ttkTurns: 3,
        ttkActions: 8,
        victory: true,
        expGained: 10,
        turns: [turn],
      };

      const aggregates: TrechoAggregates = {
        avgTtkTurns: 3,
        p95TtkTurns: 5,
        avgTtkActions: 8,
        p95TtkActions: 12,
      };

      const trechoReport: TrechoReport = {
        trechoId: 'test',
        results: [battleResult],
        aggregates,
        warnings: [warning],
      };

      const metadata: ReportMetadata = {
        timestamp: '2026-01-05T12:00:00.000Z',
        seed: 12345,
        projectPath: '/path',
      };

      const summary: ReportSummary = {
        executionTimeMs: 1000,
        totalTrechos: 1,
        totalBattles: 1,
        totalWarnings: 1,
        warningsByType: { troop_not_found: 1 },
        successRate: 1.0,
        peakMemoryMB: 64,
      };

      const report: Report = {
        timestamp: metadata.timestamp,
        seed: metadata.seed,
        projectPath: metadata.projectPath,
        summary,
        trechos: [trechoReport],
      };

      expect(report).toBeDefined();
      expect(report.trechos[0]?.results[0]?.turns[0]?.actions[0]?.actor.type).toBe(
        'player'
      );
    });
  });
});
