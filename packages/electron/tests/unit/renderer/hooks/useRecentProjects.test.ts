/**
 * useRecentProjects Hook Tests
 *
 * Tests for the useRecentProjects custom hook.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useRecentProjects } from '@/hooks/useRecentProjects'

// Mock window.coreto API
const mockCoreto = global.window.coreto as jest.Mocked<typeof global.window.coreto>

describe('useRecentProjects', () => {
  const mockRecentProjects = [
    {
      path: '/path/to/project1',
      name: 'Project 1',
      lastOpened: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    },
    {
      path: '/path/to/project2',
      name: 'Project 2',
      lastOpened: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
      path: '/path/to/project3',
      name: 'Project 3',
      lastOpened: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('should return initial loading state when autoFetch is true', () => {
      mockCoreto.listRecent.mockResolvedValue({
        success: true,
        data: mockRecentProjects,
      })

      const { result } = renderHook(() => useRecentProjects(5, true))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.recentProjects).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it('should return initial idle state when autoFetch is false', () => {
      const { result } = renderHook(() => useRecentProjects(5, false))

      expect(result.current.isLoading).toBe(false)
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

      const { result } = renderHook(() => useRecentProjects(5, true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.recentProjects).toEqual(mockRecentProjects)
      expect(mockCoreto.listRecent).toHaveBeenCalledWith(5)
    })

    it('should handle empty recent projects list', async () => {
      mockCoreto.listRecent.mockResolvedValue({
        success: true,
        data: [],
      })

      const { result } = renderHook(() => useRecentProjects(5, true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.recentProjects).toEqual([])
    })

    it('should handle IPC errors on fetch', async () => {
      mockCoreto.listRecent.mockResolvedValue({
        success: false,
        error: {
          name: 'IPCError',
          message: 'Failed to fetch recent projects',
          severity: 'critical' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      })

      const { result } = renderHook(() => useRecentProjects(5, true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.recentProjects).toEqual([])
      expect(result.current.error).not.toBeNull()
      expect(result.current.error?.message).toBe('Failed to fetch recent projects')
    })

    it('should handle network errors on fetch', async () => {
      mockCoreto.listRecent.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useRecentProjects(5, true))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.recentProjects).toEqual([])
      expect(result.current.error).not.toBeNull()
      expect(result.current.error?.message).toBe('Network error')
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

      const { result } = renderHook(() => useRecentProjects(5, false))

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

      const { result } = renderHook(() => useRecentProjects(5, false))

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

      const { result } = renderHook(() => useRecentProjects(5, false))

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.recentProjects).toEqual(mockRecentProjects)
      expect(mockCoreto.listRecent).toHaveBeenCalledWith(5)
    })
  })

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      mockCoreto.listRecent.mockResolvedValue({
        success: true,
        data: mockRecentProjects,
      })

      const { result } = renderHook(() => useRecentProjects(5, true))

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
