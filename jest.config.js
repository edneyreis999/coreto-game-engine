/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  // Test discovery in both root tests/ and src/ directories
  // After migration, tests will move to packages/*/tests/
  roots: ['<rootDir>/tests', '<rootDir>/src', '<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'node',
        },
      },
    ],
  },
  // Module name mapping for workspace imports and path aliases
  moduleNameMapper: {
    // Workspace package imports (for future use after migration)
    '^@coreto/core/(.*)$': '<rootDir>/packages/core/src/$1',
    '^@coreto/cli/(.*)$': '<rootDir>/packages/cli/src/$1',
    '^@coreto/electron/(.*)$': '<rootDir>/packages/electron/src/$1',
    // Root path aliases (maintained for backward compatibility during migration)
    '^@/(.*)\\.js$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFilesAfterEnv: ['jest-canvas-mock', '<rootDir>/tests/setup.ts'],
  // Coverage collection from all packages and src/
  collectCoverageFrom: [
    'src/**/*.ts',
    'packages/*/src/**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!src/cli/index.ts', // Entry point, covered by E2E
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
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // Ignore node_modules in packages during workspace discovery
  testPathIgnorePatterns: ['/node_modules/', '/packages/*/node_modules/'],
};
