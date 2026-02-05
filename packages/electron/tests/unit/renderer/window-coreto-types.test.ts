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
 */

describe('window.coreto Type Availability', () => {
  it('should have window.coreto type available at compile time', () => {
    // This test would fail to COMPILE (not run) with the tsconfig bug
    // TypeScript would error: TS2339: Property 'coreto' does not exist
    
    const coreto = window.coreto;
    
    // Verify type properties exist (compile-time check)
    expect(typeof coreto.openProject).toBe('function');
    expect(typeof coreto.validateProject).toBe('function');
    expect(typeof coreto.runSimulation).toBe('function');
    expect(typeof coreto.startSimulation).toBe('function');
    expect(typeof coreto.getSimulationResults).toBe('function');
    expect(typeof coreto.loadConfig).toBe('function');
    expect(typeof coreto.getTrechos).toBe('function');
    expect(typeof coreto.listRecent).toBe('function');
    expect(typeof coreto.addRecent).toBe('function');
  });

  it('should have window.coreto methods with correct signatures', () => {
    // Type assertions that would fail compilation without proper types
    const openProject: (projectPath: string) => Promise<unknown> = window.coreto.openProject;
    const validateProject: (projectPath: string) => Promise<unknown> = window.coreto.validateProject;
    const listRecent: (limit?: number) => Promise<unknown> = window.coreto.listRecent;
    
    expect(openProject).toBeDefined();
    expect(validateProject).toBeDefined();
    expect(listRecent).toBeDefined();
  });

  it('should access window.coreto.openProject without type errors', async () => {
    // Mock the implementation
    const mockResult = { success: true, data: {} };
    (window.coreto.openProject as jest.Mock).mockResolvedValue(mockResult);
    
    // This line would cause TS2339 error without proper types
    const result = await window.coreto.openProject('/test/path');
    
    expect(result).toEqual(mockResult);
  });

  it('should access window.coreto.listRecent without type errors', async () => {
    // Mock the implementation
    const mockResult = { success: true, data: [] };
    (window.coreto.listRecent as jest.Mock).mockResolvedValue(mockResult);
    
    // This line would cause TS2339 error without proper types
    const result = await window.coreto.listRecent(10);
    
    expect(result).toEqual(mockResult);
  });

  it('should access window.coreto.getSimulationResults without type errors', async () => {
    // Mock the implementation
    const mockResult = { success: true, data: null };
    (window.coreto.getSimulationResults as jest.Mock).mockResolvedValue(mockResult);
    
    // This line would cause TS2339 error without proper types
    const result = await window.coreto.getSimulationResults();
    
    expect(result).toEqual(mockResult);
  });
});
