/**
 * Jest Configuration for @coreto/electron
 *
 * Configures Jest for testing main process code.
 * Renderer process tests will use a separate config in the future.
 */

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  displayName: 'electron',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/renderer/src/$1',
    '^@coreto/core$': '<rootDir>/../core/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx'
        }
      }
    ]
  },
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/main/**/*.ts',
    'src/preload/**/*.ts',
    '!src/main/**/*.d.ts',
    '!src/preload/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
