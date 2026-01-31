/**
 * SyncWarpLoop - Synchronous High-Speed Battle Simulation Loop
 *
 * Replaces the asynchronous requestAnimationFrame-based game loop with a synchronous
 * while loop that executes at "warp speed" (>1000 frames/second) for headless battle simulation.
 *
 * CRITICAL: Graphics.frameCount MUST be manually incremented for state/buff timers to work correctly.
 *
 * Based on: docs/pesquisas/Headless RPG Maker MZ_ Node.js POC.md (Section 3, lines 186-253)
 * ADR: ADR-029 (Sync Warp Loop Architecture)
 *
 * @module infrastructure/runtime/simulation
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// This file intentionally uses 'any' types to interface with RPG Maker MZ game loop APIs

/**
 * Synchronous game loop that executes at maximum speed without waiting for RAF.
 *
 * Performance Target:
 * - >1000 frames/second (vs 60 fps in browser)
 * - 1000 frames in <1 second
 * - 10000 frames in <5 seconds
 */
export class SyncWarpLoop {
  private maxFrames: number;
  private running: boolean = false;
  private simulatedFrames: number = 0;
  private initialScene: string | null = null;

  /**
   * Creates a new SyncWarpLoop instance.
   *
   * @param maxFrames - Maximum number of frames to simulate before timeout (default: 10000)
   * @param initialScene - Optional initial scene to start with (e.g., 'Scene_Battle')
   */
  constructor(maxFrames: number = 10000, initialScene?: string) {
    this.maxFrames = maxFrames;
    this.initialScene = initialScene || null;
  }

  /**
   * Starts the synchronous warp loop.
   *
   * This method:
   * 1. Terminates any previous SceneManager state
   * 2. Initializes Scene_Boot if no scene exists
   * 3. Runs synchronous while loop executing frames at maximum speed
   * 4. Stops when battle ends (Scene_Title/Scene_Gameover) or maxFrames reached
   *
   * @throws {Error} If simulation fails
   */
  start(): void {
    this.running = true;
    this.simulatedFrames = 0;

    console.log('[SyncWarpLoop] Starting warp speed simulation');

    // CRITICAL: Override ColorFilter IMMEDIATELY before creating scenes
    // RMMZ redefines ColorFilter and breaks 'this' context in headless mode
    this.applyColorFilterOverride();

    // Debug: check if override worked (gracefully handle missing PIXI in tests)
    const PIXI = (global as any).PIXI;
    if (PIXI?.filters?.ColorFilter) {
      console.log('[SyncWarpLoop] ColorFilter after override:', PIXI.filters.ColorFilter.toString().substring(0, 100));
    } else {
      console.log('[SyncWarpLoop] PIXI.filters.ColorFilter not available (test mode)');
    }

    // Finalize previous SceneManager processes to clear state (POC line 212)
    const SceneManager = (global as any).SceneManager;
    SceneManager.terminate();

    // DO NOT call SceneManager.run() - that would start async loop
    // Initialize scene manually
    if (this.initialScene) {
      // Use specified initial scene (e.g., Scene_Battle)
      const SceneClass = (global as any)[this.initialScene];
      if (!SceneClass) {
        throw new Error(`Initial scene '${this.initialScene}' not found in global scope`);
      }
      console.log(`[SyncWarpLoop] Starting with scene: ${this.initialScene}`);
      SceneManager.goto(SceneClass);
    } else if (!SceneManager._scene) {
      // Fallback to Scene_Boot
      const Scene_Boot = (global as any).Scene_Boot;
      SceneManager.goto(Scene_Boot);
    }

    try {
      // The Warp Loop - synchronous execution at maximum speed (POC line 222)
      while (this.running && this.simulatedFrames < this.maxFrames) {
        this.tick();
      }

      console.log(`[SyncWarpLoop] Completed: ${this.simulatedFrames} frames`);
    } catch (e) {
      console.error('[SyncWarpLoop] Simulation failed with error:', e);
      throw e;
    }
  }

  /**
   * Override ColorFilter to prevent crashes from RMMZ's broken implementation.
   *
   * CRITICAL: Must be called immediately before creating scenes.
   * RMMZ's ColorFilter.initialize() breaks 'this' binding in headless mode.
   */
  private applyColorFilterOverride(): void {
    const PIXI = (global as any).PIXI;

    if (!PIXI || !PIXI.filters) {
      return;
    }

    // Replace with safe stub
    function StubColorFilter(this: any): void {
      this.hue = 0;
      this.brightness = 255;
      this.colorTone = [0, 0, 0, 0];
    }

    StubColorFilter.prototype.setHue = function (hue: number) {
      this.hue = hue;
    };

    StubColorFilter.prototype.setColorTone = function (tone: number[]) {
      this.colorTone = tone;
    };

    StubColorFilter.prototype.setBrightness = function (brightness: number) {
      this.brightness = brightness;
    };

    PIXI.filters.ColorFilter = StubColorFilter;
  }

