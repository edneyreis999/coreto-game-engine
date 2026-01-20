// Minimal RMMZ sprites stub for unit tests.

globalThis.Spriteset_Base = function Spriteset_Base() {};

globalThis.Spriteset_Battle = function Spriteset_Battle() {};
globalThis.Spriteset_Battle.prototype = Object.create(globalThis.Spriteset_Base.prototype);
globalThis.Spriteset_Battle.prototype.isBusy = function () {
  return false;
};

globalThis.Sprite_Battler = function Sprite_Battler() {};

globalThis.Sprite_Button = function Sprite_Button() {};
globalThis.Sprite_Button.prototype.loadButtonImage = function () {};
globalThis.Sprite_Button.prototype.checkBitmap = function () {
  return true;
};
globalThis.Sprite_Button.prototype.updateFrame = function () {};
globalThis.Sprite_Button.prototype.updateOpacity = function () {};

