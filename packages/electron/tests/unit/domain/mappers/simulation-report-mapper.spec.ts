/**
 * Unit tests for simulation report mapper
 */

import { describe, it, expect } from '@jest/globals'
import { mapSimulationReportToReportData } from '@coreto/electron/domain/mappers/simulation-report-mapper'
import type { SimulationReport } from '@coreto/electron/domain/entities/simulation'
import type { ReportData } from '@coreto/electron/domain/types/domain-types'

describe('simulation-report-mapper', () => {
  describe('mapSimulationReportToReportData', () => {
    it('should map simulation report to report data format', () => {
      const simulationReport: SimulationReport = {
        metadata: {
          id: 'sim-1',
          timestamp: Date.now(),
          projectPath: '/path/to/project',
          version: '1.0',
        },
        summary: {
          trechos: [],
          overallTTK: 100,
          totalBattles: 10,
          warningCount: 0,
          criticalWarningCount: 0,
          duration: 1000,
          seed: 12345,
        },
        trechos: [
          {
            id: 'trecho1',
            description: 'First Trecho',
            battles: [
              {
                battleId: 'battle-1',
                turns: 5,
                ttk: 10,
                winner: 'heroes',
                heroes: [],
                enemies: [],
              },
              {
                battleId: 'battle-2',
                turns: 7,
                ttk: 14,
                winner: 'heroes',
                heroes: [],
                enemies: [],
              },
              {
                battleId: 'battle-3',
                turns: 10,
                ttk: 20,
                winner: 'enemies',
                heroes: [],
                enemies: [],
              },
            ],
          },
        ],
        warnings: [],
      }

      const result = mapSimulationReportToReportData('sim-1', simulationReport)

      expect(result).toEqual({
        trechos: [
          {
            id: 'trecho1',
            name: 'First Trecho',
            passed: true,
            battleCount: 3,
            avgTtkTurns: (5 + 7 + 10) / 3,
            avgTtkActions: (10 + 14 + 20) / 3,
            p95TtkTurns: 0,
            p95TtkActions: 0,
            successRate: 2 / 3,
            battles: [
              {
                troopId: 0,
                troopName: '',
                outcome: 'victory',
                ttkTurns: 5,
                ttkActions: 10,
                durationMs: 0,
                seed: 0,
                expGained: 0,
              },
              {
                troopId: 0,
                troopName: '',
                outcome: 'victory',
                ttkTurns: 7,
                ttkActions: 14,
                durationMs: 0,
                seed: 0,
                expGained: 0,
              },
              {
                troopId: 0,
                troopName: '',
                outcome: 'defeat',
                ttkTurns: 10,
                ttkActions: 20,
                durationMs: 0,
                seed: 0,
                expGained: 0,
              },
            ],
            warnings: [],
          },
        ],
        totalBattles: 10,
        timestamp: new Date(simulationReport.metadata.timestamp).toISOString(),
      } satisfies ReportData)
    })

    it('should handle trecho with no battles', () => {
      const simulationReport: SimulationReport = {
        metadata: {
          id: 'sim-1',
          timestamp: Date.now(),
          projectPath: '/path/to/project',
          version: '1.0',
        },
        summary: {
          trechos: [],
          overallTTK: 0,
          totalBattles: 0,
          warningCount: 0,
          criticalWarningCount: 0,
          duration: 0,
        },
        trechos: [
          {
            id: 'trecho1',
            description: 'Empty Trecho',
            battles: [],
          },
        ],
        warnings: [],
      }

      const result = mapSimulationReportToReportData('sim-1', simulationReport)

      expect(result.trechos).toHaveLength(1)
      expect(result.trechos[0]).toEqual({
        id: 'trecho1',
        name: 'Empty Trecho',
        passed: false, // No battles means not passed
        battleCount: 0,
        avgTtkTurns: 0,
        avgTtkActions: 0,
        p95TtkTurns: 0,
        p95TtkActions: 0,
        successRate: 0,
        battles: [],
        warnings: [],
      })
    })

    it('should filter warnings by trecho context', () => {
      const simulationReport: SimulationReport = {
        metadata: {
          id: 'sim-1',
          timestamp: Date.now(),
          projectPath: '/path/to/project',
          version: '1.0',
        },
        summary: {
          trechos: [],
          overallTTK: 100,
          totalBattles: 5,
          warningCount: 3,
          criticalWarningCount: 1,
          duration: 1000,
          seed: 12345,
        },
        trechos: [
          {
            id: 'trecho1',
            description: 'Trecho 1',
            battles: [
              {
                battleId: 'battle-1',
                turns: 5,
                ttk: 10,
                winner: 'heroes',
                heroes: [],
                enemies: [],
              },
            ],
          },
          {
            id: 'trecho2',
            description: 'Trecho 2',
            battles: [],
          },
        ],
        warnings: [
          {
            type: 'HIGH_TTK',
            severity: 'warning',
            message: 'TTK too high',
            context: { trechoId: 'trecho1' },
          },
          {
            type: 'LOW_SUCCESS',
            severity: 'critical',
            message: 'Success rate too low',
            context: { trechoId: 'trecho1' },
          },
          {
            type: 'GLOBAL_WARNING',
            severity: 'info',
            message: 'Global warning',
            context: {},
          },
        ],
      }

      const result = mapSimulationReportToReportData('sim-1', simulationReport)

      // Trecho 1 should have warnings specific to it (with trechoId) and global warnings (no trechoId)
      expect(result.trechos[0].warnings).toHaveLength(3)
      expect(result.trechos[0].warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'HIGH_TTK',
            severity: 'warning',
            message: 'TTK too high',
          }),
          expect.objectContaining({
            type: 'LOW_SUCCESS',
            severity: 'critical',
            message: 'Success rate too low',
          }),
          expect.objectContaining({
            type: 'GLOBAL_WARNING',
            severity: 'info',
            message: 'Global warning',
          }),
        ])
      )

      // Trecho 2 should only have global warnings
      expect(result.trechos[1].warnings).toHaveLength(1)
      expect(result.trechos[1].warnings[0]).toEqual({
        type: 'GLOBAL_WARNING',
        severity: 'info',
        message: 'Global warning',
        context: {},
      })
    })

    it('should correctly calculate TTK statistics', () => {
      const simulationReport: SimulationReport = {
        metadata: {
          id: 'sim-1',
          timestamp: Date.now(),
          projectPath: '/path/to/project',
          version: '1.0',
        },
        summary: {
          trechos: [],
          overallTTK: 150,
          totalBattles: 4,
          warningCount: 0,
          criticalWarningCount: 0,
          duration: 2000,
          seed: 12345,
        },
        trechos: [
          {
            id: 'trecho1',
            description: 'Trecho 1',
            battles: [
              { battleId: 'b1', turns: 5, ttk: 10, winner: 'heroes', heroes: [], enemies: [] },
              { battleId: 'b2', turns: 10, ttk: 20, winner: 'heroes', heroes: [], enemies: [] },
              { battleId: 'b3', turns: 15, ttk: 30, winner: 'enemies', heroes: [], enemies: [] },
              { battleId: 'b4', turns: 20, ttk: 40, winner: 'heroes', heroes: [], enemies: [] },
            ],
          },
        ],
        warnings: [],
      }

      const result = mapSimulationReportToReportData('sim-1', simulationReport)

      const trecho = result.trechos[0]
      expect(trecho.battleCount).toBe(4)
      expect(trecho.avgTtkTurns).toBe((5 + 10 + 15 + 20) / 4)
      expect(trecho.avgTtkActions).toBe((10 + 20 + 30 + 40) / 4)
      expect(trecho.successRate).toBe(3 / 4) // 3 victories out of 4
    })

    it('should convert timestamp to ISO string', () => {
      const timestamp = 1704067200000 // 2024-01-01 00:00:00 UTC
      const simulationReport: SimulationReport = {
        metadata: {
          id: 'sim-1',
          timestamp,
          projectPath: '/path/to/project',
          version: '1.0',
        },
        summary: {
          trechos: [],
          overallTTK: 0,
          totalBattles: 0,
          warningCount: 0,
          criticalWarningCount: 0,
          duration: 0,
        },
        trechos: [],
        warnings: [],
      }

      const result = mapSimulationReportToReportData('sim-1', simulationReport)

      expect(result.timestamp).toBe(new Date(timestamp).toISOString())
    })
  })
})
