/**
 * Jest Test Setup for Renderer Process
 *
 * Sets up global test environment configuration for React renderer tests.
 * Mocks window.coreto API and Electron APIs.
 */

// Import jest-dom matchers
import '@testing-library/jest-dom'

// Set NODE_ENV to test for all tests
process.env.NODE_ENV = 'test'

// Mock window.coreto API
global.window = global.window || {}

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
})

// Make window.coreto available globally for test assertions
global.mockCoreto = mockCoretoAPI
