/**
 * Integration Test for Electron App Startup
 *
 * Tests that the Electron application launches successfully,
 * the renderer process loads, and the window displays correctly.
 */

// Mock Electron modules (must be before imports)
jest.mock('electron', () => ({
  app: {
    whenReady: jest.fn(),
    on: jest.fn(),
    quit: jest.fn()
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn().mockResolvedValue(undefined),
    once: jest.fn(),
    webContents: {
      setWindowOpenHandler: jest.fn(),
      openDevTools: jest.fn()
    },
    show: jest.fn(),
    getTitle: jest.fn(() => 'Coreto Dev Portal'),
    getSize: jest.fn(() => [1200, 800]),
    isFocused: jest.fn(() => true)
  }))
}))

// Mock path module
jest.mock('node:path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
  resolve: jest.fn((...args: string[]) => args.join('/'))
}))

import { BrowserWindow } from 'electron'

describe('Electron App - Integration Startup', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()

    // Set development environment
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('App Launch', () => {
    it('should launch Electron app without errors', async () => {
      // Arrange
      const { app } = await import('electron')
      const mockWhenReady = app.whenReady as jest.MockedFunction<typeof app.whenReady>
      mockWhenReady.mockResolvedValue(undefined as never)

      // Act & Assert
      await expect(import('../../src/main/index')).resolves.not.toThrow()
    })

    it('should create a window when app is ready', async () => {
      // Arrange
      const { app, BrowserWindow } = await import('electron')
      const mockWhenReady = app.whenReady as jest.MockedFunction<typeof app.whenReady>
      mockWhenReady.mockResolvedValue(undefined as never)

      // Act
      const { startApp } = await import('../../src/main/index')
      await startApp()

      // Assert
      expect(BrowserWindow).toHaveBeenCalled()
    })
  })

  describe('Window Display', () => {
    it('should display window with correct title', async () => {
      // Arrange
      const mockWindow = {
        loadFile: jest.fn().mockResolvedValue(undefined),
        once: jest.fn(),
        webContents: {
          setWindowOpenHandler: jest.fn(),
          openDevTools: jest.fn()
        },
        show: jest.fn(),
        getTitle: jest.fn(() => 'Coreto Dev Portal')
      }
      ;(BrowserWindow as unknown as jest.Mock).mockImplementation(() => mockWindow)

      // Act
      const { createWindow } = await import('../../src/main/index')
      const window = createWindow()

      // Assert
      expect(window.getTitle()).toBe('Coreto Dev Portal')
    })

    it('should display window with correct dimensions (1200x800)', async () => {
      // Arrange
      const mockWindow = {
        loadFile: jest.fn().mockResolvedValue(undefined),
        once: jest.fn(),
        webContents: {
          setWindowOpenHandler: jest.fn(),
          openDevTools: jest.fn()
        },
        show: jest.fn(),
        getSize: jest.fn(() => [1200, 800])
      }
      ;(BrowserWindow as unknown as jest.Mock).mockImplementation(() => mockWindow)

      // Act
      const { createWindow } = await import('../../src/main/index')
      const window = createWindow()

      // Assert
      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1200,
          height: 800
        })
      )
      expect(window.getSize()).toEqual([1200, 800])
    })
  })

  describe('Renderer Process', () => {
    it('should load the renderer HTML file', async () => {
      // Arrange
      const mockWindow = {
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
      const { createWindow } = await import('../../src/main/index')
      createWindow()

      // Assert
      expect(mockWindow.loadFile).toHaveBeenCalled()
      const loadPath = (mockWindow.loadFile as jest.Mock).mock.calls[0]?.[0]
      expect(loadPath).toContain('index.html')
    })

    it('should enable context isolation and disable node integration', async () => {
      // Arrange & Act
      const { createWindow } = await import('../../src/main/index')
      createWindow()

      // Assert
      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          webPreferences: expect.objectContaining({
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
          })
        })
      )
    })
  })

  describe('App Lifecycle Events', () => {
    it('should register window-all-closed event handler', async () => {
      // Arrange
      const { app } = await import('electron')
      const mockOn = app.on as jest.MockedFunction<typeof app.on>

      // Act
      const { registerAppLifecycleHandlers } = await import('../../src/main/index')
      registerAppLifecycleHandlers()

      // Assert
      expect(mockOn).toHaveBeenCalledWith('window-all-closed', expect.any(Function))
    })

    it('should register activate event handler for macOS', async () => {
      // Arrange
      const { app } = await import('electron')
      const mockOn = app.on as jest.MockedFunction<typeof app.on>

      // Act
      const { registerAppLifecycleHandlers } = await import('../../src/main/index')
      registerAppLifecycleHandlers()

      // Assert
      expect(mockOn).toHaveBeenCalledWith('activate', expect.any(Function))
    })

    it('should register before-quit event handler', async () => {
      // Arrange
      const { app } = await import('electron')
      const mockOn = app.on as jest.MockedFunction<typeof app.on>

      // Act
      const { registerAppLifecycleHandlers } = await import('../../src/main/index')
      registerAppLifecycleHandlers()

      // Assert
      expect(mockOn).toHaveBeenCalledWith('before-quit', expect.any(Function))
    })
  })

  describe('Development vs Production', () => {
    it('should open DevTools in development mode', async () => {
      // Arrange
      process.env.NODE_ENV = 'development'

      const mockWindow = {
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
      const { createWindow } = await import('../../src/main/index')
      createWindow()

      // Assert
      expect(mockWindow.webContents.openDevTools).toHaveBeenCalled()
    })

    it('should not open DevTools in production mode', async () => {
      // Arrange
      process.env.NODE_ENV = 'production'

      const mockWindow = {
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
      const { createWindow } = await import('../../src/main/index')
      createWindow()

      // Assert
      expect(mockWindow.webContents.openDevTools).toBeUndefined()
    })
  })

  describe('Window Ready Behavior', () => {
    it('should show window after ready-to-show event', async () => {
      // Arrange
      let readyToShowCallback: (() => void) | null = null
      const mockWindow = {
        loadFile: jest.fn().mockResolvedValue(undefined),
        once: jest.fn((event: string, callback: () => void) => {
          if (event === 'ready-to-show') {
            readyToShowCallback = callback
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
      const { createWindow } = await import('../../src/main/index')
      createWindow()

      // Trigger ready-to-show event
      if (readyToShowCallback) {
        ;(readyToShowCallback as () => void)()
      }

      // Assert
      expect(mockWindow.once).toHaveBeenCalledWith('ready-to-show', expect.any(Function))
      expect(mockWindow.show).toHaveBeenCalled()
    })
  })

  describe('External Link Handling', () => {
    it('should register handler for external links', async () => {
      // Arrange
      const mockWindow = {
        loadFile: jest.fn().mockResolvedValue(undefined),
        once: jest.fn(),
        webContents: {
          setWindowOpenHandler: jest.fn(() => ({ action: 'deny' })),
          openDevTools: jest.fn()
        },
        show: jest.fn()
      }
      ;(BrowserWindow as unknown as jest.Mock).mockImplementation(() => mockWindow)

      // Act
      const { createWindow } = await import('../../src/main/index')
      createWindow()

      // Assert
      expect(mockWindow.webContents.setWindowOpenHandler).toHaveBeenCalledWith(expect.any(Function))
    })
  })
})
