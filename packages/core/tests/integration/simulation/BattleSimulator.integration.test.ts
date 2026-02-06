import type { RmmzDatabase, ILogger } from '@coreto/core';
import {
  BattleTimeoutError,
  HeadlessBattleSimulator,
  PartyConfig,
  ValidationError,
} from '@coreto/core';
import { RmmzDatabaseFakeBuilder } from '../../fakes';

// Mock SyncWarpLoop to prevent actual loop execution during tests
jest.mock('@coreto/core/infrastructure/runtime/simulation/SyncWarpLoop.js', () => {
  return {
    SyncWarpLoop: jest.fn().mockImplementation(() => {
      return {
        start: jest.fn(),
        getSimulatedFrames: jest.fn().mockReturnValue(10),
        stop: jest.fn(),
      };
    }),
  };
});

// Mock HeadlessRuntimeBootstrapper to prevent loading real RMMZ scripts
jest.mock('@coreto/core/infrastructure/runtime/HeadlessRuntimeBootstrapper.js', () => {
  return {
    HeadlessRuntimeBootstrapper: jest.fn().mockImplementation(() => {
      return {
        bootstrap: jest.fn().mockResolvedValue(undefined),
        cleanup: jest.fn(),
        getDOM: jest.fn().mockReturnValue(null),
      };
    }),
  };
});

/**
 * Integration tests for HeadlessBattleSimulator.
 *
 * These tests verify the full battle execution flow with mocked but complete RMMZ setup.
 * Tests cover actual battle execution, outcome determination, and determinism (ADR-018).
 */
