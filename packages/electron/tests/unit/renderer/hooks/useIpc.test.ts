/**
 * useIpc Hook Tests
 *
 * Tests for the useIpc custom hook.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useIpc, useIpcWithArg } from '@/hooks/useIpc'

// Mock window.coreto API - defined in setup.renderer.ts
const mockCoreto = (global as any).mockCoreto

describe('useIpc', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('basic usage', () => {
    it('should return initial idle state', () => {
      mockCoreto.getPreferences.mockResolvedValue({
        success: true,
        data: {
          theme: 'system' as const,
          lastProjectPath: null,
        },
      })

      const { result } = renderHook(() =>
        useIpc(() => mockCoreto.getPreferences(), { invokeOnMount: false })
      )

      expect(result.current.data).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should invoke IPC call and return data on success', async () => {
      const mockData = {
        theme: 'system' as const,
        lastProjectPath: '/path/to/project',
      }

      mockCoreto.getPreferences.mockResolvedValue({
        success: true,
        data: mockData,
      })

      const { result } = renderHook(() =>
        useIpc(() => mockCoreto.getPreferences(), { invokeOnMount: true })
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBeNull()
    })

    it('should handle IPC errors', async () => {
      mockCoreto.getPreferences.mockResolvedValue({
        success: false,
        error: {
          name: 'IPCError',
          message: 'Failed to get preferences',
          severity: 'critical' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      })

      const { result } = renderHook(() =>
        useIpc(() => mockCoreto.getPreferences(), { invokeOnMount: true })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeNull()
      expect(result.current.error).not.toBeNull()
      expect(result.current.error?.message).toBe('Failed to get preferences')
    })

    it('should handle network errors', async () => {
      mockCoreto.getPreferences.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useIpc(() => mockCoreto.getPreferences(), { invokeOnMount: true })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeNull()
      expect(result.current.error).not.toBeNull()
      expect(result.current.error?.message).toBe('Network error')
    })
  })

  describe('invoke', () => {
    it('should invoke IPC call manually', async () => {
      const mockData = {
        theme: 'dark' as const,
        lastProjectPath: null,
      }

      mockCoreto.getPreferences.mockResolvedValue({
        success: true,
        data: mockData,
      })

      const { result } = renderHook(() =>
        useIpc(() => mockCoreto.getPreferences(), { invokeOnMount: false })
      )

      await act(async () => {
        await result.current.invoke()
      })

      expect(result.current.data).toEqual(mockData)
      expect(mockCoreto.getPreferences).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple invocations', async () => {
      mockCoreto.getPreferences.mockResolvedValue({
        success: true,
        data: {
          theme: 'system' as const,
          lastProjectPath: null,
        },
      })

      const { result } = renderHook(() =>
        useIpc(() => mockCoreto.getPreferences(), { invokeOnMount: false })
      )

      await act(async () => {
        await result.current.invoke()
      })

      await act(async () => {
        await result.current.invoke()
      })

      expect(result.current.data).not.toBeNull()
      expect(mockCoreto.getPreferences).toHaveBeenCalledTimes(2)
    })
  })

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      mockCoreto.getPreferences.mockResolvedValue({
        success: true,
        data: {
          theme: 'system' as const,
          lastProjectPath: null,
        },
      })

      const { result } = renderHook(() =>
        useIpc(() => mockCoreto.getPreferences(), { invokeOnMount: true })
      )

      await waitFor(() => {
        expect(result.current.data).not.toBeNull()
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.data).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })
})

describe('useIpcWithArg', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('basic usage', () => {
    it('should invoke IPC call with argument', async () => {
      const mockData = {
        path: '/path/to/project',
        name: 'Test Project',
        isValid: true,
        troopsCount: 10,
        classesCount: 5,
        enemiesCount: 15,
      }

      mockCoreto.openProject.mockResolvedValue({
        success: true,
        data: mockData,
      })

      const { result } = renderHook(() =>
        useIpcWithArg((path: string) => mockCoreto.openProject(path))
      )

      await act(async () => {
        await result.current.invoke('/path/to/project')
      })

      expect(result.current.data).toEqual(mockData)
      expect(mockCoreto.openProject).toHaveBeenCalledWith('/path/to/project')
    })

    it('should handle IPC errors with argument', async () => {
      mockCoreto.openProject.mockResolvedValue({
        success: false,
        error: {
          name: 'IPCError',
          message: 'Invalid project path',
          severity: 'critical' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      })

      const { result } = renderHook(() =>
        useIpcWithArg((path: string) => mockCoreto.openProject(path))
      )

      await act(async () => {
        await result.current.invoke('/invalid/path')
      })

      expect(result.current.data).toBeNull()
      expect(result.current.error).not.toBeNull()
      expect(result.current.error?.message).toBe('Invalid project path')
    })
  })
})
