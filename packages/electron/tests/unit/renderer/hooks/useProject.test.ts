/**
 * useProject Hook Tests
 *
 * Tests for the useProject custom hook.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useProject } from '@/hooks/useProject'


// ============================================================================
// Test Constants
// ============================================================================

const MOCK_TIMEOUT = 100;
const MOCK_TROOPS_COUNT = 10;
const MOCK_CLASSES_COUNT = 5;
const MOCK_ENEMIES_COUNT = 15;

describe('useProject', () => {
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
  })

  describe('initial state', () => {
    it('should return initial idle state', () => {
      const { result } = renderHook(() => useProject())

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

      mockCoreto.openProject.mockResolvedValue({
        success: true,
        data: mockProjectInfo,
      })

      const { result } = renderHook(() => useProject())

      await act(async () => {
        await result.current.openProject('/path/to/project')
      })

      expect(result.current.projectInfo).toEqual(mockProjectInfo)
      expect(result.current.validation.status).toBe('valid')
      expect(result.current.validation.errors).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockCoreto.openProject).toHaveBeenCalledWith('/path/to/project')
    })

    it('should handle invalid project', async () => {
      mockCoreto.openProject.mockResolvedValue({
        success: true,
        data: {
          path: '/path/to/project',
          name: 'Invalid Project',
          isValid: false,
        },
      })

      const { result } = renderHook(() => useProject())

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
        if (mockError instanceof Error) {
          mockCoreto.openProject.mockRejectedValue(mockError)
        } else {
          mockCoreto.openProject.mockResolvedValue(mockError)
        }

        const { result } = renderHook(() => useProject())

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
      mockCoreto.openProject.mockImplementation(
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
      )

      const { result } = renderHook(() => useProject())

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
      mockCoreto.validateProject.mockResolvedValue({
        success: true,
        data: mockData,
      })

      const { result } = renderHook(() => useProject())

      await act(async () => {
        await result.current.validateProject('/path/to/project')
      })

      if (expectedStatus === 'valid' && expectedErrors.length === 0) {
        expect(result.current.projectInfo).toBeNull()
      }
      expect(result.current.validation.status).toBe(expectedStatus)
      expect(result.current.validation.errors).toEqual(expectedErrors)
      expect(result.current.validation.warnings).toEqual(expectedWarnings)
      expect(mockCoreto.validateProject).toHaveBeenCalledWith('/path/to/project')
    })
  })

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      mockCoreto.openProject.mockResolvedValue({
        success: true,
        data: {
          path: '/path/to/project',
          name: 'Test Project',
          isValid: true,
        },
      })

      const { result } = renderHook(() => useProject())

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
