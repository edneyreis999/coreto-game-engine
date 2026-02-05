/**
 * Unit Tests for Main Process Entry Point
 *
 * Tests window creation, app lifecycle, and environment detection.
 */

// Mock Electron modules (must be before imports)
jest.mock('electron', () => ({
  app: {
    whenReady: jest.fn(),
    on: jest.fn(),
    quit: jest.fn()
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn().mockResolvedValue(undefined),
    loadFile: jest.fn().mockResolvedValue(undefined),
    once: jest.fn(),
    webContents: {
      setWindowOpenHandler: jest.fn(),
      openDevTools: jest.fn()
    },
    show: jest.fn()
  }))
}))

// Mock path module
jest.mock('node:path', () => ({
  join: jest.fn((...args: string[]) => args.join('/'))
}))

import { BrowserWindow } from 'electron'
import { createWindow, mainWindow } from '../../../src/main/index'

describe('Main Process - index', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    // Reset mainWindow to null
    ;(global as unknown as { mainWindow: typeof mainWindow }).mainWindow = null
  })

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks()
  })

  describe('createWindow', () => {
    it('should create a BrowserWindow with correct dimensions and properties', () => {
      // Act
      createWindow()

      // Assert
      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1200,
          height: 800,
          title: 'Coreto Dev Portal',
          show: false,
          autoHideMenuBar: true,
          webPreferences: expect.objectContaining({
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
          })
        })
      )
    })

    it('should load the renderer process from the correct path', () => {
      // Arrange
      const mockWindow = {
        loadURL: jest.fn().mockResolvedValue(undefined),
        loadFile: jest.fn().mockResolvedValue(undefined),
        once: jest.fn(),
        webContents: {
          setWindowOpenHandler: jest.fn(),
          openDevTools: jest.fn()
        },
        show: jest.fn()
      }
      ;(BrowserWindow as unknown as jest.Mock).mockImplementation(() => mockWindow)

      // Act
      createWindow()

      // Assert
      expect(mockWindow.loadFile).toHaveBeenCalled()
    })

    it('should open DevTools in development mode', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const mockWindow = {
        loadURL: jest.fn().mockResolvedValue(undefined),
        loadFile: jest.fn().mockResolvedValue(undefined),
        once: jest.fn(),
        webContents: {
          setWindowOpenHandler: jest.fn(),
          openDevTools: jest.fn()
        },
        show: jest.fn()
      }
      ;(BrowserWindow as unknown as jest.Mock).mockImplementation(() => mockWindow)

      // Act
      createWindow()

      // Assert
      expect(mockWindow.webContents.openDevTools).toHaveBeenCalled()

      // Cleanup
      process.env.NODE_ENV = originalEnv
    })

    it('should register ready-to-show handler to display window', () => {
      // Arrange
      const mockWindow = {
        loadFile: jest.fn().mockResolvedValue(undefined),
        once: jest.fn((event: string, callback: () => void) => {
          if (event === 'ready-to-show') {
            callback()
          }
        }),
        webContents: {
          setWindowOpenHandler: jest.fn(),
          openDevTools: jest.fn()
        },
        show: jest.fn()
      }
      ;(BrowserWindow as unknown as jest.Mock).mockImplementation(() => mockWindow)

      // Act
      createWindow()

      // Assert
      expect(mockWindow.once).toHaveBeenCalledWith('ready-to-show', expect.any(Function))
      expect(mockWindow.show).toHaveBeenCalled()
    })

    it('should set external link handler to open in default browser', () => {
      // Arrange
      const mockWindow = {
        loadURL: jest.fn().mockResolvedValue(undefined),
        loadFile: jest.fn().mockResolvedValue(undefined),
        once: jest.fn(),
        webContents: {
          setWindowOpenHandler: jest.fn(),
          openDevTools: jest.fn()
        },
        show: jest.fn()
      }
      ;(BrowserWindow as unknown as jest.Mock).mockImplementation(() => mockWindow)

      // Act
      createWindow()

      // Assert
      expect(mockWindow.webContents.setWindowOpenHandler).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should return the created BrowserWindow instance', () => {
      // Act
      const result = createWindow()

      // Assert
      expect(result).toBeDefined()
      expect(BrowserWindow).toHaveBeenCalled()
      expect(result).toEqual(expect.any(Object))
    })
  })

  describe('Environment Detection', () => {
    it('should detect development environment', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const mockWindow = {
        loadURL: jest.fn().mockResolvedValue(undefined),
        loadFile: jest.fn().mockResolvedValue(undefined),
        once: jest.fn(),
        webContents: {
          setWindowOpenHandler: jest.fn(),
          openDevTools: jest.fn()
        },
        show: jest.fn()
      }
      ;(BrowserWindow as unknown as jest.Mock).mockImplementation(() => mockWindow)

      // Act
      createWindow()

      // Assert
      expect(mockWindow.webContents.openDevTools).toHaveBeenCalled()

      // Cleanup
      process.env.NODE_ENV = originalEnv
    })

    it('should handle production environment', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const mockWindow = {
        loadURL: jest.fn().mockResolvedValue(undefined),
        loadFile: jest.fn().mockResolvedValue(undefined),
        once: jest.fn(),
        webContents: {
          setWindowOpenHandler: jest.fn(),
          openDevTools: undefined
        },
        show: jest.fn()
      }
      ;(BrowserWindow as unknown as jest.Mock).mockImplementation(() => mockWindow)

      // Act
      createWindow()

      // Assert
      // In production, DevTools should not be opened
      expect(mockWindow.webContents.openDevTools).toBeUndefined()

      // Cleanup
      process.env.NODE_ENV = originalEnv
    })
  })
})
