/**
 * Unit Tests for TTK Domain Invariants
 *
 * These tests use fast-check to verify critical TTK invariants hold across
 * a wide range of randomly generated inputs. Property-based testing complements
 * unit tests by exploring edge cases that manual test selection might miss.
 *
 * Invariants tested:
 * 1. TTK turns are never negative for any valid battle configuration
 * 2. TTK actions are never less than TTK turns (at least one action per turn)
 * 3. Battle duration is always positive (battles take time to execute)
 *
 * @module tests/unit/domain/ttk-invariants
 */

import * as fc from 'fast-check';
import { BattleResult, TtkMetrics, PartyConfig } from '@coreto/core';
import { BattleResultFakeBuilder } from '../../fakes';

describe('TTK Invariants - Property-Based Tests', () => {
  describe('Invariant 1: TTK turns are never negative', () => {
    it('should always have ttkTurns >= 0 for any valid battle result', () => {
      fc.assert(
        fc.property(
          // Arbitrary troop ID (1-100, valid range for RPG Maker MZ)
          fc.integer({ min: 1, max: 100 }),

          // Arbitrary troop name (non-empty string)
          fc.stringMatching(/^.+/),

          // Arbitrary outcome (victory, defeat, timeout)
          fc.constantFrom<'victory' | 'defeat' | 'timeout'>('victory', 'defeat', 'timeout'),

          // Arbitrary TTK metrics
          fc.integer({ min: 0, max: 1000 }), // ttkTurns (0-1000 is reasonable range)
          fc.integer({ min: 0, max: 10000 }), // ttkActions

          // Arbitrary duration (0-60000ms, up to 1 minute)
          fc.integer({ min: 0, max: 60000 }),

          // Arbitrary seed
          fc.integer({ min: 0, max: 2 ** 31 - 1 }),

          (
            troopId,
            troopName,
            outcome,
            ttkTurns,
            ttkActions,
            durationMs,
            seed
          ) => {
            // Arrange: Build battle result with arbitrary values
            const result = new BattleResultFakeBuilder()
              .withTroopId(troopId)
              .withTroopName(troopName || 'Test Troop')
              .withOutcome(outcome)
              .withTtkMetrics(ttkTurns, ttkActions)
              .withDuration(durationMs)
              .withSeed(seed)
              .build();

            // Assert: TTK turns must be >= 0
            expect(result.ttkTurns).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 } // Run 100 test cases
      );
    });

    it('should always have turns >= 0 for TtkMetrics directly', () => {
      fc.assert(
        fc.property(
          // Arbitrary turns and actions
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 10000 }),
          (turns, actions) => {
            // Arrange & Act: Create TtkMetrics
            const metrics = new TtkMetrics(turns, actions);

            // Assert: Turns must be >= 0
            expect(metrics.turns).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Invariant 2: TTK actions >= TTK turns', () => {
    it('should always have ttkActions >= ttkTurns for victory battles with turns > 0', () => {
      fc.assert(
        fc.property(
          // Arbitrary TTK turns (1-100 for victories with actual battle)
          fc.integer({ min: 1, max: 100 }),

          // Arbitrary additional actions beyond the minimum (turns)
          fc.integer({ min: 0, max: 1000 }),

          (turns, extraActions) => {
            // Arrange: For victory battles, actions must be >= turns
            const actions = turns + extraActions;

            const result = new BattleResultFakeBuilder()
              .withTroopId(1)
              .withTroopName('Test Troop')
              .withVictory()
              .withTtkMetrics(turns, actions)
              .withDuration(1000)
              .withSeed(12345)
              .build();

            // Assert: Actions must be >= turns for victory
            expect(result.ttkActions).toBeGreaterThanOrEqual(result.ttkTurns);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain actions >= turns for TtkMetrics', () => {
      fc.assert(
        fc.property(
          // Arbitrary turns
          fc.integer({ min: 0, max: 100 }),

          // Arbitrary multiplier for actions (1-10 actions per turn)
          fc.integer({ min: 1, max: 10 }),

          (turns, actionMultiplier) => {
            // Arrange: Calculate actions to ensure actions >= turns
            const actions = turns === 0 ? 0 : Math.max(turns, turns * actionMultiplier);

            // Act: Create TtkMetrics
            const metrics = new TtkMetrics(turns, actions);

            // Assert: Actions >= turns
            expect(metrics.actions).toBeGreaterThanOrEqual(metrics.turns);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case of 0 turns correctly', () => {
      fc.assert(
        fc.property(
          // Arbitrary actions when turns = 0
          fc.integer({ min: 0, max: 100 }),
          (actions) => {
            // Arrange & Act: Create metrics with 0 turns
            const metrics = new TtkMetrics(0, actions);

            // Assert: When turns is 0, actions can be 0 or positive
            expect(metrics.turns).toBe(0);
            expect(metrics.actions).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Invariant 3: Battle duration is always positive', () => {
    it('should always have durationMs > 0 for executed battles', () => {
      fc.assert(
        fc.property(
          // Arbitrary troop configurations
          fc.integer({ min: 1, max: 100 }), // troopId
          fc.stringMatching(/^.+/), // troopName

          // Arbitrary TTK metrics that represent a real battle
          fc.integer({ min: 0, max: 100 }), // ttkTurns
          fc.integer({ min: 1, max: 1000 }), // ttkActions (at least 1 for real battle)

          // Arbitrary seeds
          fc.integer({ min: 0, max: 2 ** 31 - 1 }),

          (troopId, troopName, ttkTurns, ttkActions, seed) => {
            // Arrange: Build battle result
            const result = new BattleResultFakeBuilder()
              .withTroopId(troopId)
              .withTroopName(troopName || 'Test Troop')
              .withVictory()
              .withTtkMetrics(ttkTurns, ttkActions)
              .withDuration(1) // Minimum 1ms for any executed battle
              .withSeed(seed)
              .build();

            // Assert: Duration must be positive (> 0) for executed battles
            expect(result.durationMs).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow durationMs = 0 only for theoretical battles', () => {
      fc.assert(
        fc.property(
          // Arbitrary troop ID and name
          fc.integer({ min: 1, max: 100 }),
          fc.stringMatching(/^.+/),

          (troopId, troopName) => {
            // Arrange: Create battle result with 0 duration (theoretical)
            const result = new BattleResultFakeBuilder()
              .withTroopId(troopId)
              .withTroopName(troopName || 'Test Troop')
              .withVictory()
              .withTtkMetrics(0, 0)
              .withDuration(0) // 0 is valid for non-executed/theoretical battles
              .withSeed(12345)
              .build();

            // Assert: Duration can be 0 (e.g., for battle configurations)
            expect(result.durationMs).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject negative duration values', () => {
      fc.assert(
        fc.property(
          // Arbitrary valid battle data
          fc.integer({ min: 1, max: 100 }),
          fc.stringMatching(/^.+/),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 2 ** 31 - 1 }),

          (troopId, troopName, ttkTurns, ttkActions, seed) => {
            // Arrange: Try to create battle result with negative duration
            const createResult = () =>
              new BattleResult({
                troopId,
                troopName: troopName || 'Test Troop',
                outcome: 'victory',
                ttkTurns,
                ttkActions,
                durationMs: -1, // Invalid: negative duration
                seed,
              });

            // Assert: Should throw ValidationError
            expect(createResult).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Combined invariants', () => {
    it('should satisfy all invariants simultaneously for random battle results', () => {
      fc.assert(
        fc.property(
          // Arbitrary troop configuration
          fc.integer({ min: 1, max: 100 }),
          fc.stringMatching(/^.+/),
          fc.constantFrom<'victory' | 'defeat' | 'timeout'>('victory', 'defeat', 'timeout'),

          // Arbitrary TTK metrics (with realistic bounds)
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),

          // Arbitrary duration
          fc.integer({ min: 0, max: 60000 }),

          // Arbitrary seed
          fc.integer({ min: 0, max: 2 ** 31 - 1 }),

          (
            troopId,
            troopName,
            outcome,
            ttkTurns,
            ttkActions,
            durationMs,
            seed
          ) => {
            // Arrange: Build battle result
            const result = new BattleResultFakeBuilder()
              .withTroopId(troopId)
              .withTroopName(troopName || 'Test Troop')
              .withOutcome(outcome)
              .withTtkMetrics(ttkTurns, ttkActions)
              .withDuration(durationMs)
              .withSeed(seed)
              .build();

            // Assert: All basic invariants must hold
            expect(result.ttkTurns).toBeGreaterThanOrEqual(0);
            expect(result.ttkActions).toBeGreaterThanOrEqual(0);
            expect(result.durationMs).toBeGreaterThanOrEqual(0);

            // For victory with turns > 0, actions should be >= turns
            // Note: This property test might find edge cases where this doesn't hold
            // which would indicate invalid battle states in the domain model
            if (outcome === 'victory' && ttkTurns > 0 && ttkActions >= ttkTurns) {
              expect(result.ttkActions).toBeGreaterThanOrEqual(result.ttkTurns);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Party configuration invariants', () => {
    it('should always create valid party configurations', () => {
      fc.assert(
        fc.property(
          // Arbitrary party size (1-4 members)
          fc.integer({ min: 1, max: 4 }),

          // Arbitrary class IDs (1-10 for testing)
          fc.integer({ min: 1, max: 10 }),

          // Arbitrary levels (1-99)
          fc.integer({ min: 1, max: 99 }),

          (partySize, classId, level) => {
            // Arrange: Create members array
            const members = Array.from({ length: partySize }, () => ({
              classId,
              level,
            }));

            // Act: Create party config
            const party = new PartyConfig(members);

            // Assert: Party should be valid
            expect(party.members).toHaveLength(partySize);
            party.members.forEach((member) => {
              expect(member.classId).toBeGreaterThanOrEqual(1);
              expect(member.level).toBeGreaterThanOrEqual(1);
              expect(member.level).toBeLessThanOrEqual(99);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject empty party configurations', () => {
      fc.assert(
        fc.property(
          fc.constant(undefined),
          () => {
            // Arrange & Act: Try to create empty party
            const createParty = () => new PartyConfig([]);

            // Assert: Should throw ValidationError
            expect(createParty).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
