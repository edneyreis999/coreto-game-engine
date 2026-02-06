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
 * IMPORTANT: This mock matches the SEGREGATED API structure introduced in Task #8.
 * The API is organized by domain concern (project, simulation, config, data, history, preferences, recent).
 *
 * @example
 * ```ts
 * const mockCoreto = createMinimalCoretoMock();
 *
 * // Override specific methods
 * mockCoreto.recent.list = jest.fn().mockResolvedValue({ success: true, data: [] });
 * mockCoreto.project.open = jest.fn().mockResolvedValue({ success: true, data: { path: '/test', name: 'Test', isValid: true } });
 * ```
 */
export function createMinimalCoretoMock(
  overrides: Partial<CoretoAPI> = {}
): CoretoAPI {
  const defaultMock: CoretoAPI = {
    // Project API - Domain-segregated
    project: {
      open: jest.fn().mockResolvedValue({ success: true, data: { path: '/test', name: 'Test', isValid: true } }),
      validate: jest.fn().mockResolvedValue({ success: true, data: { isValid: true, errors: [], warnings: [] } }),
    },

    // Simulation API - Domain-segregated
    simulation: {
      // Event listeners - return cleanup function
      onProgress: jest.fn().mockReturnValue(() => {}),
      onComplete: jest.fn().mockReturnValue(() => {}),
      onError: jest.fn().mockReturnValue(() => {}),

      // Commands
      start: jest.fn().mockResolvedValue({ success: true, data: { simulationId: 'test-sim-id' } }),
      cancel: jest.fn().mockResolvedValue({ success: true, data: undefined }),
      getResults: jest.fn().mockResolvedValue({
        success: true,
        data: {
          trechos: [],
          totalBattles: 0,
          timestamp: new Date().toISOString(),
        },
      }),
      getProgress: jest.fn().mockResolvedValue({ success: true, data: 0 }),

      // Legacy handler
      run: jest.fn().mockResolvedValue({
        success: true,
        data: {
          trechos: [],
          totalBattles: 0,
          timestamp: new Date().toISOString(),
        },
      }),
    },

    // Config API - Domain-segregated
    config: {
      save: jest.fn().mockResolvedValue({ success: true, data: { success: true, configPath: '/test/config.json' } }),
      load: jest.fn().mockResolvedValue({
        success: true,
        data: {
          version: '1.0',
          trechos: [],
          metadata: {},
        },
      }),
      getTrechos: jest.fn().mockResolvedValue({ success: true, data: [] }),
      updateTrecho: jest.fn().mockResolvedValue({ success: true, data: { trecho: {} } }),
      deleteTrecho: jest.fn().mockResolvedValue({ success: true, data: { deletedTrechoId: 'test-id' } }),
      updateGlobalSettings: jest.fn().mockResolvedValue({ success: true, data: { seed: 12345 } }),
    },

    // Data API - Domain-segregated
    data: {
      getTroops: jest.fn().mockResolvedValue({ success: true, data: [] }),
      getClasses: jest.fn().mockResolvedValue({ success: true, data: [] }),
      getEnemies: jest.fn().mockResolvedValue({ success: true, data: [] }),
    },

    // Recent Projects API - Domain-segregated
    recent: {
      list: jest.fn().mockResolvedValue({ success: true, data: [] }),
      add: jest.fn().mockResolvedValue({ success: true, data: { path: '/test', name: 'Test', lastOpened: new Date().toISOString() } }),
    },

    // Preferences API - Domain-segregated
    preferences: {
      get: jest.fn().mockResolvedValue({
        success: true,
        data: { theme: 'system', window_bounds: undefined, last_project_path: null },
      }),
      set: jest.fn().mockResolvedValue({ success: true, data: { theme: 'system', window_bounds: undefined, last_project_path: null } }),
    },

    // History API - Domain-segregated
    history: {
      list: jest.fn().mockResolvedValue({ success: true, data: { simulations: [] } }),
      loadReport: jest.fn().mockResolvedValue({ success: true, data: { report: null } }),
      exportReport: jest.fn().mockResolvedValue({ success: true, data: { filePath: '/test/report.json' } }),
      delete: jest.fn().mockResolvedValue({ success: true, data: { deletedId: 'test-id' } }),
      generateId: jest.fn().mockResolvedValue({ success: true, data: { simulationId: 'test-sim-id' } }),
    },
  };

  // Deep merge overrides
  return {
    ...defaultMock,
    ...overrides,
    // Merge nested objects if provided
    project: { ...defaultMock.project, ...overrides.project },
    simulation: { ...defaultMock.simulation, ...overrides.simulation },
    config: { ...defaultMock.config, ...overrides.config },
    data: { ...defaultMock.data, ...overrides.data },
    recent: { ...defaultMock.recent, ...overrides.recent },
    preferences: { ...defaultMock.preferences, ...overrides.preferences },
    history: { ...defaultMock.history, ...overrides.history },
  } as CoretoAPI;
}
