/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  // Test discovery in packages/tests/ directory
  roots: ['<rootDir>/tests', '<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.(ts|mts)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'bundler',
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
  setupFilesAfterEnv: ['jest-canvas-mock', '<rootDir>/packages/core/tests/setup.ts'],
  // Coverage collection from packages
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!packages/cli/src/index.ts', // Entry point, covered by E2E
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  verbose: true,
  testTimeout: 10000,
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'mts', 'js', 'json', 'node'],
  // Ignore node_modules in packages during workspace discovery
  testPathIgnorePatterns: ['/node_modules/', '/packages/*/node_modules/'],
};
