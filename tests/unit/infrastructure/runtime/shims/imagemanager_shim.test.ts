/**
 * ImageManager Shim Unit Tests
 *
 * Validates ImageManager mock that bypasses image loading.
 * Task 20.5-20.6: ImageManager loadBitmap and isReady mocks
 */

import { setupImageManagerMock } from '../../../../../src/infrastructure/runtime/shims/imagemanager_shim';

describe('ImageManager Shim', () => {
  describe('setupImageManagerMock()', () => {
    test('should throw error if ImageManager not found', () => {
      delete (global as any).ImageManager;

      expect(() => setupImageManagerMock()).toThrow(
        'ImageManager not found - setupImageManagerMock must be called after loading rmmz_managers.js'
      );
    });
  });

  describe('ImageManager.loadBitmap() override', () => {
    beforeEach(() => {
      // Mock ImageManager as if rmmz_managers.js loaded it
      (global as any).ImageManager = {
        loadBitmap: jest.fn(),
        isReady: jest.fn(),
      };

      setupImageManagerMock();
    });

    afterEach(() => {
      delete (global as any).ImageManager;
    });

    test('should override loadBitmap method', () => {
      const ImageManager = (global as any).ImageManager;
      expect(typeof ImageManager.loadBitmap).toBe('function');
    });

    test('should return dummy bitmap object', () => {
      const ImageManager = (global as any).ImageManager;
      const bitmap = ImageManager.loadBitmap('characters', 'Actor1');

      expect(bitmap).toBeDefined();
      expect(bitmap).toBeInstanceOf(Object);
    });

    test('bitmap.isReady() should return true (CRITICAL)', () => {
      const ImageManager = (global as any).ImageManager;
      const bitmap = ImageManager.loadBitmap('characters', 'Actor1');

      expect(bitmap.isReady()).toBe(true);
    });

    test('bitmap.addLoadListener() should fire callback immediately (CRITICAL)', () => {
      const ImageManager = (global as any).ImageManager;
      const bitmap = ImageManager.loadBitmap('characters', 'Actor1');

      let callbackFired = false;
      bitmap.addLoadListener(() => {
        callbackFired = true;
      });

      expect(callbackFired).toBe(true);
    });

    test('bitmap should have required properties', () => {
      const ImageManager = (global as any).ImageManager;
      const bitmap = ImageManager.loadBitmap('characters', 'Actor1');

      expect(bitmap.width).toBe(1);
      expect(bitmap.height).toBe(1);
      expect(bitmap._canvas).toBeDefined();
      expect(bitmap._canvas.width).toBe(1);
      expect(bitmap._canvas.height).toBe(1);
      expect(bitmap._context).toBeNull();
    });

    test('bitmap should have no-op drawing methods', () => {
      const ImageManager = (global as any).ImageManager;
      const bitmap = ImageManager.loadBitmap('characters', 'Actor1');

      expect(() => bitmap.blt()).not.toThrow();
      expect(() => bitmap.clear()).not.toThrow();
      expect(() => bitmap.clearRect()).not.toThrow();
      expect(() => bitmap.fillRect()).not.toThrow();
      expect(() => bitmap.gradientFillRect()).not.toThrow();
      expect(() => bitmap.drawCircle()).not.toThrow();
      expect(() => bitmap.drawText()).not.toThrow();
    });

    test('bitmap.getPixel() should return dummy pixel', () => {
      const ImageManager = (global as any).ImageManager;
      const bitmap = ImageManager.loadBitmap('characters', 'Actor1');

      const pixel = bitmap.getPixel(0, 0);
      expect(pixel).toEqual([0, 0, 0, 0]);
    });

    test('bitmap.getAlphaPixel() should return 0', () => {
      const ImageManager = (global as any).ImageManager;
      const bitmap = ImageManager.loadBitmap('characters', 'Actor1');

      const alpha = bitmap.getAlphaPixel(0, 0);
      expect(alpha).toBe(0);
    });
  });

  describe('ImageManager.isReady() override', () => {
    beforeEach(() => {
      (global as any).ImageManager = {
        loadBitmap: jest.fn(),
        isReady: jest.fn(),
      };

      setupImageManagerMock();
    });

    afterEach(() => {
      delete (global as any).ImageManager;
    });

    test('should override isReady method', () => {
      const ImageManager = (global as any).ImageManager;
      expect(typeof ImageManager.isReady).toBe('function');
    });

    test('should always return true (CRITICAL)', () => {
      const ImageManager = (global as any).ImageManager;

      expect(ImageManager.isReady()).toBe(true);
      expect(ImageManager.isReady()).toBe(true);
      expect(ImageManager.isReady()).toBe(true);
    });
  });

  describe('integration scenario: Scene_Boot flow', () => {
    beforeEach(() => {
      (global as any).ImageManager = {
        loadBitmap: jest.fn(),
        isReady: jest.fn().mockReturnValue(false), // Original would wait
      };

      setupImageManagerMock();
    });

    afterEach(() => {
      delete (global as any).ImageManager;
    });

    test('should prevent Scene_Boot infinite loop', () => {
      const ImageManager = (global as any).ImageManager;

      // Simulate Scene_Boot loading system images
      const systemBitmap = ImageManager.loadBitmap('system', 'Window');

      // Simulate Scene_Boot checking if ready
      let loopIterations = 0;
      const maxIterations = 1000;

      while (!ImageManager.isReady() && loopIterations < maxIterations) {
        loopIterations++;
      }

      // Should exit immediately (1 iteration max)
      expect(loopIterations).toBeLessThan(10);
      expect(ImageManager.isReady()).toBe(true);
      expect(systemBitmap.isReady()).toBe(true);
    });
  });
});
