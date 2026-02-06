/**
 * CoretoAPI Mock Factory
 *
 * Creates minimal mocks for the CoretoAPI for testing.
 * Uses Vitest's vi.fn() for spyable functions.
 *
 * @see packages/electron/src/preload/index.ts
 */

import type { CoretoAPI } from '@/preload';

/**
 * Creates a minimal CoretoAPI mock with spyable methods.
 * Pass overrides to mock specific methods with custom implementations.
 *
 * @example
 * ```ts
 * const mockCoreto = createMinimalCoretoMock({
 *   listRecent: jest.fn().mockResolvedValue({ success: true, data: [] }),
 *   openProject: jest.fn().mockResolvedValue({ success: true, data: { path: '/test', name: 'Test', isValid: true } }),
 * });
 * ```
 */
export function createMinimalCoretoMock(
  overrides: Partial<Record<keyof CoretoAPI, ReturnType<typeof jest.fn>>> = {}
): CoretoAPI {
  return {
    // Project handlers
    openProject: jest.fn().mockResolvedValue({ success: true, data: { path: '/test', name: 'Test', isValid: true } }),
    validateProject: jest.fn().mockResolvedValue({ success: true, data: { isValid: true, errors: [], warnings: [] } }),

    // Simulation event listeners - return cleanup function
    onProgress: jest.fn().mockReturnValue(() => {}),
    onComplete: jest.fn().mockReturnValue(() => {}),
    onError: jest.fn().mockReturnValue(() => {}),

    // Simulation commands
    startSimulation: jest.fn().mockResolvedValue({ success: true, data: { simulationId: 'test-sim-id' } }),
    cancelSimulation: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    runSimulation: jest.fn().mockResolvedValue({
      success: true,
      data: {
        trechos: [],
        totalBattles: 0,
        timestamp: new Date().toISOString(),
      },
    }),

    // Recent projects
    listRecent: jest.fn().mockResolvedValue({ success: true, data: [] }),
    addRecent: jest.fn().mockResolvedValue({ success: true, data: { path: '/test', name: 'Test', lastOpened: new Date().toISOString() } }),
    removeRecent: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    clearRecent: jest.fn().mockResolvedValue({ success: true, data: undefined }),

    // Preferences
    getPreferences: jest.fn().mockResolvedValue({
      success: true,
      data: { theme: 'system', window_bounds: undefined, last_project_path: null },
    }),
    setPreferences: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    setTheme: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    setLastProjectPath: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    setWindowBounds: jest.fn().mockResolvedValue({ success: true, data: undefined }),

    // Config
    loadConfig: jest.fn().mockResolvedValue({
      success: true,
      data: {
        version: '1.0',
        trechos: [],
        metadata: {},
      },
    }),
    saveConfig: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    validateConfig: jest.fn().mockResolvedValue({
      success: true,
      data: { isValid: true, errors: [], warnings: [] },
    }),

    // History
    listHistory: jest.fn().mockResolvedValue({ success: true, data: [] }),
    getHistory: jest.fn().mockResolvedValue({ success: true, data: null }),
    deleteHistory: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    clearHistory: jest.fn().mockResolvedValue({ success: true, data: undefined }),

    ...overrides,
  } as unknown as CoretoAPI;
}
