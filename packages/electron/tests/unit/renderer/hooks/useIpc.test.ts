/**
 * useIpc Hook Tests
 *
 * Tests for the useIpc custom hook.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useIpc, useIpcWithArg } from '@/hooks/useIpc'
import { createMinimalCoretoMock } from '@/tests/helpers/factories'


// ============================================================================
// Test Constants
// ============================================================================

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
      const mockCoreto = createMinimalCoretoMock({
        getPreferences: jest.fn().mockResolvedValue({
          success: true,
          data: {
            theme: 'system' as const,
            lastProjectPath: null,
          },
        }),
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
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

      const mockCoreto = createMinimalCoretoMock({
        getPreferences: jest.fn().mockResolvedValue({
          success: true,
          data: mockData,
        }),
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
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

    describe('error handling', () => {
      test.each([
        [
          'IPC error',
          {
            success: false,
            error: {
              name: 'IPCError',
              message: 'Failed to get preferences',
              severity: 'critical' as const,
              context: {},
              timestamp: new Date().toISOString(),
            },
          },
          'Failed to get preferences',
        ],
        [
          'network error',
          new Error('Network error'),
          'Network error',
        ],
      ] as const)('should handle %s', async (_name, mockError, expectedMessage) => {
        const mockCoreto = createMinimalCoretoMock()

        if (mockError instanceof Error) {
          mockCoreto.getPreferences.mockRejectedValue(mockError)
        } else {
          mockCoreto.getPreferences.mockResolvedValue(mockError)
        }

        Object.defineProperty(window, 'coreto', {
          value: mockCoreto,
          writable: true,
        })

        const { result } = renderHook(() =>
          useIpc(() => mockCoreto.getPreferences(), { invokeOnMount: true })
        )

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.data).toBeNull()
        expect(result.current.error).not.toBeNull()
        expect(result.current.error?.message).toBe(expectedMessage)
      })
    })
  })

  describe('invoke', () => {
    it('should invoke IPC call manually', async () => {
      const mockData = {
        theme: 'dark' as const,
        lastProjectPath: null,
      }

      const mockCoreto = createMinimalCoretoMock({
        getPreferences: jest.fn().mockResolvedValue({
          success: true,
          data: mockData,
        }),
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
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
      const mockCoreto = createMinimalCoretoMock({
        getPreferences: jest.fn().mockResolvedValue({
          success: true,
          data: {
            theme: 'system' as const,
            lastProjectPath: null,
          },
        }),
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
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
      const mockCoreto = createMinimalCoretoMock({
        getPreferences: jest.fn().mockResolvedValue({
          success: true,
          data: {
            theme: 'system' as const,
            lastProjectPath: null,
          },
        }),
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
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
        troopsCount: 1,
        classesCount: 1,
        enemiesCount: 1,
      }

      const mockCoreto = createMinimalCoretoMock({
        openProject: jest.fn().mockResolvedValue({
          success: true,
          data: mockData,
        }),
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
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
      const mockCoreto = createMinimalCoretoMock({
        openProject: jest.fn().mockResolvedValue({
          success: false,
          error: {
            name: 'IPCError',
            message: 'Invalid project path',
            severity: 'critical' as const,
            context: {},
            timestamp: new Date().toISOString(),
          },
        }),
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
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
