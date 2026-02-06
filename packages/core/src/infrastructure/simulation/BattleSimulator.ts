import { inject, injectable } from 'tsyringe';
import type { IBattleSimulator, BattleSetup } from '../../core/ports/IBattleSimulator.js';
import type { RmmzDatabase } from '../../core/ports/IDataLoader.js';
import type { ILogger } from '../../core/ports/ILogger.js';
import { BattleResult } from '../../core/domain/BattleResult.js';
import { TtkMetrics } from '../../core/domain/TtkMetrics.js';
import { BattleTimeoutError } from '../../core/errors/BattleTimeoutError.js';
import { ValidationError } from '../../core/errors/ValidationError.js';
import { SyncWarpLoop } from '../runtime/simulation/SyncWarpLoop.js';
import { HeadlessRuntimeBootstrapper } from '../runtime/HeadlessRuntimeBootstrapper.js';
import { ILoggerToken } from '../di/tokens.js';
import seedrandom from 'seedrandom';

/// <reference path="../../types/rmmz-runtime.d.ts" />

/**
 * Type alias for RNG function returned by seedrandom
 */
type RandomFunction = {
  (): number;
};

/**
 * Access global RMMZ objects with proper typing
 */
const globalScope = global as typeof globalThis & {
  $gameParty: RMMZ.Game_Party;
  $gameTroop: RMMZ.Game_Troop;
  $gameActors: RMMZ.Game_Actors;
  BattleManager: RMMZ.BattleManager;
  DataManager: RMMZ.DataManager;
  SceneManager: RMMZ.SceneManager;
  Graphics: RMMZ.Graphics;
  AudioManager: RMMZ.AudioManager;
  ImageManager: RMMZ.ImageManager;
  EffectManager: RMMZ.EffectManager;
  $dataTroops: RMMZ.DataTroop[];
  $dataEnemies: RMMZ.DataEnemy[];
};

/**
 * Maximum frames allowed for a battle before timeout.
 * At 60fps equivalent, 10000 frames = ~166.67 seconds of battle time.
 * This prevents infinite loops in battle logic.
 */
const MAX_FRAMES = 10000;

/**
 * HeadlessBattleSimulator - Executes real RPG Maker MZ battles in headless mode.
 *
 * This implementation:
 * - Uses BattleManager.setup() to configure battles (ADR-003)
 * - Executes real battle logic via SyncWarpLoop (ADR-029)
 * - Measures TTK in both turns and actions (ADR-020)
 * - Applies deterministic RNG seeding (ADR-018)
 * - Enforces battle timeout via MAX_FRAMES safety check
 *
 * IMPORTANT:
 * - This simulator requires HeadlessRuntimeBootstrapper to be initialized first
 * - BattleManager and Game_Party/Game_Troop must exist in global scope
 * - Graphics.frameCount is managed by SyncWarpLoop
 *
 * @example
 * ```typescript
 * const simulator = new HeadlessBattleSimulator();
 * await simulator.initialize(database);
 *
 * const result = await simulator.executeBattle({
 *   troopId: 1,
 *   party: new PartyConfig([{ classId: 1, level: 5 }]),
 *   seed: 12345,
 *   maxTurns: 100
 * });
 * ```
 */
@injectable()
export class HeadlessBattleSimulator implements IBattleSimulator {
  private database: RmmzDatabase | null = null;
  private lastMetrics: TtkMetrics | null = null;
  private initialized = false;
  private bootstrapper: HeadlessRuntimeBootstrapper | null = null;

  constructor(@inject(ILoggerToken as unknown as string) private readonly logger: ILogger) {}

