/**
 * useProject Hook Tests
 *
 * Tests for the useProject custom hook.
 */

import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useProject } from '@/hooks/useProject'
import { ProjectProvider } from '@/contexts/ProjectContext'
import { createMinimalCoretoMock } from '@/tests/helpers/mocks/coreto-mock.factory'


// ============================================================================
// Test Constants
// ============================================================================

const MOCK_TIMEOUT = 100;
const MOCK_TROOPS_COUNT = 10;
const MOCK_CLASSES_COUNT = 5;
const MOCK_ENEMIES_COUNT = 15;

// ============================================================================
// Test Wrapper
// ============================================================================

/**
 * Wrapper component that provides ProjectProvider for tests.
 */
function wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return React.createElement(ProjectProvider, null, children)
}

describe('useProject', () => {
  describe('initial state', () => {
    it('should return initial idle state', () => {
      const mockCoreto = createMinimalCoretoMock()

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() => useProject(), { wrapper })

      expect(result.current.projectInfo).toBeNull()
      expect(result.current.validation.status).toBe('idle')
      expect(result.current.validation.errors).toEqual([])
      expect(result.current.validation.warnings).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('openProject', () => {
    it('should open a valid project successfully', async () => {
      const mockProjectInfo = {
        path: '/path/to/project',
        name: 'Test Project',
        isValid: true,
        troopsCount: 1,
        classesCount: 1,
        enemiesCount: 1,
      }

      const mockCoreto = createMinimalCoretoMock({
        project: {
          open: jest.fn().mockResolvedValue({
            success: true,
            data: mockProjectInfo,
          }),
        },
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() => useProject(), { wrapper })

      await act(async () => {
        await result.current.openProject('/path/to/project')
      })

      expect(result.current.projectInfo).toEqual(mockProjectInfo)
      expect(result.current.validation.status).toBe('valid')
      expect(result.current.validation.errors).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockCoreto.project.open).toHaveBeenCalledWith('/path/to/project')
    })

    it('should handle invalid project', async () => {
      const mockCoreto = createMinimalCoretoMock({
        project: {
          open: jest.fn().mockResolvedValue({
            success: true,
            data: {
              path: '/path/to/project',
              name: 'Invalid Project',
              isValid: false,
            },
          }),
        },
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() => useProject(), { wrapper })

      await act(async () => {
        await result.current.openProject('/path/to/project')
      })

      expect(result.current.projectInfo).not.toBeNull()
      expect(result.current.validation.status).toBe('invalid')
      expect(result.current.validation.errors).toEqual(['Project is not valid'])
    })

    describe('error handling', () => {
      test.each([
        [
          'IPC error',
          {
            success: false,
            error: {
              name: 'IPCError',
              message: 'Failed to open project',
              severity: 'critical' as const,
              context: {},
              timestamp: new Date().toISOString(),
            },
          },
          'Failed to open project',
        ],
        [
          'network error',
          new Error('Network error'),
          'Network error',
        ],
      ] as const)('should handle %s', async (_name, mockError, expectedMessage) => {
        const mockCoreto = createMinimalCoretoMock()

        if (mockError instanceof Error) {
          mockCoreto.project.open.mockRejectedValue(mockError)
        } else {
          mockCoreto.project.open.mockResolvedValue(mockError)
        }

        Object.defineProperty(window, 'coreto', {
          value: mockCoreto,
          writable: true,
        })

        const { result } = renderHook(() => useProject(), { wrapper })

        await act(async () => {
          await result.current.openProject('/path/to/project')
        })

        expect(result.current.projectInfo).toBeNull()
        expect(result.current.validation.status).toBe('invalid')
        expect(result.current.error).not.toBeNull()
        expect(result.current.error?.message).toBe(expectedMessage)
      })
    })

    it('should set loading state during openProject call', async () => {
      const mockCoreto = createMinimalCoretoMock({
        project: {
          open: jest.fn().mockImplementation(
            () =>
              new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    success: true,
                    data: {
                      path: '/path/to/project',
                      name: 'Test Project',
                      isValid: true,
                    },
                  })
                }, MOCK_TIMEOUT)
              })
          ),
        },
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() => useProject(), { wrapper })

      act(() => {
        result.current.openProject('/path/to/project')
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('validateProject', () => {
    test.each([
      [
        'a valid project successfully',
        {
          isValid: true,
          errors: [],
          warnings: [],
        },
        'valid',
        [],
        [],
      ],
      [
        'an invalid project with errors',
        {
          isValid: false,
          errors: ['game.rmmzproject not found', 'data directory not found'],
          warnings: [],
        },
        'invalid',
        ['game.rmmzproject not found', 'data directory not found'],
        [],
      ],
      [
        'with warnings',
        {
          isValid: true,
          errors: [],
          warnings: ['Some data files may be corrupt'],
        },
        'valid',
        [],
        ['Some data files may be corrupt'],
      ],
    ])('should validate %s', async (_name, mockData, expectedStatus, expectedErrors, expectedWarnings) => {
      const mockCoreto = createMinimalCoretoMock({
        project: {
          validate: jest.fn().mockResolvedValue({
            success: true,
            data: mockData,
          }),
        },
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() => useProject(), { wrapper })

      await act(async () => {
        await result.current.validateProject('/path/to/project')
      })

      if (expectedStatus === 'valid' && expectedErrors.length === 0) {
        expect(result.current.projectInfo).toBeNull()
      }
      expect(result.current.validation.status).toBe(expectedStatus)
      expect(result.current.validation.errors).toEqual(expectedErrors)
      expect(result.current.validation.warnings).toEqual(expectedWarnings)
      expect(mockCoreto.project.validate).toHaveBeenCalledWith('/path/to/project')
    })
  })

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      const mockCoreto = createMinimalCoretoMock({
        project: {
          open: jest.fn().mockResolvedValue({
            success: true,
            data: {
              path: '/path/to/project',
              name: 'Test Project',
              isValid: true,
            },
          }),
        },
      })

      Object.defineProperty(window, 'coreto', {
        value: mockCoreto,
        writable: true,
      })

      const { result } = renderHook(() => useProject(), { wrapper })

      await act(async () => {
        await result.current.openProject('/path/to/project')
      })

      expect(result.current.validation.status).toBe('valid')

      act(() => {
        result.current.reset()
      })

      expect(result.current.projectInfo).toBeNull()
      expect(result.current.validation.status).toBe('idle')
      expect(result.current.validation.errors).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })
})

describe('useProject utility functions', () => {
  describe('isValidStatus', () => {
    it('should return true for valid status', () => {
      // This would be tested if we export the utility functions
      // For now, they're internal to the hook
    })
  })

  describe('getValidationMessage', () => {
    // Would test getValidationMessage if exported
  })
})
