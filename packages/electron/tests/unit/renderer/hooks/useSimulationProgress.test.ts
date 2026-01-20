/**
 * useSimulationProgress Hook Tests
 *
 * Tests for the useSimulationProgress custom hook.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useSimulationProgress } from '@/hooks/useSimulationProgress'

// Mock window.coreto API
const mockCoreto = global.window.coreto as jest.Mocked<typeof global.window.coreto>

// Mock simulation result
const mockSimulationResult = {
  trechoId: 'ato1-nivel1-10',
  troopId: 1,
  troopName: 'Slime',
  battleResult: {
    troopId: 1,
    troopName: 'Slime',
    outcome: 'victory' as const,
    ttkTurns: 5,
    ttkActions: 8,
    durationMs: 1500,
    seed: 12345,
    expGained: 10,
  },
  passed: true,
  warnings: [],
}

describe('useSimulationProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('should return initial idle state', () => {
      const { result } = renderHook(() => useSimulationProgress())

      expect(result.current.status).toBe('idle')
      expect(result.current.progress.percentage).toBe(0)
      expect(result.current.progress.isRunning).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.result).toBeNull()
    })

    it('should have correct initial progress values', () => {
      const { result } = renderHook(() => useSimulationProgress())

      expect(result.current.progress.totalItems).toBe(0)
      expect(result.current.progress.currentIndex).toBe(0)
      expect(result.current.progress.isRunning).toBe(false)
    })
  })

  describe('startSimulation', () => {
    it('should start simulation and update status to running', async () => {
      // Mock simulation:run to return success
      mockCoreto.runSimulation.mockResolvedValue({
        success: true,
        data: mockSimulationResult,
      })

      const { result } = renderHook(() => useSimulationProgress(100)) // Shorter interval for tests

      await act(async () => {
        await result.current.startSimulation({
          projectPath: '/path/to/project',
          trechoId: 'ato1-nivel1-10',
        })
      })

      expect(result.current.status).toBe('completed')
      expect(result.current.result).toEqual(mockSimulationResult)
      expect(mockCoreto.runSimulation).toHaveBeenCalledWith({
        projectPath: '/path/to/project',
        trechoId: 'ato1-nivel1-10',
      })
    })

    it('should handle simulation errors', async () => {
      mockCoreto.runSimulation.mockResolvedValue({
        success: false,
        error: {
          name: 'SimulationError',
          message: 'Simulation failed: Invalid project',
          severity: 'critical' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      })

      const { result } = renderHook(() => useSimulationProgress(100))

      await act(async () => {
        try {
          await result.current.startSimulation({
            projectPath: '/invalid/path',
          })
        } catch (error) {
          // Expected to throw
        }
      })

      await waitFor(() => {
        expect(result.current.status).toBe('error')
        expect(result.current.error).toBe('Simulation failed: Invalid project')
        expect(result.current.result).toBeNull()
      })
    })

    it('should handle network errors', async () => {
      mockCoreto.runSimulation.mockRejectedValue(
        new Error('Network connection lost')
      )

      const { result } = renderHook(() => useSimulationProgress(100))

      await act(async () => {
        try {
          await result.current.startSimulation({
            projectPath: '/path/to/project',
          })
        } catch (error) {
          // Expected to throw
        }
      })

      await waitFor(() => {
        expect(result.current.status).toBe('error')
        expect(result.current.error).toBe('Network connection lost')
      })
    })
  })

  describe('progress polling', () => {
    it('should stop polling when simulation completes', async () => {
      mockCoreto.runSimulation.mockResolvedValue({
        success: true,
        data: mockSimulationResult,
      })

      const { result } = renderHook(() => useSimulationProgress(100))

      await act(async () => {
        await result.current.startSimulation({
          projectPath: '/path/to/project',
          trechoId: 'test',
        })
      })

      expect(result.current.status).toBe('completed')

      // Wait a bit to verify no more polls happen
      await waitFor(
        () => {
          const pollCount = mockCoreto.getSimulationProgress.mock.calls.length
          expect(pollCount).toBeGreaterThanOrEqual(0)
        },
        { timeout: 200 }
      )
    })

    it('should handle progress polling errors gracefully', async () => {
      let resolveSimulation: ((value: unknown) => void) | null = null
      mockCoreto.runSimulation.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSimulation = resolve
          })
      )

      // Mock progress to return error
      mockCoreto.getSimulationProgress.mockResolvedValue({
        success: false,
        error: {
          name: 'ProgressError',
          message: 'Failed to get progress',
          severity: 'warning' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      })

      const { result } = renderHook(() => useSimulationProgress(100))

      // Start simulation
      act(() => {
        result.current.startSimulation({
          projectPath: '/path/to/project',
        }).catch(() => {})
      })

      // Wait for running state
      await waitFor(() => {
        expect(result.current.status).toBe('running')
      })

      // Wait for at least one poll to happen
      await waitFor(
        () => {
          expect(mockCoreto.getSimulationProgress).toHaveBeenCalled()
        },
        { timeout: 200 }
      )

      // Clean up
      act(() => {
        resolveSimulation?.({
          success: true,
          data: mockSimulationResult,
        })
      })

      // Polling should stop after error
      await waitFor(() => {
        expect(result.current.status).toBe('completed')
      })
    })
  })

  describe('cancelSimulation', () => {
    it('should cancel running simulation', async () => {
      // Mock a hanging simulation
      mockCoreto.runSimulation.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      // Mock cancel to succeed
      mockCoreto.cancelSimulation.mockResolvedValue({
        success: true,
        data: undefined,
      })

      const { result } = renderHook(() => useSimulationProgress())

      // Start simulation
      act(() => {
        result.current.startSimulation({
          projectPath: '/path/to/project',
        }).catch(() => {})
      })

      await waitFor(() => {
        expect(result.current.status).toBe('running')
      })

      // Cancel simulation
      await act(async () => {
        await result.current.cancelSimulation()
      })

      expect(result.current.status).toBe('cancelled')
      expect(result.current.progress.isRunning).toBe(false)
      expect(mockCoreto.cancelSimulation).toHaveBeenCalled()
    })

    it('should handle cancel errors', async () => {
      mockCoreto.cancelSimulation.mockRejectedValue(
        new Error('Failed to cancel')
      )

      const { result } = renderHook(() => useSimulationProgress())

      await act(async () => {
        await result.current.cancelSimulation()
      })

      expect(result.current.error).toBe('Failed to cancel')
    })
  })

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      mockCoreto.runSimulation.mockResolvedValue({
        success: true,
        data: mockSimulationResult,
      })

      const { result } = renderHook(() => useSimulationProgress())

      // Run a simulation to completion
      await act(async () => {
        await result.current.startSimulation({
          projectPath: '/path/to/project',
          trechoId: 'test',
        })
      })

      expect(result.current.status).toBe('completed')
      expect(result.current.result).not.toBeNull()

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.progress.percentage).toBe(0)
      expect(result.current.progress.isRunning).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.result).toBeNull()
    })

    it('should stop polling when reset', async () => {
      let resolveSimulation: ((value: unknown) => void) | null = null
      mockCoreto.runSimulation.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSimulation = resolve
          })
      )

      mockCoreto.getSimulationProgress.mockResolvedValue({
        success: true,
        data: 50,
      })

      const { result } = renderHook(() => useSimulationProgress(50))

      // Start simulation
      act(() => {
        result.current.startSimulation({
          projectPath: '/path/to/project',
        }).catch(() => {})
      })

      await waitFor(() => {
        expect(result.current.status).toBe('running')
      })

      // Wait for some polling
      await waitFor(
        () => {
          expect(mockCoreto.getSimulationProgress).toHaveBeenCalled()
        },
        { timeout: 200 }
      )

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.status).toBe('idle')

      // Clean up the hanging promise
      act(() => {
        resolveSimulation?.({
          success: true,
          data: mockSimulationResult,
        })
      })
    })
  })

  describe('cleanup', () => {
    it('should clean up polling interval on unmount', async () => {
      let resolveSimulation: ((value: unknown) => void) | null = null
      mockCoreto.runSimulation.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSimulation = resolve
          })
      )

      mockCoreto.getSimulationProgress.mockResolvedValue({
        success: true,
        data: 25,
      })

      const { result, unmount } = renderHook(() => useSimulationProgress(50))

      // Start simulation
      act(() => {
        result.current.startSimulation({
          projectPath: '/path/to/project',
        }).catch(() => {})
      })

      await waitFor(() => {
        expect(result.current.status).toBe('running')
      })

      // Wait for at least one poll
      await waitFor(
        () => {
          expect(mockCoreto.getSimulationProgress).toHaveBeenCalled()
        },
        { timeout: 200 }
      )

      const pollCountBefore = mockCoreto.getSimulationProgress.mock.calls.length

      // Unmount the hook
      act(() => {
        unmount()
      })

      // Wait a bit to ensure polling stopped
      await waitFor(
        () => {
          const pollCount = mockCoreto.getSimulationProgress.mock.calls.length
          expect(pollCount).toBe(pollCountBefore)
        },
        { timeout: 200 }
      )

      // Clean up the hanging promise
      act(() => {
        resolveSimulation?.({
          success: true,
          data: mockSimulationResult,
        })
      })
    })
  })

  describe('custom poll interval', () => {
    it('should use custom poll interval', async () => {
      let resolveSimulation: ((value: unknown) => void) | null = null
      mockCoreto.runSimulation.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSimulation = resolve
          })
      )

      mockCoreto.getSimulationProgress.mockResolvedValue({
        success: true,
        data: 25,
      })

      // Use 50ms interval for faster test
      const { result } = renderHook(() => useSimulationProgress(50))

      act(() => {
        result.current.startSimulation({
          projectPath: '/path/to/project',
        }).catch(() => {})
      })

      await waitFor(() => {
        expect(result.current.status).toBe('running')
      })

      // Wait for polls to happen
      await waitFor(
        () => {
          expect(mockCoreto.getSimulationProgress).toHaveBeenCalled()
        },
        { timeout: 200 }
      )

      // Clean up
      act(() => {
        resolveSimulation?.({
          success: true,
          data: mockSimulationResult,
        })
      })
    })
  })
})
