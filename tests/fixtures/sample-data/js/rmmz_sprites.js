/**
 * Minimal rmmz_sprites.js for testing purposes.
 */

// Export minimal sprites - use plain classes to avoid inheritance issues
window.Sprite_Base = class {};
window.Sprite_Battler = class {};
window.Spriteset_Battle = class {
  constructor() {
    this._enemySprites = [];
    this._actorSprites = [];
  }
};
