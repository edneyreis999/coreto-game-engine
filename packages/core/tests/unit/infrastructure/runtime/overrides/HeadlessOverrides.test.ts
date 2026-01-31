import { HeadlessOverrides } from '@coreto/core/infrastructure/runtime/overrides/HeadlessOverrides.js';

describe('HeadlessOverrides', () => {
  beforeEach(() => {
    // Minimal globals used by applyAll()
    (global as any).Graphics = {
      startLoading: () => {},
      endLoading: () => {},
      printLoadingError: () => {},
    };

    function ColorFilter(this: any) {}
    ColorFilter.prototype.setHue = function (this: any, hue: number) {
      // Intentionally expects uniforms to exist (override must ensure it)
      this.uniforms.hue = hue;
    };
    ColorFilter.prototype.setColorTone = function (this: any, tone: number[]) {
      this.uniforms.colorTone = tone;
    };
    ColorFilter.prototype.setBrightness = function (this: any, brightness: number) {
      this.uniforms.brightness = brightness;
    };
    ColorFilter.prototype.setBlendColor = function (this: any, color: number[]) {
      this.uniforms.blendColor = color;
    };
    (global as any).ColorFilter = ColorFilter;

    (global as any).ColorManager = {
      textColor: () => '#000000',
      loadWindowskin: () => {},
    };

    function Sprite_Button(this: any) {}
    Sprite_Button.prototype.loadButtonImage = () => {
      throw new Error('should be stubbed');
    };
    Sprite_Button.prototype.checkBitmap = () => false;
    Sprite_Button.prototype.updateFrame = () => {
      throw new Error('should be stubbed');
    };
    Sprite_Button.prototype.updateOpacity = () => {
      throw new Error('should be stubbed');
    };
    (global as any).Sprite_Button = Sprite_Button;

    // Busy state override dependencies
    function Window_Base(this: any) {
      this._updated = 0;
    }
    Window_Base.prototype.update = function (this: any) {
      this._updated++;
    };
    (global as any).Window_Base = Window_Base;

    function Window_Scrollable(this: any) {
      this._scrollBar = { update: () => { throw new Error('ignore'); } };
      this._updated = 0;
    }
    Window_Scrollable.prototype.update = function (this: any) {
      (global as any).Window_Base.prototype.update.call(this);
    };
    (global as any).Window_Scrollable = Window_Scrollable;

    function Window_BattleLog(this: any) {
      this._waitCount = 10;
      this._waitMode = 'effect';
      this._methods = [1, 2, 3];
    }
    Window_BattleLog.prototype = Object.create(Window_Scrollable.prototype);
    Window_BattleLog.prototype.messageSpeed = function () {
      return 16;
    };
    Window_BattleLog.prototype.callNextMethod = function (this: any) {
      this._methods.shift();
    };
    (global as any).Window_BattleLog = Window_BattleLog;

    function Spriteset_Base(this: any) {}
    function Spriteset_Battle(this: any) {}
    Spriteset_Battle.prototype = Object.create(Spriteset_Base.prototype);
    Spriteset_Battle.prototype.isBusy = function () {
      return true;
    };
    (global as any).Spriteset_Base = Spriteset_Base;
    (global as any).Spriteset_Battle = Spriteset_Battle;

    function Game_Temp(this: any) {}
    Game_Temp.prototype.requestAnimation = () => {
      throw new Error('should be no-op');
    };
    (global as any).Game_Temp = Game_Temp;

    // Message override dependencies
    function Game_Message(this: any) {
      this._texts = [];
      this._choices = [];
    }
    Game_Message.prototype.isBusy = function (this: any) {
      return this._texts.length > 0;
    };
    Game_Message.prototype.add = function (this: any, text: string) {
      this._texts.push(text);
    };
    (global as any).Game_Message = Game_Message;

    // Fade override dependencies
    function Scene_Base(this: any) {
      this._fadeDuration = 24;
      this._fadeSign = 1;
      this._fadeOpacity = 255;
    }
    Scene_Base.prototype.isBusy = function () {
      return true;
    };
    Scene_Base.prototype.updateFade = function () {};
    (global as any).Scene_Base = Scene_Base;

    (global as any).SceneManager = {
      isGameActive: () => false,
    };

    // Input neutralization dependencies
    (global as any).Input = {
      update: () => {},
      isPressed: (_k: string) => true,
      isTriggered: (_k: string) => true,
      isRepeated: (_k: string) => true,
      isLongPressed: (_k: string) => true,
    };
    (global as any).TouchInput = {
      update: () => {},
      isHovered: () => true,
      isPressed: () => true,
      isTriggered: () => true,
      isReleased: () => true,
      isClicked: () => true,
      isCancelled: () => true,
    };

    // Action counter init
    const partyActors = [
      { _actionCount: 0, isActor: () => true },
      { _actionCount: 0, isActor: () => true },
    ];
    (global as any).$gameParty = { members: () => partyActors, battleMembers: () => partyActors };
    (global as any).$gameTroop = { members: () => [] };

    function Game_Battler(this: any, isActor: boolean) {
      this._isActor = isActor;
      this._actionCount = 0;
    }
    Game_Battler.prototype.isActor = function (this: any) {
      return this._isActor;
    };
    Game_Battler.prototype.performActionStart = function () {};
    (global as any).Game_Battler = Game_Battler;

    // Enable applyBattleManagerDebug deeper path
    (global as any).Scene_Battle = class Scene_Battle {
      isActive() {
        return true;
      }
      isBusy() {
        return false;
      }
      update() {}
    };

    const makeAction = () => ({
      item: () => null,
      setAttack: () => {},
    });
    const makeActor = (id: number) => ({
      actorId: () => id,
      isAlive: () => true,
      canMove: () => true,
      numActions: () => 1,
      makeActions: () => {},
      action: (_i: number) => makeAction(),
      name: () => `Actor${id}`,
      makeSpeed: () => {},
      speed: () => 10,
    });
    const makeEnemy = (id: number) => ({
      enemyId: id,
      isAlive: () => true,
      canMove: () => true,
      numActions: () => 1,
      makeActions: () => {},
      name: () => `Enemy${id}`,
      makeSpeed: () => {},
      speed: () => 5,
    });

    const party = [makeActor(1)];
    const troop = [makeEnemy(1)];
    (global as any).$gameParty.members = () => party;
    (global as any).$gameParty.battleMembers = () => party;
    (global as any).$gameTroop.members = () => troop;

    (global as any).BattleManager = {
      _phase: 'input',
      _surprise: false,
      _preemptive: false,
      _actionBattlers: [],
      _subject: null,
      isInputting: () => true,
      updatePhase: () => {},
      startTurn: function (this: any) {
        this._actionBattlers = [];
      },
      isBusy: () => false,
      updateEvent: () => false,
      update: () => {},
    };
  });

  afterEach(() => {
    for (const k of [
      'Graphics',
      'ColorFilter',
      'ColorManager',
      'Sprite_Button',
      'Window_Base',
      'Window_Scrollable',
      'Window_BattleLog',
      'Spriteset_Base',
      'Spriteset_Battle',
      'Game_Temp',
      'Game_Message',
      'Scene_Base',
      'SceneManager',
      'Input',
      'TouchInput',
      '$gameParty',
      '$gameTroop',
      'Game_Battler',
      'Scene_Battle',
      'BattleManager',
    ]) {
      delete (global as any)[k];
    }
  });

  it('should neutralize busy states, messages, fades, input, and action tracking', () => {
    const overrides = new HeadlessOverrides();
    expect(() => overrides.applyAll()).not.toThrow();

    // ColorManager functions should be callable after mocking
    const ColorManager = (global as any).ColorManager;
    expect(ColorManager.textColor(1)).toBe('#ffffff');
    expect(ColorManager.normalColor()).toBe('#ffffff');
    expect(ColorManager.crisisColor()).toBe('#ffff00');
    expect(ColorManager.deathColor()).toBe('#ff0000');
    expect(ColorManager.systemColor()).toBe('#ffffff');
    expect(ColorManager.gaugeBackColor()).toBe('#000000');
    expect(ColorManager.hpGaugeColor1()).toBe('#ff0000');
    expect(ColorManager.hpGaugeColor2()).toBe('#ff4444');
    expect(ColorManager.mpGaugeColor1()).toBe('#0000ff');
    expect(ColorManager.mpGaugeColor2()).toBe('#4444ff');
    expect(ColorManager.tpGaugeColor1()).toBe('#00ff00');
    expect(ColorManager.tpGaugeColor2()).toBe('#44ff44');
    expect(ColorManager.mpCostColor()).toBe('#00ff00');
    expect(ColorManager.tpCostColor()).toBe('#00ff00');
    expect(ColorManager.powerUpColor()).toBe('#00ff00');
    expect(ColorManager.powerDownColor()).toBe('#ff0000');
    expect(ColorManager.pendingColor()).toBe('#888888');
    expect(ColorManager.paramchangeTextColor(1)).toBe('#00ff00');
    expect(ColorManager.paramchangeTextColor(-1)).toBe('#ff0000');
    expect(ColorManager.outlineColor()).toBe('rgba(0, 0, 0, 0.6)');
    expect(ColorManager.dimColor1()).toBe('rgba(0, 0, 0, 0.6)');
    expect(ColorManager.dimColor2()).toBe('rgba(0, 0, 0, 0)');
    expect(ColorManager.itemBackColor1()).toBe('rgba(32, 32, 32, 0.5)');
    expect(ColorManager.itemBackColor2()).toBe('rgba(0, 0, 0, 0.5)');
    expect(ColorManager.damageColor(0)).toBe('#ffffff');
    expect(ColorManager.hpColor({})).toBe('#ffffff');
    expect(ColorManager.mpColor({})).toBe('#ffffff');
    expect(ColorManager.tpColor({})).toBe('#ffffff');
    expect(() => ColorManager.loadWindowskin()).not.toThrow();

    // Graphics loading methods should be safe no-ops
    const Graphics = (global as any).Graphics;
    expect(() => Graphics.startLoading()).not.toThrow();
    expect(() => Graphics.endLoading()).not.toThrow();
    expect(() => Graphics.printLoadingError('x')).not.toThrow();

    // Sprite_Button methods should be safe no-ops
    const btn = new (global as any).Sprite_Button();
    expect(() => btn.loadButtonImage()).not.toThrow();
    expect(btn.checkBitmap()).toBe(true);
    expect(() => btn.updateFrame()).not.toThrow();
    expect(() => btn.updateOpacity()).not.toThrow();

    // Busy state: messageSpeed should be instant (0)
    const logWin = new (global as any).Window_BattleLog();
    expect(logWin.messageSpeed()).toBe(0);

    // Busy state: update should flush methods and remove waits
    expect(logWin._methods.length).toBeGreaterThan(0);
    logWin.update();
    expect(logWin._waitCount).toBe(0);
    expect(logWin._waitMode).toBe('');
    expect(logWin._methods.length).toBe(0);

    // Window_Scrollable.update override should tolerate scrollbar update errors
    const scrollable = new (global as any).Window_Scrollable();
    expect(() => scrollable.update()).not.toThrow();
    expect(scrollable._updated).toBe(1);

    // Spriteset busy must be forced false
    const spriteset = new (global as any).Spriteset_Battle();
    expect(spriteset.isBusy()).toBe(false);

    // Animations should be ignored
    const temp = new (global as any).Game_Temp();
    expect(() => temp.requestAnimation([], 1, false)).not.toThrow();

    // SceneManager active forced
    expect((global as any).SceneManager.isGameActive()).toBe(true);

    // Messages instant
    const msg = new (global as any).Game_Message();
    msg.add('hello');
    expect(msg.isBusy()).toBe(false);
    msg.clear();
    expect(msg.isBusy()).toBe(false);

    // Fades disabled
    const scene = new (global as any).Scene_Base();
    expect(scene.isBusy()).toBe(false);
    scene.startFadeIn(24, false);
    expect(scene._fadeDuration).toBe(0);
    scene.startFadeOut(24, false);
    expect(scene._fadeDuration).toBe(0);
    scene.updateFade();
    expect(scene._fadeDuration).toBe(0);

    // Input neutralized
    expect(() => (global as any).Input.update()).not.toThrow();
    expect((global as any).Input.isPressed('ok')).toBe(false);
    expect((global as any).Input.isTriggered('ok')).toBe(false);
    expect((global as any).Input.isRepeated('ok')).toBe(false);
    expect((global as any).Input.isLongPressed('ok')).toBe(false);

    expect(() => (global as any).TouchInput.update()).not.toThrow();
    expect((global as any).TouchInput.isClicked()).toBe(false);
    expect((global as any).TouchInput.isHovered()).toBe(false);
    expect((global as any).TouchInput.isPressed()).toBe(false);
    expect((global as any).TouchInput.isTriggered()).toBe(false);
    expect((global as any).TouchInput.isReleased()).toBe(false);
    expect((global as any).TouchInput.isCancelled()).toBe(false);

    // ColorFilter patched to safely ensure uniforms
    const cf = new (global as any).ColorFilter();
    expect(() => cf.setHue(10)).not.toThrow();
    expect(() => cf.setBrightness(200)).not.toThrow();
    expect(() => cf.setColorTone([0, 0, 0, 0])).not.toThrow();
    expect(() => cf.setBlendColor([0, 0, 0, 0])).not.toThrow();

    // Action tracking should increment only for actors
    const actor = new (global as any).Game_Battler(true);
    const enemy = new (global as any).Game_Battler(false);
    (global as any).Game_Battler.prototype.performActionStart.call(actor, {});
    (global as any).Game_Battler.prototype.performActionStart.call(enemy, {});
    expect(actor._actionCount).toBe(1);
    expect(enemy._actionCount).toBe(0);
  });

  it('should force BattleManager input phase to progress (headless)', () => {
    const overrides = new HeadlessOverrides();
    overrides.applyAll();

    const BattleManager = (global as any).BattleManager;
    BattleManager._phase = 'input';
    BattleManager.updatePhase(true);

    expect(BattleManager._actionBattlers.length).toBeGreaterThan(0);

    // Should also be safe to run wrapped update and scene update
    const scene = new (global as any).Scene_Battle();
    expect(() => scene.update()).not.toThrow();
    expect(BattleManager.isInputting()).toBe(false);

    // Exercise update wrapper logging branches
    const originalIsBusy = BattleManager.isBusy;
    const originalUpdateEvent = BattleManager.updateEvent;
    BattleManager.isBusy = () => true;
    BattleManager.updateEvent = () => false;
    expect(() => BattleManager.update(true)).not.toThrow();
    BattleManager.isBusy = () => false;
    BattleManager.updateEvent = () => true;
    expect(() => BattleManager.update(true)).not.toThrow();
    BattleManager.isBusy = originalIsBusy;
    BattleManager.updateEvent = originalUpdateEvent;

    // Non-input phase should delegate to original updatePhase without throwing
    BattleManager._phase = 'turn';
    expect(() => BattleManager.updatePhase(true)).not.toThrow();
  });

  it('should throw if core scripts are missing for busy state overrides', () => {
    delete (global as any).Window_BattleLog;
    const overrides = new HeadlessOverrides();
    expect(() => overrides.applyAll()).toThrow(/Core scripts not loaded/);
  });

  it('should gracefully skip optional overrides when globals are missing', () => {
    // Remove optional globals to exercise early-return branches
    delete (global as any).ColorFilter;
    delete (global as any).Graphics;
    delete (global as any).ColorManager;
    delete (global as any).Sprite_Button;
    delete (global as any).Game_Message;
    delete (global as any).Scene_Base;
    delete (global as any).SceneManager;
    delete (global as any).BattleManager;
    delete (global as any).Scene_Battle;

    const overrides = new HeadlessOverrides();
    expect(() => overrides.applyAll()).not.toThrow();
  });
});