  /**
   * Executes a single frame tick.
   *
   * This method:
   * 1. Increments Graphics.frameCount (CRITICAL for buff/state timers)
   * 2. Updates SceneManager (input, scene transitions, scene logic)
   * 3. Checks for battle end conditions (Scene_Title/Scene_Gameover)
   *
   * @private
   */
  private tick(): void {
    const SceneManager = (global as any).SceneManager;
    const Graphics = (global as any).Graphics;
    const BattleManager = (global as any).BattleManager;
    const $gameTroop = (global as any).$gameTroop;
    const $gameParty = (global as any).$gameParty;
    const $gameMessage = (global as any).$gameMessage;

    // 1. Advance logical time (POC line 234)
    // Graphics.frameCount is used for state and buff timers
    Graphics.frameCount++;

    // 2. Update Managers (POC lines 238-240)
    // Skip SceneManager.updateMain() as it depends on rendering
    // Call logical updates directly
    SceneManager.updateInputData(); // Update Input wrapper state (mocks)

    // Debug scene transition
    if (this.simulatedFrames < 5) {
      console.log(`[SyncWarpLoop] Before changeScene: _scene=${SceneManager._scene?.constructor?.name}, _nextScene=${SceneManager._nextScene?.name}`);
    }

    SceneManager.changeScene(); // Manage transitions (Map -> Battle)

    if (this.simulatedFrames < 5) {
      console.log(`[SyncWarpLoop] After changeScene: _scene=${SceneManager._scene?.constructor?.name}`);
    }

    SceneManager.updateScene(); // Call .update() on current scene (Scene_Battle)

    // DIAGNOSTIC: Log battle state every 100 frames (and first 5 frames for debugging)
    if (this.simulatedFrames % 100 === 0 || this.simulatedFrames < 5) {
      console.log(`[SyncWarpLoop] Frame ${this.simulatedFrames}:`);
      console.log(`  Scene: ${SceneManager._scene?.constructor?.name || 'none'}`);

      // Debug Scene isBusy (fade check)
      const scene = SceneManager._scene;
      if (scene && typeof scene.isBusy === 'function') {
        console.log(`  Scene isBusy: ${scene.isBusy()}`);
        console.log(`  Scene isActive: ${scene.isActive?.()}`);
        console.log(`  Scene isStarted: ${scene.isStarted?.()}`);
        console.log(`  Scene isReady: ${scene.isReady?.()}`);
        console.log(`  SceneManager.isGameActive: ${SceneManager.isGameActive?.()}`);
        if (scene._fadeDuration !== undefined) {
          console.log(`    _fadeDuration: ${scene._fadeDuration}`);
        }
      }

      console.log(`  BattleManager phase: ${BattleManager?._phase || 'not started'}`);

      // Safe call to isBusy (may throw if internal state is null)
      try {
        const isBusy = BattleManager?.isBusy?.();
        console.log(`  BattleManager isBusy: ${isBusy}`);

        // Debug isBusy components
        if (isBusy && BattleManager._spriteset && BattleManager._logWindow && $gameMessage) {
          console.log(`    $gameMessage.isBusy(): ${$gameMessage.isBusy()}`);
          console.log(`    _spriteset.isBusy(): ${BattleManager._spriteset.isBusy()}`);
          console.log(`    _logWindow.isBusy(): ${BattleManager._logWindow.isBusy()}`);
        }

        console.log(`  BattleManager isBattleEnd: ${BattleManager?.isBattleEnd?.()}`);

        // Debug updateEvent blocker
        const $gameTroop = (global as any).$gameTroop;
        if ($gameTroop && typeof $gameTroop.isEventRunning === 'function') {
          console.log(`  $gameTroop.isEventRunning(): ${$gameTroop.isEventRunning()}`);
        }
      } catch (e) {
        console.log(`  BattleManager state check failed: ${(e as Error).message}`);
      }

      if ($gameTroop) {
        const enemies = $gameTroop.members();
        console.log(`  Enemies alive: ${enemies.filter((e: any) => e.isAlive()).length}/${enemies.length}`);
        enemies.forEach((e: any, i: number) => {
          console.log(`    Enemy ${i}: HP=${e.hp}/${e.mhp} (alive=${e.isAlive()})`);
        });
      }

      if ($gameParty) {
        const members = $gameParty.members();
        console.log(`  Party alive: ${members.filter((m: any) => m.isAlive()).length}/${members.length}`);
        members.forEach((m: any, i: number) => {
          console.log(`    Member ${i}: HP=${m.hp}/${m.mhp} (alive=${m.isAlive()})`);
        });
      }
    }

    // 3. Conditional Battle End Check (POC lines 244-249)
    // If scene changes to Scene_Title or Scene_Gameover, battle is over
    const Scene_Title = (global as any).Scene_Title;
    const Scene_Gameover = (global as any).Scene_Gameover;

    if (
      SceneManager._scene instanceof Scene_Title ||
      SceneManager._scene instanceof Scene_Gameover
    ) {
      console.log(`[SyncWarpLoop] Battle ended: scene changed to ${SceneManager._scene.constructor.name}`);
      this.running = false;
    }

    // Additional check: If BattleManager says battle is over
    if (BattleManager && typeof BattleManager.isBattleEnd === 'function' && BattleManager.isBattleEnd()) {
      console.log(`[SyncWarpLoop] Battle ended: BattleManager.isBattleEnd() returned true`);
      this.running = false;
    }

    this.simulatedFrames++;
  }

  /**
   * Returns the number of frames simulated so far.
   *
   * @returns Frame count
   */
  getSimulatedFrames(): number {
    return this.simulatedFrames;
  }

  /**
   * Stops the warp loop immediately.
   */
  stop(): void {
    this.running = false;
  }
}
