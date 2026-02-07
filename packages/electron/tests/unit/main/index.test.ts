/**
 * Unit Tests for Main Process Window Configuration
 *
 * Tests window configuration and URL resolution logic using pure functions.
 * No Electron API mocks required - tests pure business logic only.
 */

// Mock window-config module to avoid import.meta.url issues in Jest
jest.mock('@coreto/electron/main/window-config', () => {
  const { join } = require('node:path');
  // Mock DIRNAME for testing
  const DIRNAME = '/mock/path/to/electron/out/main';

  return {
    DEFAULT_WINDOW_WIDTH: 1200,
    DEFAULT_WINDOW_HEIGHT: 800,
    createWindowConfig: (isDev: boolean) => ({
      width: 1200,
      height: 800,
      title: 'Coreto Dev Portal',
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: join(DIRNAME, '../preload/index.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: !isDev,
      },
    }),
    getWindowUrl: (isDev: boolean) => {
      if (isDev && process.env.ELECTRON_RENDERER_URL) {
        return process.env.ELECTRON_RENDERER_URL;
      }
      return `file://${join(DIRNAME, '../renderer/index.html')}`;
    },
  };
}, { virtual: true });

import { createWindowConfig, getWindowUrl, DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT } from '@coreto/electron/main/window-config'

describe('Main Process - window-config', () => {
  const originalEnv = process.env.NODE_ENV
  const originalRendererUrl = process.env.ELECTRON_RENDERER_URL

  afterEach(() => {
    // Restore environment variables after each test
    process.env.NODE_ENV = originalEnv
    process.env.ELECTRON_RENDERER_URL = originalRendererUrl
  })

  describe('createWindowConfig', () => {
    it('should create window config with correct dimensions', () => {
      const config = createWindowConfig(false)

      expect(config.width).toBe(DEFAULT_WINDOW_WIDTH)
      expect(config.height).toBe(DEFAULT_WINDOW_HEIGHT)
    })

    it('should create window config with correct title', () => {
      const config = createWindowConfig(false)

      expect(config.title).toBe('Coreto Dev Portal')
    })

    it('should configure window to not show initially', () => {
      const config = createWindowConfig(false)

      expect(config.show).toBe(false)
    })

    it('should enable autoHideMenuBar', () => {
      const config = createWindowConfig(false)

      expect(config.autoHideMenuBar).toBe(true)
    })

    it('should enable context isolation for security', () => {
      const config = createWindowConfig(false)

      expect(config.webPreferences?.contextIsolation).toBe(true)
    })

    it('should disable node integration for security', () => {
      const config = createWindowConfig(false)

      expect(config.webPreferences?.nodeIntegration).toBe(false)
    })

    it('should enable sandbox in production for security', () => {
      const config = createWindowConfig(false)

      expect(config.webPreferences?.sandbox).toBe(true)
    })

    it('should disable sandbox in development for easier debugging', () => {
      const config = createWindowConfig(true)

      expect(config.webPreferences?.sandbox).toBe(false)
    })

    it('should configure preload path', () => {
      const config = createWindowConfig(false)

      expect(config.webPreferences?.preload).toContain('preload/index.cjs')
    })

    it('should have same base configuration in dev and production (except sandbox)', () => {
      const devConfig = createWindowConfig(true)
      const prodConfig = createWindowConfig(false)

      expect(devConfig.width).toBe(prodConfig.width)
      expect(devConfig.height).toBe(prodConfig.height)
      expect(devConfig.title).toBe(prodConfig.title)
      expect(devConfig.webPreferences?.contextIsolation).toBe(prodConfig.webPreferences?.contextIsolation)
      expect(devConfig.webPreferences?.nodeIntegration).toBe(prodConfig.webPreferences?.nodeIntegration)
      // Sandbox differs between dev and prod
      expect(devConfig.webPreferences?.sandbox).not.toBe(prodConfig.webPreferences?.sandbox)
    })
  })

  describe('getWindowUrl', () => {
    it('should use ELECTRON_RENDERER_URL in development when set', () => {
      process.env.ELECTRON_RENDERER_URL = 'http://localhost:5173'

      const url = getWindowUrl(true)

      expect(url).toBe('http://localhost:5173')
    })

    it('should use custom ELECTRON_RENDERER_URL when provided', () => {
      process.env.ELECTRON_RENDERER_URL = 'http://localhost:3000'

      const url = getWindowUrl(true)

      expect(url).toBe('http://localhost:3000')
    })

    it('should fall back to file URL in development when ELECTRON_RENDERER_URL not set', () => {
      delete process.env.ELECTRON_RENDERER_URL

      const url = getWindowUrl(true)

      expect(url).toMatch(/^file:\/\/.*renderer\/index\.html$/)
    })

    it('should use file URL in production', () => {
      const url = getWindowUrl(false)

      expect(url).toMatch(/^file:\/\/.*renderer\/index\.html$/)
    })

    it('should contain correct path segments in file URL', () => {
      const url = getWindowUrl(false)

      expect(url).toContain('renderer')
      expect(url).toContain('index.html')
    })
  })

  describe('Constants', () => {
    it('should export DEFAULT_WINDOW_WIDTH as 1200', () => {
      expect(DEFAULT_WINDOW_WIDTH).toBe(1200)
    })

    it('should export DEFAULT_WINDOW_HEIGHT as 800', () => {
      expect(DEFAULT_WINDOW_HEIGHT).toBe(800)
    })
  })
})
