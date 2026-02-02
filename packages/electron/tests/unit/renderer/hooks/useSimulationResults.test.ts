/**
 * useSimulationResults Hook Tests
 *
 * Tests for the useSimulationResults custom React hook.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useSimulationResults } from '@/hooks/useSimulationResults'
import type { ReportData } from '@coreto/electron/main/ipc/types.js'

// Mock window.coreto API - defined in setup.renderer.ts
const mockCoreto = (global as any).mockCoreto

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
  beforeEach(() => {
    jest.clearAllMocks()

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

    it('should return error state when IPC call fails', async () => {
      const mockError = new Error('Failed to get results')
      mockCoreto.getSimulationResults.mockResolvedValue({
        success: false,
        error: {
          name: 'IPCError',
          message: mockError.message,
          severity: 'critical',
          context: {},
          timestamp: new Date().toISOString(),
        },
      })

      const { result } = renderHook(() => useSimulationResults())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.report).toBe(null)
      expect(result.current.hasResults).toBe(false)
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe(mockError.message)
    })

    it('should handle network errors', async () => {
      mockCoreto.getSimulationResults.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useSimulationResults())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Network error')
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
    it('should return false when report is null', async () => {
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

      const { result } = renderHook(() => useSimulationResults())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasResults).toBe(false)
    })

    it('should return true when report exists', async () => {
      const { result } = renderHook(() => useSimulationResults())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasResults).toBe(true)
    })
  })
})
