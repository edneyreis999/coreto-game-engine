/**
 * Audio Shims (AudioContext, GainNode, AudioBufferSourceNode)
 *
 * Implements Web Audio API mocks for headless simulation.
 * Based on POC research (Section 2.2.1, lines 165-175).
 * ADR-015: Graphics Subsystem Mocking
 *
 * Critical features:
 * - AudioContext.currentTime MUST be a number (used for audio timers)
 * - AudioBufferSourceNode.onended MUST trigger to prevent soft-lock
 * - All methods are no-op, but maintain API compatibility
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// This file intentionally uses 'any' types to mock external Web Audio API

/**
 * Mock AudioContext implementation.
 *
 * CRITICAL: currentTime is used by RPG Maker MZ for audio timers.
 * Even in headless mode, this property must exist and be a number.
 */
class MockAudioContext {
  currentTime: number = 0; // CRITICAL: used for timers
  destination: any = {};
  sampleRate: number = 44100;
  state: string = 'running';

  createGain(): MockGainNode {
    return new MockGainNode();
  }

  createBufferSource(): MockAudioBufferSourceNode {
    return new MockAudioBufferSourceNode();
  }

  decodeAudioData(
    _data: ArrayBuffer,
    success?: (buffer: any) => void,
    _error?: (err: any) => void
  ): void {
    // Immediately resolve with dummy buffer
    if (success) {
      success({ duration: 1, sampleRate: 44100 });
    }
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  suspend(): Promise<void> {
    return Promise.resolve();
  }

  resume(): Promise<void> {
    return Promise.resolve();
  }
}

/**
 * Mock AudioBufferSourceNode.
 *
 * CRITICAL: onended callback MUST fire to prevent battle soft-lock.
 * Some battle events wait for SE/ME to finish before proceeding.
 */
class MockAudioBufferSourceNode {
  buffer: any = null;
  loop: boolean = false;
  loopStart: number = 0;
  loopEnd: number = 0;
  playbackRate: any = { value: 1 };
  detune: any = { value: 0 };
  onended: (() => void) | null = null;

  connect(_destination?: any): this {
    return this;
  }

  disconnect(): void {
    // No-op
  }

  /**
   * Starts audio playback.
   * CRITICAL: Fire onended immediately to avoid blocking battle flow.
   */
  start(_when?: number, _offset?: number, _duration?: number): void {
    // Fire onended callback asynchronously (next tick)
    if (this.onended) {
      setTimeout(() => this.onended && this.onended(), 0);
    }
  }

  /**
   * Stops audio playback.
   * Fire onended callback if registered.
   */
  stop(_when?: number): void {
    if (this.onended) {
      this.onended();
    }
  }
}

/**
 * Mock GainNode (volume control).
 */
class MockGainNode {
  gain = { value: 1 };

  connect(_destination?: any): this {
    return this;
  }

  disconnect(): void {
    // No-op
  }
}

// Inject into global scope
(global as any).AudioContext = MockAudioContext;
(global as any).webkitAudioContext = MockAudioContext; // Safari fallback
(global as any).GainNode = MockGainNode;

export { MockAudioContext, MockAudioBufferSourceNode, MockGainNode };
