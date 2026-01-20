/**
 * Unit Tests for Preload Script
 *
 * Tests context isolation verification and IPC exposure to renderer process.
 */

// Make this file an external module for global augmentations
export {}

// Mock Electron modules (must be before imports)
const mockExposeInMainWorld = jest.fn()
jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: mockExposeInMainWorld
  },
  ipcRenderer: jest.fn()
}))

// Mock @electron-toolkit/preload
jest.mock('@electron-toolkit/preload', () => ({
  electronAPI: {
    ipcRenderer: {
      on: jest.fn(),
      once: jest.fn(),
      send: jest.fn(),
      invoke: jest.fn(),
      removeAllListeners: jest.fn()
    }
  }
}))

// Extend Process type to include contextIsolated (Electron-specific property)
declare global {
  namespace NodeJS {
    interface Process {
      contextIsolated?: boolean
    }
  }
}

// Mock process.contextIsolated
const mockContextIsolated = true
Object.defineProperty(process, 'contextIsolated', {
  value: mockContextIsolated,
  writable: true,
  configurable: true
})

describe('Preload Script - index', () => {
  beforeEach(() => {
    // Reset modules to force fresh require
    jest.resetModules()
    // Reset mocks before each test
    jest.clearAllMocks()
    // Reset context isolation
    Object.defineProperty(process, 'contextIsolated', {
      value: true,
      writable: true,
      configurable: true
    })
    // Reset the mock function
    mockExposeInMainWorld.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Context Isolation', () => {
    it('should verify context isolation is enabled', () => {
      // Assert
      expect(process.contextIsolated).toBe(true)
    })

    it('should expose electronAPI via contextBridge when context is isolated', async () => {
      // Act
      require('../../../src/preload/index')

      // Assert
      expect(mockExposeInMainWorld).toHaveBeenCalledWith(
        'electron',
        expect.any(Object)
      )
    })

    it('should expose coretoAPI via contextBridge when context is isolated', async () => {
      // Act
      require('../../../src/preload/index')

      // Assert
      expect(mockExposeInMainWorld).toHaveBeenCalledWith(
        'coreto',
        expect.any(Object)
      )
    })

    it('should log warning when context isolation is disabled', async () => {
      // Arrange
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      Object.defineProperty(process, 'contextIsolated', {
        value: false,
        writable: true,
        configurable: true
      })
      mockExposeInMainWorld.mockClear()

      // Act
      require('../../../src/preload/index')

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Context isolation is not enabled')
      )

      // Cleanup
      consoleWarnSpy.mockRestore()
    })

    it('should log error when context bridge exposure fails', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockExposeInMainWorld.mockImplementation(() => {
        throw new Error('Context bridge error')
      })
      mockExposeInMainWorld.mockClear()

      // Act
      require('../../../src/preload/index')

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to expose context bridge APIs'),
        expect.any(Error)
      )

      // Cleanup
      consoleErrorSpy.mockRestore()
      mockExposeInMainWorld.mockImplementation(() => {}) // Reset to safe implementation
    })
  })

  describe('IPC Exposure', () => {
    it('should expose electronAPI with ipcRenderer', async () => {
      // Act
      require('../../../src/preload/index')

      // Assert
      const electronCall = mockExposeInMainWorld.mock.calls.find(
        call => call[0] === 'electron'
      )
      expect(electronCall).toBeDefined()
      expect(electronCall?.[1]).toHaveProperty('ipcRenderer')
    })

    it('should expose coretoAPI placeholder for future IPC handlers', async () => {
      // Act
      require('../../../src/preload/index')

      // Assert
      const coretoCall = mockExposeInMainWorld.mock.calls.find(
        call => call[0] === 'coreto'
      )
      expect(coretoCall).toBeDefined()
      expect(coretoCall?.[1]).toEqual({})
    })

    it('should call exposeInMainWorld twice (once for electron, once for coreto)', async () => {
      // Act
      require('../../../src/preload/index')

      // Assert
      expect(mockExposeInMainWorld).toHaveBeenCalledTimes(2)
    })
  })

  describe('Security Features', () => {
    it('should not expose Node.js APIs directly to renderer', async () => {
      // Act
      require('../../../src/preload/index')

      // Assert
      // Verify that we're not exposing Node.js modules directly
      const electronCall = mockExposeInMainWorld.mock.calls.find(
        call => call[0] === 'electron'
      )
      const exposedAPI = electronCall?.[1]

      // Should have ipcRenderer (from @electron-toolkit/preload)
      expect(exposedAPI).toHaveProperty('ipcRenderer')

      // Should NOT have direct Node.js modules like 'fs', 'path', etc.
      expect(exposedAPI).not.toHaveProperty('fs')
      expect(exposedAPI).not.toHaveProperty('path')
      expect(exposedAPI).not.toHaveProperty('child_process')
    })

    it('should use contextBridge for all renderer APIs', async () => {
      // Act
      require('../../../src/preload/index')

      // Assert
      // All APIs should be exposed via contextBridge
      expect(mockExposeInMainWorld).toHaveBeenCalled()
    })
  })
})
