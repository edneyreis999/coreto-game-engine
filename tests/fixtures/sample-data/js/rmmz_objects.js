/**
 * Minimal rmmz_objects.js for testing purposes.
 */

// Export minimal game objects
window.Game_Actor = class {};
window.Game_Enemy = class {
  constructor(enemyId) {
    this._enemyId = enemyId;
  }
};
window.Game_Party = class {
  constructor() {
    this._actors = [];
  }
};
window.Game_Troop = class {};
window.Game_Action = class {};
window.Game_Battler = class {};
window.Game_Unit = class {};
