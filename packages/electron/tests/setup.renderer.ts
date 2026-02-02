/**
 * Jest Test Setup for Renderer Process
 *
 * Sets up global test environment configuration for React renderer tests.
 * Mocks window.coreto API and Electron APIs.
 */

// Reference global type declarations (CoretoAPI for source files)
/// <reference path="../src/renderer/src/types/preload.d.ts" />

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

// Mock window.coreto API
const mockCoretoAPI = {
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
