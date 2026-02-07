import type { BrowserWindowConstructorOptions } from 'electron';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Polyfill for DIRNAME in ES modules.
 * In ES modules, __dirname is not defined globally.
 * We use a different name to avoid conflicts with Jest's __dirname.
 */
// @ts-ignore - import.meta is an ES module feature
const DIRNAME = fileURLToPath(new URL('.', import.meta.url));

/**
 * Default window dimensions matching TechSpec specifications
 */
export const DEFAULT_WINDOW_WIDTH = 1200;
export const DEFAULT_WINDOW_HEIGHT = 800;

/**
 * Creates the BrowserWindow configuration object.
 *
 * This pure function extracts window configuration logic for better testability.
 * It separates the configuration data from the side effect of creating the window.
 *
 * @param isDev - Whether the app is running in development mode
 * @returns BrowserWindow constructor options
 */
export function createWindowConfig(isDev: boolean): BrowserWindowConstructorOptions {
  return {
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    title: 'Coreto Dev Portal',
    show: false, // Don't show until ready-to-show
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(DIRNAME, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: !isDev, // Disable sandbox in development for easier debugging
    },
  };
}

/**
 * Gets the URL to load in the renderer process.
 *
 * This pure function extracts URL resolution logic for better testability.
 * It uses the ELECTRON_RENDERER_URL environment variable in development,
 * or falls back to the built renderer HTML file in production.
 *
 * @param isDev - Whether the app is running in development mode
 * @returns The URL to load in the BrowserWindow
 */
export function getWindowUrl(isDev: boolean): string {
  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    return process.env.ELECTRON_RENDERER_URL;
  }
  return `file://${join(DIRNAME, '../renderer/index.html')}`;
}
