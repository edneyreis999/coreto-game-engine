/**
 * Minimal rmmz_managers.js for testing purposes.
 */

// Export minimal managers
window.DataManager = {
  loadDatabase: function() {},
  isDatabaseLoaded: function() { return true; },
  saveGame: function() {},
  loadGame: function() {},
};

window.BattleManager = {
  setup: function() {},
  startBattle: function() {},
  endBattle: function() {},
};

window.SceneManager = {
  goto: function() {},
  push: function() {},
  pop: function() {},
};

window.ImageManager = {
  loadBitmap: function() { return {}; },
  reserveBitmap: function() {},
};

window.AudioManager = {
  playBgm: function() {},
  playSe: function() {},
  stopBgm: function() {},
};
