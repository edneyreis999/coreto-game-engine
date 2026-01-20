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
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true
        }
      }
    ]
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
      roots: ['<rootDir>/tests'],
      testMatch: ['**/tests/unit/main/**/*.test.ts', '**/tests/unit/preload/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      collectCoverageFrom: [
        'src/main/**/*.ts',
        'src/preload/**/*.ts',
        '!src/main/**/*.d.ts',
        '!src/preload/**/*.d.ts'
      ],
    },
    // Renderer process tests (jsdom environment for React)
    {
      ...baseConfig,
      displayName: 'renderer',
      testEnvironment: 'node', // TODO: Change back to 'jsdom' once jest-environment-jsdom is installed via pnpm
      roots: ['<rootDir>/tests'],
      testMatch: ['**/tests/unit/renderer/**/*.test.ts', '**/tests/unit/renderer/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.renderer.ts'],
      moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
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
      collectCoverageFrom: [],
    },
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
