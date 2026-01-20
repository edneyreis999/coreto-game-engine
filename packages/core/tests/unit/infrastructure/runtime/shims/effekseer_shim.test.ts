/**
 * Effekseer Shim Unit Tests
 *
 * Validates Effekseer particle system mock.
 * Task 20.2: Effekseer Mock
 */

// Import shim to trigger global injection
import '../../../../../src/infrastructure/runtime/shims/effekseer_shim';

describe('Effekseer Shim', () => {
  let Effekseer: any;

  beforeEach(() => {
    // Get from global (injected by import)
    Effekseer = (global as any).Effekseer;
  });

  describe('global injection', () => {
    test('should exist in global scope', () => {
      expect(Effekseer).toBeDefined();
    });
  });

  describe('initRuntime()', () => {
    test('should exist', () => {
      expect(typeof Effekseer.initRuntime).toBe('function');
    });

    test('should call onload callback immediately', () => {
      let callbackFired = false;

      Effekseer.initRuntime(
        '/path/to/effekseer.wasm',
        () => {
          callbackFired = true;
        },
        () => {
          fail('onerror should not be called');
        }
      );

      expect(callbackFired).toBe(true);
    });

    test('should handle missing onload callback', () => {
      expect(() => {
        Effekseer.initRuntime('/path/to/effekseer.wasm', null, null);
      }).not.toThrow();
    });

    test('should not call onerror callback', () => {
      let errorCalled = false;

      Effekseer.initRuntime(
        '/path/to/effekseer.wasm',
        () => {},
        () => {
          errorCalled = true;
        }
      );

      expect(errorCalled).toBe(false);
    });
  });

  describe('update()', () => {
    test('should exist', () => {
      expect(typeof Effekseer.update).toBe('function');
    });

    test('should not crash', () => {
      expect(() => Effekseer.update()).not.toThrow();
    });

    test('should be a no-op', () => {
      const initialState = { ...Effekseer };
      Effekseer.update();

      // update should not modify state
      expect(Effekseer).toEqual(initialState);
    });
  });

  describe('release()', () => {
    test('should exist', () => {
      expect(typeof Effekseer.release).toBe('function');
    });

    test('should not crash', () => {
      expect(() => Effekseer.release()).not.toThrow();
    });
  });

  describe('loadEffect()', () => {
    test('should exist', () => {
      expect(typeof Effekseer.loadEffect).toBe('function');
    });

    test('should return dummy effect handle', () => {
      const effect = Effekseer.loadEffect('/path/to/effect.efkefc');

      expect(effect).toBeDefined();
      expect(effect.handle).toBeNull();
    });

    test('should not crash on any path', () => {
      expect(() => Effekseer.loadEffect('')).not.toThrow();
      expect(() => Effekseer.loadEffect('/some/random/path.efkefc')).not.toThrow();
    });
  });

  describe('API surface', () => {
    test('should expose all required methods', () => {
      expect(typeof Effekseer.initRuntime).toBe('function');
      expect(typeof Effekseer.update).toBe('function');
      expect(typeof Effekseer.release).toBe('function');
      expect(typeof Effekseer.loadEffect).toBe('function');
    });
  });
});
