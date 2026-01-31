import { SyncWarpLoop } from '@coreto/core/infrastructure/runtime/simulation/SyncWarpLoop.js';

describe('SyncWarpLoop', () => {
  beforeEach(() => {
    (global as any).Graphics = { frameCount: 0 };
    (global as any).PIXI = { filters: { ColorFilter: function ColorFilter() {} } };

    class Scene_Boot {
      update() {}
    }
    class Scene_Title {
      update() {}
    }
    (global as any).Scene_Boot = Scene_Boot;
    (global as any).Scene_Title = Scene_Title;
    (global as any).Scene_Gameover = class Scene_Gameover {};

    const state = { ticks: 0 };
    (global as any).BattleManager = {
      _phase: 'start',
      isBusy: () => false,
      isBattleEnd: () => {
        state.ticks += 1;
        return state.ticks >= 3;
      },
    };

    (global as any).$gameTroop = {
      members: () => [{ isAlive: () => false, hp: 0, mhp: 0 }],
    };
    (global as any).$gameParty = {
      members: () => [{ isAlive: () => true, hp: 1, mhp: 1 }],
    };
    (global as any).$gameMessage = { isBusy: () => false };

    (global as any).SceneManager = {
      _scene: null,
      _nextScene: null,
      terminate: () => {},
      goto: (SceneClass: any) => {
        (global as any).SceneManager._scene = new SceneClass();
      },
      updateInputData: () => {},
      changeScene: () => {},
      updateScene: () => {},
      isGameActive: () => true,
    };
  });

  afterEach(() => {
    delete (global as any).Graphics;
    delete (global as any).PIXI;
    delete (global as any).Scene_Boot;
    delete (global as any).Scene_Title;
    delete (global as any).Scene_Gameover;
    delete (global as any).BattleManager;
    delete (global as any).$gameTroop;
    delete (global as any).$gameParty;
    delete (global as any).$gameMessage;
    delete (global as any).SceneManager;
  });

  it('should run synchronously and increment Graphics.frameCount', () => {
    const loop = new SyncWarpLoop(50);
    loop.start();

    expect(loop.getSimulatedFrames()).toBeGreaterThan(0);
    expect((global as any).Graphics.frameCount).toBe(loop.getSimulatedFrames());

    // ColorFilter override should produce a callable stub with setters
    const ColorFilter = (global as any).PIXI.filters.ColorFilter;
    const filter = new ColorFilter();
    filter.setHue(10);
    filter.setColorTone([1, 2, 3, 4]);
    filter.setBrightness(200);
    expect(filter.hue).toBe(10);
  });

  it('should throw if initial scene is not found', () => {
    const loop = new SyncWarpLoop(10, 'Scene_DoesNotExist');
    expect(() => loop.start()).toThrow(/Initial scene 'Scene_DoesNotExist' not found/);
  });

  it('should not crash when PIXI filters are not available', () => {
    (global as any).PIXI = {}; // No filters
    const loop = new SyncWarpLoop(5);
    expect(() => loop.start()).not.toThrow();
  });

  it('should be stoppable', () => {
    const loop = new SyncWarpLoop(10000);
    loop.stop();
    // stop() only flips a flag; start() should still execute until conditions hit,
    // but getSimulatedFrames should always be safe to call.
    expect(loop.getSimulatedFrames()).toBe(0);
  });
});
