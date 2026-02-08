/**
 * useIpc Hook Tests
 *
 * Tests for the useIpc custom hook.
 *
 * Parameterized Test Pattern:
 * This file uses Jest's test.each for data-driven testing to reduce code duplication.
 * Pattern: test.each<[name, param1, param2, ...]>(table)('%s', async (name, param1, param2, ...) => { ... })
 *
 * Benefits:
 * - Reduced test code duplication (~30% reduction)
 * - Easier to extend (add new test cases to table)
 * - Clear test intent through table structure
 * - Consistent test structure for similar scenarios
 *
 * Usage:
 * 1. Define test table with [description, input1, input2, ... expected] tuples
 * 2. Use %s placeholder in test name for description interpolation
 * 3. Access parameters in test callback in table order
 * 4. Add assertions that work across all parameter combinations
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useIpc, useIpcWithArg } from '@/hooks/useIpc'
import { createMinimalCoretoMock } from '@/tests/helpers/mocks/coreto-mock.factory'


// ============================================================================
// Test Constants
// ============================================================================

describe('useIpc', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('basic usage', () => {
    it('should return initial idle state', () => {
      const mockCoreto = createMinimalCoretoMock({
        preferences: { get: jest.fn().mockResolvedValue({
          success: true,
          data: {
            theme: 'system' as const,
            lastProjectPath: null,
          },
        }),
        },
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() =>
        useIpc(() => mockCoreto.preferences.get(), { invokeOnMount: false })
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
        preferences: { get: jest.fn().mockResolvedValue({
          success: true,
          data: mockData,
        }),
        },
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() =>
        useIpc(() => mockCoreto.preferences.get(), { invokeOnMount: true })
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
          mockCoreto.preferences.get.mockRejectedValue(mockError)
        } else {
          mockCoreto.preferences.get.mockResolvedValue(mockError)
        }

        Object.defineProperty(window, 'coreto', {
          value: mockCoreto,
          writable: true,
        })

        const { result } = renderHook(() =>
          useIpc(() => mockCoreto.preferences.get(), { invokeOnMount: true })
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
    // Parameterized tests for invoke behavior
    // Pattern: [description, invokeCount, expectedCallCount]
    test.each([
      ['single invocation', 1, 1],
      ['multiple invocations', 2, 2],
    ] as const)('should handle %s', async (_description, invokeCount, expectedCallCount) => {
      const mockCoreto = createMinimalCoretoMock({
        preferences: { get: jest.fn().mockResolvedValue({
          success: true,
          data: {
            theme: 'system' as const,
            lastProjectPath: null,
          },
        }),
        },
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() =>
        useIpc(() => mockCoreto.preferences.get(), { invokeOnMount: false })
      )

      // Invoke the specified number of times
      for (let i = 0; i < invokeCount; i++) {
        await act(async () => {
          await result.current.invoke()
        })
      }

      expect(result.current.data).not.toBeNull()
      expect(mockCoreto.preferences.get).toHaveBeenCalledTimes(expectedCallCount)
    })
  })

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      const mockCoreto = createMinimalCoretoMock({
        preferences: { get: jest.fn().mockResolvedValue({
          success: true,
          data: {
            theme: 'system' as const,
            lastProjectPath: null,
          },
        }),
        },
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() =>
        useIpc(() => mockCoreto.preferences.get(), { invokeOnMount: true })
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
    // Parameterized tests for IPC calls with arguments
    // Pattern: [description, mockResponse, testPath, expectedDataOrNull, expectedErrorOrNull]
    test.each([
      [
        'successful IPC call with argument',
        {
          success: true,
          data: {
            path: '/path/to/project',
            name: 'Test Project',
            isValid: true,
            troopsCount: 1,
            classesCount: 1,
            enemiesCount: 1,
          },
        },
        '/path/to/project',
        {
          path: '/path/to/project',
          name: 'Test Project',
          isValid: true,
          troopsCount: 1,
          classesCount: 1,
          enemiesCount: 1,
        },
        null,
      ],
      [
        'IPC error with argument',
        {
          success: false,
          error: {
            name: 'IPCError',
            message: 'Invalid project path',
            severity: 'critical' as const,
            context: {},
            timestamp: new Date().toISOString(),
          },
        },
        '/invalid/path',
        null,
        'Invalid project path',
      ],
    ] as const)(
      'should handle %s',
      async (_description, mockResponse, testPath, expectedData, expectedError) => {
        const mockCoreto = createMinimalCoretoMock({
          project: { open: jest.fn().mockResolvedValue(mockResponse) },
        })

        Object.defineProperty(window, 'coreto', {
          value: mockCoreto,
          writable: true,
        })

        const { result } = renderHook(() =>
          useIpcWithArg((path: string) => mockCoreto.project.open(path))
        )

        await act(async () => {
          await result.current.invoke(testPath)
        })

        if (expectedError) {
          expect(result.current.data).toBeNull()
          expect(result.current.error).not.toBeNull()
          expect(result.current.error?.message).toBe(expectedError)
        } else {
          expect(result.current.data).toEqual(expectedData)
          expect(result.current.error).toBeNull()
        }
        expect(mockCoreto.project.open).toHaveBeenCalledWith(testPath)
      }
    )
  })
})
