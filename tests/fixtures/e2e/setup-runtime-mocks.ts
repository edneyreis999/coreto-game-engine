/**
 * E2E Runtime Mocks Setup
 *
 * Creates minimal mocks for RPG Maker MZ global objects required for E2E testing.
 * Based on unit test mocks in BattleSimulator.test.ts.
 *
 * @module tests/fixtures/e2e/setup-runtime-mocks
 */

/**
 * Setup minimal runtime mocks for E2E testing.
 *
 * Creates mocked versions of:
 * - $gameParty
 * - $gameActors
 * - $gameTroop
 * - BattleManager
 * - Graphics
 * - Math.seedrandom
 *
 * These mocks are sufficient for battle simulation to run in E2E tests.
 */
export function setupRuntimeMocks(): void {
  const globalScope = global as any;

  // Mock Math.seedrandom for deterministic RNG
  if (!(Math as any).seedrandom) {
    (Math as any).seedrandom = (seed: string) => {
      // Simple LCG implementation for testing
      let value = parseInt(seed) || 12345;
      return () => {
        value = (value * 1664525 + 1013904223) % 4294967296;
        return value / 4294967296;
      };
    };
  }

  // Mock Game_Party
  const mockMembers: any[] = [];
  globalScope.$gameParty = {
    clearMembers: () => {
      mockMembers.length = 0;
    },
    addActor: (actorId: number) => {
      // Create minimal actor mock
      const actor = {
        _actorId: actorId,
        _classId: 1,
        _level: 1,
        actorId: () => actorId,
        setClassId: (classId: number) => {
          actor._classId = classId;
        },
        changeClass: (classId: number, _keepExp: boolean) => {
          actor._classId = classId;
        },
        setLevel: (level: number) => {
          actor._level = level;
        },
        changeLevel: (level: number, _show: boolean) => {
          actor._level = level;
        },
        currentClass: () => globalScope.$dataClasses[actor._classId],
        hp: () => 100,
        mp: () => 50,
        atk: () => 50,
        def: () => 50,
        mat: () => 50,
        mdf: () => 50,
        agi: () => 50,
        luk: () => 50,
      };
      mockMembers.push(actor);
    },
    members: () => mockMembers,
  };

  // Mock Game_Actors
  let nextActorId = 1;
  const actorCache: Record<number, any> = {};

  globalScope.$gameActors = {
    actor: (actorId: number) => {
      // Return cached actor or create new one
      if (!actorCache[actorId]) {
        actorCache[actorId] = {
          _actorId: actorId,
          _classId: 1,
          _level: 1,
          actorId: () => actorId,
          setClassId: (classId: number) => {
            actorCache[actorId]._classId = classId;
          },
          changeClass: (classId: number, _keepExp: boolean) => {
            actorCache[actorId]._classId = classId;
          },
          setLevel: (level: number) => {
            actorCache[actorId]._level = level;
          },
          changeLevel: (level: number, _show: boolean) => {
            actorCache[actorId]._level = level;
          },
          currentClass: () => globalScope.$dataClasses[actorCache[actorId]._classId],
          hp: () => 100,
          mp: () => 50,
          atk: () => 50,
          def: () => 50,
          mat: () => 50,
          mdf: () => 50,
          agi: () => 50,
          luk: () => 50,
        };
      }
      return actorCache[actorId];
    },
    _data: actorCache,
    _nextId: () => nextActorId++,
  };

  // Mock Game_Troop
  const mockEnemies: any[] = [{}]; // At least one enemy to pass validation
  globalScope.$gameTroop = {
    setup: (_troopId: number) => {
      // Minimal troop setup
      mockEnemies.length = 1;
      mockEnemies[0] = { _enemyId: 1 };
    },
    members: () => mockEnemies,
    isAllDead: () => true, // For victory condition
  };

  // Mock BattleManager
  let battleFrameCount = 0;
  let battleEnded = false;
  globalScope.BattleManager = {
    setBattleTest: () => {},
    setup: () => {
      battleFrameCount = 0;
      battleEnded = false;
    },
    isBattleTest: () => true,
    isVictory: () => battleEnded,
    isDefeat: () => false,
    _turnCount: 3,
    _actionCount: 5,
    updateEvent: () => {
      // Simulate battle progress - end after ~10 frames
      battleFrameCount++;
      if (battleFrameCount >= 10) {
        battleEnded = true;
      }
      return false;
    },
    updateBattleEnd: () => {},
    processVictory: () => {},
    processDefeat: () => {},
  };

  // Mock Scene classes
  if (!globalScope.Scene_Boot) {
    globalScope.Scene_Boot = class Scene_Boot {};
  }
  if (!globalScope.Scene_Title) {
    globalScope.Scene_Title = class Scene_Title {};
  }
  if (!globalScope.Scene_Gameover) {
    globalScope.Scene_Gameover = class Scene_Gameover {};
  }
  if (!globalScope.Scene_Battle) {
    globalScope.Scene_Battle = class Scene_Battle {
      update() {}
    };
  }

  // Mock SceneManager
  if (!globalScope.SceneManager) {
    let sceneFrameCount = 0;
    globalScope.SceneManager = {
      _scene: new globalScope.Scene_Boot(),
      _nextScene: null,
      terminate: () => {},
      goto: (sceneClass: any) => {
        globalScope.SceneManager._nextScene = sceneClass;
        sceneFrameCount = 0;
      },
      scene: () => globalScope.SceneManager._scene,
      updateInputData: () => {},
      changeScene: () => {
        if (globalScope.SceneManager._nextScene) {
          globalScope.SceneManager._scene = new globalScope.SceneManager._nextScene();
          globalScope.SceneManager._nextScene = null;
        }
      },
      updateScene: () => {
        if (globalScope.SceneManager._scene && typeof globalScope.SceneManager._scene.update === 'function') {
          globalScope.SceneManager._scene.update();
        }
        // Simulate battle ending after ~10 frames
        sceneFrameCount++;
        if (sceneFrameCount >= 10 && !(globalScope.SceneManager._scene instanceof globalScope.Scene_Title)) {
          // Transition to victory scene (Scene_Title as proxy for battle end)
          globalScope.SceneManager._nextScene = globalScope.Scene_Title;
        }
      },
    };
  }

  // Mock Graphics
  if (!globalScope.Graphics) {
    globalScope.Graphics = {
      frameCount: 0,
      boxWidth: 800,
      boxHeight: 600,
      width: 800,
      height: 600,
      _defaultScale: 1,
      _realScale: 1,
    };
  }

  // Mock Input (required by some systems)
  if (!globalScope.Input) {
    globalScope.Input = {
      update: () => {},
      isTriggered: () => false,
      isPressed: () => false,
    };
  }
}

/**
 * Clean up runtime mocks after tests.
 */
export function cleanupRuntimeMocks(): void {
  const globalScope = global as any;

  delete globalScope.$gameParty;
  delete globalScope.$gameActors;
  delete globalScope.$gameTroop;
  delete globalScope.BattleManager;
  delete (Math as any).seedrandom;
}
