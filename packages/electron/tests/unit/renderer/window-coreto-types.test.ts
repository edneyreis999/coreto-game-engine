/**
 * Test: window.coreto Type Availability
 *
 * This test verifies that window.coreto types are properly available in renderer tests.
 *
 * BUG REPRODUCED:
 * Before fix in commit d65089b, this test would fail with:
 *
 *   TS2339: Property 'coreto' does not exist on type 'Window & typeof globalThis'
 *
 * Root cause:
 * - jest.config.js had tsconfig at project level (ignored by ts-jest)
 * - ts-jest used inline tsconfig from preset that didn't include preload.d.ts
 * - window.coreto type declarations were not available during compilation
 *
 * Fix:
 * - Moved tsconfig into transform configuration where ts-jest actually reads it
 * - tsconfig.spec.json includes type definition files in src/renderer/src/types/
 * - preload.d.ts declares window.coreto interface
 *
 * API UPDATE (Issue #2 fix):
 * Tests updated to use new segregated API structure (Task #8 refactoring):
 * - coreto.project.open instead of coreto.openProject
 * - coreto.project.validate instead of coreto.validateProject
 * - coreto.simulation.run instead of coreto.runSimulation
 * - coreto.recent.list instead of coreto.listRecent
 */

describe('window.coreto Type Availability', () => {
  it('should have window.coreto type available at compile time', () => {
    // This test would fail to COMPILE (not run) with the tsconfig bug
    // TypeScript would error: TS2339: Property 'coreto' does not exist

    const coreto = window.coreto;

    // Verify type properties exist (compile-time check) - using new segregated API
    expect(typeof coreto.project.open).toBe('function');
    expect(typeof coreto.project.validate).toBe('function');
    expect(typeof coreto.simulation.run).toBe('function');
    expect(typeof coreto.simulation.start).toBe('function');
    expect(typeof coreto.simulation.getResults).toBe('function');
    expect(typeof coreto.config.load).toBe('function');
    expect(typeof coreto.config.getTrechos).toBe('function');
    expect(typeof coreto.recent.list).toBe('function');
    expect(typeof coreto.recent.add).toBe('function');
  });

  it('should have window.coreto methods with correct signatures', () => {
    // Type assertions that would fail compilation without proper types - using new segregated API
    const openProject: (projectPath: string) => Promise<unknown> = window.coreto.project.open;
    const validateProject: (projectPath: string) => Promise<unknown> = window.coreto.project.validate;
    const listRecent: (limit?: number) => Promise<unknown> = window.coreto.recent.list;

    expect(openProject).toBeDefined();
    expect(validateProject).toBeDefined();
    expect(listRecent).toBeDefined();
  });

  it('should access window.coreto.project.open without type errors', async () => {
    // Mock the implementation - using new segregated API
    const mockResult = { success: true, data: {} };
    (window.coreto.project.open as jest.Mock).mockResolvedValue(mockResult);

    // This line would cause TS2339 error without proper types
    const result = await window.coreto.project.open('/test/path');

    expect(result).toEqual(mockResult);
  });

  it('should access window.coreto.recent.list without type errors', async () => {
    // Mock the implementation - using new segregated API
    const mockResult = { success: true, data: [] };
    (window.coreto.recent.list as jest.Mock).mockResolvedValue(mockResult);

    // This line would cause TS2339 error without proper types
    const result = await window.coreto.recent.list(10);

    expect(result).toEqual(mockResult);
  });

  it('should access window.coreto.simulation.getResults without type errors', async () => {
    // Mock the implementation - using new segregated API
    const mockResult = { success: true, data: null };
    (window.coreto.simulation.getResults as jest.Mock).mockResolvedValue(mockResult);

    // This line would cause TS2339 error without proper types
    const result = await window.coreto.simulation.getResults();

    expect(result).toEqual(mockResult);
  });
});
