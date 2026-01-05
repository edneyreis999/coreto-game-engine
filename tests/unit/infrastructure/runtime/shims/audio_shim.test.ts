/**
 * Audio Shim Unit Tests
 *
 * Validates Web Audio API mocks for headless simulation.
 * Task 20.2-20.4: AudioContext, GainNode, AudioBufferSourceNode
 */

// Import shim to trigger global injection
import '../../../../../src/infrastructure/runtime/shims/audio_shim';

describe('Audio Shim', () => {
  let AudioContext: any;
  let GainNode: any;

  beforeEach(() => {
    // Get from global (injected by import)
    AudioContext = (global as any).AudioContext;
    GainNode = (global as any).GainNode;
  });

  describe('AudioContext', () => {
    test('should exist in global scope', () => {
      expect(AudioContext).toBeDefined();
    });

    test('should also exist as webkitAudioContext (Safari fallback)', () => {
      expect((global as any).webkitAudioContext).toBe(AudioContext);
    });

    test('should have currentTime property (CRITICAL)', () => {
      const ctx = new AudioContext();
      expect(typeof ctx.currentTime).toBe('number');
      expect(ctx.currentTime).toBe(0);
    });

    test('should have destination property', () => {
      const ctx = new AudioContext();
      expect(ctx.destination).toBeDefined();
    });

    test('should have sampleRate property', () => {
      const ctx = new AudioContext();
      expect(ctx.sampleRate).toBe(44100);
    });

    test('should have state property', () => {
      const ctx = new AudioContext();
      expect(ctx.state).toBe('running');
    });
  });

  describe('createGain()', () => {
    test('should return GainNode instance', () => {
      const ctx = new AudioContext();
      const gainNode = ctx.createGain();

      expect(gainNode).toBeDefined();
      expect(gainNode.gain).toBeDefined();
      expect(gainNode.gain.value).toBe(1);
    });

    test('should have connect method', () => {
      const ctx = new AudioContext();
      const gainNode = ctx.createGain();

      expect(typeof gainNode.connect).toBe('function');
      expect(() => gainNode.connect()).not.toThrow();
    });
  });

  describe('createBufferSource()', () => {
    test('should return AudioBufferSourceNode instance', () => {
      const ctx = new AudioContext();
      const sourceNode = ctx.createBufferSource();

      expect(sourceNode).toBeDefined();
    });

    test('should have required properties', () => {
      const ctx = new AudioContext();
      const sourceNode = ctx.createBufferSource();

      expect(sourceNode.buffer).toBeNull();
      expect(sourceNode.loop).toBe(false);
      expect(sourceNode.loopStart).toBe(0);
      expect(sourceNode.loopEnd).toBe(0);
      expect(sourceNode.playbackRate.value).toBe(1);
      expect(sourceNode.detune.value).toBe(0);
    });

    test('should have connect method', () => {
      const ctx = new AudioContext();
      const sourceNode = ctx.createBufferSource();

      expect(typeof sourceNode.connect).toBe('function');
      const result = sourceNode.connect();
      expect(result).toBe(sourceNode); // Should return self for chaining
    });
  });

  describe('AudioBufferSourceNode.start() - CRITICAL', () => {
    test('should not crash', () => {
      const ctx = new AudioContext();
      const sourceNode = ctx.createBufferSource();

      expect(() => sourceNode.start()).not.toThrow();
    });

    test('should fire onended callback asynchronously', (done) => {
      jest.useFakeTimers();

      const ctx = new AudioContext();
      const sourceNode = ctx.createBufferSource();

      let callbackFired = false;
      sourceNode.onended = () => {
        callbackFired = true;
        done();
      };

      sourceNode.start();

      // Callback should NOT fire synchronously
      expect(callbackFired).toBe(false);

      // Advance timers to trigger setTimeout
      jest.runAllTimers();

      jest.useRealTimers();
    });

    test('should handle missing onended callback', () => {
      const ctx = new AudioContext();
      const sourceNode = ctx.createBufferSource();

      // Should not crash when onended is null
      expect(() => sourceNode.start()).not.toThrow();
    });
  });

  describe('AudioBufferSourceNode.stop()', () => {
    test('should not crash', () => {
      const ctx = new AudioContext();
      const sourceNode = ctx.createBufferSource();

      expect(() => sourceNode.stop()).not.toThrow();
    });

    test('should fire onended callback immediately', () => {
      const ctx = new AudioContext();
      const sourceNode = ctx.createBufferSource();

      let callbackFired = false;
      sourceNode.onended = () => {
        callbackFired = true;
      };

      sourceNode.stop();

      // stop() fires callback synchronously
      expect(callbackFired).toBe(true);
    });
  });

  describe('decodeAudioData()', () => {
    test('should exist', () => {
      const ctx = new AudioContext();
      expect(typeof ctx.decodeAudioData).toBe('function');
    });

    test('should call success callback with dummy buffer', () => {
      const ctx = new AudioContext();
      const buffer = new ArrayBuffer(0);

      let callbackFired = false;
      let decodedBuffer: any = null;

      ctx.decodeAudioData(buffer, (buf: any) => {
        callbackFired = true;
        decodedBuffer = buf;
      });

      expect(callbackFired).toBe(true);
      expect(decodedBuffer).toBeDefined();
      expect(decodedBuffer.duration).toBe(1);
      expect(decodedBuffer.sampleRate).toBe(44100);
    });

    test('should handle missing success callback', () => {
      const ctx = new AudioContext();
      const buffer = new ArrayBuffer(0);

      expect(() => ctx.decodeAudioData(buffer)).not.toThrow();
    });
  });

  describe('GainNode', () => {
    test('should exist in global scope', () => {
      expect(GainNode).toBeDefined();
    });

    test('should have gain property', () => {
      const gainNode = new GainNode();
      expect(gainNode.gain).toBeDefined();
      expect(gainNode.gain.value).toBe(1);
    });

    test('should have connect method', () => {
      const gainNode = new GainNode();
      expect(typeof gainNode.connect).toBe('function');
    });
  });
});