  /**
   * Initialize the battle simulator with loaded RPG Maker MZ database.
   * Sets global database variables required by BattleManager.
   *
   * @param database - Loaded RPG Maker MZ database with all required data
   * @param projectPath - Absolute path to RPG Maker MZ project root
   * @throws {ValidationError} If database is invalid or incomplete
   */
  async initialize(database: RmmzDatabase, projectPath: string): Promise<void> {
    // Validate database has required fields
    if (!database.$dataTroops || !database.$dataEnemies) {
      throw new ValidationError('Database missing required fields', {
        hasTroops: !!database.$dataTroops,
        hasEnemies: !!database.$dataEnemies,
      });
    }

    this.database = database;

    // Bootstrap headless runtime (JSDOM + core scripts + game objects)
    this.bootstrapper = new HeadlessRuntimeBootstrapper(true); // diagnostic mode ON for debugging
    await this.bootstrapper.bootstrap(projectPath);

    // Validate that $gameParty and other game objects were initialized
    if (!globalScope.$gameParty) {
      throw new ValidationError('$gameParty not initialized after bootstrap');
    }
    if (!globalScope.$gameActors) {
      throw new ValidationError('$gameActors not initialized after bootstrap');
    }
    if (!globalScope.BattleManager) {
      throw new ValidationError('BattleManager not initialized after bootstrap');
    }

    this.initialized = true;
  }

  /**
   * Execute a single battle simulation for a specific troop.
   * Measures TTK in both turns and actions (ADR-020).
   *
   * @param setup - Battle configuration with troop, party, and seed
   * @returns Battle result with TTK metrics and victory status
   * @throws {BattleTimeoutError} If battle exceeds maxFrames
   * @throws {ValidationError} If simulator not initialized or invalid setup
   */
  async executeBattle(setup: BattleSetup): Promise<BattleResult> {
    if (!this.initialized || !this.database) {
      throw new ValidationError('Simulator not initialized. Call initialize() first.');
    }

    // Validate troopId exists
    if (!this.database.$dataTroops[setup.troopId]) {
      throw new ValidationError('Troop not found in database', {
        troopId: setup.troopId,
      });
    }

    const startTime = Date.now();

    // Reset actor ID counter for this battle
    this.nextActorId = 1;

    // Setup RNG seed for deterministic execution (ADR-018)
    this.seedRandom(setup.seed);

    // Setup party with configured members
    this.setupParty(setup.party);

    // Reset action counters to prevent accumulation between battles
    this.resetActionCounters();

    // Setup battle in BattleManager
    this.setupBattle(setup.troopId);

    // Execute battle using SyncWarpLoop, starting directly with Scene_Battle
    const warpLoop = new SyncWarpLoop(MAX_FRAMES, 'Scene_Battle');
    warpLoop.start();

    const frames = warpLoop.getSimulatedFrames();
    const durationMs = Date.now() - startTime;

    // Check for timeout
    if (frames >= MAX_FRAMES) {
      throw new BattleTimeoutError(setup.troopId, frames, MAX_FRAMES);
    }

    // Measure TTK metrics
    const metrics = this.measureTtkMetrics();
    this.lastMetrics = metrics;

    // Determine battle outcome
    const outcome = this.determineBattleOutcome();

    // Capture EXP gained (best-effort; depends on RMMZ internals being available)
    const expGained = this.getBattleExpGained(outcome);

    // Get troop name
    const troopData = this.database.$dataTroops[setup.troopId];
    if (!troopData) {
      throw new ValidationError('Troop data not found', {
        troopId: setup.troopId,
      });
    }
    const troopName = troopData.name;

    return new BattleResult({
      troopId: setup.troopId,
      troopName,
      outcome,
      ttkTurns: metrics.turns,
      ttkActions: metrics.actions,
      durationMs,
      seed: setup.seed,
      expGained,
    });
  }

  /**
   * Get TTK metrics from the last executed battle.
   * Useful for diagnostic purposes (ADR-025).
   *
   * @returns TTK metrics (turns and actions) from last battle
   * @throws {ValidationError} If no battle has been executed yet
   */
  getLastMetrics(): TtkMetrics {
    if (!this.lastMetrics) {
      throw new ValidationError('No battle has been executed yet');
    }
    return this.lastMetrics;
  }

  /**
   * Cleanup resources and reset simulator state.
   * Clears database references and resets initialization flag.
   */
  async cleanup(): Promise<void> {
    // Cleanup bootstrapper
    if (this.bootstrapper) {
      this.bootstrapper.cleanup();
      this.bootstrapper = null;
    }

    this.database = null;
    this.lastMetrics = null;
    this.initialized = false;
  }

