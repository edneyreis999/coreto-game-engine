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
  // Global settings
  ...baseConfig,
  projects: [
    // ============================================================
    // Core Package Project
    // ============================================================
    {
      displayName: 'core',
      ...baseConfig,
      testMatch: ['<rootDir>/packages/core/**/*.test.ts'],
      roots: ['<rootDir>/packages/core'],
      testEnvironment: 'node',
      // Module name mapping for @coreto/core imports
      moduleNameMapper: {
        '^@coreto/core$': '<rootDir>/packages/core/src/index.ts',
        '^@coreto/core/(.*)\\.d\\.ts$': '<rootDir>/packages/core/src/$1.d.ts',
        '^@coreto/core/(.*)\\.js$': '<rootDir>/packages/core/src/$1.ts',
        '^@coreto/core/(.+)$': '<rootDir>/packages/core/src/$1.ts',
        // Path aliases for @coreto/core/*
        '^@coreto/core/domain$': '<rootDir>/packages/core/src/core/domain/index.ts',
        '^@coreto/core/domain/(.*)$': '<rootDir>/packages/core/src/core/domain/$1',
        '^@coreto/core/ports$': '<rootDir>/packages/core/src/core/ports/index.ts',
        '^@coreto/core/ports/(.*)$': '<rootDir>/packages/core/src/core/ports/$1',
        '^@coreto/core/errors$': '<rootDir>/packages/core/src/core/errors/index.ts',
        '^@coreto/core/errors/(.*)$': '<rootDir>/packages/core/src/core/errors/$1',
        '^@coreto/core/use-cases$': '<rootDir>/packages/core/src/core/use-cases/index.ts',
        '^@coreto/core/use-cases/(.*)$': '<rootDir>/packages/core/src/core/use-cases/$1',
        '^@coreto/core/infrastructure/(.*)$': '<rootDir>/packages/core/src/infrastructure/$1',
        '^@coreto/core/tests/fakes$': '<rootDir>/packages/core/tests/fakes/index.ts',
        '^@coreto/core/tests/fakes/(.+)$': '<rootDir>/packages/core/tests/fakes/$1.ts',
        '^@/(.*)\\.js$': '<rootDir>/packages/core/src/$1.ts',
        '^@/(.+)$': '<rootDir>/packages/core/src/$1.ts',
        // Type-only imports (.d.ts files in types/ directory)
        '^\\.\\./\\.\\./types/rmmz-runtime\\.js$': '<rootDir>/packages/core/src/types/rmmz-runtime.d.ts',
        '^\\.\\./\\.\\./types/pixi\\.js$': '<rootDir>/packages/core/src/types/pixi.d.ts',
        '^\\.\\./types/rmmz-runtime\\.js$': '<rootDir>/packages/core/src/types/rmmz-runtime.d.ts',
        '^\\.\\./types/pixi\\.js$': '<rootDir>/packages/core/src/types/pixi.d.ts',
        // Relative imports from index.ts and other source files (single dot)
        '^\\./(core/.+)\\.js$': '<rootDir>/packages/core/src/$1.ts',
        '^\\./(infrastructure/.+)\\.js$': '<rootDir>/packages/core/src/$1.ts',
        '^\\./(types/.+)\\.js$': '<rootDir>/packages/core/src/$1.ts',
      },
      // Custom resolver for handling .js -> .ts/.d.ts mapping
      resolver: '<rootDir>/jest.resolver.cjs',
      setupFilesAfterEnv: ['jest-canvas-mock', '<rootDir>/packages/core/tests/setup.ts'],
      collectCoverageFrom: [
        'packages/core/src/**/*.ts',
        '!**/*.d.ts',
        '!**/*.test.ts',
        '!**/*.spec.ts',
      ],
    },

    // ============================================================
    // Electron Package Projects
    // ============================================================

    // --- Main process and preload tests (Node.js environment) ---
    {
      displayName: 'electron-main',
      ...baseConfig,
      testEnvironment: 'node',
      maxWorkers: 1,
      roots: ['<rootDir>/packages/electron'],
      testMatch: [
        '<rootDir>/packages/electron/tests/unit/main/**/*.test.ts',
        '<rootDir>/packages/electron/tests/unit/preload/**/*.test.ts',
        '<rootDir>/packages/electron/src/main/**/__tests__/**/*.test.ts',
        '<rootDir>/packages/electron/src/main/**/__tests__/**/*.spec.ts',
      ],
      moduleNameMapper: {
        '^@coreto/core$': '<rootDir>/packages/core/src/index.ts',
        '^@coreto/core/(.*)\\.d\\.ts$': '<rootDir>/packages/core/src/$1.d.ts',
        '^@coreto/core/(.*)\\.js$': '<rootDir>/packages/core/src/$1.ts',
        '^@coreto/core/(.+)$': '<rootDir>/packages/core/src/$1.ts',
        '^@coreto/core/tests/fakes$': '<rootDir>/packages/core/tests/fakes/index.ts',
        '^@coreto/core/tests/fakes/(.+)$': '<rootDir>/packages/core/tests/fakes/$1.ts',
        '^@coreto/electron/domain$': '<rootDir>/packages/electron/src/domain/index.ts',
        '^@coreto/electron/domain/(.+)$': '<rootDir>/packages/electron/src/domain/$1/index.ts',
        '^@coreto/electron/(.*)\\.js$': '<rootDir>/packages/electron/src/$1.ts',
        '^@coreto/electron/(.+)$': '<rootDir>/packages/electron/src/$1.ts',
      },
      resolver: '<rootDir>/jest.resolver.cjs',
      setupFilesAfterEnv: ['<rootDir>/packages/electron/tests/setup.ts'],
      collectCoverageFrom: [
        'packages/electron/src/main/**/*.ts',
        'packages/electron/src/preload/**/*.ts',
        '!packages/electron/src/main/**/*.d.ts',
        '!packages/electron/src/preload/**/*.d.ts',
        '!packages/electron/src/main/**/__tests__/**',
      ],
    },

    // --- Renderer process tests (jsdom environment for React) ---
    {
      displayName: 'electron-renderer',
      ...baseConfig,
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/packages/electron/tests'],
      testMatch: [
        '<rootDir>/packages/electron/tests/unit/renderer/**/*.test.ts',
        '<rootDir>/packages/electron/tests/unit/renderer/**/*.test.tsx',
      ],
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            useESM: true,
            tsconfig: '<rootDir>/packages/electron/tsconfig.spec.json',
            diagnostics: {
              ignoreCodes: ['TS151002'],
            },
          },
        ],
      },
      moduleNameMapper: {
        '^@coreto/core$': '<rootDir>/packages/core/src/index.ts',
        '^@coreto/core/(.*)\\.js$': '<rootDir>/packages/core/src/$1.ts',
        '^@coreto/core/(.+)$': '<rootDir>/packages/core/src/$1.ts',
        '^@coreto/core/tests/fakes$': '<rootDir>/packages/core/tests/fakes/index.ts',
        '^@coreto/core/tests/fakes/(.+)$': '<rootDir>/packages/core/tests/fakes/$1.ts',
        '^@coreto/electron/domain$': '<rootDir>/packages/electron/src/domain/index.ts',
        '^@coreto/electron/domain/(.+)$': '<rootDir>/packages/electron/src/domain/$1/index.ts',
        '^@coreto/electron/(.*)\\.js$': '<rootDir>/packages/electron/src/$1.ts',
        '^@coreto/electron/(.+)$': '<rootDir>/packages/electron/src/$1.ts',
        '^@/hooks/(.*)$': '<rootDir>/packages/electron/src/renderer/src/hooks/$1',
        '^@/hooks/(.*)\\.js$': '<rootDir>/packages/electron/src/renderer/src/hooks/$1.ts',
        '^@/components/(.*)$': '<rootDir>/packages/electron/src/renderer/src/components/$1',
        '^@/components/(.*)\\.js$': '<rootDir>/packages/electron/src/renderer/src/components/$1.ts',
        '^@/lib/(.*)$': '<rootDir>/packages/electron/src/renderer/src/lib/$1',
        '^@/lib/(.*)\\.js$': '<rootDir>/packages/electron/src/renderer/src/lib/$1.ts',
        '^@/types/(.*)\\.d\\.ts$': '<rootDir>/packages/core/src/types/$1.d.ts',
        '^@/types/(.*)\\.js$': '<rootDir>/packages/core/src/types/$1.ts',
        '^@/types/(.+)$': '<rootDir>/packages/core/src/types/$1.ts',
        '^@/infrastructure/(.*)\\.d\\.ts$': '<rootDir>/packages/core/src/infrastructure/$1.d.ts',
        '^@/infrastructure/(.*)\\.js$': '<rootDir>/packages/core/src/infrastructure/$1.ts',
        '^@/infrastructure/(.+)$': '<rootDir>/packages/core/src/infrastructure/$1.ts',
        '^@/(core/.*)\\.d\\.ts$': '<rootDir>/packages/core/src/$1.d.ts',
        '^@/(core/.*)\\.js$': '<rootDir>/packages/core/src/$1.ts',
        '^@/(core/.+)$': '<rootDir>/packages/core/src/$1.ts',
        '^@/(.*)\\.d\\.ts$': '<rootDir>/packages/core/src/$1.d.ts',
        '^@/(.*)\\.js$': '<rootDir>/packages/core/src/$1.ts',
        '^@/(.+)$': '<rootDir>/packages/core/src/$1.ts',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      setupFilesAfterEnv: [
        '<rootDir>/packages/electron/tests/setup.renderer.ts'
      ],
      collectCoverageFrom: [
        'packages/electron/src/renderer/src/**/*.{ts,tsx}',
        '!packages/electron/src/renderer/src/**/*.d.ts',
        '!packages/electron/src/renderer/src/main.tsx',
      ],
    },

    // --- Integration tests ---
    {
      displayName: 'electron-integration',
      ...baseConfig,
      testEnvironment: 'node',
      roots: ['<rootDir>/packages/electron/tests'],
      testMatch: ['<rootDir>/packages/electron/tests/integration/**/*.test.ts'],
      moduleNameMapper: {
        '^@coreto/core$': '<rootDir>/packages/core/src/index.ts',
        '^@coreto/core/(.*)\\.d\\.ts$': '<rootDir>/packages/core/src/$1.d.ts',
        '^@coreto/core/(.*)\\.js$': '<rootDir>/packages/core/src/$1.ts',
        '^@coreto/core/(.+)$': '<rootDir>/packages/core/src/$1.ts',
        '^@coreto/core/tests/fakes$': '<rootDir>/packages/core/tests/fakes/index.ts',
        '^@coreto/core/tests/fakes/(.+)$': '<rootDir>/packages/core/tests/fakes/$1.ts',
        '^@coreto/electron/domain$': '<rootDir>/packages/electron/src/domain/index.ts',
        '^@coreto/electron/domain/(.+)$': '<rootDir>/packages/electron/src/domain/$1/index.ts',
        '^@coreto/electron/(.*)\\.js$': '<rootDir>/packages/electron/src/$1.ts',
        '^@coreto/electron/(.+)$': '<rootDir>/packages/electron/src/$1.ts',
        '^@/(.*)\\.js$': '<rootDir>/packages/electron/src/renderer/src/$1.ts',
        '^@/(.+)$': '<rootDir>/packages/electron/src/renderer/src/$1.ts',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      resolver: '<rootDir>/jest.resolver.cjs',
      setupFilesAfterEnv: ['<rootDir>/packages/electron/tests/setup.ts'],
      collectCoverageFrom: [],
    },

    // --- E2E tests ---
    {
      displayName: 'electron-e2e',
      ...baseConfig,
      testEnvironment: 'node',
      maxWorkers: 1,
      roots: ['<rootDir>/packages/electron/tests'],
      testMatch: ['<rootDir>/packages/electron/tests/e2e/**/*.test.ts'],
      moduleNameMapper: {
        '^@coreto/core$': '<rootDir>/packages/core/src/index.ts',
        '^@coreto/core/(.*)\\.d\\.ts$': '<rootDir>/packages/core/src/$1.d.ts',
        '^@coreto/core/(.*)\\.js$': '<rootDir>/packages/core/src/$1.ts',
        '^@coreto/core/(.+)$': '<rootDir>/packages/core/src/$1.ts',
        '^@coreto/core/tests/fakes$': '<rootDir>/packages/core/tests/fakes/index.ts',
        '^@coreto/core/tests/fakes/(.+)$': '<rootDir>/packages/core/tests/fakes/$1.ts',
        '^@coreto/electron/(.*)\\.js$': '<rootDir>/packages/electron/src/$1.ts',
        '^@coreto/electron/(.+)$': '<rootDir>/packages/electron/src/$1.ts',
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      setupFilesAfterEnv: ['<rootDir>/packages/electron/tests/setup.ts'],
      collectCoverageFrom: [],
    },
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
};
