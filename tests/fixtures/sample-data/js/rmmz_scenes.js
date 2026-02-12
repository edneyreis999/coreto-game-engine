/**
 * Minimal rmmz_scenes.js for testing purposes.
 */

// Export minimal scenes - use plain classes to avoid inheritance issues
window.Scene_Base = class {};
window.Scene_Map = class {};
window.Scene_Battle = class {
  constructor() {
    this._logWindow = null;
  }
};
window.Scene_Boot = class {};
window.Scene_MenuBase = class {};
