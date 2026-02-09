import { WarningCollector } from '@coreto/core';
import { Warning, type WarningData } from '@coreto/core';
import { WarningFakeBuilder } from '../../../../fakes/index.js';

/**
 * Helper function for testing array immutability.
 * Attempts to mutate a readonly array by pushing a new element.
 * Used in tests to verify that arrays are properly frozen/readonly.
 *
 * @param array - The array to attempt mutation on
 * @returns A function that performs the mutation attempt
 */
function withArrayMutation<T>(array: readonly T[]): () => void {
  return () => {
    (array as unknown as T[]).push(
      new WarningFakeBuilder()
        .withTroopNotFound(999)
        .withMessage('Hacked')
        .withCriticalSeverity()
        .build() as unknown as T
    );
  };
}

describe('WarningCollector', () => {
  let collector: WarningCollector;

  beforeEach(() => {
    collector = new WarningCollector();
  });

  describe('add', () => {
    it('should add warning from data', () => {
      const data: WarningData = {
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test warning',
        context: { troopId: 1 },
      };

      collector.add(data);

      expect(collector.count()).toBe(1);
      expect(collector.getWarnings()[0]!.message).toBe('Test warning');
    });

    it('should add multiple warnings', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning 1',
        context: {},
      });

      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Warning 2',
        context: {},
      });

      expect(collector.count()).toBe(2);
    });

    it('should preserve warning order', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'First',
        context: {},
      });

      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Second',
        context: {},
      });

      const warnings = collector.getWarnings();
      expect(warnings[0]!.message).toBe('First');
      expect(warnings[1]!.message).toBe('Second');
    });
  });

  describe('addMany', () => {
    it('should add multiple warnings from data array', () => {
      const warnings: WarningData[] = [
        {
          type: 'ttk_out_of_tolerance',
          severity: 'warning',
          message: 'Warning 1',
          context: {},
        },
        {
          type: 'troop_not_found',
          severity: 'critical',
          message: 'Warning 2',
          context: {},
        },
      ];

      collector.addMany(warnings);

      expect(collector.count()).toBe(2);
    });

    it('should add multiple Warning instances', () => {
      const warnings = [
        new Warning({
          type: 'ttk_out_of_tolerance',
          severity: 'warning',
          message: 'Warning 1',
          context: {},
        }),
        new Warning({
          type: 'troop_not_found',
          severity: 'critical',
          message: 'Warning 2',
          context: {},
        }),
      ];

      collector.addMany(warnings);

      expect(collector.count()).toBe(2);
    });

    it('should add mixed data and Warning instances', () => {
      const warnings = [
        {
          type: 'ttk_out_of_tolerance',
          severity: 'warning',
          message: 'Warning 1',
          context: {},
        } as WarningData,
        new Warning({
          type: 'troop_not_found',
          severity: 'critical',
          message: 'Warning 2',
          context: {},
        }),
      ];

      collector.addMany(warnings);

      expect(collector.count()).toBe(2);
    });

    it('should handle empty array', () => {
      collector.addMany([]);

      expect(collector.count()).toBe(0);
    });
  });

  describe('getWarnings', () => {
    it('should return empty array initially', () => {
      expect(collector.getWarnings()).toEqual([]);
    });

    it('should return all warnings', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning 1',
        context: {},
      });

      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Warning 2',
        context: {},
      });

      const warnings = collector.getWarnings();

      expect(warnings).toHaveLength(2);
    });

    it('should return readonly copy (cannot mutate original)', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: {},
      });

      const warnings = collector.getWarnings();
      const mutateArray = withArrayMutation(warnings);
      mutateArray();

      // Original should still have 1 warning
      expect(collector.count()).toBe(1);
    });
  });

  describe('getByType', () => {
    beforeEach(() => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'TTK warning',
        context: {},
      });

      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Troop warning',
        context: {},
      });

      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'info',
        message: 'Another TTK warning',
        context: {},
      });
    });

    it('should return warnings of specific type', () => {
      const ttkWarnings = collector.getByType('ttk_out_of_tolerance');

      expect(ttkWarnings).toHaveLength(2);
      expect(ttkWarnings[0]!.message).toBe('TTK warning');
      expect(ttkWarnings[1]!.message).toBe('Another TTK warning');
    });

    it('should return empty array for non-existent type', () => {
      const warnings = collector.getByType('enemy_not_found');

      expect(warnings).toEqual([]);
    });

    it('should return single warning for unique type', () => {
      const warnings = collector.getByType('troop_not_found');

      expect(warnings).toHaveLength(1);
      expect(warnings[0]!.message).toBe('Troop warning');
    });
  });

  describe('getBySeverity', () => {
    beforeEach(() => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning 1',
        context: {},
      });

      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Critical 1',
        context: {},
      });

      collector.add({
        type: 'battle_timeout',
        severity: 'info',
        message: 'Info 1',
        context: {},
      });

      collector.add({
        type: 'enemy_not_found',
        severity: 'critical',
        message: 'Critical 2',
        context: {},
      });
    });

    it('should return warnings of specific severity', () => {
      const criticalWarnings = collector.getBySeverity('critical');

      expect(criticalWarnings).toHaveLength(2);
      expect(criticalWarnings[0]!.message).toBe('Critical 1');
      expect(criticalWarnings[1]!.message).toBe('Critical 2');
    });

    it('should return warning severity warnings', () => {
      const warnings = collector.getBySeverity('warning');

      expect(warnings).toHaveLength(1);
      expect(warnings[0]!.message).toBe('Warning 1');
    });

    it('should return info severity warnings', () => {
      const warnings = collector.getBySeverity('info');

      expect(warnings).toHaveLength(1);
      expect(warnings[0]!.message).toBe('Info 1');
    });
  });

  describe('getCriticalWarnings', () => {
    it('should return only critical warnings', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning',
        context: {},
      });

      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Critical',
        context: {},
      });

      const criticalWarnings = collector.getCriticalWarnings();

      expect(criticalWarnings).toHaveLength(1);
      expect(criticalWarnings[0]!.severity).toBe('critical');
    });

    it('should return empty array if no critical warnings', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning',
        context: {},
      });

      expect(collector.getCriticalWarnings()).toEqual([]);
    });
  });

  describe('hasWarnings', () => {
    it('should return false initially', () => {
      expect(collector.hasWarnings()).toBe(false);
    });

    it('should return true after adding warning', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: {},
      });

      expect(collector.hasWarnings()).toBe(true);
    });

    it('should return false after clearing', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: {},
      });

      collector.clear();

      expect(collector.hasWarnings()).toBe(false);
    });
  });

  describe('hasCriticalWarnings', () => {
    it('should return false initially', () => {
      expect(collector.hasCriticalWarnings()).toBe(false);
    });

    it('should return true after adding critical warning', () => {
      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Critical',
        context: {},
      });

      expect(collector.hasCriticalWarnings()).toBe(true);
    });

    it('should return false if only non-critical warnings', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning',
        context: {},
      });

      collector.add({
        type: 'battle_timeout',
        severity: 'info',
        message: 'Info',
        context: {},
      });

      expect(collector.hasCriticalWarnings()).toBe(false);
    });

    it('should return true if at least one critical warning exists', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning',
        context: {},
      });

      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Critical',
        context: {},
      });

      expect(collector.hasCriticalWarnings()).toBe(true);
    });
  });

  describe('count', () => {
    it('should return 0 initially', () => {
      expect(collector.count()).toBe(0);
    });

    it('should return correct count after adding warnings', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning 1',
        context: {},
      });

      expect(collector.count()).toBe(1);

      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Warning 2',
        context: {},
      });

      expect(collector.count()).toBe(2);
    });
  });

  describe('countByType', () => {
    beforeEach(() => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'TTK 1',
        context: {},
      });

      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'TTK 2',
        context: {},
      });

      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Troop',
        context: {},
      });

      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'info',
        message: 'TTK 3',
        context: {},
      });
    });

    it('should return counts grouped by type', () => {
      const counts = collector.countByType();

      expect(counts).toEqual({
        ttk_out_of_tolerance: 3,
        troop_not_found: 1,
      });
    });

    it('should return empty object if no warnings', () => {
      const emptyCollector = new WarningCollector();
      const counts = emptyCollector.countByType();

      expect(counts).toEqual({});
    });

    it('should include all warning types', () => {
      const newCollector = new WarningCollector();

      newCollector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Test',
        context: {},
      });

      newCollector.add({
        type: 'enemy_not_found',
        severity: 'critical',
        message: 'Test',
        context: {},
      });

      newCollector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: {},
      });

      newCollector.add({
        type: 'skill_formula_error',
        severity: 'warning',
        message: 'Test',
        context: {},
      });

      newCollector.add({
        type: 'battle_timeout',
        severity: 'info',
        message: 'Test',
        context: {},
      });

      const counts = newCollector.countByType();

      expect(counts).toEqual({
        troop_not_found: 1,
        enemy_not_found: 1,
        ttk_out_of_tolerance: 1,
        skill_formula_error: 1,
        battle_timeout: 1,
      });
    });
  });

  describe('countBySeverity', () => {
    beforeEach(() => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning 1',
        context: {},
      });

      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Critical 1',
        context: {},
      });

      collector.add({
        type: 'enemy_not_found',
        severity: 'critical',
        message: 'Critical 2',
        context: {},
      });

      collector.add({
        type: 'battle_timeout',
        severity: 'info',
        message: 'Info 1',
        context: {},
      });
    });

    it('should return counts grouped by severity', () => {
      const counts = collector.countBySeverity();

      expect(counts).toEqual({
        critical: 2,
        warning: 1,
        info: 1,
      });
    });

    it('should return zero counts for empty collector', () => {
      const emptyCollector = new WarningCollector();
      const counts = emptyCollector.countBySeverity();

      expect(counts).toEqual({
        critical: 0,
        warning: 0,
        info: 0,
      });
    });

    it('should count only existing severities', () => {
      const newCollector = new WarningCollector();

      newCollector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: {},
      });

      const counts = newCollector.countBySeverity();

      expect(counts).toEqual({
        critical: 0,
        warning: 1,
        info: 0,
      });
    });
  });

  describe('clear', () => {
    it('should remove all warnings', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning 1',
        context: {},
      });

      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Warning 2',
        context: {},
      });

      collector.clear();

      expect(collector.count()).toBe(0);
      expect(collector.hasWarnings()).toBe(false);
    });

    it('should allow adding warnings after clear', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning 1',
        context: {},
      });

      collector.clear();

      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Warning 2',
        context: {},
      });

      expect(collector.count()).toBe(1);
    });
  });

  describe('merge', () => {
    it('should merge warnings from another collector', () => {
      const collector1 = new WarningCollector();
      collector1.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning 1',
        context: {},
      });

      const collector2 = new WarningCollector();
      collector2.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Warning 2',
        context: {},
      });

      collector1.merge(collector2);

      expect(collector1.count()).toBe(2);
    });

    it('should preserve order when merging', () => {
      const collector1 = new WarningCollector();
      collector1.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'First',
        context: {},
      });

      const collector2 = new WarningCollector();
      collector2.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Second',
        context: {},
      });

      collector1.merge(collector2);

      const warnings = collector1.getWarnings();
      expect(warnings[0]!.message).toBe('First');
      expect(warnings[1]!.message).toBe('Second');
    });

    it('should not affect source collector', () => {
      const collector1 = new WarningCollector();
      const collector2 = new WarningCollector();

      collector2.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Warning',
        context: {},
      });

      collector1.merge(collector2);

      expect(collector2.count()).toBe(1);
    });

    it('should handle merging empty collector', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning',
        context: {},
      });

      const emptyCollector = new WarningCollector();
      collector.merge(emptyCollector);

      expect(collector.count()).toBe(1);
    });
  });

  describe('toJSON', () => {
    it('should return array of plain warning objects', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Warning 1',
        context: { troopId: 1 },
      });

      collector.add({
        type: 'troop_not_found',
        severity: 'critical',
        message: 'Warning 2',
        context: { troopId: 2 },
      });

      const json = collector.toJSON();

      expect(json).toEqual([
        {
          type: 'ttk_out_of_tolerance',
          severity: 'warning',
          message: 'Warning 1',
          context: { troopId: 1 },
        },
        {
          type: 'troop_not_found',
          severity: 'critical',
          message: 'Warning 2',
          context: { troopId: 2 },
        },
      ]);
    });

    it('should return empty array if no warnings', () => {
      expect(collector.toJSON()).toEqual([]);
    });

    it('should be suitable for JSON.stringify', () => {
      collector.add({
        type: 'ttk_out_of_tolerance',
        severity: 'warning',
        message: 'Test',
        context: { troopId: 1 },
      });

      const jsonString = JSON.stringify(collector.toJSON());
      const parsed = JSON.parse(jsonString);

      expect(parsed[0].type).toBe('ttk_out_of_tolerance');
      expect(parsed[0].severity).toBe('warning');
      expect(parsed[0].message).toBe('Test');
      expect(parsed[0].context).toEqual({ troopId: 1 });
    });
  });
});
