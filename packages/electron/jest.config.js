/**
 * Jest Configuration for @coreto/electron
 *
 * Configures Jest for testing main process, preload, and renderer code.
 * Uses separate projects for different test environments.
 */

/** @type {import('ts-jest').JestConfigWithTsJest} */
const baseConfig = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/renderer/src/$1',
    '^@coreto/core$': '<rootDir>/../core/src/index.ts',
    '^@coreto/electron/(.*)\\.js$': '<rootDir>/src/$1.ts',
    '^@coreto/electron/(.+)$': '<rootDir>/src/$1.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
        },
      },
    ],
  },
};

export default {
  displayName: 'electron',
  projects: [
    // Main process and preload tests (Node.js environment)
    {
      ...baseConfig,
      displayName: 'main',
      testEnvironment: 'node',
      maxWorkers: 1, // Run tests sequentially to avoid database singleton conflicts
      roots: ['<rootDir>/tests', '<rootDir>/src/main'],
      transformIgnorePatterns: ['node_modules/(?!(ts-jest))'],
      testMatch: [
        '**/tests/unit/main/**/*.test.ts',
        '**/tests/unit/preload/**/*.test.ts',
        '**/tests/unit/domain/**/*.spec.ts',
        '**/src/main/**/__tests__/*.spec.ts',
        '**/src/main/**/__tests__/*.test.ts',
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/builders/',
        '/__tests__/fakes/',
        '/__tests__/fixtures/',
        '/__tests__/mocks/',
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@tests/(.*)$': '<rootDir>/tests/$1',
        '^@coreto/core$': '<rootDir>/../core/src/index.ts',
        '^@coreto/oracle$': '<rootDir>/../oracle/src/index.ts',
        '^@coreto/oracle/(.*)$': '<rootDir>/../oracle/src/$1',
        // Domain layer specific mappings (must come before generic fallback)
        '^@coreto/electron/domain/services$': '<rootDir>/src/domain/services/index.ts',
        '^@coreto/electron/domain/schemas$': '<rootDir>/src/domain/schemas/index.ts',
        '^@coreto/electron/domain/types$': '<rootDir>/src/domain/types/index.ts',
        '^@coreto/electron/domain/ports$': '<rootDir>/src/domain/ports/index.ts',
        '^@coreto/electron/domain/use-cases$': '<rootDir>/src/domain/use-cases/index.ts',
        '^@coreto/electron/domain/repositories$': '<rootDir>/src/domain/repositories/index.ts',
        '^@coreto/electron/domain/validation$': '<rootDir>/src/domain/validation/index.ts',
        '^@coreto/electron/domain/mappers$': '<rootDir>/src/domain/mappers/index.ts',
        '^@coreto/electron/domain$': '<rootDir>/src/domain/index.ts',
        // Generic fallback for other @coreto/electron imports
        '^@coreto/electron/(.*)\\.js$': '<rootDir>/src/$1.ts',
        '^@coreto/electron/(.+)$': '<rootDir>/src/$1.ts',
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      collectCoverageFrom: [
        'src/main/**/*.ts',
        'src/preload/**/*.ts',
        '!src/main/**/*.d.ts',
        '!src/preload/**/*.d.ts',
        '!src/main/**/__tests__/**',
      ],
    },
    // Renderer process tests (jsdom environment for React)
    {
      ...baseConfig,
      displayName: 'renderer',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/tests'],
      testMatch: ['**/tests/unit/renderer/**/*.test.ts', '**/tests/unit/renderer/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.renderer.ts'],
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            useESM: true,
            tsconfig: '<rootDir>/tsconfig.spec.json',
          },
        ],
      },
      moduleNameMapper: {
        '^@/tests/(.*)$': '<rootDir>/tests/$1',
        '^@/(.*)$': '<rootDir>/src/renderer/src/$1',
        '^@preload/(.*)$': '<rootDir>/src/preload/$1',
        '^@coreto/core$': '<rootDir>/../core/src/index.ts',
        // Domain layer specific mappings (must come before generic fallback)
        '^@coreto/electron/domain/services$': '<rootDir>/src/domain/services/index.ts',
        '^@coreto/electron/domain/schemas$': '<rootDir>/src/domain/schemas/index.ts',
        '^@coreto/electron/domain/types$': '<rootDir>/src/domain/types/index.ts',
        '^@coreto/electron/domain/ports$': '<rootDir>/src/domain/ports/index.ts',
        '^@coreto/electron/domain/use-cases$': '<rootDir>/src/domain/use-cases/index.ts',
        '^@coreto/electron/domain/repositories$': '<rootDir>/src/domain/repositories/index.ts',
        '^@coreto/electron/domain/validation$': '<rootDir>/src/domain/validation/index.ts',
        '^@coreto/electron/domain/mappers$': '<rootDir>/src/domain/mappers/index.ts',
        '^@coreto/electron/domain$': '<rootDir>/src/domain/index.ts',
        // Generic fallback for other @coreto/electron imports
        '^@coreto/electron/(.*)\\.js$': '<rootDir>/src/$1.ts',
        '^@coreto/electron/(.+)$': '<rootDir>/src/$1.ts',
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      collectCoverageFrom: [
        'src/renderer/src/**/*.{ts,tsx}',
        '!src/renderer/src/**/*.d.ts',
        '!src/renderer/src/main.tsx',
      ],
    },
    // Integration tests
    {
      ...baseConfig,
      displayName: 'integration',
      testEnvironment: 'node',
      roots: ['<rootDir>/tests'],
      testMatch: ['**/tests/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@tests/(.*)$': '<rootDir>/tests/$1',
        '^@coreto/core$': '<rootDir>/../core/src/index.ts',
        '^@coreto/oracle$': '<rootDir>/../oracle/src/index.ts',
        '^@coreto/oracle/(.*)$': '<rootDir>/../oracle/src/$1',
        // Domain layer specific mappings (must come before generic fallback)
        '^@coreto/electron/domain/services$': '<rootDir>/src/domain/services/index.ts',
        '^@coreto/electron/domain/schemas$': '<rootDir>/src/domain/schemas/index.ts',
        '^@coreto/electron/domain/types$': '<rootDir>/src/domain/types/index.ts',
        '^@coreto/electron/domain/ports$': '<rootDir>/src/domain/ports/index.ts',
        '^@coreto/electron/domain/use-cases$': '<rootDir>/src/domain/use-cases/index.ts',
        '^@coreto/electron/domain/repositories$': '<rootDir>/src/domain/repositories/index.ts',
        '^@coreto/electron/domain/validation$': '<rootDir>/src/domain/validation/index.ts',
        '^@coreto/electron/domain/mappers$': '<rootDir>/src/domain/mappers/index.ts',
        '^@coreto/electron/domain$': '<rootDir>/src/domain/index.ts',
        // Generic fallback for other @coreto/electron imports
        '^@coreto/electron/(.*)\\.js$': '<rootDir>/src/$1.ts',
        '^@coreto/electron/(.+)$': '<rootDir>/src/$1.ts',
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      collectCoverageFrom: [],
    },
    // E2E tests
    {
      ...baseConfig,
      displayName: 'e2e',
      testEnvironment: 'node',
      maxWorkers: 1, // Run sequentially to avoid database conflicts
      roots: ['<rootDir>/tests'],
      testMatch: ['**/tests/e2e/**/*.test.ts', '**/tests/integration/oracleMcp.e2e.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      collectCoverageFrom: [],
      transformIgnorePatterns: [
        'node_modules/(?!(ts-jest))',
        '<rootDir>/../oracle',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@tests/(.*)$': '<rootDir>/tests/$1',
        '^@coreto/core$': '<rootDir>/../core/src/index.ts',
        '^@coreto/oracle$': '<rootDir>/../oracle/src/index.ts',
        '^@coreto/oracle/(.*)$': '<rootDir>/../oracle/src/$1',
        '^@coreto/electron/domain/services$': '<rootDir>/src/domain/services/index.ts',
        '^@coreto/electron/domain/schemas$': '<rootDir>/src/domain/schemas/index.ts',
        '^@coreto/electron/domain/types$': '<rootDir>/src/domain/types/index.ts',
        '^@coreto/electron/domain/ports$': '<rootDir>/src/domain/ports/index.ts',
        '^@coreto/electron/domain/use-cases$': '<rootDir>/src/domain/use-cases/index.ts',
        '^@coreto/electron/domain/repositories$': '<rootDir>/src/domain/repositories/index.ts',
        '^@coreto/electron/domain/validation$': '<rootDir>/src/domain/validation/index.ts',
        '^@coreto/electron/domain/mappers$': '<rootDir>/src/domain/mappers/index.ts',
        '^@coreto/electron/domain$': '<rootDir>/src/domain/index.ts',
        '^@coreto/electron/(.*)\\.js$': '<rootDir>/src/$1.ts',
        '^@coreto/electron/(.+)$': '<rootDir>/src/$1.ts',
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
    },
    // Architecture tests
    {
      ...baseConfig,
      displayName: 'architecture',
      testEnvironment: 'node',
      roots: ['<rootDir>/tests'],
      testMatch: ['**/tests/architecture/**/*.test.ts'],
      testPathIgnorePatterns: ['/node_modules/'],
    },
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
