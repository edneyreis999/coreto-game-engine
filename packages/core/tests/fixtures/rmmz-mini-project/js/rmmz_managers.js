// Minimal RMMZ managers stub for unit tests.

globalThis.SceneManager = {
  _scene: null,
  _nextScene: null,
  _sceneFrameCount: 0,
  terminate: function () {
    this._scene = null;
    this._nextScene = null;
  },
  goto: function (SceneClass) {
    this._nextScene = SceneClass;
    this._sceneFrameCount = 0;
  },
  updateInputData: function () {},
  changeScene: function () {
    if (this._nextScene) {
      this._scene = new this._nextScene();
      this._nextScene = null;
      this._sceneFrameCount = 0;
    }
  },
  updateScene: function () {
    if (this._scene && typeof this._scene.update === 'function') {
      this._scene.update();
    }
    // Auto-end battle after a few frames for testing
    if (this._scene && this._scene.constructor === globalThis.Scene_Battle) {
      this._sceneFrameCount++;
      // End battle after 5 frames (enough for battle to be "executed")
      if (this._sceneFrameCount >= 5) {
        this.goto(globalThis.Scene_Title);
      }
    }
  },
  isGameActive: function () {
    return true;
  },
};

globalThis.BattleManager = {
  _phase: 'start',
  _actionBattlers: [],
  _battleTest: false,
  _turnCount: 0,
  _actionCount: 0,
  isBattleEnd: function () {
    // End battle when all enemies are dead (victory) or all party members are dead (defeat)
    const troops = globalThis.$gameTroop;
    const party = globalThis.$gameParty;
    if (troops && typeof troops.isAllDead === 'function' && troops.isAllDead()) {
      return true;
    }
    if (party && typeof party.isAllDead === 'function' && party.isAllDead()) {
      return true;
    }
    return false;
  },
  isBusy: function () {
    return false;
  },
  updateEvent: function () {
    // Return true to indicate event processing should continue
    // Check for battle end after setup
    if (this.isBattleEnd()) {
      return true;
    }
    return false;
  },
  isInputting: function () {
    return true;
  },
  updatePhase: function () {},
  startTurn: function () {
    this._actionBattlers = [];
  },
  update: function () {
    // Increment turn count
    this._turnCount++;
    // Increment action count
    this._actionCount++;
  },
  setBattleTest: function (battleTest) {
    this._battleTest = battleTest;
  },
  isBattleTest: function () {
    return this._battleTest;
  },
  setup: function (troopId, canEscape, canLose) {
    this._turnCount = 0;
    this._actionCount = 0;
    // Setup game troop with the specified troop
    if (globalThis.$gameTroop && typeof globalThis.$gameTroop.setup === 'function') {
      globalThis.$gameTroop.setup(troopId);
    }
  },
  isVictory: function () {
    return globalThis.$gameTroop && globalThis.$gameTroop.isAllDead();
  },
  isDefeat: function () {
    return globalThis.$gameParty && globalThis.$gameParty.isAllDead();
  },
};

globalThis.ImageManager = {
  isReady: function () {
    return true;
  },
};

globalThis.AudioManager = {};

globalThis.ColorManager = {
  textColor: function () {
    return '#ffffff';
  },
};

globalThis.Input = {
  update: function () {},
  isPressed: function () {
    return false;
  },
  isTriggered: function () {
    return false;
  },
  isRepeated: function () {
    return false;
  },
  isLongPressed: function () {
    return false;
  },
};

globalThis.TouchInput = {
  update: function () {},
  isHovered: function () {
    return false;
  },
  isPressed: function () {
    return false;
  },
  isTriggered: function () {
    return false;
  },
  isReleased: function () {
    return false;
  },
  isClicked: function () {
    return false;
  },
  isCancelled: function () {
    return false;
  },
};

// DataManager with basic load tracking. DatabaseLoader will override loadDataFile.
globalThis.DataManager = {
  _loaded: false,
  _pending: 0,
  _errorUrl: null,
  onLoad: function () {
    this._pending = Math.max(0, (this._pending || 0) - 1);
    if (this._pending === 0) {
      this._loaded = true;
    }
  },
  isDatabaseLoaded: function () {
    return this._loaded === true;
  },
  loadDatabase: function () {
    this._loaded = false;
    const files = [
      ['$dataActors', 'Actors.json'],
      ['$dataClasses', 'Classes.json'],
      ['$dataSkills', 'Skills.json'],
      ['$dataItems', 'Items.json'],
      ['$dataWeapons', 'Weapons.json'],
      ['$dataArmors', 'Armors.json'],
      ['$dataEnemies', 'Enemies.json'],
      ['$dataTroops', 'Troops.json'],
      ['$dataStates', 'States.json'],
      ['$dataSystem', 'System.json'],
    ];
    this._pending = files.length;
    for (const [name, src] of files) {
      this.loadDataFile(name, src);
    }
  },
  createGameObjects: function () {
    // Game objects are already created in rmmz_objects.js
    // This is called by bootstrap to ensure game objects exist
    // Don't override the existing objects
  },
};
