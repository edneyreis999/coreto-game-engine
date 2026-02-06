/**
 * Jest Configuration for Coreto Game Engine Monorepo
 *
 * Uses Jest projects array to support multiple packages with isolated
 * configurations. This is the recommended approach for pnpm monorepos
 * as it provides better scalability and isolation.
 *
 * @type {import('jest').Config}
 */
import baseConfig from './jest.preset.js';

export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  // Test discovery in root tests and examples directories only
  // Note: packages/core and packages/electron have their own jest configs
  roots: ['<rootDir>/tests', '<rootDir>/examples'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.(ts|mts)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'bundler',
          lib: ['ES2022', 'DOM'],
          types: ['node', 'jest', 'jsdom'],
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
        },
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(ts-jest))',
  ],
  // Module name mapping for workspace imports
  moduleNameMapper: {
    // Workspace package imports - map to built dist files
    '^@coreto/core$': '<rootDir>/packages/core/src/index.ts',
    '^@coreto/core/(.*)\\.js$': '<rootDir>/packages/core/src/$1',
    '^@coreto/core/(.*)$': '<rootDir>/packages/core/src/$1',
    '^@coreto/cli/(.*)\\.js$': '<rootDir>/packages/cli/src/$1',
    '^@coreto/cli/(.*)$': '<rootDir>/packages/cli/src/$1',
    '^@coreto/electron/(.*)\\.js$': '<rootDir>/packages/electron/src/$1',
    '^@coreto/electron/(.*)$': '<rootDir>/packages/electron/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFilesAfterEnv: ['jest-canvas-mock', '<rootDir>/packages/core/tests/setup.cjs'],
  // Coverage collection from packages
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!packages/cli/src/index.ts', // Entry point, covered by E2E
  ],

  // ============================================================
  // Global Coverage Settings
  // ============================================================
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  verbose: true,
  testTimeout: 10000,
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'mts', 'js', 'json', 'node'],
  // Ignore node_modules and non-test files in packages during workspace discovery
  testPathIgnorePatterns: [
    '/node_modules/',
    '/packages/*/node_modules/',
    '/__tests__/builders/',
    '/__tests__/fakes/',
    '/__tests__/fixtures/',
    '/__tests__/mocks/',
    '/scripts/',
    '/tests/scripts/',
  ],
};
