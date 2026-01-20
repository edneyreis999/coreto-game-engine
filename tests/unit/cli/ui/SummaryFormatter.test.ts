/**
 * Unit tests for SummaryFormatter
 *
 * Tests terminal output formatting for battle summaries
 */

import { SummaryFormatter } from '../../../../packages/cli/src/cli/ui/SummaryFormatter';
import type { BattleSummary } from '../../../../packages/cli/src/cli/ui/types';

describe('SummaryFormatter', () => {
  describe('format', () => {
    it('should format basic summary', () => {
      const summary: BattleSummary = {
        totalBattles: 10,
        totalTrechos: 2,
        successRate: 0.95,
        totalWarnings: 1,
      };

      const output = SummaryFormatter.format(summary);

      expect(output).toContain('TTK VALIDATION SUMMARY');
      expect(output).toContain('Total Battles:    10');
      expect(output).toContain('Total Trechos:    2');
      expect(output).toContain('Success Rate:     95.0%');
      expect(output).toContain('Warnings:         1');
    });

    it('should include verbose metrics when provided', () => {
      const summary: BattleSummary = {
        totalBattles: 10,
        totalTrechos: 2,
        successRate: 0.95,
        totalWarnings: 1,
        averageTtkTurns: 5.5,
        averageTtkActions: 12.3,
      };

      const output = SummaryFormatter.format(summary, true);

      expect(output).toContain('Average TTK');
      expect(output).toContain('Turns:            5.50');
      expect(output).toContain('Actions:          12.30');
    });

    it('should not include verbose metrics in non-verbose mode', () => {
      const summary: BattleSummary = {
        totalBattles: 10,
        totalTrechos: 2,
        successRate: 0.95,
        totalWarnings: 1,
        averageTtkTurns: 5.5,
        averageTtkActions: 12.3,
      };

      const output = SummaryFormatter.format(summary, false);

      expect(output).not.toContain('Average TTK');
    });

    it('should format success rate with check mark for high success', () => {
      const summary: BattleSummary = {
        totalBattles: 10,
        totalTrechos: 2,
        successRate: 0.95,
        totalWarnings: 0,
      };

      const output = SummaryFormatter.format(summary);

      expect(output).toContain('95.0% ✅');
    });

    it('should format success rate with warning for medium success', () => {
      const summary: BattleSummary = {
        totalBattles: 10,
        totalTrechos: 2,
        successRate: 0.75,
        totalWarnings: 0,
      };

      const output = SummaryFormatter.format(summary);

      expect(output).toContain('75.0% ⚠️');
    });

    it('should format success rate with error for low success', () => {
      const summary: BattleSummary = {
        totalBattles: 10,
        totalTrechos: 2,
        successRate: 0.5,
        totalWarnings: 0,
      };

      const output = SummaryFormatter.format(summary);

      expect(output).toContain('50.0% ❌');
    });

    it('should format zero warnings with check mark', () => {
      const summary: BattleSummary = {
        totalBattles: 10,
        totalTrechos: 2,
        successRate: 0.95,
        totalWarnings: 0,
      };

      const output = SummaryFormatter.format(summary);

      expect(output).toContain('Warnings:         0 ✅');
    });

    it('should format few warnings with warning icon', () => {
      const summary: BattleSummary = {
        totalBattles: 10,
        totalTrechos: 2,
        successRate: 0.95,
        totalWarnings: 3,
      };

      const output = SummaryFormatter.format(summary);

      expect(output).toContain('Warnings:         3 ⚠️');
    });

    it('should format many warnings with error icon', () => {
      const summary: BattleSummary = {
        totalBattles: 10,
        totalTrechos: 2,
        successRate: 0.95,
        totalWarnings: 10,
      };

      const output = SummaryFormatter.format(summary);

      expect(output).toContain('Warnings:         10 ❌');
    });
  });

  describe('formatBattleDetail', () => {
    it('should format battle detail correctly', () => {
      const output = SummaryFormatter.formatBattleDetail('trecho1', 5, 3, 10, 250);

      expect(output).toContain('Troop 5');
      expect(output).toContain('3 turns');
      expect(output).toContain('10 actions');
      expect(output).toContain('250ms');
    });
  });

  describe('formatTrechoHeader', () => {
    it('should format trecho header correctly', () => {
      const output = SummaryFormatter.formatTrechoHeader('ato1-nivel1-10', 5);

      expect(output).toContain('Trecho: ato1-nivel1-10');
      expect(output).toContain('5 battles');
    });
  });
});
