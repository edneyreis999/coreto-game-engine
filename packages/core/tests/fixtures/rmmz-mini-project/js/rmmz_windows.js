// Minimal RMMZ windows stub for unit tests.

globalThis.Window_Base = function Window_Base() {};
globalThis.Window_Base.prototype.update = function () {};

globalThis.Window_Scrollable = function Window_Scrollable() {
  this._scrollBar = null;
};
globalThis.Window_Scrollable.prototype.update = function () {
  globalThis.Window_Base.prototype.update.call(this);
};

globalThis.Window_BattleLog = function Window_BattleLog() {
  this._waitCount = 0;
  this._waitMode = '';
  this._methods = [];
};
globalThis.Window_BattleLog.prototype = Object.create(globalThis.Window_Scrollable.prototype);
globalThis.Window_BattleLog.prototype.messageSpeed = function () {
  return 16;
};
globalThis.Window_BattleLog.prototype.callNextMethod = function () {
  this._methods.shift();
};

globalThis.Window_BattleStatus = function Window_BattleStatus() {};
globalThis.Window_BattleStatus.prototype = Object.create(globalThis.Window_Scrollable.prototype);

