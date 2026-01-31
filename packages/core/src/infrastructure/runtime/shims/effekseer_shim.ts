/**
 * Effekseer Mock (particle effects system)
 *
 * Implements stubs for Effekseer particle effects.
 * Based on POC research (Section 2.1.2, lines 154-159).
 * ADR-015: Graphics Subsystem Mocking
 *
 * Effekseer is used by RPG Maker MZ for advanced particle animations.
 * In headless mode, we don't load the WASM module or WebGL context.
 * All methods are no-op stubs that satisfy initialization checks.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// This file intentionally uses 'any' types to mock external Effekseer API

interface EffekseerShim {
  initRuntime(path: string, onload: () => void, onerror: () => void): void;
  update(): void;
  release(): void;
  loadEffect(path: string): { handle: any };
}

const Effekseer: EffekseerShim = {
  /**
   * Initializes Effekseer runtime.
   * In headless mode, we skip WASM loading and immediately call onload.
   *
   * @param path - Path to Effekseer WASM module (ignored)
   * @param onload - Callback to fire on successful load
   * @param onerror - Callback to fire on error (not used)
   */
  initRuntime(_path: string, onload: () => void, _onerror: () => void): void {
    // Skip WASM loading - immediately signal success
    if (onload) {
      onload();
    }
  },

  /**
   * Updates particle effects (no-op in headless).
   */
  update(): void {
    // No-op: no particle simulation
  },

  /**
   * Releases Effekseer resources (no-op in headless).
   */
  release(): void {
    // No-op: no resources to release
  },

  /**
   * Loads an effect file.
   *
   * @param path - Path to .efkefc file (ignored)
   * @returns Dummy effect handle
   */
  loadEffect(_path: string): { handle: any } {
    // Return dummy handle to satisfy API contract
    return { handle: null };
  },
};

// Inject into global scope
(global as any).Effekseer = Effekseer;

export { Effekseer };
