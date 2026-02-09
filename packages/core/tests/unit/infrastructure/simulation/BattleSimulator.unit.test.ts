import type { RmmzDatabase, ILogger } from '@coreto/core';
import {
  HeadlessBattleSimulator,
  PartyConfig,
  ValidationError,
} from '@coreto/core';
import { RmmzDatabaseFakeBuilder } from '../../../fakes';

// Mock SyncWarpLoop to prevent actual loop execution during tests
jest.mock('../../../../src/infrastructure/runtime/simulation/SyncWarpLoop.js', () => {
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
jest.mock('../../../../src/infrastructure/runtime/HeadlessRuntimeBootstrapper.js', () => {
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
 * Unit tests for HeadlessBattleSimulator.
 *
 * These tests verify the simulator's internal logic, validation, and state management.
 * All RMMZ globals are mocked to isolate the simulator from the runtime.
 */
describe('HeadlessBattleSimulator', () => {
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
    // In RMMZ, $gameActors.actor(id) lazily creates actors
    const actorMap = new Map<number, any>();
    mockGlobal.$gameActors = {
      actor: jest.fn((actorId: number) => {
        // Lazily create actor if it doesn't exist (RMMZ behavior)
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

    // SyncWarpLoop is mocked at module level, no need for scene/graphics mocks
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

    it('should throw ValidationError if database missing required fields', async () => {
      const invalidDb = { ...mockDatabase, $dataTroops: undefined } as any;
      await expect(simulator.initialize(invalidDb, '/fake/project/path')).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw if $gameParty is not initialized after bootstrap', async () => {
      delete mockGlobal.$gameParty;
      await expect(simulator.initialize(mockDatabase, '/fake/project/path')).rejects.toThrow(
        /\$gameParty not initialized/
      );
    });

    it('should throw if $gameActors is not initialized after bootstrap', async () => {
      delete mockGlobal.$gameActors;
      await expect(simulator.initialize(mockDatabase, '/fake/project/path')).rejects.toThrow(
        /\$gameActors not initialized/
      );
    });

    it('should throw if BattleManager is not initialized after bootstrap', async () => {
      delete mockGlobal.BattleManager;
      await expect(simulator.initialize(mockDatabase, '/fake/project/path')).rejects.toThrow(
        /BattleManager not initialized/
      );
    });

    it('should call HeadlessRuntimeBootstrapper.bootstrap with projectPath', async () => {
      await simulator.initialize(mockDatabase, '/fake/project/path');

      // Verify bootstrapper was called (via mock)
      const { HeadlessRuntimeBootstrapper } = require('@coreto/core');
      const mockInstance = HeadlessRuntimeBootstrapper.mock.results[0].value;
      expect(mockInstance.bootstrap).toHaveBeenCalledWith('/fake/project/path');
    });
  });

  describe('getLastMetrics', () => {
    it('should throw ValidationError if no battle executed', () => {
      expect(() => simulator.getLastMetrics()).toThrow(ValidationError);
    });

    it('should return metrics after battle execution', async () => {
      await simulator.initialize(mockDatabase, '/fake/project/path');

      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      await simulator.executeBattle(setup);

      const metrics = simulator.getLastMetrics();
      expect(metrics.turns).toBe(5);
      expect(metrics.actions).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cleanup', () => {
    it('should cleanup without errors', async () => {
      await simulator.initialize(mockDatabase, '/fake/project/path');

      // Should not throw
      await expect(simulator.cleanup()).resolves.not.toThrow();
    });

    it('should allow re-initialization after cleanup', async () => {
      await simulator.initialize(mockDatabase, '/fake/project/path');
      await simulator.cleanup();

      await expect(simulator.initialize(mockDatabase, '/fake/project/path')).resolves.not.toThrow();
    });
  });

  describe('party setup validation', () => {
    beforeEach(async () => {
      await simulator.initialize(mockDatabase, '/fake/project/path');
    });

    it('should throw ValidationError if $gameParty not initialized', async () => {
      mockGlobal.$gameParty = null;

      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      await expect(simulator.executeBattle(setup)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if party member count mismatch', async () => {
      // Mock addActor to not actually add members (simulate failure)
      mockGlobal.$gameParty.addActor = jest.fn(); // No-op
      mockGlobal.$gameParty.members = jest.fn(() => []); // Empty members

      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      await expect(simulator.executeBattle(setup)).rejects.toThrow(ValidationError);

      // Verify error context contains expected and actual values
      try {
        await simulator.executeBattle(setup);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context).toMatchObject({
          expected: 1,
          actual: 0,
        });
      }
    });
  });

  describe('battle setup validation', () => {
    beforeEach(async () => {
      await simulator.initialize(mockDatabase, '/fake/project/path');
    });

    it('should throw ValidationError if BattleManager not initialized', async () => {
      mockGlobal.BattleManager = null;

      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      await expect(simulator.executeBattle(setup)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if Game_Troop not populated after setup', async () => {
      mockGlobal.$gameTroop.members = jest.fn(() => []); // Empty troop

      const setup = {
        troopId: 1,
        party: new PartyConfig([{ classId: 1, level: 5 }]),
        seed: 12345,
      };

      await expect(simulator.executeBattle(setup)).rejects.toThrow(ValidationError);
    });
  });
});
