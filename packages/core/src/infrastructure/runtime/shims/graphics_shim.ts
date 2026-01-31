/**
 * Graphics Mock (minimal implementation for headless simulation)
 *
 * Implements core Graphics object expected by RPG Maker MZ.
 * ADR-015: Graphics Subsystem Mocking
 *
 * Critical methods:
 * - initialize(): No-op (no WebGL context needed)
 * - render(): No-op (no visual rendering)
 * - update(): Increments frameCount (used for timing in battle engine)
 * - createEffekseerContext(): Stub for Effekseer particle system
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// This file intentionally uses 'any' types to mock external Graphics API

interface GraphicsShim {
  frameCount: number;
  width: number;
  height: number;
  boxWidth: number;
  boxHeight: number;
  _renderer: any;
  _app: any;
  initialize(width?: number, height?: number): void;
  render(): void;
  update(): void;
  createEffekseerContext(): void;
  playEffect(): void;
}

const Graphics: GraphicsShim = {
  frameCount: 0,
  width: 816,
  height: 624,
  boxWidth: 816,
  boxHeight: 624,
  _renderer: null,
  _app: null,

  /**
   * Initializes Graphics subsystem.
   * In headless mode, this is a no-op.
   */
  initialize(width: number = 816, height: number = 624): void {
    this.width = width;
    this.height = height;
    this.boxWidth = width;
    this.boxHeight = height;
    this.frameCount = 0;
  },

  /**
   * Renders frame (no-op in headless).
   */
  render(): void {
    // No-op: no visual rendering in headless mode
  },

  /**
   * Updates frameCount.
   * CRITICAL: frameCount is used for battle timers, buff/debuff durations.
   * Controlled by SyncWarpLoop (Task 23.5).
   */
  update(): void {
    this.frameCount++;
  },

  /**
   * Creates Effekseer context (stub).
   * Effekseer is used for particle effect animations.
   * In headless mode, we don't need WebGL/WASM, so this is a no-op.
   */
  createEffekseerContext(): void {
    // Stub: no Effekseer WASM module loaded
  },

  /**
   * Plays effect (stub).
   * Normally triggers Effekseer particle animation.
   */
  playEffect(): void {
    // Stub: no visual effects in headless
  },
};

// Inject into global scope
(global as any).Graphics = Graphics;

export { Graphics };
