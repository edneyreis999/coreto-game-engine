/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  // Test discovery in packages/ directory
  roots: ['<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules',
  ],
  // Module name mapping for workspace imports
  moduleNameMapper: {
    // Workspace package imports - strip .js extension and map to src files
    '^@coreto/core$': '<rootDir>/packages/core/src/index.ts',
    '^@coreto/core/(.*)\\.js$': '<rootDir>/packages/core/src/$1.ts',
    '^@coreto/core/(.+)$': '<rootDir>/packages/core/src/$1.ts',
    '^@coreto/cli/(.*)\\.js$': '<rootDir>/packages/cli/src/$1.ts',
    '^@coreto/cli/(.+)$': '<rootDir>/packages/cli/src/$1.ts',
    '^@coreto/electron/(.*)\\.js$': '<rootDir>/packages/electron/src/$1.ts',
    '^@coreto/electron/(.+)$': '<rootDir>/packages/electron/src/$1.ts',
    // Handle @/ path alias for @coreto/electron renderer (components, hooks, etc.)
    // These MUST come BEFORE the generic @/ patterns to avoid incorrect matches
    '^@/hooks/(.*)$': '<rootDir>/packages/electron/src/renderer/src/hooks/$1',
    '^@/hooks/(.*)\\.js$': '<rootDir>/packages/electron/src/renderer/src/hooks/$1.ts',
    '^@/components/(.*)$': '<rootDir>/packages/electron/src/renderer/src/components/$1',
    '^@/components/(.*)\\.js$': '<rootDir>/packages/electron/src/renderer/src/components/$1.ts',
    '^@/lib/(.*)$': '<rootDir>/packages/electron/src/renderer/src/lib/$1',
    '^@/lib/(.*)\\.js$': '<rootDir>/packages/electron/src/renderer/src/lib/$1.ts',
    // Handle @/ path alias for @coreto/core
    '^@/types/(.*)\\.js$': '<rootDir>/packages/core/src/types/$1.ts',
    '^@/types/(.+)$': '<rootDir>/packages/core/src/types/$1.ts',
    '^@/infrastructure/(.*)\\.js$': '<rootDir>/packages/core/src/infrastructure/$1.ts',
    '^@/infrastructure/(.+)$': '<rootDir>/packages/core/src/infrastructure/$1.ts',
    '^@/cli/(.*)\\.js$': '<rootDir>/packages/cli/src/cli/$1.ts',
    '^@/cli/(.+)$': '<rootDir>/packages/cli/src/cli/$1.ts',
    '^@/(core/.*)\\.js$': '<rootDir>/packages/core/src/$1.ts',
    '^@/(core/.+)$': '<rootDir>/packages/core/src/$1.ts',
    // Generic @/ fallback - must come LAST
    '^@/(.*)\\.js$': '<rootDir>/packages/core/src/$1.ts',
    '^@/(.+)$': '<rootDir>/packages/core/src/$1.ts',
    // Handle relative imports
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
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // Ignore node_modules in packages during workspace discovery
  testPathIgnorePatterns: [
    '/node_modules/',
    '/packages/*/node_modules/',
    // Ignore electron tests - they have their own Jest config with jsdom environment
    '/packages/electron/tests/',
    // Ignore electron src tests (__tests__ folders)
    '/packages/electron/src/main/__tests__/',
    '/packages/electron/src/renderer/__tests__/',
  ],
};
