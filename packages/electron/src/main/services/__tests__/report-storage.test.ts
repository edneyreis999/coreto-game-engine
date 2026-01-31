/**
 * Unit Tests for ReportStorageService
 *
 * Tests the three-tier storage strategy:
 * - Summary in SQLite (~1KB)
 * - Full report in files (~500KB)
 *
 * @see packages/electron/src/main/services/report-storage.ts
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

// Mock electron module before importing
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/user/data'),
  },
}));

// Jest globals are available automatically
import Database from 'better-sqlite3';
import { rimraf } from 'rimraf';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { ReportStorageService, generateSimulationId } from '../report-storage.js';
import type { SimulationSummary, SimulationReport } from '../types.js';
import type { ReportData } from '../../ipc/types.js';
import { app } from 'electron';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates a mock ReportData for testing.
 */
function createMockReportData(_overrides?: Partial<ReportData>): ReportData {
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
        battles: Array.from({ length: 100 }, (_, i) => ({
          troopId: 1,
          troopName: `Troop ${i}`,
          outcome: 'victory' as const,
          ttkTurns: 5,
          ttkActions: 10,
          durationMs: 1000,
          seed: 12345,
          expGained: 100,
        })),
        warnings: [
          {
            type: 'test-warning',
            severity: 'warning' as const,
            message: 'Test warning message',
            context: { test: true },
          },
        ],
      },
      {
        id: 'trecho-2',
        name: 'Trecho 2',
        passed: false,
        battleCount: 50,
        avgTtkTurns: 10,
        avgTtkActions: 20,
        p95TtkTurns: 15,
        p95TtkActions: 25,
        successRate: 0.5,
        battles: Array.from({ length: 50 }, (_, i) => ({
          troopId: 2,
          troopName: `Troop ${i + 100}`,
          outcome: i % 2 === 0 ? ('victory' as const) : ('defeat' as const),
          ttkTurns: 10,
          ttkActions: 20,
          durationMs: 2000,
          seed: 12345,
          expGained: 200,
        })),
        warnings: [
          {
            type: 'critical-warning',
            severity: 'critical' as const,
            message: 'Critical warning message',
            context: { critical: true },
          },
        ],
      },
    ],
    totalBattles: 150,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an in-memory database for testing.
 */
function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create simulation_history_v2 table
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

