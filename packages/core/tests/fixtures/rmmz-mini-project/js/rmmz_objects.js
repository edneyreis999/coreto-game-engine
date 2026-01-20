// Minimal RMMZ objects stub for unit tests.

globalThis.Game_Battler = function Game_Battler() {};
globalThis.Game_Battler.prototype.performActionStart = function () {};

globalThis.Game_Actor = function Game_Actor() {};
globalThis.Game_Enemy = function Game_Enemy() {};

globalThis.Game_Party = function Game_Party() {};
globalThis.Game_Party.prototype.members = function () {
  return [];
};
globalThis.Game_Party.prototype.battleMembers = function () {
  return [];
};

globalThis.Game_Troop = function Game_Troop() {};
globalThis.Game_Troop.prototype.members = function () {
  return [];
};

globalThis.Game_Action = function Game_Action() {};

globalThis.Game_Temp = function Game_Temp() {};
globalThis.Game_Temp.prototype.requestAnimation = function () {};

globalThis.Game_Message = function Game_Message() {};
globalThis.Game_Message.prototype.isBusy = function () {
  return false;
};
globalThis.Game_Message.prototype.add = function () {};

// Provide globals used by headless runtime/overrides
globalThis.$gameParty = new globalThis.Game_Party();
globalThis.$gameTroop = new globalThis.Game_Troop();
globalThis.$gameMessage = new globalThis.Game_Message();
globalThis.$gameTemp = new globalThis.Game_Temp();

