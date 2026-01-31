/**
 * SimulationHistory Query Tests
 *
 * Tests CRUD operations for the simulation_history table.
 *
 * @see packages/electron/src/main/database/queries/simulation-history.ts
 */

import { initDatabase, resetDatabaseSingleton } from '../../../../src/main/database/index.js';
import type { SimulationHistoryInput } from '../../../../src/main/database/queries/simulation-history.js';
import {
  addSimulationHistory,
  countSimulationHistory,
  deleteOldSimulationHistory,
  deleteSimulationHistoryByProject,
  getSimulationHistory,
  listSimulationHistoryByProject,
  listSimulationHistoryByTrecho,
} from '../../../../src/main/database/queries/simulation-history.js';

describe('SimulationHistory Queries', () => {
  let db: ReturnType<typeof initDatabase>;

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
    db = initDatabase(true);
  });

  afterEach(() => {
    resetDatabaseSingleton();
  });

  describe('addSimulationHistory', () => {
    it('should create record with all required fields', () => {
      const result = addSimulationHistory(db, mockInput);

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
      const added = addSimulationHistory(db, mockInput);

      const retrieved = getSimulationHistory(db, added.id);

      expect(retrieved).toEqual(added);
    });

    it('should serialize warnings array to JSON', () => {
      const inputWithWarnings = {
        ...mockInput,
        warnings: ['Warning 1', 'Warning 2'],
      };

      const result = addSimulationHistory(db, inputWithWarnings);

      expect(result.warnings).toEqual(['Warning 1', 'Warning 2']);
    });

    it('should handle null config_name', () => {
      const inputWithoutConfig = {
        ...mockInput,
        config_name: null,
      };

      const result = addSimulationHistory(db, inputWithoutConfig);

      expect(result.config_name).toBeNull();
    });
  });

  describe('listSimulationHistoryByProject', () => {
    beforeEach(() => {
      // Add test data
      addSimulationHistory(db, {
        ...mockInput,
        project_path: '/project1',
        trecho_id: 'trecho1',
        troop_id: 1,
      });

      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE id = ?').run(
        Date.now() - 3000,
        1
      );

      addSimulationHistory(db, {
        ...mockInput,
        project_path: '/project1',
        trecho_id: 'trecho2',
        troop_id: 2,
      });

      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE id = ?').run(
        Date.now() - 2000,
        2
      );

      addSimulationHistory(db, {
        ...mockInput,
        project_path: '/project2',
        trecho_id: 'trecho1',
        troop_id: 1,
      });
    });

    it('should return simulations filtered by projectPath', () => {
      const results = listSimulationHistoryByProject(db, '/project1');

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.project_path === '/project1')).toBe(true);
    });

    it('should return empty array for non-existent project', () => {
      const results = listSimulationHistoryByProject(db, '/nonexistent');

      expect(results).toEqual([]);
    });

    it('should order by executedAt DESC', () => {
      const results = listSimulationHistoryByProject(db, '/project1');

      expect(results[0]!.id).toBe(2);
      expect(results[1]!.id).toBe(1);
    });

    it('should limit results to specified count', () => {
      const results = listSimulationHistoryByProject(db, '/project1', 1);

      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe(2);
    });
  });

  describe('listSimulationHistoryByTrecho', () => {
    beforeEach(() => {
      // Add test data
      addSimulationHistory(db, {
        ...mockInput,
        project_path: '/project1',
        trecho_id: 'trecho1',
        troop_id: 1,
      });

      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE id = ?').run(
        Date.now() - 3000,
        1
      );

      addSimulationHistory(db, {
        ...mockInput,
        project_path: '/project2',
        trecho_id: 'trecho1',
        troop_id: 2,
      });

      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE id = ?').run(
        Date.now() - 2000,
        2
      );

      addSimulationHistory(db, {
        ...mockInput,
        trecho_id: 'trecho2',
        troop_id: 1,
      });
    });

    it('should return simulations filtered by trechoId', () => {
      const results = listSimulationHistoryByTrecho(db, 'trecho1');

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.trecho_id === 'trecho1')).toBe(true);
    });

    it('should return empty array for non-existent trecho', () => {
      const results = listSimulationHistoryByTrecho(db, 'nonexistent');

      expect(results).toEqual([]);
    });

    it('should order by executedAt DESC', () => {
      const results = listSimulationHistoryByTrecho(db, 'trecho1');

      expect(results[0]!.id).toBe(2);
      expect(results[1]!.id).toBe(1);
    });
  });

  describe('deleteOldSimulationHistory', () => {
    beforeEach(() => {
      const now = Date.now();

      // Add records with different timestamps

      // Old record (10 days ago)
      addSimulationHistory(db, {
        ...mockInput,
        trecho_id: 'old',
      });
      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE trecho_id = ?').run(
        now - 10 * 24 * 60 * 60 * 1000,
        'old'
      );

      // Recent record (2 days ago)
      addSimulationHistory(db, {
        ...mockInput,
        trecho_id: 'recent',
      });
      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE trecho_id = ?').run(
        now - 2 * 24 * 60 * 60 * 1000,
        'recent'
      );

      // Very recent record (1 hour ago)
      addSimulationHistory(db, {
        ...mockInput,
        trecho_id: 'very-recent',
      });
      db.prepare('UPDATE simulation_history SET executed_at = ? WHERE trecho_id = ?').run(
        now - 60 * 60 * 1000,
        'very-recent'
      );
    });

    it('should remove records older than specified days', () => {
      const deletedCount = deleteOldSimulationHistory(db, 5);

      expect(deletedCount).toBe(1);

      const remaining = listSimulationHistoryByProject(db, '/path/to/project');
      expect(remaining).toHaveLength(2);
      expect(remaining.every((r) => r.trecho_id !== 'old')).toBe(true);
    });

    it('should keep recent records', () => {
      deleteOldSimulationHistory(db, 5);

      const remaining = listSimulationHistoryByProject(db, '/path/to/project');
      expect(remaining).toHaveLength(2);
    });
  });

  describe('getSimulationHistory', () => {
    it('should return simulation by ID', () => {
      const added = addSimulationHistory(db, mockInput);

      const result = getSimulationHistory(db, added.id);

      expect(result).toEqual(added);
    });

    it('should return null when simulation not found', () => {
      const result = getSimulationHistory(db, 99999);

      expect(result).toBeNull();
    });
  });

  describe('deleteSimulationHistoryByProject', () => {
    it('should delete all simulations for a project', () => {
      addSimulationHistory(db, {
        ...mockInput,
        project_path: '/project1',
        trecho_id: 'trecho1',
      });
      addSimulationHistory(db, {
        ...mockInput,
        project_path: '/project1',
        trecho_id: 'trecho2',
      });
      addSimulationHistory(db, {
        ...mockInput,
        project_path: '/project2',
        trecho_id: 'trecho1',
      });

      const deletedCount = deleteSimulationHistoryByProject(db, '/project1');

      expect(deletedCount).toBe(2);

      const project1Results = listSimulationHistoryByProject(db, '/project1');
      const project2Results = listSimulationHistoryByProject(db, '/project2');

      expect(project1Results).toEqual([]);
      expect(project2Results).toHaveLength(1);
    });

    it('should return 0 when project has no simulations', () => {
      const deletedCount = deleteSimulationHistoryByProject(db, '/nonexistent');

      expect(deletedCount).toBe(0);
    });
  });

  describe('countSimulationHistory', () => {
    it('should return total count of simulation records', () => {
      addSimulationHistory(db, {
        ...mockInput,
        trecho_id: 'trecho1',
      });
      addSimulationHistory(db, {
        ...mockInput,
        trecho_id: 'trecho2',
      });
      addSimulationHistory(db, {
        ...mockInput,
        trecho_id: 'trecho3',
      });

      const count = countSimulationHistory(db);

      expect(count).toBe(3);
    });

    it('should return 0 when no simulations exist', () => {
      const count = countSimulationHistory(db);

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

      const result = addSimulationHistory(db, input);

      expect(result.outcome).toBe('defeat');
      expect(result.passed).toBe(false);
    });

    it('should handle timeout outcome', () => {
      const input = {
        ...mockInput,
        outcome: 'timeout' as const,
        passed: false,
      };

      const result = addSimulationHistory(db, input);

      expect(result.outcome).toBe('timeout');
      expect(result.passed).toBe(false);
    });

    it('should handle empty warnings array', () => {
      const result = addSimulationHistory(db, mockInput);

      expect(result.warnings).toEqual([]);
    });

    it('should handle warnings with special characters', () => {
      const input = {
        ...mockInput,
        warnings: ['Warning: "quote"', "Warning: 'apostrophe'", 'Warning: \\backslash\\'],
      };

      const result = addSimulationHistory(db, input);

      expect(result.warnings).toEqual(input.warnings);
    });
  });
});
