/**
 * SyncWarpLoop Unit Tests
 *
 * Tests for the synchronous high-speed battle simulation loop.
 *
 * @module tests/unit/infrastructure/runtime/simulation
 */

import { SyncWarpLoop } from '../../../../../src/infrastructure/runtime/simulation/SyncWarpLoop';

describe('SyncWarpLoop', () => {
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    // Mock console to suppress logs during tests
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();

    // Mock global SceneManager
    (global as any).SceneManager = {
      _scene: null,
      terminate: jest.fn(),
      goto: jest.fn((sceneClass: any) => {
        (global as any).SceneManager._scene = new sceneClass();
      }),
      updateInputData: jest.fn(),
      changeScene: jest.fn(),
      updateScene: jest.fn()
    };

    // Mock global Graphics
    (global as any).Graphics = {
      frameCount: 0
    };

    // Mock Scene classes
    (global as any).Scene_Boot = class Scene_Boot {
      update() {}
    };
    (global as any).Scene_Title = class Scene_Title {
      update() {}
    };
    (global as any).Scene_Gameover = class Scene_Gameover {
      update() {}
    };
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('constructor', () => {
    it('should initialize with default maxFrames', () => {
      const loop = new SyncWarpLoop();

      expect(loop.getSimulatedFrames()).toBe(0);
    });

    it('should initialize with custom maxFrames', () => {
      const loop = new SyncWarpLoop(5000);

      expect(loop.getSimulatedFrames()).toBe(0);
    });
  });

  describe('start', () => {
    it('should call SceneManager.terminate on start', () => {
      const loop = new SyncWarpLoop(10);

      loop.start();

      expect((global as any).SceneManager.terminate).toHaveBeenCalled();
    });

    it('should initialize Scene_Boot if no scene exists', () => {
      (global as any).SceneManager._scene = null;
      const loop = new SyncWarpLoop(10);

      loop.start();

      expect((global as any).SceneManager.goto).toHaveBeenCalledWith(
        (global as any).Scene_Boot
      );
    });

    it('should not initialize scene if scene already exists', () => {
      (global as any).SceneManager._scene = new (global as any).Scene_Boot();
      const loop = new SyncWarpLoop(10);

      loop.start();

      expect((global as any).SceneManager.goto).not.toHaveBeenCalled();
    });

    it('should execute frames synchronously', () => {
      const loop = new SyncWarpLoop(100);

      loop.start();

      expect(loop.getSimulatedFrames()).toBe(100);
    });

    it('should log completion message', () => {
      const loop = new SyncWarpLoop(50);

      loop.start();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[SyncWarpLoop] Completed: 50 frames')
      );
    });

    it('should log error and rethrow on simulation failure', () => {
      (global as any).SceneManager.updateScene = jest.fn(() => {
        throw new Error('Test error');
      });

      const loop = new SyncWarpLoop(10);

      expect(() => loop.start()).toThrow('Test error');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[SyncWarpLoop] Simulation failed'),
        expect.any(Error)
      );
    });
  });

  describe('tick', () => {
    it('should increment Graphics.frameCount on each tick', () => {
      (global as any).Graphics.frameCount = 0;
      const loop = new SyncWarpLoop(100);

      loop.start();

      expect((global as any).Graphics.frameCount).toBe(100);
    });

    it('should call SceneManager.updateInputData on each tick', () => {
      const loop = new SyncWarpLoop(50);

      loop.start();

      expect((global as any).SceneManager.updateInputData).toHaveBeenCalledTimes(50);
    });

    it('should call SceneManager.changeScene on each tick', () => {
      const loop = new SyncWarpLoop(50);

      loop.start();

      expect((global as any).SceneManager.changeScene).toHaveBeenCalledTimes(50);
    });

    it('should call SceneManager.updateScene on each tick', () => {
      const loop = new SyncWarpLoop(50);

      loop.start();

      expect((global as any).SceneManager.updateScene).toHaveBeenCalledTimes(50);
    });

    it('should stop when scene changes to Scene_Title', () => {
      let tickCount = 0;
      (global as any).SceneManager.updateScene = jest.fn(() => {
        tickCount++;
        if (tickCount === 30) {
          (global as any).SceneManager._scene = new (global as any).Scene_Title();
        }
      });

      const loop = new SyncWarpLoop(10000);
      loop.start();

      expect(loop.getSimulatedFrames()).toBe(30);
    });

    it('should stop when scene changes to Scene_Gameover', () => {
      let tickCount = 0;
      (global as any).SceneManager.updateScene = jest.fn(() => {
        tickCount++;
        if (tickCount === 42) {
          (global as any).SceneManager._scene = new (global as any).Scene_Gameover();
        }
      });

      const loop = new SyncWarpLoop(10000);
      loop.start();

      expect(loop.getSimulatedFrames()).toBe(42);
    });
  });

  describe('stop', () => {
    it('should stop when maxFrames reached', () => {
      const loop = new SyncWarpLoop(250);

      loop.start();

      expect(loop.getSimulatedFrames()).toBe(250);
    });

    it('should stop when stop() is called', () => {
      let tickCount = 0;
      (global as any).SceneManager.updateScene = jest.fn(() => {
        tickCount++;
        if (tickCount === 75) {
          loop.stop();
        }
      });

      const loop = new SyncWarpLoop(10000);
      loop.start();

      expect(loop.getSimulatedFrames()).toBe(75);
    });
  });

  describe('getSimulatedFrames', () => {
    it('should track simulated frames count', () => {
      const loop = new SyncWarpLoop(123);

      expect(loop.getSimulatedFrames()).toBe(0);

      loop.start();

      expect(loop.getSimulatedFrames()).toBe(123);
    });

    it('should return correct count when stopped early', () => {
      let tickCount = 0;
      (global as any).SceneManager.updateScene = jest.fn(() => {
        tickCount++;
        if (tickCount === 33) {
          loop.stop();
        }
      });

      const loop = new SyncWarpLoop(1000);
      loop.start();

      expect(loop.getSimulatedFrames()).toBe(33);
    });
  });

  describe('performance', () => {
    it('should execute >1000 frames in <1 second', () => {
      const loop = new SyncWarpLoop(1000);
      const startTime = Date.now();

      loop.start();

      const elapsed = Date.now() - startTime;
      const fps = (1000 / elapsed) * 1000;

      expect(loop.getSimulatedFrames()).toBe(1000);
      expect(elapsed).toBeLessThan(1000);
      expect(fps).toBeGreaterThan(1000);
    });

    it('should execute >10000 frames in <5 seconds', () => {
      const loop = new SyncWarpLoop(10000);
      const startTime = Date.now();

      loop.start();

      const elapsed = Date.now() - startTime;

      expect(loop.getSimulatedFrames()).toBe(10000);
      expect(elapsed).toBeLessThan(5000);
    });
  });
});
