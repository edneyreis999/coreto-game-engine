/**
 * Minimal CoretoAPI Mock Factory
 *
 * Creates minimal mocks for window.coreto for testing React hooks.
 * Uses Jest's jest.fn() for spyable functions.
 *
 * This factory provides a minimal mock that only includes the essential
 * methods used by the tests. Each method has a default implementation
 * that can be overridden via the overrides parameter.
 *
 * @example
 * ```ts
 * const mockCoreto = createMinimalCoretoMock({
 *   openProject: jest.fn().mockResolvedValue({ success: true, data: {...} }),
 * });
 * ```
 */

/**
 * Creates a minimal window.coreto mock with spyable methods.
 * Pass overrides to mock specific methods with custom implementations.
 */
export function createMinimalCoretoMock(
  overrides: Partial<Record<string, ReturnType<typeof jest.fn>>> = {}
): any {
  return {
    // Project handlers
    openProject: jest.fn().mockResolvedValue({
      success: true,
      data: { path: '/test', name: 'Test', isValid: true }
    }),
    validateProject: jest.fn().mockResolvedValue({
      success: true,
      data: { isValid: true, errors: [], warnings: [] }
    }),

    // Simulation commands
    runSimulation: jest.fn().mockResolvedValue({
      success: true,
      data: {
        trechos: [],
        totalBattles: 0,
        timestamp: new Date().toISOString(),
      },
    }),
    startSimulation: jest.fn().mockResolvedValue({
      success: true,
      data: { simulationId: 'test-sim-id' }
    }),
    getSimulationProgress: jest.fn().mockResolvedValue({
      success: true,
      data: 0
    }),
    cancelSimulation: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    getSimulationResults: jest.fn().mockResolvedValue({
      success: true,
      data: {
        trechos: [],
        totalBattles: 0,
        timestamp: new Date().toISOString(),
      },
    }),

    // Config handlers
    loadConfig: jest.fn().mockResolvedValue({
      success: true,
      data: {
        projectPath: '/test',
        reportOutputPath: '/test/reports',
        seed: 12345,
        maxBattleTurns: 100,
        trechos: [],
      },
    }),
    saveConfig: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    getTrechos: jest.fn().mockResolvedValue({ success: true, data: [] }),
    updateTrecho: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    deleteTrecho: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    updateGlobalSettings: jest.fn().mockResolvedValue({
      success: true,
      data: { seed: 12345, maxBattleTurns: 100 }
    }),

    // Data handlers
    getTroops: jest.fn().mockResolvedValue({ success: true, data: [] }),
    getClasses: jest.fn().mockResolvedValue({ success: true, data: [] }),
    getEnemies: jest.fn().mockResolvedValue({ success: true, data: [] }),

    // Recent projects
    listRecent: jest.fn().mockResolvedValue({ success: true, data: [] }),
    addRecent: jest.fn().mockResolvedValue({
      success: true,
      data: { path: '/test', name: 'Test', lastOpened: new Date().toISOString() }
    }),

    // Preferences
    getPreferences: jest.fn().mockResolvedValue({
      success: true,
      data: { theme: 'system' as const, lastProjectPath: null }
    }),
    setPreferences: jest.fn().mockResolvedValue({ success: true, data: undefined }),

    // Event listeners - return cleanup function
    onProgress: jest.fn(() => jest.fn()),
    onComplete: jest.fn(() => jest.fn()),
    onError: jest.fn(() => jest.fn()),

    // Override with custom implementations
    ...overrides,
  };
}
