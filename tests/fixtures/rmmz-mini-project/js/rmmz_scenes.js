// Minimal RMMZ scenes stub for unit tests.

globalThis.Scene_Base = function Scene_Base() {
  this._fadeDuration = 0;
  this._fadeSign = 0;
  this._fadeOpacity = 0;
};
globalThis.Scene_Base.prototype.isBusy = function () {
  return false;
};
globalThis.Scene_Base.prototype.isActive = function () {
  return true;
};
globalThis.Scene_Base.prototype.update = function () {};

globalThis.Scene_Boot = function Scene_Boot() {};
globalThis.Scene_Boot.prototype = Object.create(globalThis.Scene_Base.prototype);

globalThis.Scene_Battle = function Scene_Battle() {};
globalThis.Scene_Battle.prototype = Object.create(globalThis.Scene_Base.prototype);

globalThis.Scene_Title = function Scene_Title() {};
globalThis.Scene_Title.prototype = Object.create(globalThis.Scene_Base.prototype);

globalThis.Scene_Gameover = function Scene_Gameover() {};
globalThis.Scene_Gameover.prototype = Object.create(globalThis.Scene_Base.prototype);

