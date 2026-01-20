/**
 * Graphics Shim Unit Tests
 *
 * Validates Graphics mock behavior for headless simulation.
 * Task 20.1: Graphics Mock
 */

// Import shim to trigger global injection
import '../../../../../src/infrastructure/runtime/shims/graphics_shim';

describe('Graphics Shim', () => {
  let Graphics: any;

  beforeEach(() => {
    // Get Graphics from global (injected by import)
    Graphics = (global as any).Graphics;

    // Reset frameCount before each test
    if (Graphics) {
      Graphics.frameCount = 0;
    }
  });

  describe('initialization', () => {
    test('should exist in global scope', () => {
      expect(Graphics).toBeDefined();
    });

    test('should initialize with default dimensions', () => {
      Graphics.initialize();

      expect(Graphics.width).toBe(816);
      expect(Graphics.height).toBe(624);
      expect(Graphics.boxWidth).toBe(816);
      expect(Graphics.boxHeight).toBe(624);
    });

    test('should initialize with custom dimensions', () => {
      Graphics.initialize(1024, 768);

      expect(Graphics.width).toBe(1024);
      expect(Graphics.height).toBe(768);
      expect(Graphics.boxWidth).toBe(1024);
      expect(Graphics.boxHeight).toBe(768);
    });

    test('should reset frameCount on initialize', () => {
      Graphics.frameCount = 100;
      Graphics.initialize();

      expect(Graphics.frameCount).toBe(0);
    });
  });

  describe('update()', () => {
    test('should increment frameCount', () => {
      Graphics.frameCount = 0;

      Graphics.update();
      expect(Graphics.frameCount).toBe(1);

      Graphics.update();
      expect(Graphics.frameCount).toBe(2);

      Graphics.update();
      expect(Graphics.frameCount).toBe(3);
    });

    test('should handle multiple update cycles', () => {
      Graphics.frameCount = 0;

      for (let i = 0; i < 100; i++) {
        Graphics.update();
      }

      expect(Graphics.frameCount).toBe(100);
    });
  });

  describe('render()', () => {
    test('should not crash', () => {
      expect(() => Graphics.render()).not.toThrow();
    });

    test('should be a no-op', () => {
      const initialState = { ...Graphics };
      Graphics.render();

      // render should not modify state
      expect(Graphics.frameCount).toBe(initialState.frameCount);
      expect(Graphics.width).toBe(initialState.width);
      expect(Graphics.height).toBe(initialState.height);
    });
  });

  describe('Effekseer stubs', () => {
    test('createEffekseerContext should not crash', () => {
      expect(() => Graphics.createEffekseerContext()).not.toThrow();
    });

    test('playEffect should not crash', () => {
      expect(() => Graphics.playEffect()).not.toThrow();
    });
  });

  describe('API surface', () => {
    test('should expose all required methods', () => {
      expect(typeof Graphics.initialize).toBe('function');
      expect(typeof Graphics.render).toBe('function');
      expect(typeof Graphics.update).toBe('function');
      expect(typeof Graphics.createEffekseerContext).toBe('function');
      expect(typeof Graphics.playEffect).toBe('function');
    });

    test('should expose all required properties', () => {
      expect(typeof Graphics.frameCount).toBe('number');
      expect(typeof Graphics.width).toBe('number');
      expect(typeof Graphics.height).toBe('number');
      expect(typeof Graphics.boxWidth).toBe('number');
      expect(typeof Graphics.boxHeight).toBe('number');
    });
  });
});
