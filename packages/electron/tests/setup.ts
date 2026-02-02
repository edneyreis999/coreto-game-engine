/**
 * Jest Test Setup for Electron Package
 *
 * Sets up global test environment configuration.
 */

// Set NODE_ENV to test for all tests
process.env.NODE_ENV = 'test';

// Polyfill vi for Vitest compatibility (using Jest functions)
(global as any).vi = {
  fn: jest.fn,
  mock: jest.mock,
  spyOn: jest.spyOn,
  clearAllMocks: jest.clearAllMocks,
  resetAllMocks: jest.resetAllMocks,
  restoreAllMocks: jest.restoreAllMocks,
};

// Mock import.meta.env for ES modules
Object.defineProperty(global as any, 'import', {
  value: {
    meta: {
      env: {
        NODE_ENV: 'test',
        PROD: false
      }
    }
  }
});