describe('HeadlessBattleSimulator Integration', () => {
  let simulator: HeadlessBattleSimulator;
  let mockDatabase: RmmzDatabase;
  let mockGlobal: any;
  let mockLogger: ILogger;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    simulator = new HeadlessBattleSimulator(mockLogger);

    // Mock database with proper types using RmmzDatabaseFakeBuilder
    mockDatabase = new RmmzDatabaseFakeBuilder().withMinimalValidDatabase().build();

    // Add actors (not covered by withMinimalValidDatabase)
    (mockDatabase.$dataActors as any) = [null, { id: 1, name: 'Actor1' }];

    // Mock RMMZ globals
    mockGlobal = global as any;

    // Mock Math.seedrandom
    (Math as any).seedrandom = jest.fn((_seed: string) => {
      // Mock implementation - just return a function
      return () => 0.5;
    });

    // Mock BattleManager
    mockGlobal.BattleManager = {
      setBattleTest: jest.fn(),
      setup: jest.fn(),
      isBattleTest: jest.fn(() => true),
      isVictory: jest.fn(() => true),
      isDefeat: jest.fn(() => false),
      _turnCount: 5,
      _actionCount: 15,
    };

    // Mock Game_Party
    const mockMembers: any[] = [];
    mockGlobal.$gameParty = {
      clearMembers: jest.fn(() => {
        mockMembers.length = 0;
      }),
      addActor: jest.fn((actorId: number) => {
        mockMembers.push({ actorId });
      }),
      members: jest.fn(() => mockMembers),
      isAllDead: jest.fn(() => false), // Default: party alive
    };

    // Mock Game_Actors
    const actorMap = new Map<number, any>();
    mockGlobal.$gameActors = {
      actor: jest.fn((actorId: number) => {
        if (!actorMap.has(actorId)) {
          const actor = {
            _actorId: actorId,
            _classId: 1,
            _level: 1,
            changeLevel: jest.fn(function (this: any, level: number) {
              this._level = level;
            }),
            changeClass: jest.fn(function (this: any, classId: number) {
              this._classId = classId;
            }),
          };
          actorMap.set(actorId, actor);
        }
        return actorMap.get(actorId);
      }),
    };

    // Mock Game_Troop
    mockGlobal.$gameTroop = {
      members: jest.fn(() => [
        { enemyId: 1, hp: 0 }, // Dead enemy for victory condition
      ]),
      _turnCount: 5, // TTK measurement reads from $gameTroop._turnCount
      isAllDead: jest.fn(() => true), // Default: enemies dead (victory)
    };

    // SyncWarpLoop is mocked at module level
  });

  afterEach(() => {
    // Cleanup mocks
    delete mockGlobal.BattleManager;
    delete mockGlobal.$gameParty;
    delete mockGlobal.$gameActors;
    delete mockGlobal.$gameTroop;
    delete (Math as any).seedrandom;
  });

  describe('initialize', () => {
    it('should initialize with valid database', async () => {
      await expect(simulator.initialize(mockDatabase, '/fake/project/path')).resolves.not.toThrow();
    });
  });

  describe('executeBattle', () => {
    beforeEach(async () => {
      await simulator.initialize(mockDatabase, '/fake/project/path');
    });

    it('should throw ValidationError if not initialized', async () => {
      const uninitializedSimulator = new HeadlessBattleSimulator(mockLogger);
      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      await expect(uninitializedSimulator.executeBattle(setup)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if troopId not found', async () => {
      const setup = {
        troopId: 999, // Non-existent troop
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      await expect(simulator.executeBattle(setup)).rejects.toThrow(ValidationError);
    });

    it('should execute battle and return BattleResult', async () => {
      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      const result = await simulator.executeBattle(setup);

      expect(result.troopId).toBe(1);
      expect(result.troopName).toBe('Goblin Pack');
      expect(result.outcome).toBe('victory');
      expect(result.ttkTurns).toBe(5);
      expect(result.ttkActions).toBeGreaterThanOrEqual(0);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.seed).toBe(12345);
    });

    it('should override Math.random with deterministic implementation', async () => {
      const originalRandom = Math.random;
      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 42,
      };

      await simulator.executeBattle(setup);

      // Verify Math.random was overridden (seedrandom overrides it)
      expect(Math.random).not.toBe(originalRandom);

      // Restore original
      Math.random = originalRandom;
    });

    it('should setup party with correct members (CA-003)', async () => {
      const setup = {
        troopId: 1,
        party: new PartyConfig([
          { classId: 1, level: 5 },
          { classId: 1, level: 7 },
        ]),
        seed: 12345,
      };

      await simulator.executeBattle(setup);

      expect(mockGlobal.$gameParty.clearMembers).toHaveBeenCalled();
      expect(mockGlobal.$gameParty.addActor).toHaveBeenCalledTimes(2);
      expect(mockGlobal.$gameParty.members()).toHaveLength(2);
    });

    it('should set battle test mode (CA-001)', async () => {
      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      await simulator.executeBattle(setup);

      expect(mockGlobal.BattleManager.setBattleTest).toHaveBeenCalledWith(true);
    });

    it('should setup BattleManager with troopId (CA-002)', async () => {
      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      await simulator.executeBattle(setup);

      expect(mockGlobal.BattleManager.setup).toHaveBeenCalledWith(1, false, false);
    });

    it('should throw BattleTimeoutError if battle exceeds MAX_FRAMES', async () => {
      // Mock SyncWarpLoop to return more than MAX_FRAMES (10000)
      const { SyncWarpLoop } = jest.requireMock(
        '@coreto/core/infrastructure/runtime/simulation/SyncWarpLoop.js'
      );
      SyncWarpLoop.mockImplementationOnce(() => {
        return {
          start: jest.fn(),
          getSimulatedFrames: jest.fn().mockReturnValue(15000), // More than MAX_FRAMES (10000)
          stop: jest.fn(),
        };
      });

      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      await expect(simulator.executeBattle(setup)).rejects.toThrow(BattleTimeoutError);
    });

    it('should not crash when Math.seedrandom is not available', async () => {
      const originalSeedRandom = (Math as any).seedrandom;
      delete (Math as any).seedrandom;

      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      // Should complete without error (may have fallback behavior)
      await expect(simulator.executeBattle(setup)).resolves.toBeDefined();

      (Math as any).seedrandom = originalSeedRandom;
    });

    it('should support manual party clearing when clearMembers/removeAllMembers are not available', async () => {
      // Provide a party that must be cleared via removeActor loop
      const members: any[] = [{ actorId: () => 999 }];
      mockGlobal.$gameParty = {
        members: jest.fn(() => members),
        removeActor: jest.fn((_id: number) => {
          members.shift();
        }),
        addActor: jest.fn((actorId: number) => {
          members.push({ actorId: () => actorId });
        }),
        isAllDead: jest.fn(() => false),
      };

      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      const result = await simulator.executeBattle(setup);
      expect(result.troopId).toBe(1);
      expect(mockGlobal.$gameParty.removeActor).toHaveBeenCalled();
    });

    it('should capture exp gained from BattleManager rewards when available', async () => {
      mockGlobal.BattleManager._rewards = { exp: 123.9 };
      mockGlobal.$gameTroop.isAllDead = jest.fn(() => true);
      mockGlobal.$gameParty.isAllDead = jest.fn(() => false);

      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      const result = await simulator.executeBattle(setup);
      expect(result.expGained).toBe(123);
    });

    it('should return timeout outcome when neither side is dead', async () => {
      mockGlobal.$gameTroop.isAllDead = jest.fn(() => false);
      mockGlobal.$gameParty.isAllDead = jest.fn(() => false);

      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      const result = await simulator.executeBattle(setup);
      expect(result.outcome).toBe('timeout');
      expect(result.expGained).toBe(0);
    });
  });

  describe('battle outcome determination', () => {
    beforeEach(async () => {
      await simulator.initialize(mockDatabase, '/fake/project/path');
    });

    it('should return victory outcome when all enemies are dead', async () => {
      mockGlobal.$gameTroop.isAllDead = jest.fn(() => true);
      mockGlobal.$gameParty.isAllDead = jest.fn(() => false);

      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      const result = await simulator.executeBattle(setup);
      expect(result.outcome).toBe('victory');
    });

    it('should return defeat outcome when entire party is dead', async () => {
      mockGlobal.$gameTroop.isAllDead = jest.fn(() => false);
      mockGlobal.$gameParty.isAllDead = jest.fn(() => true);

      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      const result = await simulator.executeBattle(setup);
      expect(result.outcome).toBe('defeat');
    });

    it('should return timeout outcome when neither victory nor defeat', async () => {
      mockGlobal.$gameTroop.isAllDead = jest.fn(() => false);
      mockGlobal.$gameParty.isAllDead = jest.fn(() => false);

      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      const result = await simulator.executeBattle(setup);
      expect(result.outcome).toBe('timeout');
    });
  });

  describe('determinism (ADR-018)', () => {
    beforeEach(async () => {
      await simulator.initialize(mockDatabase, '/fake/project/path');
    });

    it('should use same seed for identical battles', async () => {
      const setup1 = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      const setup2 = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345, // Same seed
      };

      const result1 = await simulator.executeBattle(setup1);
      const result2 = await simulator.executeBattle(setup2);

      // Verify determinism: same seed produces identical results
      expect(result1.outcome).toBe(result2.outcome);
      expect(result1.ttkTurns).toBe(result2.ttkTurns);
      expect(result1.ttkActions).toBe(result2.ttkActions);
    });
  });
});
