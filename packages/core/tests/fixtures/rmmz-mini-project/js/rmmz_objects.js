// Minimal RMMZ objects stub for unit tests.

globalThis.Game_Battler = function Game_Battler() {
  this._hp = 100;
  this._isAlive = true;
};
globalThis.Game_Battler.prototype.performActionStart = function () {};
globalThis.Game_Battler.prototype.isAlive = function () {
  return this._isAlive && this._hp > 0;
};
globalThis.Game_Battler.prototype.isDead = function () {
  return !this.isAlive();
};
globalThis.Game_Battler.prototype.hp = function () {
  return this._hp;
};

globalThis.Game_Actor = function Game_Actor() {
  this._actorId = 0;
  this._classId = 1;
  this._level = 1;
  this._actionCount = 0;
  this._hp = 100;
  this._isAlive = true;
};
globalThis.Game_Actor.prototype.actorId = function () {
  return this._actorId;
};
globalThis.Game_Actor.prototype.currentClass = function () {
  return globalThis.$dataClasses[this._classId];
};
globalThis.Game_Actor.prototype.changeLevel = function (level, show) {
  this._level = level;
};
globalThis.Game_Actor.prototype.changeClass = function (classId, keepExp) {
  this._classId = classId;
};
globalThis.Game_Actor.prototype.isAlive = function () {
  return this._isAlive && this._hp > 0;
};
globalThis.Game_Actor.prototype.isDead = function () {
  return !this.isAlive();
};
globalThis.Game_Enemy = function Game_Enemy() {
  this._hp = 50;
  this._isAlive = true;
};
globalThis.Game_Enemy.prototype.isAlive = function () {
  return this._isAlive && this._hp > 0;
};
globalThis.Game_Enemy.prototype.isDead = function () {
  return !this.isAlive();
};

// Game_Actors manages all actor instances
globalThis.Game_Actors = function Game_Actors() {
  this._data = [];
};
globalThis.Game_Actors.prototype.actor = function (actorId) {
  if (actorId <= 0) return null;
  // Lazily create actor if it doesn't exist
  if (!this._data[actorId]) {
    const actor = new globalThis.Game_Actor();
    actor._actorId = actorId;
    this._data[actorId] = actor;
  }
  return this._data[actorId];
};

globalThis.Game_Party = function Game_Party() {
  this._members = [];
};
globalThis.Game_Party.prototype.members = function () {
  return this._members;
};
globalThis.Game_Party.prototype.battleMembers = function () {
  return this._members;
};
globalThis.Game_Party.prototype.clearMembers = function () {
  this._members = [];
};
globalThis.Game_Party.prototype.addActor = function (actorId) {
  const actor = globalThis.$gameActors.actor(actorId);
  if (actor && !this._members.includes(actor)) {
    this._members.push(actor);
  }
};
globalThis.Game_Party.prototype.removeActor = function (actorId) {
  const index = this._members.findIndex(function (actor) {
    return actor && actor.actorId() === actorId;
  });
  if (index >= 0) {
    this._members.splice(index, 1);
  }
};
globalThis.Game_Party.prototype.isAllDead = function () {
  return this._members.every(function (actor) {
    return !actor || actor.isDead();
  });
};

globalThis.Game_Troop = function Game_Troop() {
  this._members = [];
  this._turnCount = 0;
};
globalThis.Game_Troop.prototype.members = function () {
  return this._members;
};
globalThis.Game_Troop.prototype.setup = function (troopId) {
  const troop = globalThis.$dataTroops[troopId];
  if (troop) {
    this._members = troop.members.map(function (member) {
      const enemy = new globalThis.Game_Enemy();
      enemy._enemyId = member.enemyId;
      enemy._hp = 0; // Start dead for quick test battles
      enemy._isAlive = false;
      return enemy;
    });
  }
  this._turnCount = 0;
};
globalThis.Game_Troop.prototype.isAllDead = function () {
  return this._members.every(function (enemy) {
    return !enemy || enemy.isDead();
  });
};
globalThis.Game_Troop.prototype.onTurnEnd = function () {
  this._turnCount++;
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
globalThis.$gameActors = new globalThis.Game_Actors();
globalThis.$gameParty = new globalThis.Game_Party();
globalThis.$gameTroop = new globalThis.Game_Troop();
globalThis.$gameMessage = new globalThis.Game_Message();
globalThis.$gameTemp = new globalThis.Game_Temp();

// DataManager.createGameObjects is called by bootstrap
if (!globalThis.DataManager) {
  globalThis.DataManager = {};
}
globalThis.DataManager.createGameObjects = function () {
  // Re-create game objects (already created above, but this is called by bootstrap)
  globalThis.$gameActors = new globalThis.Game_Actors();
  globalThis.$gameParty = new globalThis.Game_Party();
  globalThis.$gameTroop = new globalThis.Game_Troop();
};


