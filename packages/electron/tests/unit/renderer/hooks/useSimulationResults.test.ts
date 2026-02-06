/**
 * useSimulationResults Hook Tests
 *
 * Tests for the useSimulationResults custom React hook.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useSimulationResults } from '@/hooks/useSimulationResults'
import type { ReportData } from '@coreto/electron/main/ipc/types.js'
import { createMinimalCoretoMock } from '@/tests/helpers/factories'

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
  describe('initial state', () => {
    it('should start with loading state', () => {
      const mockCoreto = createMinimalCoretoMock({
        getSimulationResults: jest.fn().mockResolvedValue({
          success: true,
          data: mockReportData,
        }),
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() => useSimulationResults())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.hasResults).toBe(false)
      expect(result.current.report).toBe(null)
      expect(result.current.error).toBe(null)
    })

    it('should have refresh function available', () => {
      const mockCoreto = createMinimalCoretoMock({
        getSimulationResults: jest.fn().mockResolvedValue({
          success: true,
          data: mockReportData,
        }),
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() => useSimulationResults())

      expect(typeof result.current.refresh).toBe('function')
    })
  })

  describe('fetching results', () => {
    it('should fetch results on mount', async () => {
      const mockCoreto = createMinimalCoretoMock({
        getSimulationResults: jest.fn().mockResolvedValue({
          success: true,
          data: mockReportData,
        }),
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() => useSimulationResults())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockCoreto.getSimulationResults).toHaveBeenCalledTimes(1)
    })

    it('should return report data when IPC call succeeds', async () => {
      const mockCoreto = createMinimalCoretoMock({
        getSimulationResults: jest.fn().mockResolvedValue({
          success: true,
          data: mockReportData,
        }),
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

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
        const mockCoreto = createMinimalCoretoMock()

        if (mockError instanceof Error) {
          mockCoreto.getSimulationResults.mockRejectedValue(mockError)
        } else {
          mockCoreto.getSimulationResults.mockResolvedValue(mockError)
        }

        Object.defineProperty(window, 'coreto', {
          value: mockCoreto,
          writable: true,
        })

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
      const mockCoreto = createMinimalCoretoMock({
        getSimulationResults: jest.fn().mockResolvedValue({
          success: true,
          data: mockReportData,
        }),
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

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
      const mockCoreto = createMinimalCoretoMock({
        getSimulationResults: jest.fn().mockResolvedValue({
          success: true,
          data: mockReportData,
        }),
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

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
      const mockCoreto = createMinimalCoretoMock()

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

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
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
          const mockCoreto = createMinimalCoretoMock()
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
          return mockCoreto
        },
        false,
      ],
      [
        'true when report exists',
        () => {
          return createMinimalCoretoMock({
            getSimulationResults: jest.fn().mockResolvedValue({
              success: true,
              data: mockReportData,
            }),
          })
        },
        true,
      ],
    ])('should return %s', async (_name, setupFn, expectedValue) => {
      const mockCoreto = setupFn()

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() => useSimulationResults())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasResults).toBe(expectedValue)
    })
  })
})
