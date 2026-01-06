// Minimal RMMZ core script stub for unit tests.
// Loaded via ScriptLoader using indirect eval, so attach to globalThis.

globalThis.Utils = globalThis.Utils || {};

globalThis.Graphics = globalThis.Graphics || { frameCount: 0 };

function ColorFilter() {
  // Simulate RMMZ constructor calling initialize immediately
  if (this && typeof this.initialize === 'function') {
    this.initialize();
  }
}

ColorFilter.prototype.initialize = function () {
  // Intentionally leave uniforms undefined to validate headless patches.
  this.hue = 0;
  this.brightness = 255;
  this.colorTone = [0, 0, 0, 0];
};

ColorFilter.prototype.setHue = function (hue) {
  this.uniforms.hue = hue;
};
ColorFilter.prototype.setColorTone = function (tone) {
  this.uniforms.colorTone = tone;
};
ColorFilter.prototype.setBrightness = function (brightness) {
  this.uniforms.brightness = brightness;
};
ColorFilter.prototype.setBlendColor = function (color) {
  this.uniforms.blendColor = color;
};

globalThis.ColorFilter = ColorFilter;

// Minimal visual classes referenced by post-load patches
globalThis.Sprite = function Sprite() {};
globalThis.Bitmap = function Bitmap() {};

// Window + openness setter intentionally crashes unless patched
globalThis.Window = function Window() {};
globalThis.Window.prototype.addChild = function () {};
globalThis.Window.prototype._createAllParts = function () {
  // Simulate headless-incompatible behavior that should be suppressed by patches
  throw new Error('visual parts not available');
};
Object.defineProperty(globalThis.Window.prototype, 'openness', {
  configurable: true,
  set: function (value) {
    // Will crash if _container doesn't exist (post-load patch must fix)
    this._container.y = value;
  },
});
