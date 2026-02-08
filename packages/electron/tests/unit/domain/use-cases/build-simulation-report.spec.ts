/**
 * Unit tests for Build Simulation Report Use Case
 *
 * Tests the SimulationReportBuilder use case which transforms
 * SimulationResult into ReportData format.
 */

import { describe, it, expect } from '@jest/globals';
import { SimulationReportBuilder, buildSimulationReport } from '@coreto/electron/domain/use-cases';
import type { SimulationResult } from '@coreto/electron/domain/types';
import type { BattleOutcome } from '@coreto/electron/domain/types';

describe('build-simulation-report use case', () => {
  const createMockSimulationResult = (
    outcome: BattleOutcome,
    passed: boolean,
    warnings: string[] = []
  ): SimulationResult => ({
    trechoId: 'trecho-001',
    troopId: 42,
    troopName: 'Goblin Scout',
    battleResult: {
      troopId: 42,
      troopName: 'Goblin Scout',
      outcome,
      ttkTurns: 5,
      ttkActions: 8,
      durationMs: 1250,
      seed: 12345,
      expGained: 100,
    },
    passed,
    warnings,
  });

  describe('class-based implementation', () => {
    it('should create SimulationReportBuilder instance', () => {
      const builder = new SimulationReportBuilder();
      expect(builder).toBeDefined();
      expect(builder.buildReport).toBeInstanceOf(Function);
    });

    it('should implement IReportBuilder interface', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Forest Path',
      });

      expect(report).toBeDefined();
      expect(report.trechos).toHaveLength(1);
    });
  });

  describe('victory result mapping', () => {
    it('should map victory to ReportData with passed=true and successRate=1.0', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Forest Path',
      });

      expect(report.trechos).toHaveLength(1);
      expect(report.trechos[0].passed).toBe(true);
      expect(report.trechos[0].successRate).toBe(1.0);
      expect(report.totalBattles).toBe(1);
    });

    it('should preserve battleResult fields correctly', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Forest Path',
      });

      const battle = report.trechos[0].battles[0];
      expect(battle.troopId).toBe(42);
      expect(battle.troopName).toBe('Goblin Scout');
      expect(battle.outcome).toBe('victory');
      expect(battle.ttkTurns).toBe(5);
      expect(battle.ttkActions).toBe(8);
      expect(battle.durationMs).toBe(1250);
      expect(battle.seed).toBe(12345);
      expect(battle.expGained).toBe(100);
    });
  });

  describe('defeat result mapping', () => {
    it('should map defeat to ReportData with passed=false and successRate=0.0', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('defeat', false);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Dark Cave',
      });

      expect(report.trechos).toHaveLength(1);
      expect(report.trechos[0].passed).toBe(false);
      expect(report.trechos[0].successRate).toBe(0.0);
      expect(report.totalBattles).toBe(1);
    });

    it('should preserve defeat battleResult fields', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('defeat', false);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Dark Cave',
      });

      const battle = report.trechos[0].battles[0];
      expect(battle.outcome).toBe('defeat');
      expect(battle.ttkTurns).toBe(5);
      expect(battle.ttkActions).toBe(8);
    });
  });

  describe('warnings conversion', () => {
    it('should convert empty string[] to empty WarningData[]', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true, []);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Safe Zone',
      });

      expect(report.trechos[0].warnings).toHaveLength(0);
    });

    it('should convert string[] to WarningData[] with correct structure', () => {
      const builder = new SimulationReportBuilder();
      const warnings = [
        'TTK exceeds tolerance: 15 turns > 10 max',
        'Action count high: 25 actions',
      ];
      const result = createMockSimulationResult('victory', true, warnings);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Danger Zone',
      });

      expect(report.trechos[0].warnings).toHaveLength(2);

      const [warning1, warning2] = report.trechos[0].warnings;

      expect(warning1.type).toBe('tolerance');
      expect(warning1.severity).toBe('warning');
      expect(warning1.message).toBe('TTK exceeds tolerance: 15 turns > 10 max');
      expect(warning1.context).toEqual({
        trechoId: 'trecho-001',
        troopId: 42,
      });

      expect(warning2.type).toBe('tolerance');
      expect(warning2.severity).toBe('warning');
      expect(warning2.message).toBe('Action count high: 25 actions');
      expect(warning2.context).toEqual({
        trechoId: 'trecho-001',
        troopId: 42,
      });
    });

    it('should include trechoId and troopId in warning context', () => {
      const builder = new SimulationReportBuilder();
      const warnings = ['Some warning message'];
      const result = createMockSimulationResult('victory', true, warnings);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Context Test',
      });

      const warning = report.trechos[0].warnings[0];
      expect(warning.context).toHaveProperty('trechoId', 'trecho-001');
      expect(warning.context).toHaveProperty('troopId', 42);
    });
  });

  describe('aggregate calculations for single battle', () => {
    it('should set avgTtkTurns = p95TtkTurns = battleResult.ttkTurns', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Aggregate Test',
      });

      const trecho = report.trechos[0];
      expect(trecho.avgTtkTurns).toBe(5);
      expect(trecho.p95TtkTurns).toBe(5);
      expect(trecho.avgTtkTurns).toBe(result.battleResult.ttkTurns);
    });

    it('should set avgTtkActions = p95TtkActions = battleResult.ttkActions', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Aggregate Test',
      });

      const trecho = report.trechos[0];
      expect(trecho.avgTtkActions).toBe(8);
      expect(trecho.p95TtkActions).toBe(8);
      expect(trecho.avgTtkActions).toBe(result.battleResult.ttkActions);
    });

    it('should set battleCount to 1', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Single Battle',
      });

      expect(report.trechos[0].battleCount).toBe(1);
    });

    it('should have exactly one battle in battles array', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Single Battle',
      });

      expect(report.trechos[0].battles).toHaveLength(1);
    });
  });

  describe('trecho metadata', () => {
    it('should set trecho id and name correctly', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Mystic Forest',
      });

      expect(report.trechos[0].id).toBe('trecho-001');
      expect(report.trechos[0].name).toBe('Mystic Forest');
    });

    it('should use provided trechoName parameter', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const customName = 'Custom Trecho Name';
      const report = builder.buildReport({
        simulationResult: result,
        trechoName: customName,
      });

      expect(report.trechos[0].name).toBe(customName);
    });
  });

  describe('report metadata', () => {
    it('should set totalBattles to 1', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Test',
      });

      expect(report.totalBattles).toBe(1);
    });

    it('should set timestamp to current ISO string', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const before = new Date().toISOString();
      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Test',
      });
      const after = new Date().toISOString();

      expect(report.timestamp).toBeDefined();
      expect(report.timestamp >= before).toBe(true);
      expect(report.timestamp <= after).toBe(true);
    });

    it('should have exactly one trecho in trechos array', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Test',
      });

      expect(report.trechos).toHaveLength(1);
    });
  });

  describe('timeout outcome handling', () => {
    it('should correctly map timeout outcome', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('timeout', false);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Timeout Test',
      });

      expect(report.trechos[0].battles[0].outcome).toBe('timeout');
      expect(report.trechos[0].passed).toBe(false);
      expect(report.trechos[0].successRate).toBe(0.0);
    });
  });

  describe('type safety', () => {
    it('should not use any types or non-null assertions', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Type Safety Test',
      });

      // Verify all required fields are present and correctly typed
      expect(report).toHaveProperty('trechos');
      expect(report).toHaveProperty('totalBattles');
      expect(report).toHaveProperty('timestamp');

      const trecho = report.trechos[0];
      expect(trecho).toHaveProperty('id');
      expect(trecho).toHaveProperty('name');
      expect(trecho).toHaveProperty('passed');
      expect(trecho).toHaveProperty('battleCount');
      expect(trecho).toHaveProperty('avgTtkTurns');
      expect(trecho).toHaveProperty('avgTtkActions');
      expect(trecho).toHaveProperty('p95TtkTurns');
      expect(trecho).toHaveProperty('p95TtkActions');
      expect(trecho).toHaveProperty('successRate');
      expect(trecho).toHaveProperty('battles');
      expect(trecho).toHaveProperty('warnings');

      const battle = trecho.battles[0];
      expect(battle).toHaveProperty('troopId');
      expect(battle).toHaveProperty('troopName');
      expect(battle).toHaveProperty('outcome');
      expect(battle).toHaveProperty('ttkTurns');
      expect(battle).toHaveProperty('ttkActions');
      expect(battle).toHaveProperty('durationMs');
      expect(battle).toHaveProperty('seed');
      expect(battle).toHaveProperty('expGained');
    });
  });

  describe('data integrity', () => {
    it('should not lose any data during transformation', () => {
      const builder = new SimulationReportBuilder();
      const warnings = [
        'Warning 1',
        'Warning 2',
        'Warning 3',
      ];
      const result = createMockSimulationResult('victory', true, warnings);

      const report = builder.buildReport({
        simulationResult: result,
        trechoName: 'Integrity Test',
      });

      // Verify battle data integrity
      expect(report.trechos[0].battles[0]).toEqual(result.battleResult);

      // Verify warnings count preserved
      expect(report.trechos[0].warnings.length).toBe(warnings.length);

      // Verify warnings messages preserved
      const warningMessages = report.trechos[0].warnings.map(w => w.message);
      expect(warningMessages).toEqual(warnings);

      // Verify trecho metadata preserved
      expect(report.trechos[0].id).toBe(result.trechoId);
    });
  });

  describe('convenience function', () => {
    it('should provide functional API for simple use cases', () => {
      const result = createMockSimulationResult('victory', true);

      const report = buildSimulationReport(result, 'Functional Test');

      expect(report).toBeDefined();
      expect(report.trechos).toHaveLength(1);
      expect(report.trechos[0].name).toBe('Functional Test');
    });

    it('should produce same result as class-based API', () => {
      const result = createMockSimulationResult('victory', true);
      const trechoName = 'Comparison Test';

      const report1 = buildSimulationReport(result, trechoName);

      const builder = new SimulationReportBuilder();
      const report2 = builder.buildReport({
        simulationResult: result,
        trechoName,
      });

      expect(report1).toEqual(report2);
    });
  });

  describe('purity and side effects', () => {
    it('should be pure function with no side effects', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const originalResult = { ...result };

      builder.buildReport({
        simulationResult: result,
        trechoName: 'Purity Test',
      });

      // Verify input was not mutated
      expect(result).toEqual(originalResult);
    });

    it('should produce consistent output for same input', () => {
      const builder = new SimulationReportBuilder();
      const result = createMockSimulationResult('victory', true);

      const report1 = builder.buildReport({
        simulationResult: result,
        trechoName: 'Consistency Test',
      });

      const report2 = builder.buildReport({
        simulationResult: result,
        trechoName: 'Consistency Test',
      });

      // Timestamp will differ, so check other fields
      expect(report1.trechos).toEqual(report2.trechos);
      expect(report1.totalBattles).toBe(report2.totalBattles);
      expect(report1.timestamp).toBeDefined();
      expect(report2.timestamp).toBeDefined();
    });
  });
});
