/**
 * Jest Test Setup for Electron Package
 *
 * Sets up global test environment configuration.
 */

// Set NODE_ENV to test for all tests
process.env.NODE_ENV = 'test'

// Mock import.meta.env for ES modules
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        NODE_ENV: 'test',
        PROD: false
      }
    }
  }
})
