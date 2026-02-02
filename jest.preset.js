/**
 * Jest Preset - Shared configuration for monorepo
 *
 * This preset contains the base configuration shared across all packages
 * in the monorepo. Individual packages can extend this via Jest projects.
 *
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
        diagnostics: {
          ignoreCodes: ['TS151002'],
        },
      },
    ],
  },
  transformIgnorePatterns: ['node_modules'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testTimeout: 10000,
};
