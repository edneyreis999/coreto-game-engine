/**
 * useSimulationResults Hook Tests
 *
 * Tests for the useSimulationResults custom React hook.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useSimulationResults } from '@/hooks/useSimulationResults'
import type { ReportData } from '@coreto/electron/main/ipc/types.js'

const mockReportData: ReportData = {
  trechos: [
    {
      id: 'trecho-1',
      name: 'Forest Battles',
      passed: true,
      battleCount: 5,
      avgTtkTurns: 12.5,
      avgTtkActions: 24.3,
      p95TtkTurns: 15.0,
      p95TtkActions: 30.0,
      successRate: 100.0,
      battles: [],
      warnings: [],
    },
  ],
  totalBattles: 5,
  timestamp: '2026-01-20T10:30:00.000Z',
}

describe('useSimulationResults', () => {
  let mockCoreto: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Create fresh mock for each test
    mockCoreto = {
      openProject: jest.fn(),
      validateProject: jest.fn(),
      runSimulation: jest.fn(),
      startSimulation: jest.fn(),
      getSimulationProgress: jest.fn(),
      cancelSimulation: jest.fn(),
      getSimulationResults: jest.fn(),
      loadConfig: jest.fn(),
      getTrechos: jest.fn(),
      updateTrecho: jest.fn(),
      deleteTrecho: jest.fn(),
      getTroops: jest.fn(),
      getClasses: jest.fn(),
      getEnemies: jest.fn(),
      listRecent: jest.fn(),
      addRecent: jest.fn(),
      getPreferences: jest.fn(),
      setPreferences: jest.fn(),
      updateGlobalSettings: jest.fn(),
      // Event listener functions - return cleanup function
      onProgress: jest.fn(() => jest.fn()),
      onComplete: jest.fn(() => jest.fn()),
      onError: jest.fn(() => jest.fn()),
    }

    // Setup global window mock
    Object.defineProperty(window, 'coreto', {
      value: mockCoreto,
      writable: true,
    })

    // Setup default mock response
    mockCoreto.getSimulationResults.mockResolvedValue({
      success: true,
      data: mockReportData,
    })
  })

  describe('initial state', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useSimulationResults())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.hasResults).toBe(false)
      expect(result.current.report).toBe(null)
      expect(result.current.error).toBe(null)
    })

    it('should have refresh function available', () => {
      const { result } = renderHook(() => useSimulationResults())

      expect(typeof result.current.refresh).toBe('function')
    })
  })

  describe('fetching results', () => {
    it('should fetch results on mount', async () => {
      const { result } = renderHook(() => useSimulationResults())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockCoreto.getSimulationResults).toHaveBeenCalledTimes(1)
    })

    it('should return report data when IPC call succeeds', async () => {
      const { result } = renderHook(() => useSimulationResults())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.report).toEqual(mockReportData)
      expect(result.current.hasResults).toBe(true)
      expect(result.current.error).toBe(null)
    })

    describe('error handling', () => {
      test.each([
        [
          'IPC error',
          {
            success: false,
            error: {
              name: 'IPCError',
              message: 'Failed to get results',
              severity: 'critical' as const,
              context: {},
              timestamp: new Date().toISOString(),
            },
          },
          'Failed to get results',
        ],
        [
          'network error',
          new Error('Network error'),
          'Network error',
        ],
      ] as const)('should handle %s', async (_name, mockError, expectedMessage) => {
        if (mockError instanceof Error) {
          mockCoreto.getSimulationResults.mockRejectedValue(mockError)
        } else {
          mockCoreto.getSimulationResults.mockResolvedValue(mockError)
        }

        const { result } = renderHook(() => useSimulationResults())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.report).toBe(null)
        expect(result.current.hasResults).toBe(false)
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe(expectedMessage)
      })
    })
  })

  describe('manual refresh', () => {
    it('should refetch results when refresh is called', async () => {
      const { result } = renderHook(() => useSimulationResults())

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCallCount = mockCoreto.getSimulationResults.mock.calls.length

      // Call refresh
      await act(async () => {
        await result.current.refresh()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockCoreto.getSimulationResults).toHaveBeenCalledTimes(initialCallCount + 1)
    })

    it('should update report data after refresh', async () => {
      const { result } = renderHook(() => useSimulationResults())

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Update mock data for refresh
      const updatedReport: ReportData = {
        ...mockReportData,
        trechos: [
          ...mockReportData.trechos,
          {
            id: 'trecho-2',
            name: 'Cave Battles',
            passed: false,
            battleCount: 3,
            avgTtkTurns: 20.0,
            avgTtkActions: 35.0,
            p95TtkTurns: 25.0,
            p95TtkActions: 40.0,
            successRate: 66.7,
            battles: [],
            warnings: [],
          },
        ],
        totalBattles: 8,
      }

      mockCoreto.getSimulationResults.mockResolvedValue({
        success: true,
        data: updatedReport,
      })

      // Call refresh
      await act(async () => {
        await result.current.refresh()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.report?.trechos).toHaveLength(2)
      expect(result.current.report?.totalBattles).toBe(8)
    })
  })

  describe('error recovery', () => {
    it('should recover from error after successful refresh', async () => {
      // Initial call fails
      mockCoreto.getSimulationResults.mockResolvedValueOnce({
        success: false,
        error: {
          name: 'IPCError',
          message: 'Failed to get results',
          severity: 'critical',
          context: {},
          timestamp: new Date().toISOString(),
        },
      })

      const { result } = renderHook(() => useSimulationResults())

      // Wait for error state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).not.toBe(null)

      // Setup successful response for refresh
      mockCoreto.getSimulationResults.mockResolvedValueOnce({
        success: true,
        data: mockReportData,
      })

      // Call refresh
      await act(async () => {
        await result.current.refresh()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe(null)
      expect(result.current.report).toEqual(mockReportData)
      expect(result.current.hasResults).toBe(true)
    })
  })

  describe('hasResults flag', () => {
    test.each([
      [
        'false when report is null',
        () => {
          mockCoreto.getSimulationResults.mockResolvedValueOnce({
            success: false,
            error: {
              name: 'IPCError',
              message: 'No results',
              severity: 'critical',
              context: {},
              timestamp: new Date().toISOString(),
            },
          })
        },
        false,
      ],
      [
        'true when report exists',
        () => {
          // Use default mock (already set in beforeEach)
        },
        true,
      ],
    ])('should return %s', async (_name, setupFn, expectedValue) => {
      setupFn()

      const { result } = renderHook(() => useSimulationResults())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasResults).toBe(expectedValue)
    })
  })
})
