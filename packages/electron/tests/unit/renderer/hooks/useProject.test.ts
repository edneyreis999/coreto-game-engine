/**
 * useProject Hook Tests
 *
 * Tests for the useProject custom hook.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useProject } from '@/hooks/useProject'
import type { CoretoAPI } from '@coreto/electron/preload/index.js'

// Extend Window interface with coreto property
declare global {
  interface Window {
    coreto: jest.Mocked<CoretoAPI>;
  }
}

// Mock window.coreto API
const mockCoreto = (window as { coreto?: jest.Mocked<Window['coreto']> }).coreto!

describe('useProject', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
        troopsCount: 10,
        classesCount: 5,
        enemiesCount: 15,
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

    it('should handle IPC errors', async () => {
      mockCoreto.openProject.mockResolvedValue({
        success: false,
        error: {
          name: 'IPCError',
          message: 'Failed to open project',
          severity: 'critical' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      })

      const { result } = renderHook(() => useProject())

      await act(async () => {
        await result.current.openProject('/path/to/project')
      })

      expect(result.current.projectInfo).toBeNull()
      expect(result.current.validation.status).toBe('invalid')
      expect(result.current.validation.errors).toEqual(['Failed to open project'])
      expect(result.current.error).not.toBeNull()
      expect(result.current.error?.message).toBe('Failed to open project')
    })

    it('should handle network errors', async () => {
      mockCoreto.openProject.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useProject())

      await act(async () => {
        await result.current.openProject('/path/to/project')
      })

      expect(result.current.projectInfo).toBeNull()
      expect(result.current.validation.status).toBe('invalid')
      expect(result.current.error).not.toBeNull()
      expect(result.current.error?.message).toBe('Network error')
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
            }, 100)
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
    it('should validate a valid project successfully', async () => {
      mockCoreto.validateProject.mockResolvedValue({
        success: true,
        data: {
          isValid: true,
          errors: [],
          warnings: [],
        },
      })

      const { result } = renderHook(() => useProject())

      await act(async () => {
        await result.current.validateProject('/path/to/project')
      })

      expect(result.current.projectInfo).toBeNull()
      expect(result.current.validation.status).toBe('valid')
      expect(result.current.validation.errors).toEqual([])
      expect(result.current.validation.warnings).toEqual([])
      expect(mockCoreto.validateProject).toHaveBeenCalledWith('/path/to/project')
    })

    it('should validate an invalid project with errors', async () => {
      mockCoreto.validateProject.mockResolvedValue({
        success: true,
        data: {
          isValid: false,
          errors: ['game.rmmzproject not found', 'data directory not found'],
          warnings: [],
        },
      })

      const { result } = renderHook(() => useProject())

      await act(async () => {
        await result.current.validateProject('/path/to/project')
      })

      expect(result.current.validation.status).toBe('invalid')
      expect(result.current.validation.errors).toEqual([
        'game.rmmzproject not found',
        'data directory not found',
      ])
    })

    it('should validate with warnings', async () => {
      mockCoreto.validateProject.mockResolvedValue({
        success: true,
        data: {
          isValid: true,
          errors: [],
          warnings: ['Some data files may be corrupt'],
        },
      })

      const { result } = renderHook(() => useProject())

      await act(async () => {
        await result.current.validateProject('/path/to/project')
      })

      expect(result.current.validation.status).toBe('valid')
      expect(result.current.validation.warnings).toEqual(['Some data files may be corrupt'])
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
