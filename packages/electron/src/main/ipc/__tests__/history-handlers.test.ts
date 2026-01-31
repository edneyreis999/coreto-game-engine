/**
 * Unit Tests for History IPC Handlers
 *
 * Tests IPC handlers for simulation history operations.
 *
 * @see packages/electron/src/main/ipc/history-handlers.ts
 */

// Mock electron modules BEFORE imports
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { ReportStorageService } from '../../services/report-storage.js';
import { registerHistoryHandlers } from '../history-handlers.js';
import type { ReportData } from '../types.js';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates a mock ReportData for testing.
 */
function createMockReportData(): ReportData {
  return {
    trechos: [
      {
        id: 'trecho-1',
        name: 'Trecho 1',
        passed: true,
        battleCount: 100,
        avgTtkTurns: 5,
        avgTtkActions: 10,
        p95TtkTurns: 8,
        p95TtkActions: 15,
        successRate: 1.0,
        battles: [
          {
            troopId: 1,
            troopName: 'Test Troop',
            outcome: 'victory',
            ttkTurns: 5,
            ttkActions: 10,
            durationMs: 1000,
            seed: 12345,
            expGained: 100,
          },
        ],
        warnings: [
          {
            type: 'test-warning',
            severity: 'warning',
            message: 'Test warning',
            context: {},
          },
        ],
      },
    ],
    totalBattles: 100,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an in-memory database for testing.
 */
function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');

  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS simulation_history_v2 (
      id TEXT PRIMARY KEY,
      project_path TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'FAILED', 'CANCELLED')),
      summary_json TEXT NOT NULL,
      report_file_path TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_simulation_history_v2_project_path
      ON simulation_history_v2(project_path, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_simulation_history_v2_timestamp
      ON simulation_history_v2(timestamp DESC);
  `);

  return db;
}

// ============================================================================
// Test Suite
// ============================================================================

describe('History IPC Handlers', () => {
  let db: Database.Database;
  let service: ReportStorageService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handlers: Map<string, (...args: any[]) => Promise<any>>;
  let getDatabaseMock: jest.SpyInstance;

  beforeEach(() => {
    db = createTestDatabase();
    service = new ReportStorageService(db);

    // Mock getDatabase to return our test database
    const { getDatabase: _getDb } = require('../../database/index.js');
    getDatabaseMock = jest.spyOn(require('../../database/index.js'), 'getDatabase').mockReturnValue(db);

    // Set up handler map to capture registered handlers
    handlers = new Map();

    // Mock ipcMain.handle to capture handlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ipcMain.handle as jest.Mock).mockImplementation((channel: string, handler: (...args: any[]) => any) => {
      handlers.set(channel, handler);
    });

    // Register handlers
    registerHistoryHandlers();
  });

  afterEach(() => {
    getDatabaseMock.mockRestore();
    handlers.clear();
    (ipcMain.handle as jest.Mock).mockClear();
    (ipcMain.removeAllListeners as jest.Mock).mockClear();
    db.close();
  });

  /**
   * Helper to invoke a captured handler.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function invokeHandler(channel: string, ...args: any[]): Promise<any> {
    const handler = handlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for channel: ${channel}`);
    }
    // Create mock event
    const mockEvent = {} as Electron.IpcMainInvokeEvent;
    return handler(mockEvent, ...args);
  }

  describe('history:list', () => {
    it('should return list of simulations', async () => {
      const { generateSimulationId } = require('../../services/report-storage.js');
      const sim1 = generateSimulationId();
      const sim2 = generateSimulationId();
      await service.storeSimulation(sim1, '/project/a', createMockReportData(), 'SUCCESS');
      await service.storeSimulation(sim2, '/project/b', createMockReportData(), 'SUCCESS');

      const result = await invokeHandler('history:list', { limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.simulations).toHaveLength(2);
    });

    it('should filter by project path', async () => {
      const { generateSimulationId } = require('../../services/report-storage.js');
      const sim1 = generateSimulationId();
      const sim2 = generateSimulationId();
      await service.storeSimulation(sim1, '/project/a', createMockReportData(), 'SUCCESS');
      await service.storeSimulation(sim2, '/project/b', createMockReportData(), 'SUCCESS');

      const result = await invokeHandler('history:list', { projectPath: '/project/a' });

      expect(result.success).toBe(true);
      expect(result.data?.simulations).toHaveLength(1);
      expect(result.data?.simulations[0]?.projectPath).toBe('/project/a');
    });

    it('should return error for invalid payload', async () => {
      const result = await invokeHandler('history:list', { limit: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('history:generateId', () => {
    it('should generate a valid UUID', async () => {
      const result = await invokeHandler('history:generateId', {});

      expect(result.success).toBe(true);
      expect(result.data?.simulationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', async () => {
      const result1 = await invokeHandler('history:generateId', {});
      const result2 = await invokeHandler('history:generateId', {});

      expect(result1.data?.simulationId).not.toBe(result2.data?.simulationId);
    });
  });

  describe('history:loadReport', () => {
    it('should return null if report not exported', async () => {
      // Use a valid UUID (generateSimulationId generates UUIDs)
      const { generateSimulationId } = require('../../services/report-storage.js');
      const simId = generateSimulationId();
      await service.storeSimulation(simId, '/project/a', createMockReportData(), 'SUCCESS');

      const result = await invokeHandler('history:loadReport', { simulationId: simId });

      expect(result.success).toBe(true);
      expect(result.data?.report).toBeNull();
    });

    it('should return error for invalid UUID', async () => {
      const result = await invokeHandler('history:loadReport', { simulationId: 'invalid-uuid' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('history:delete', () => {
    it('should delete simulation record', async () => {
      const { generateSimulationId } = require('../../services/report-storage.js');
      const simId = generateSimulationId();
      await service.storeSimulation(simId, '/project/a', createMockReportData(), 'SUCCESS');

      // Verify exists
      let stmt = db.prepare('SELECT COUNT(*) as count FROM simulation_history_v2 WHERE id = ?');
      let row = stmt.get(simId) as { count: number };
      expect(row.count).toBe(1);

      // Delete
      const result = await invokeHandler('history:delete', { simulationId: simId });

      expect(result.success).toBe(true);

      // Verify gone
      stmt = db.prepare('SELECT COUNT(*) as count FROM simulation_history_v2 WHERE id = ?');
      row = stmt.get(simId) as { count: number };
      expect(row.count).toBe(0);
    });

    it('should return error for invalid UUID', async () => {
      const result = await invokeHandler('history:delete', { simulationId: 'invalid-uuid' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
