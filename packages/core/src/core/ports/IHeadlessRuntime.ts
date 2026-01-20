/**
 * HeadlessRuntime port interface.
 * Manages JSDOM environment and RPG Maker MZ core script loading (ADR-014, ADR-015).
 */
export interface IHeadlessRuntime {
  /**
   * Initialize JSDOM environment with required globals.
   * Sets up window, document, and required mocks (PIXI, Graphics, Effekseer, AudioManager).
   * Must be called before loadCoreScripts().
   * @throws {RuntimeError} If JSDOM initialization fails
   */
  initialize(): Promise<void>;

  /**
   * Load RPG Maker MZ core scripts into JSDOM window.
   * Implements synchronous script loading for headless execution.
   * @param projectPath - Absolute path to RPG Maker MZ project
   * @throws {RuntimeError} If core scripts are missing or invalid
   */
  loadCoreScripts(projectPath: string): Promise<void>;

  /**
   * Setup graphics/audio mocks for headless execution (ADR-015).
   * Mocks PIXI.js, Graphics, Effekseer, and AudioManager APIs.
   * Called automatically by initialize(), but can be called separately.
   */
  setupMocks(): void;

  /**
   * Cleanup JSDOM environment and free resources.
   * Should be called when simulation is complete.
   */
  cleanup(): Promise<void>;
}
