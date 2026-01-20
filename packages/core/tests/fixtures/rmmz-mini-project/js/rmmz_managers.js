// Minimal RMMZ managers stub for unit tests.

globalThis.SceneManager = {
  _scene: null,
  _nextScene: null,
  terminate: function () {},
  goto: function (SceneClass) {
    this._scene = new SceneClass();
    this._nextScene = null;
  },
  updateInputData: function () {},
  changeScene: function () {},
  updateScene: function () {
    if (this._scene && typeof this._scene.update === 'function') {
      this._scene.update();
    }
  },
  isGameActive: function () {
    return true;
  },
};

globalThis.BattleManager = {
  _phase: 'start',
  _actionBattlers: [],
  isBattleEnd: function () {
    return false;
  },
  isBusy: function () {
    return false;
  },
  updateEvent: function () {
    return false;
  },
  isInputting: function () {
    return true;
  },
  updatePhase: function () {},
  startTurn: function () {
    this._actionBattlers = [];
  },
  update: function () {},
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
    globalThis.$gameParty = { members: function () { return []; } };
    globalThis.$gameActors = { actor: function () { return null; } };
  },
};
