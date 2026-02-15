import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/**
 * Electron Vite Configuration
 *
 * Configures three-process build for Electron:
 * - main: Node.js process with @coreto/core integration
 * - preload: Isolated context bridge script
 * - renderer: React application with Vite
 *
 * Module Aliases:
 * - Domain aliases are shared across main and renderer (DRY via sharedDomainAliases)
 * - Renderer has additional '@/*' alias for React components
 * - See packages/electron/CLAUDE.md for import conventions
 *
 * @see https://electron-vite.org/config/
 */

/**
 * Shared domain layer aliases.
 * Used by both main and renderer processes for cross-layer imports.
 *
 * IMPORTANT: Keep in sync with:
 * - tsconfig.json (TypeScript resolution)
 * - jest.config.js (test module resolution)
 *
 * Convention: Point to directories (not index.ts) to allow Vite to resolve subpaths
 */
const sharedDomainAliases = {
  '@coreto/electron/domain/use-cases': resolve(__dirname, 'src/domain/use-cases'),
  '@coreto/electron/domain/repositories': resolve(__dirname, 'src/domain/repositories'),
  '@coreto/electron/domain/services': resolve(__dirname, 'src/domain/services'),
  '@coreto/electron/domain/validation': resolve(__dirname, 'src/domain/validation'),
  '@coreto/electron/domain/types': resolve(__dirname, 'src/domain/types'),
  '@coreto/electron/domain/schemas': resolve(__dirname, 'src/domain/schemas'),
  '@coreto/electron/domain/ports': resolve(__dirname, 'src/domain/ports'),
  '@coreto/electron/domain': resolve(__dirname, 'src/domain'),
  '@coreto/oracle': resolve(__dirname, '../oracle/src'),
  '@coreto/oracle/lib': resolve(__dirname, '../oracle/src/lib'),
  '@coreto/oracle/server': resolve(__dirname, '../oracle/src/server'),
  '@coreto/electron/assets': resolve(__dirname, 'src/assets'),
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: sharedDomainAliases
    },
    build: {
      rollupOptions: {
        external: ['@coreto/oracle', '@coreto/oracle/*'],
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          'workers/simulation.worker': resolve(__dirname, 'src/main/workers/simulation.worker.ts'),
          'workers/nsd.worker': resolve(__dirname, 'src/main/workers/nsd.worker.ts')
        },
        output: {
          entryFileNames: '[name].js',
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          }
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: sharedDomainAliases
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: '[name].cjs',
          format: 'cjs'
        }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer/src'),
        ...sharedDomainAliases
      }
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html')
        }
      }
    }
  }
})
