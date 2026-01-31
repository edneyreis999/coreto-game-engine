/**
 * Unit Tests for Preload Script
 *
 * Tests context isolation verification and IPC exposure to renderer process.
 */

// Make this file an external module for global augmentations
export {}

// Mock process.contextIsolated
// Note: contextIsolated is already defined by Electron types as readonly boolean
// We use Object.defineProperty to override it for testing purposes
Object.defineProperty(process, 'contextIsolated', {
  value: true,
  writable: true,
  configurable: true
})

// Mock modules before importing
const mockExposeInMainWorld = jest.fn()

jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: mockExposeInMainWorld
  },
  ipcRenderer: jest.fn()
}))

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

// Import initializePreload function AFTER mocks are set up
import { initializePreload } from '@coreto/electron/preload/index.js'

describe('Preload Script - index', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    // Reset context isolation
    Object.defineProperty(process, 'contextIsolated', {
      value: true,
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Context Isolation', () => {
    it('should verify context isolation is enabled', () => {
      // Assert
      expect(process.contextIsolated).toBe(true)
    })

    it('should expose electronAPI via contextBridge when context is isolated', () => {
      // Act
      initializePreload()

      // Assert
      expect(mockExposeInMainWorld).toHaveBeenCalledWith(
        'electron',
        expect.any(Object)
      )
    })

    it('should expose coretoAPI via contextBridge when context is isolated', () => {
      // Act
      initializePreload()

      // Assert
      expect(mockExposeInMainWorld).toHaveBeenCalledWith(
        'coreto',
        expect.any(Object)
      )
    })

    it('should log warning when context isolation is disabled', () => {
      // Arrange
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      Object.defineProperty(process, 'contextIsolated', {
        value: false,
        writable: true,
        configurable: true
      })

      // Act
      initializePreload()

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Context isolation is not enabled')
      )

      // Cleanup
      consoleWarnSpy.mockRestore()
    })

    it('should log error when context bridge exposure fails', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockExposeInMainWorld.mockImplementationOnce(() => {
        throw new Error('Context bridge error')
      })

      // Act
      initializePreload()

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to expose context bridge APIs'),
        expect.any(Error)
      )

      // Cleanup
      consoleErrorSpy.mockRestore()
    })
  })

  describe('IPC Exposure', () => {
    it('should expose electronAPI with ipcRenderer', () => {
      // Act
      initializePreload()

      // Assert
      const electronCall = mockExposeInMainWorld.mock.calls.find(
        call => call[0] === 'electron'
      )
      expect(electronCall).toBeDefined()
      expect(electronCall?.[1]).toHaveProperty('ipcRenderer')
    })

    it('should expose coretoAPI with simulation functions', () => {
      // Act
      initializePreload()

      // Assert
      const coretoCall = mockExposeInMainWorld.mock.calls.find(
        call => call[0] === 'coreto'
      )
      expect(coretoCall).toBeDefined()

      const api = coretoCall?.[1]

      // Verificar funções críticas adicionadas nas Tasks 02-04
      expect(api).toHaveProperty('startSimulation')
      expect(api).toHaveProperty('cancelSimulation')
      expect(api).toHaveProperty('onProgress')
      expect(api).toHaveProperty('onComplete')
      expect(api).toHaveProperty('onError')
      expect(api).toHaveProperty('loadConfig')
      expect(api).toHaveProperty('getSimulationResults')
      expect(api).toHaveProperty('getSimulationProgress')
      expect(api).toHaveProperty('openProject')
      expect(api).toHaveProperty('validateProject')
    })

    it('should call exposeInMainWorld twice (once for electron, once for coreto)', () => {
      // Act
      initializePreload()

      // Assert
      expect(mockExposeInMainWorld).toHaveBeenCalledTimes(2)
    })
  })

  describe('Security Features', () => {
    it('should not expose Node.js APIs directly to renderer', () => {
      // Act
      initializePreload()

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

    it('should use contextBridge for all renderer APIs', () => {
      // Act
      initializePreload()

      // Assert
      // All APIs should be exposed via contextBridge
      expect(mockExposeInMainWorld).toHaveBeenCalled()
    })
  })
})
