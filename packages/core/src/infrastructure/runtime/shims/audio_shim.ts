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

/**
 * Minimal MockAudioNode interface for mock implementation.
 */
interface MockAudioNode {
  connect?(destination?: MockAudioNode): this;
  disconnect?(): void;
}

/**
 * Minimal AudioBuffer interface for mock implementation.
 */
interface MockAudioBuffer {
  duration: number;
  sampleRate: number;
}

/**
 * Mock AudioParam interface (used for playbackRate, detune, gain).
 */
interface MockAudioParam {
  value: number;
}

/**
 * Mock AudioContext implementation.
 *
 * CRITICAL: currentTime is used by RPG Maker MZ for audio timers.
 * Even in headless mode, this property must exist and be a number.
 */
class MockAudioContext {
  currentTime = 0; // CRITICAL: used for timers
  destination: MockAudioNode = null as unknown as MockAudioNode;
  sampleRate = 44100;
  state = 'running';

  createGain(): MockGainNode {
    return new MockGainNode();
  }

  createBufferSource(): MockAudioBufferSourceNode {
    return new MockAudioBufferSourceNode();
  }

  decodeAudioData(
    _data: ArrayBuffer,
    success?: (buffer: MockAudioBuffer) => void,
    _error?: (err: unknown) => void
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
  buffer: MockAudioBuffer | null = null;
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  playbackRate: MockAudioParam = { value: 1 };
  detune: MockAudioParam = { value: 0 };
  onended: (() => void) | null = null;

  connect(_destination?: MockAudioNode): this {
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
  gain: MockAudioParam = { value: 1 };

  connect(_destination?: MockAudioNode): this {
    return this;
  }

  disconnect(): void {
    // No-op
  }
}

// Inject into global scope
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).AudioContext = MockAudioContext;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).webkitAudioContext = MockAudioContext; // Safari fallback
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).GainNode = MockGainNode;

export { MockAudioContext, MockAudioBufferSourceNode, MockGainNode };
