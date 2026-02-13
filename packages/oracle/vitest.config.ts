/**
 * Vitest configuration for @coreto/oracle
 *
 * Configures Vitest for unit testing the Oracle MCP server.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'node_modules/**',
        'dist/**',
      ],
    },
  },
});
