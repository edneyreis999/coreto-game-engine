/**
 * Jest Test Setup for Renderer Process
 *
 * Sets up global test environment configuration for React renderer tests.
 * Mocks window.coreto API and Electron APIs.
 */

// Reference global type declarations (CoretoAPI for source files)
/// <reference path="../src/renderer/src/types/preload.d.ts" />
/// <reference path="../src/renderer/src/window.coreto.d.ts" />

// Import jest-dom matchers
import '@testing-library/jest-dom'

// Import CoretoAPI type for proper mock typing
import type { CoretoAPI } from '../src/renderer/src/types/preload'

// Set NODE_ENV to test for all tests
process.env.NODE_ENV = 'test';

// Mock window.coreto API
(global as any).window = (global as any).window || {};

// Mock window.electron.ipcRenderer for dialog:openDirectory
Object.defineProperty(global.window, 'electron', {
  value: {
    ipcRenderer: {
      invoke: jest.fn(),
    },
  },
  writable: true,
  configurable: true,
})

// Mock window.coreto API with segregated structure (matches Task #8 refactoring)
const mockCoretoAPI = {
  // Project API
  project: {
    open: jest.fn(),
    validate: jest.fn(),
  },

  // Simulation API
  simulation: {
    // Event listener functions - return cleanup function
    onProgress: jest.fn(() => jest.fn()),
    onComplete: jest.fn(() => jest.fn()),
    onError: jest.fn(() => jest.fn()),

    // Commands
    start: jest.fn(),
    cancel: jest.fn(),
    getResults: jest.fn(),
    getProgress: jest.fn(),
    run: jest.fn(), // Legacy
  },

  // Config API
  config: {
    save: jest.fn(),
    load: jest.fn(),
    getTrechos: jest.fn(),
    updateTrecho: jest.fn(),
    deleteTrecho: jest.fn(),
    updateGlobalSettings: jest.fn(),
  },

  // Data API
  data: {
    getTroops: jest.fn(),
    getClasses: jest.fn(),
    getEnemies: jest.fn(),
  },

  // Recent Projects API
  recent: {
    list: jest.fn(),
    add: jest.fn(),
  },

  // Preferences API
  preferences: {
    get: jest.fn(),
    set: jest.fn(),
  },

  // History API
  history: {
    list: jest.fn(),
    loadReport: jest.fn(),
    exportReport: jest.fn(),
    delete: jest.fn(),
    generateId: jest.fn(),
  },

  // Logs API
  logs: {
    flushRendererLogs: jest.fn(),
    export: jest.fn(),
  },
}

Object.defineProperty(global.window, 'coreto', {
  value: mockCoretoAPI,
  writable: true,
  configurable: true,
});

// Type the mock with jest.Mocked<CoretoAPI> for proper type inference in tests
// Use unknown as intermediate to bypass strict type checking
const typedCoretoMock = mockCoretoAPI as unknown as jest.Mocked<CoretoAPI>;

// Make window.coreto available globally for test assertions with proper types
declare global {
  const mockCoreto: jest.Mocked<CoretoAPI>;
}

(global as any).mockCoreto = typedCoretoMock;
