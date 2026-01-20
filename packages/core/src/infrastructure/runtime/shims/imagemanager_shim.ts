/**
 * ImageManager Mock (image loading bypass)
 *
 * Overrides ImageManager to return dummy bitmaps that are always ready.
 * Based on POC research (Section 4.2, lines 371-384).
 * ADR-015: Graphics Subsystem Mocking
 *
 * CRITICAL: This prevents Scene_Boot from entering infinite loop waiting for images.
 * Must be applied AFTER loading rmmz_managers.js (in step5_applyOverrides).
 *
 * Key overrides:
 * - ImageManager.loadBitmap(): Returns dummy bitmap with isReady() === true
 * - ImageManager.isReady(): Always returns true
 */

/**
 * Applies ImageManager mocks to global ImageManager object.
 *
 * MUST be called AFTER rmmz_managers.js is loaded.
 * Overwrites loadBitmap and isReady methods to bypass image loading.
 *
 * @throws {Error} If ImageManager is not found (call after core scripts loaded)
 */
export function setupImageManagerMock(): void {
  const ImageManager = (global as any).ImageManager;

  if (!ImageManager) {
    throw new Error(
      'ImageManager not found - setupImageManagerMock must be called after loading rmmz_managers.js'
    );
  }

  /**
   * Override loadBitmap to return dummy bitmap that is always ready.
   *
   * Based on POC research (lines 372-380).
   * Returns a minimal bitmap-like object that satisfies RPG Maker MZ checks.
   */
  ImageManager.loadBitmap = function (_folder: string, _filename: string): any {
    return {
      // CRITICAL: isReady must return true to prevent Scene_Boot infinite loop
      isReady: () => true,

      // CRITICAL: addLoadListener must fire callback immediately
      // Execute synchronously but preserve `this` binding
      addLoadListener: function (this: any, cb: () => void) {
        if (cb) {
          cb.call(this);
        }
      },

      // Dummy properties to satisfy bitmap API
      width: 1,
      height: 1,
      _canvas: { width: 1, height: 1 },
      _context: null,
      _image: null,
      _url: '',
      _paintOpacity: 255,
      _smooth: false,
      _loadingState: 'loaded',

      // CRITICAL: _baseTexture with update() method
      // Bitmap.clearRect() calls this._baseTexture.update()
      _baseTexture: {
        update: () => {
          // No-op in headless mode
        },
      },

      // No-op methods
      blt: () => {},
      clear: () => {},
      clearRect: () => {},
      fillRect: () => {},
      gradientFillRect: () => {},
      drawCircle: () => {},
      drawText: () => {},
      getPixel: () => [0, 0, 0, 0],
      getAlphaPixel: () => 0,
    };
  };

  /**
   * Override isReady to always return true.
   *
   * Based on POC research (line 384).
   * Prevents Scene_Boot from waiting for images to load.
   */
  ImageManager.isReady = function (): boolean {
    return true;
  };

  console.log('[ImageManager] Mock applied - all images ready instantly');
}
