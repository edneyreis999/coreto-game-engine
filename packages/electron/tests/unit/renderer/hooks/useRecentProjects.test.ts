/**
 * useRecentProjects Hook Tests
 *
 * Tests for the useRecentProjects custom hook.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useRecentProjects } from '@/hooks/useRecentProjects'


// ============================================================================
// Test Constants
// ============================================================================

const MILLIS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const DEFAULT_LIMIT = 5;

// Time constants in milliseconds
const ONE_HOUR_MS = MILLIS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
const ONE_DAY_MS = ONE_HOUR_MS * HOURS_PER_DAY;
const ONE_WEEK_MS = ONE_DAY_MS * DAYS_PER_WEEK;

describe('useRecentProjects', () => {
  let mockCoreto: any
  const mockRecentProjects = [
    {
      path: '/path/to/project1',
      name: 'Project 1',
      lastOpened: new Date(Date.now() - ONE_HOUR_MS).toISOString(), // 1 hour ago
    },
    {
      path: '/path/to/project2',
      name: 'Project 2',
      lastOpened: new Date(Date.now() - ONE_HOUR_MS * 24).toISOString(), // 1 day ago
    },
    {
      path: '/path/to/project3',
      name: 'Project 3',
      lastOpened: new Date(Date.now() - ONE_HOUR_MS * 24 * 7).toISOString(), // 1 week ago
    },
  ]

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
  })

  describe('initial state', () => {
    test.each([
      ['loading state when autoFetch is true', true, true],
      ['idle state when autoFetch is false', false, false],
    ])('should return initial %s', (_name, autoFetch, expectedLoading) => {
      if (autoFetch) {
        mockCoreto.listRecent.mockResolvedValue({
          success: true,
          data: mockRecentProjects,
        })
      }

      const { result } = renderHook(() => useRecentProjects(DEFAULT_LIMIT, autoFetch))

      expect(result.current.isLoading).toBe(expectedLoading)
      expect(result.current.recentProjects).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })

  describe('auto-fetch on mount', () => {
    it('should fetch recent projects on mount when autoFetch is true', async () => {
      mockCoreto.listRecent.mockResolvedValue({
        success: true,
        data: mockRecentProjects,
      })

      const { result } = renderHook(() => useRecentProjects(DEFAULT_LIMIT, true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.recentProjects).toEqual(mockRecentProjects)
      expect(mockCoreto.listRecent).toHaveBeenCalledWith(DEFAULT_LIMIT)
    })

    it('should handle empty recent projects list', async () => {
      mockCoreto.listRecent.mockResolvedValue({
        success: true,
        data: [],
      })

      const { result } = renderHook(() => useRecentProjects(DEFAULT_LIMIT, true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.recentProjects).toEqual([])
    })

    describe('error handling', () => {
      test.each([
        [
          'IPC error',
          {
            success: false,
            error: {
              name: 'IPCError',
              message: 'Failed to fetch recent projects',
              severity: 'critical' as const,
              context: {},
              timestamp: new Date().toISOString(),
            },
          },
          'Failed to fetch recent projects',
        ],
        [
          'network error',
          new Error('Network error'),
          'Network error',
        ],
      ] as const)('should handle %s', async (_name, mockError, expectedMessage) => {
        if (mockError instanceof Error) {
          mockCoreto.listRecent.mockRejectedValue(mockError)
        } else {
          mockCoreto.listRecent.mockResolvedValue(mockError)
        }

        const { result } = renderHook(() => useRecentProjects(DEFAULT_LIMIT, true))

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.recentProjects).toEqual([])
        expect(result.current.error).not.toBeNull()
        expect(result.current.error?.message).toBe(expectedMessage)
      })
    })
  })

  describe('addRecent', () => {
    it('should add a project to recent projects', async () => {
      mockCoreto.addRecent.mockResolvedValue({
        success: true,
        data: {
          path: '/path/to/new-project',
          name: 'New Project',
          lastOpened: new Date().toISOString(),
        },
      })

      // Mock listRecent to return updated list
      mockCoreto.listRecent.mockResolvedValue({
        success: true,
        data: [
          ...mockRecentProjects,
          {
            path: '/path/to/new-project',
            name: 'New Project',
            lastOpened: new Date().toISOString(),
          },
        ],
      })

      const { result } = renderHook(() => useRecentProjects(DEFAULT_LIMIT, false))

      await act(async () => {
        await result.current.addRecent('/path/to/new-project', 'New Project')
      })

      expect(mockCoreto.addRecent).toHaveBeenCalledWith('/path/to/new-project', 'New Project')
      expect(mockCoreto.listRecent).toHaveBeenCalled()
    })

    it('should handle errors when adding recent project', async () => {
      mockCoreto.addRecent.mockResolvedValue({
        success: false,
        error: {
          name: 'IPCError',
          message: 'Failed to add recent project',
          severity: 'critical' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      })

      const { result } = renderHook(() => useRecentProjects(DEFAULT_LIMIT, false))

      await act(async () => {
        await result.current.addRecent('/path/to/project', 'Project')
      })

      expect(result.current.error).not.toBeNull()
      expect(result.current.error?.message).toBe('Failed to add recent project')
    })
  })

  describe('refresh', () => {
    it('should refresh the recent projects list', async () => {
      mockCoreto.listRecent.mockResolvedValue({
        success: true,
        data: mockRecentProjects,
      })

      const { result } = renderHook(() => useRecentProjects(DEFAULT_LIMIT, false))

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.recentProjects).toEqual(mockRecentProjects)
      expect(mockCoreto.listRecent).toHaveBeenCalledWith(DEFAULT_LIMIT)
    })
  })

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      mockCoreto.listRecent.mockResolvedValue({
        success: true,
        data: mockRecentProjects,
      })

      const { result } = renderHook(() => useRecentProjects(DEFAULT_LIMIT, true))

      await waitFor(() => {
        expect(result.current.recentProjects).toEqual(mockRecentProjects)
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.recentProjects).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })
})