  /**
   * Seed the RNG for deterministic execution.
   *
   * Uses seedrandom library to create deterministic RNG.
   * Seeds the global Math.random for consistent battle execution.
   *
   * @param seed - RNG seed value
   * @private
   */
  private seedRandom(seed: number): void {
    // Create deterministic RNG using seedrandom library
    const rng = seedrandom(seed.toString()) as RandomFunction;

    // Override Math.random with deterministic version
    const originalMathRandom = Math.random;
    Math.random = () => rng();

    // Store original for cleanup if needed
    (
      global as typeof globalThis & { _originalMathRandom?: typeof originalMathRandom }
    )._originalMathRandom = originalMathRandom;

    this.logger.debug(`Seeded RNG with seed: ${seed}`);
  }

  /**
   * Setup the party with configured members.
   * Clears existing party and adds new members with specified classes and levels.
   *
   * CA-003: Validates that Game_Party has correct number of members.
   *
   * @param party - Party configuration with member classes and levels
   * @throws {ValidationError} If party setup fails
   * @private
   */
  private setupParty(party: { members: ReadonlyArray<{ classId: number; level: number }> }): void {
    const gameParty = globalScope.$gameParty;

    if (!gameParty) {
      throw new ValidationError('$gameParty not initialized');
    }

    // Log available methods for debugging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.logger.debug('$gameParty methods', {
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(gameParty)).filter(
        (m: string) => typeof (gameParty as any)[m] === 'function'
      ),
    });

    // Clear existing party members
    // RMMZ uses different method names depending on version
    if (typeof gameParty.clearMembers === 'function') {
      gameParty.clearMembers();
    } else if (typeof gameParty.removeAllMembers === 'function') {
      gameParty.removeAllMembers();
    } else {
      // Manual clear: remove all members
      while (gameParty.members().length > 0) {
        const firstMember = gameParty.members()[0];
        if (firstMember) {
          gameParty.removeActor?.(firstMember.actorId());
        }
      }
    }

    // Add each member with class and level
    for (const member of party.members) {
      // Create new actor with class
      const actorId = this.createActorForClass(member.classId);
      const actor = globalScope.$gameActors.actor(actorId);

      if (!actor) {
        throw new ValidationError('Failed to create actor', {
          classId: member.classId,
        });
      }

      // Set level
      if (actor.changeLevel) {
        actor.changeLevel(member.level, false); // false = don't show level up messages
      }

      // Add to party
      gameParty.addActor?.(actorId);
    }

    // CA-003: Validate party member count
    if (gameParty.members().length !== party.members.length) {
      throw new ValidationError('Party member count mismatch', {
        expected: party.members.length,
        actual: gameParty.members().length,
      });
    }
  }

  /**
   * Counter for generating sequential actor IDs for party members.
   * Resets on each battle setup.
   */
  private nextActorId = 1;

  /**
   * Create a temporary actor for a given class.
   * Uses sequential IDs starting from 1.
   *
   * Note: In RMMZ, $gameActors.actor(id) lazily creates actors, so we
   * use sequential IDs and configure each actor with the desired class.
   *
   * @param classId - Class ID from Classes.json
   * @returns Actor ID
   * @private
   */
  private createActorForClass(classId: number): number {
    const gameActors = globalScope.$gameActors;
    const actorId = this.nextActorId++;

    // Get or create actor with this ID
    const actor = gameActors.actor(actorId);
    if (actor && actor.changeClass) {
      actor.changeClass(classId, false);
    }

    return actorId;
  }

  /**
   * Setup battle in BattleManager.
   *
   * CA-001: Sets battle test mode (BattleManager.isBattleTest() returns true)
   * CA-002: Populates Game_Troop with enemies from the specified troop
   *
   * Note: Scene transition to Scene_Battle is handled by SyncWarpLoop
   *
   * @param troopId - Troop ID from Troops.json
   * @throws {ValidationError} If BattleManager not initialized
   * @private
   */
  private setupBattle(troopId: number): void {
    const BattleManager = globalScope.BattleManager;

    if (!BattleManager) {
      throw new ValidationError('BattleManager not initialized');
    }

    // CA-001: Enable battle test mode
    BattleManager.setBattleTest(true);

    // Setup battle with troop
    // canEscape=false, canLose=false for TTK measurement
    BattleManager.setup(troopId, false, false);

    // CA-002: Validate Game_Troop populated
    const gameTroop = globalScope.$gameTroop;
    if (!gameTroop || gameTroop.members().length === 0) {
      throw new ValidationError('Game_Troop not populated after setup', {
        troopId,
      });
    }
  }

  /**
   * Measure TTK metrics from the current battle state.
   * Reads turn count and action count from BattleManager.
   *
   * @returns TTK metrics with turns and actions
   * @private
   */
  private measureTtkMetrics(): TtkMetrics {
    const gameTroop = globalScope.$gameTroop;

    // Get turn count from $gameTroop._turnCount (not BattleManager)
    // $gameTroop increments _turnCount in its onTurnEnd() method
    const turns = gameTroop._turnCount || 0;

    // Get action count from BattleManager._actionCount (if available)
    // If not tracked by default, we count from action log
    const actions = this.countActionsFromLog();

    return new TtkMetrics(turns, actions);
  }

  /**
   * Count total actions from battle log.
   * Fallback method if BattleManager doesn't track action count directly.
   *
   * @returns Total action count
   * @private
   */
  private countActionsFromLog(): number {
    const gameParty = globalScope.$gameParty;

    // Count actions from party members
    let actionCount = 0;
    for (const member of gameParty.members()) {
      if (member._actionCount) {
        actionCount += member._actionCount;
      }
    }

    return actionCount;
  }

  /**
   * Determine battle outcome based on BattleManager state.
   *
   * @returns Battle outcome ('victory', 'defeat', or 'timeout')
   * @private
   */
  private determineBattleOutcome(): 'victory' | 'defeat' | 'timeout' {
    const $gameTroop = globalScope.$gameTroop;
    const $gameParty = globalScope.$gameParty;

    // Victory: all enemies dead
    if ($gameTroop && $gameTroop.isAllDead && $gameTroop.isAllDead()) {
      return 'victory';
    }

    // Defeat: entire party dead
    if ($gameParty && $gameParty.isAllDead && $gameParty.isAllDead()) {
      return 'defeat';
    }

    // Timeout: battle did not end naturally
    return 'timeout';
  }

  /**
   * Best-effort capture of total EXP gained from the current battle.
   *
   * In RPG Maker MZ, rewards are usually tracked by BattleManager._rewards (exp/gold/items)
   * and can also be derived from $gameTroop.expTotal().
   *
   * This method intentionally returns 0 for non-victory outcomes.
   */
  private getBattleExpGained(outcome: 'victory' | 'defeat' | 'timeout'): number {
    if (outcome !== 'victory') {
      return 0;
    }

    try {
      const BattleManager = globalScope.BattleManager;
      const rewardsExp = BattleManager?._rewards?.exp;
      if (typeof rewardsExp === 'number' && Number.isFinite(rewardsExp) && rewardsExp >= 0) {
        return Math.floor(rewardsExp);
      }
    } catch {
      // ignore
    }

    try {
      const $gameTroop = globalScope.$gameTroop;
      const expTotal = $gameTroop?.expTotal?.();
      if (typeof expTotal === 'number' && Number.isFinite(expTotal) && expTotal >= 0) {
        return Math.floor(expTotal);
      }
    } catch {
      // ignore
    }

    return 0;
  }

  /**
   * Reset action counters for all party members.
   * Prevents accumulation of ttkActions between battles.
   *
   * Each actor tracks actions in member._actionCount, which must be
   * reset to 0 before each battle to ensure accurate TTK measurement.
   *
   * @private
   */
  private resetActionCounters(): void {
    const gameParty = globalScope.$gameParty;
    if (gameParty && gameParty.members) {
      for (const member of gameParty.members()) {
        member._actionCount = 0;
      }
    }
  }
}
