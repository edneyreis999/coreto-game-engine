/**
 * SimulationHistory Query Tests
 *
 * Tests CRUD operations for the simulation_history table.
 *
 * @see packages/electron/src/main/database/queries/simulation-history.ts
 */

import { initDatabase, closeDatabase } from '../../../../src/main/database/index.js';
import type { SimulationHistory, SimulationHistoryInput } from '../../../../src/main/database/queries/simulation-history.js';
import {
  addSimulationHistory,
  listSimulationHistoryByProject,
  listSimulationHistoryByTrecho,
  deleteOldSimulationHistory,
  getSimulationHistory,
  deleteSimulationHistoryByProject,
  countSimulationHistory,
} from '../../../../src/main/database/queries/simulation-history.js';

describe('SimulationHistory Queries', () => {
  const mockInput: SimulationHistoryInput = {
    project_path: '/path/to/project',
    config_name: 'test-config.json',
    trecho_id: 'ato1-nivel1-10',
    troop_id: 1,
    troop_name: 'Test Troop',
    ttk_turns: 5,
    ttk_actions: 12,
    duration_ms: 1500,
    seed: 12345,
    exp_gained: 100,
    outcome: 'victory',
    passed: true,
    warnings: [],
  };

  beforeEach(() => {
    initDatabase(true);
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('addSimulationHistory', () => {
    it('should create record with all required fields', () => {
      const result = addSimulationHistory(mockInput);

      expect(result).toMatchObject({
        id: expect.any(Number),
        project_path: '/path/to/project',
        config_name: 'test-config.json',
        trecho_id: 'ato1-nivel1-10',
        troop_id: 1,
        troop_name: 'Test Troop',
        ttk_turns: 5,
        ttk_actions: 12,
        duration_ms: 1500,
        seed: 12345,
        exp_gained: 100,
        outcome: 'victory',
        passed: true,
        warnings: [],
      });

      expect(result.executed_at).toBeLessThanOrEqual(Date.now());
    });

    it('should store record in database', () => {
      const added = addSimulationHistory(mockInput);

      const retrieved = getSimulationHistory(added.id);

      expect(retrieved).toEqual(added);
    });

    it('should serialize warnings array to JSON', () => {
      const inputWithWarnings = {
        ...mockInput,
        warnings: ['Warning 1', 'Warning 2'],
      };

      const result = addSimulationHistory(inputWithWarnings);

      expect(result.warnings).toEqual(['Warning 1', 'Warning 2']);
    });

    it('should handle null config_name', () => {
      const inputWithoutConfig = {
        ...mockInput,
        config_name: null,
      };

      const result = addSimulationHistory(inputWithoutConfig);

      expect(result.config_name).toBeNull();
    });
  });

  describe('listSimulationHistoryByProject', () => {
    beforeEach(() => {
      // Add test data
      addSimulationHistory({
        ...mockInput,
        project_path: '/project1',
        trecho_id: 'trecho1',
        troop_id: 1,
      });

      const db = initDatabase();
      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE id = ?').run(Date.now() - 3000, 1);

      addSimulationHistory({
        ...mockInput,
        project_path: '/project1',
        trecho_id: 'trecho2',
        troop_id: 2,
      });

      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE id = ?').run(Date.now() - 2000, 2);

      addSimulationHistory({
        ...mockInput,
        project_path: '/project2',
        trecho_id: 'trecho1',
        troop_id: 1,
      });
    });

    it('should return simulations filtered by projectPath', () => {
      const results = listSimulationHistoryByProject('/project1');

      expect(results).toHaveLength(2);
      expect(results.every(r => r.project_path === '/project1')).toBe(true);
    });

    it('should return empty array for non-existent project', () => {
      const results = listSimulationHistoryByProject('/nonexistent');

      expect(results).toEqual([]);
    });

    it('should order by executedAt DESC', () => {
      const results = listSimulationHistoryByProject('/project1');

      expect(results[0].id).toBe(2);
      expect(results[1].id).toBe(1);
    });

    it('should limit results to specified count', () => {
      const results = listSimulationHistoryByProject('/project1', 1);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(2);
    });
  });

  describe('listSimulationHistoryByTrecho', () => {
    beforeEach(() => {
      // Add test data
      addSimulationHistory({
        ...mockInput,
        project_path: '/project1',
        trecho_id: 'trecho1',
        troop_id: 1,
      });

      const db = initDatabase();
      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE id = ?').run(Date.now() - 3000, 1);

      addSimulationHistory({
        ...mockInput,
        project_path: '/project2',
        trecho_id: 'trecho1',
        troop_id: 2,
      });

      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE id = ?').run(Date.now() - 2000, 2);

      addSimulationHistory({
        ...mockInput,
        trecho_id: 'trecho2',
        troop_id: 1,
      });
    });

    it('should return simulations filtered by trechoId', () => {
      const results = listSimulationHistoryByTrecho('trecho1');

      expect(results).toHaveLength(2);
      expect(results.every(r => r.trecho_id === 'trecho1')).toBe(true);
    });

    it('should return empty array for non-existent trecho', () => {
      const results = listSimulationHistoryByTrecho('nonexistent');

      expect(results).toEqual([]);
    });

    it('should order by executedAt DESC', () => {
      const results = listSimulationHistoryByTrecho('trecho1');

      expect(results[0].id).toBe(2);
      expect(results[1].id).toBe(1);
    });
  });

  describe('deleteOldSimulationHistory', () => {
    beforeEach(() => {
      const now = Date.now();

      // Add records with different timestamps
      const db = initDatabase();

      // Old record (10 days ago)
      addSimulationHistory({
        ...mockInput,
        trecho_id: 'old',
      });
      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE trecho_id = ?').run(now - 10 * 24 * 60 * 60 * 1000, 'old');

      // Recent record (2 days ago)
      addSimulationHistory({
        ...mockInput,
        trecho_id: 'recent',
      });
      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE trecho_id = ?').run(now - 2 * 24 * 60 * 60 * 1000, 'recent');

      // Very recent record (1 hour ago)
      addSimulationHistory({
        ...mockInput,
        trecho_id: 'very-recent',
      });
      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE trecho_id = ?').run(now - 60 * 60 * 1000, 'very-recent');
    });

    it('should remove records older than specified days', () => {
      const deletedCount = deleteOldSimulationHistory(5);

      expect(deletedCount).toBe(1);

      const remaining = listSimulationHistoryByProject('/path/to/project');
      expect(remaining).toHaveLength(2);
      expect(remaining.every(r => r.trecho_id !== 'old')).toBe(true);
    });

    it('should keep recent records', () => {
      deleteOldSimulationHistory(5);

      const remaining = listSimulationHistoryByProject('/path/to/project');
      expect(remaining).toHaveLength(2);
    });
  });

  describe('getSimulationHistory', () => {
    it('should return simulation by ID', () => {
      const added = addSimulationHistory(mockInput);

      const result = getSimulationHistory(added.id);

      expect(result).toEqual(added);
    });

    it('should return null when simulation not found', () => {
      const result = getSimulationHistory(99999);

      expect(result).toBeNull();
    });
  });

  describe('deleteSimulationHistoryByProject', () => {
    it('should delete all simulations for a project', () => {
      addSimulationHistory({
        ...mockInput,
        project_path: '/project1',
        trecho_id: 'trecho1',
      });
      addSimulationHistory({
        ...mockInput,
        project_path: '/project1',
        trecho_id: 'trecho2',
      });
      addSimulationHistory({
        ...mockInput,
        project_path: '/project2',
        trecho_id: 'trecho1',
      });

      const deletedCount = deleteSimulationHistoryByProject('/project1');

      expect(deletedCount).toBe(2);

      const project1Results = listSimulationHistoryByProject('/project1');
      const project2Results = listSimulationHistoryByProject('/project2');

      expect(project1Results).toEqual([]);
      expect(project2Results).toHaveLength(1);
    });

    it('should return 0 when project has no simulations', () => {
      const deletedCount = deleteSimulationHistoryByProject('/nonexistent');

      expect(deletedCount).toBe(0);
    });
  });

  describe('countSimulationHistory', () => {
    it('should return total count of simulation records', () => {
      addSimulationHistory({
        ...mockInput,
        trecho_id: 'trecho1',
      });
      addSimulationHistory({
        ...mockInput,
        trecho_id: 'trecho2',
      });
      addSimulationHistory({
        ...mockInput,
        trecho_id: 'trecho3',
      });

      const count = countSimulationHistory();

      expect(count).toBe(3);
    });

    it('should return 0 when no simulations exist', () => {
      const count = countSimulationHistory();

      expect(count).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle defeat outcome', () => {
      const input = {
        ...mockInput,
        outcome: 'defeat' as const,
        passed: false,
      };

      const result = addSimulationHistory(input);

      expect(result.outcome).toBe('defeat');
      expect(result.passed).toBe(false);
    });

    it('should handle timeout outcome', () => {
      const input = {
        ...mockInput,
        outcome: 'timeout' as const,
        passed: false,
      };

      const result = addSimulationHistory(input);

      expect(result.outcome).toBe('timeout');
      expect(result.passed).toBe(false);
    });

    it('should handle empty warnings array', () => {
      const result = addSimulationHistory(mockInput);

      expect(result.warnings).toEqual([]);
    });

    it('should handle warnings with special characters', () => {
      const input = {
        ...mockInput,
        warnings: ['Warning: "quote"', 'Warning: \'apostrophe\'', 'Warning: \\backslash\\'],
      };

      const result = addSimulationHistory(input);

      expect(result.warnings).toEqual(input.warnings);
    });
  });
});