describe('ReportStorageService', () => {
  let db: Database.Database;
  let service: ReportStorageService;
  let tempDir: string;
  let mockGetPath: jest.Mock;

  beforeEach(async () => {
    db = createTestDatabase();
    service = new ReportStorageService(db);

    // Create temp directory for report files
    tempDir = path.join(os.tmpdir(), `report-storage-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Mock app.getPath to return temp directory
    mockGetPath = app.getPath as jest.Mock;
    mockGetPath.mockReturnValue(tempDir);
  });

  afterEach(async () => {
    db.close();
    await rimraf(tempDir);
    mockGetPath.mockRestore();
  });

  afterEach(async () => {
    db.close();
    await rimraf(tempDir);
  });

  describe('generateSimulationId', () => {
    it('should generate a valid UUID', () => {
      const id = generateSimulationId();

      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = generateSimulationId();
      const id2 = generateSimulationId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('storeSimulation', () => {
    it('should store simulation summary in SQLite', async () => {
      const simulationId = generateSimulationId();
      const projectPath = '/test/project';
      const result = createMockReportData();

      await service.storeSimulation(simulationId, projectPath, result, 'SUCCESS');

      // Verify record exists in database
      const stmt = db.prepare('SELECT * FROM simulation_history_v2 WHERE id = ?');
      const row = stmt.get(simulationId) as {
        id: string;
        project_path: string;
        status: string;
        summary_json: string;
        report_file_path: string | null;
      } | undefined;

      expect(row).toBeDefined();
      expect(row?.id).toBe(simulationId);
      expect(row?.project_path).toBe(projectPath);
      expect(row?.status).toBe('SUCCESS');
      expect(row?.report_file_path).toBeNull();

      // Verify summary JSON can be parsed
      const summary = JSON.parse(row!.summary_json) as SimulationSummary;
      expect(summary.trechos).toHaveLength(2);
      expect(summary.totalBattles).toBe(150);
    });

    it('should extract lightweight summary from full result', async () => {
      const simulationId = generateSimulationId();
      const result = createMockReportData();

      await service.storeSimulation(simulationId, '/test/project', result, 'SUCCESS');

      const stmt = db.prepare('SELECT summary_json FROM simulation_history_v2 WHERE id = ?');
      const row = stmt.get(simulationId) as { summary_json: string } | undefined;
      const summary = JSON.parse(row!.summary_json) as SimulationSummary;

      // Verify summary structure
      expect(summary.trechos).toHaveLength(2);
      expect(summary.trechos[0]!).toEqual({
        id: 'trecho-1',
        description: 'Trecho 1',
        avgTTK: 5,
        maxTTK: 8,
        minTTK: 2, // Estimated
        battleCount: 100,
        status: 'SUCCESS',
      });

      // Verify aggregated metrics
      expect(summary.totalBattles).toBe(150);
      expect(summary.overallTTK).toBeGreaterThan(0);
      expect(summary.warningCount).toBe(2);
      expect(summary.criticalWarningCount).toBe(1);
    });

    it('should produce summary <2KB', async () => {
      const simulationId = generateSimulationId();
      const result = createMockReportData();

      await service.storeSimulation(simulationId, '/test/project', result, 'SUCCESS');

      const stmt = db.prepare('SELECT summary_json FROM simulation_history_v2 WHERE id = ?');
      const row = stmt.get(simulationId) as { summary_json: string } | undefined;
      const summarySize = row!.summary_json.length;

      expect(summarySize).toBeLessThan(2048); // <2KB
    });
  });

  describe('exportReport', () => {
    it('should export report to file and update database', async () => {
      const simulationId = generateSimulationId();
      const projectPath = '/test/project';
      const result = createMockReportData();

      // First store the simulation
      await service.storeSimulation(simulationId, projectPath, result, 'SUCCESS');

      // Then export the report
      const filePath = await service.exportReport(simulationId, result, projectPath);

      // Verify file exists
      expect(filePath).toContain(simulationId);
      expect(filePath).toContain('.json');

      // Verify database was updated with file path
      const stmt = db.prepare('SELECT report_file_path FROM simulation_history_v2 WHERE id = ?');
      const row = stmt.get(simulationId) as { report_file_path: string | null } | undefined;
      expect(row?.report_file_path).toBe(filePath);

      // Verify file content
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const report = JSON.parse(fileContent) as SimulationReport;

      expect(report.metadata.id).toBe(simulationId);
      expect(report.metadata.projectPath).toBe(projectPath);
      expect(report.summary).toBeDefined();
      expect(report.trechos).toBeDefined();
      expect(report.warnings).toBeDefined();
    });

    it('should create reports directory if not exists', async () => {
      const simulationId = generateSimulationId();
      const result = createMockReportData();

      const reportsDir = path.join(tempDir, 'reports');

      await service.exportReport(simulationId, result, '/test/project');

      // Verify directory was created
      const exists = await fs.access(reportsDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('loadReport', () => {
    it('should return null if report not exported', async () => {
      const simulationId = generateSimulationId();
      const result = createMockReportData();

      // Store simulation without exporting
      await service.storeSimulation(simulationId, '/test/project', result, 'SUCCESS');

      const report = await service.loadReport(simulationId);

      expect(report).toBeNull();
    });

    it('should load report from file if exported', async () => {
      const simulationId = generateSimulationId();
      const projectPath = '/test/project';
      const result = createMockReportData();

      // Store and export
      await service.storeSimulation(simulationId, projectPath, result, 'SUCCESS');

      await service.exportReport(simulationId, result, projectPath);

      const report = await service.loadReport(simulationId);

      expect(report).not.toBeNull();
      expect(report?.metadata.id).toBe(simulationId);
      expect(report?.summary).toBeDefined();
      expect(report?.trechos).toHaveLength(2);
    });

    it('should return null if file does not exist', async () => {
      const simulationId = generateSimulationId();

      // Manually insert record with non-existent file path
      const stmt = db.prepare(`
        INSERT INTO simulation_history_v2 (id, project_path, timestamp, status, summary_json, report_file_path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(simulationId, '/test/project', Date.now(), 'SUCCESS', '{}', '/nonexistent/file.json', Date.now());

      const report = await service.loadReport(simulationId);

      expect(report).toBeNull();
    });
  });

  describe('getHistory', () => {
    beforeEach(async () => {
      // Store multiple simulations
      const result1 = createMockReportData();
      const result2 = createMockReportData({
        trechos: [
          {
            ...result1.trechos[0]!,
            id: 'trecho-3',
            name: 'Trecho 3',
          },
        ],
      });

      await service.storeSimulation(generateSimulationId(), '/project/a', result1, 'SUCCESS');
      await service.storeSimulation(generateSimulationId(), '/project/b', result2, 'SUCCESS');
      await service.storeSimulation(generateSimulationId(), '/project/a', result1, 'FAILED');
    });

    it('should return all simulations when no project filter', async () => {
      const history = await service.getHistory();

      expect(history).toHaveLength(3);
    });

    it('should filter by project path', async () => {
      const history = await service.getHistory('/project/a');

      expect(history).toHaveLength(2);
      expect(history.every((h) => h.projectPath === '/project/a')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const history = await service.getHistory(undefined, 2);

      expect(history).toHaveLength(2);
    });

    it('should order by timestamp DESC', async () => {
      const history = await service.getHistory();

      // Verify timestamps are in descending order
      for (let i = 1; i < history.length; i++) {
        expect(history[i]!.timestamp).toBeLessThanOrEqual(history[i - 1]!.timestamp);
      }
    });

    it('should include parsed summary', async () => {
      const history = await service.getHistory();

      expect(history[0]!.summary).toBeDefined();
      expect(history[0]!.summary.trechos).toBeDefined();
      expect(typeof history[0]!.summary.totalBattles).toBe('number');
    });
  });

  describe('deleteSimulation', () => {
    it('should delete simulation record from database', async () => {
      const simulationId = generateSimulationId();
      const result = createMockReportData();

      await service.storeSimulation(simulationId, '/test/project', result, 'SUCCESS');

      // Verify record exists
      let stmt = db.prepare('SELECT COUNT(*) as count FROM simulation_history_v2 WHERE id = ?');
      let row = stmt.get(simulationId) as { count: number };
      expect(row.count).toBe(1);

      // Delete
      await service.deleteSimulation(simulationId);

      // Verify record is gone
      stmt = db.prepare('SELECT COUNT(*) as count FROM simulation_history_v2 WHERE id = ?');
      row = stmt.get(simulationId) as { count: number };
      expect(row.count).toBe(0);
    });

    it('should delete report file if exists', async () => {
      const simulationId = generateSimulationId();
      const result = createMockReportData();

      await service.storeSimulation(simulationId, '/test/project', result, 'SUCCESS');

      const filePath = await service.exportReport(simulationId, result, '/test/project');

      // Verify file exists
      let fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Delete
      await service.deleteSimulation(simulationId);

      // Verify file is deleted
      fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('should not error if file does not exist', async () => {
      const simulationId = generateSimulationId();
      const result = createMockReportData();

      await service.storeSimulation(simulationId, '/test/project', result, 'SUCCESS');

      // Manually set a non-existent file path
      const stmt = db.prepare('UPDATE simulation_history_v2 SET report_file_path = ? WHERE id = ?');
      stmt.run('/nonexistent/file.json', simulationId);

      // Should not throw
      await expect(service.deleteSimulation(simulationId)).resolves.toBeUndefined();
    });
  });
});
