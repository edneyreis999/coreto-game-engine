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
 * @see https://electron-vite.org/config/
 */
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
      '@coreto/electron/domain': resolve(__dirname, 'src/domain'),
      '@coreto/electron/domain/use-cases': resolve(__dirname, 'src/domain/use-cases/index.ts'),
      '@coreto/electron/domain/repositories': resolve(__dirname, 'src/domain/repositories/index.ts'),
      '@coreto/electron/domain/services': resolve(__dirname, 'src/domain/services/index.ts'),
      '@coreto/electron/domain/validation': resolve(__dirname, 'src/domain/validation/index.ts'),
      '@coreto/electron/domain/types': resolve(__dirname, 'src/domain/types/index.ts'),
      '@coreto/electron/domain/schemas': resolve(__dirname, 'src/domain/schemas/index.ts'),
      }
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          'workers/simulation.worker': resolve(__dirname, 'src/main/workers/simulation.worker.ts')
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
    build: {
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
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
        '@': resolve(__dirname, 'src/renderer/src')
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
