/**
 * Jest Configuration for @coreto/core
 *
 * Uses ts-jest with ESM support for TypeScript testing.
 *
 * @type {import('jest').Config}
 */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
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
          baseUrl: '.',
          paths: {
            '@coreto/core': ['./src/index.ts'],
            '@coreto/core/*': ['./src/*'],
          },
        },
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(ts-jest))'],
  moduleNameMapper: {
    // Map @coreto/core to local source
    '^@coreto/core$': '<rootDir>/src/index.ts',
    '^@coreto/core/(.*)\\.js$': '<rootDir>/src/$1.ts',
    '^@coreto/core/(.*)$': '<rootDir>/src/$1.ts',
    // Strip .js extensions for local imports
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFilesAfterEnv: ['jest-canvas-mock', '<rootDir>/tests/setup.cjs'],
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
  ],
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
};
