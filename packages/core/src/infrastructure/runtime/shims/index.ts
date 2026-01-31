/**
 * Shims barrel export
 *
 * Centralizes all shim imports for HeadlessRuntimeBootstrapper.
 * Ensures correct loading order:
 * 1. Graphics, Audio, Effekseer - loaded PRE-core scripts (step2)
 * 2. ImageManager - loaded POST-core scripts (step5)
 * 3. PIXI - loaded for runtime rendering
 */

export { Graphics } from './graphics_shim.js';
export { MockAudioContext, MockAudioBufferSourceNode, MockGainNode } from './audio_shim.js';
export { Effekseer } from './effekseer_shim.js';
export { setupImageManagerMock } from './imagemanager_shim.js';

// PIXI.js shim for testing and headless runtime
export {
  PIXI,
  DisplayObject,
  Container,
  Sprite,
  Graphics as PixiGraphics,
  Rectangle,
  Point,
} from './pixi_shim.js';
