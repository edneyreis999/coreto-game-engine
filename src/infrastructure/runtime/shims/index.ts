/**
 * Shims barrel export
 *
 * Centralizes all shim imports for HeadlessRuntimeBootstrapper.
 * Ensures correct loading order:
 * 1. Graphics, Audio, Effekseer - loaded PRE-core scripts (step2)
 * 2. ImageManager - loaded POST-core scripts (step5)
 */

export { Graphics } from './graphics_shim.js';
export { MockAudioContext, MockAudioBufferSourceNode, MockGainNode } from './audio_shim.js';
export { Effekseer } from './effekseer_shim.js';
export { setupImageManagerMock } from './imagemanager_shim.js';
