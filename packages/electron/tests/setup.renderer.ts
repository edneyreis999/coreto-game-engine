/**
 * Jest Test Setup for Renderer Process
 *
 * Sets up global test environment configuration for React renderer tests.
 * Mocks window.coreto API and Electron APIs.
 */

// Set NODE_ENV to test for all tests
process.env.NODE_ENV = 'test'

// Mock CSS imports
jest.mock('identity-obj-proxy', () => ({}))

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
  getSimulationProgress: jest.fn(),
  cancelSimulation: jest.fn(),
  loadConfig: jest.fn(),
  getTrechos: jest.fn(),
  getTroops: jest.fn(),
  getClasses: jest.fn(),
  getEnemies: jest.fn(),
  listRecent: jest.fn(),
  addRecent: jest.fn(),
  getPreferences: jest.fn(),
  setPreferences: jest.fn(),
}

Object.defineProperty(global.window, 'coreto', {
  value: mockCoretoAPI,
  writable: true,
  configurable: true,
})

// Make window.coreto available globally for test assertions
global.mockCoreto = mockCoretoAPI
