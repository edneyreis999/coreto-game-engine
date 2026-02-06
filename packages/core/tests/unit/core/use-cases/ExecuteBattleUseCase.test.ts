import 'reflect-metadata';
import { ExecuteBattleUseCase, ExecuteBattleInput } from '@coreto/core/core/use-cases/ExecuteBattleUseCase.js';
import { BattleTimeoutError } from '@coreto/core/core/errors/BattleTimeoutError.js';
import { TEST_CONSTANTS } from '../../../fixtures/test-constants.js';
import {
  PartyConfigFakeBuilder,
  BattleResultFakeBuilder,
  FakeBattleSimulator,
  FakeClock,
} from '../../../fakes/index.js';

describe('ExecuteBattleUseCase', () => {
  describe('execute', () => {
    it('should execute battle with correct setup', async () => {
      // Arrange
      const party = new PartyConfigFakeBuilder().withSingleMember(1, 5).build();
      const input: ExecuteBattleInput = {
        troopId: TEST_CONSTANTS.DEFAULT_TROOP_ID,
        troopName: 'Goblin Pack',
        party,
        seed: TEST_CONSTANTS.DEFAULT_SEED,
      };

      const expectedResult = new BattleResultFakeBuilder()
        .withTroopId(TEST_CONSTANTS.DEFAULT_TROOP_ID)
        .withTroopName('Goblin Pack')
        .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withDuration(TEST_CONSTANTS.DEFAULT_DURATION_MS)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const simulator = new FakeBattleSimulator(expectedResult);
      const clock = new FakeClock();
      const useCase = new ExecuteBattleUseCase(simulator, clock);

      // Act
      const output = await useCase.execute(input);

      // Assert
      expect(output.result).toEqual(expectedResult);
      expect(simulator.executeBattleCalls).toHaveLength(1);
      expect(simulator.executeBattleCalls[0]).toEqual({
        troopId: TEST_CONSTANTS.DEFAULT_TROOP_ID,
        party,
        seed: TEST_CONSTANTS.DEFAULT_SEED,
        maxTurns: undefined,
      });
    });

    it('should return duration in milliseconds', async () => {
      // Arrange
      const party = new PartyConfigFakeBuilder().withSingleMember(1, 5).build();
      const input: ExecuteBattleInput = {
        troopId: TEST_CONSTANTS.DEFAULT_TROOP_ID,
        troopName: 'Goblin Pack',
        party,
        seed: TEST_CONSTANTS.DEFAULT_SEED,
      };

      const expectedResult = new BattleResultFakeBuilder()
        .withTroopId(TEST_CONSTANTS.DEFAULT_TROOP_ID)
        .withTroopName('Goblin Pack')
        .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withDuration(TEST_CONSTANTS.DEFAULT_DURATION_MS)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const simulator = new FakeBattleSimulator(expectedResult);
      const clock = new FakeClock();
      const useCase = new ExecuteBattleUseCase(simulator, clock);

      // Act
      const output = await useCase.execute(input);

      // Assert
      expect(output.durationMs).toBeGreaterThanOrEqual(0);
      expect(typeof output.durationMs).toBe('number');
    });

    it('should pass seed to simulator', async () => {
      // Arrange
      const party = new PartyConfigFakeBuilder().withSingleMember(1, 5).build();
      const customSeed = 99999;
      const input: ExecuteBattleInput = {
        troopId: TEST_CONSTANTS.DEFAULT_TROOP_ID,
        troopName: 'Goblin Pack',
        party,
        seed: customSeed,
      };

      const expectedResult = new BattleResultFakeBuilder()
        .withTroopId(TEST_CONSTANTS.DEFAULT_TROOP_ID)
        .withTroopName('Goblin Pack')
        .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withDuration(TEST_CONSTANTS.DEFAULT_DURATION_MS)
        .withSeed(customSeed)
        .build();

      const simulator = new FakeBattleSimulator(expectedResult);
      const clock = new FakeClock();
      const useCase = new ExecuteBattleUseCase(simulator, clock);

      // Act
      await useCase.execute(input);

      // Assert
      expect(simulator.executeBattleCalls[0]?.seed).toBe(customSeed);
    });

    it('should handle battle timeout error', async () => {
      // Arrange
      const party = new PartyConfigFakeBuilder().withSingleMember(1, 5).build();
      const input: ExecuteBattleInput = {
        troopId: TEST_CONSTANTS.DEFAULT_TROOP_ID,
        troopName: 'Goblin Pack',
        party,
        seed: TEST_CONSTANTS.DEFAULT_SEED,
      };

      const timeoutError = new BattleTimeoutError(1, 10000, 100);

      const simulator = new FakeBattleSimulator(
        new BattleResultFakeBuilder().build()
      );
      simulator.throwOnExecute(timeoutError);

      const clock = new FakeClock();
      const useCase = new ExecuteBattleUseCase(simulator, clock);

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(BattleTimeoutError);
    });

    it('should use maxTurns when provided', async () => {
      // Arrange
      const party = new PartyConfigFakeBuilder().withSingleMember(1, 5).build();
      const input: ExecuteBattleInput = {
        troopId: TEST_CONSTANTS.DEFAULT_TROOP_ID,
        troopName: 'Goblin Pack',
        party,
        seed: TEST_CONSTANTS.DEFAULT_SEED,
        maxTurns: 50,
      };

      const expectedResult = new BattleResultFakeBuilder()
        .withTroopId(TEST_CONSTANTS.DEFAULT_TROOP_ID)
        .withTroopName('Goblin Pack')
        .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withDuration(TEST_CONSTANTS.DEFAULT_DURATION_MS)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const simulator = new FakeBattleSimulator(expectedResult);
      const clock = new FakeClock();
      const useCase = new ExecuteBattleUseCase(simulator, clock);

      // Act
      await useCase.execute(input);

      // Assert
      expect(simulator.executeBattleCalls[0]?.maxTurns).toBe(50);
    });

    it('should include result from simulator', async () => {
      // Arrange
      const party = new PartyConfigFakeBuilder().withSingleMember(1, 5).build();
      const input: ExecuteBattleInput = {
        troopId: TEST_CONSTANTS.DEFAULT_TROOP_ID,
        troopName: 'Goblin Pack',
        party,
        seed: TEST_CONSTANTS.DEFAULT_SEED,
      };

      const expectedResult = new BattleResultFakeBuilder()
        .withTroopId(TEST_CONSTANTS.DEFAULT_TROOP_ID)
        .withTroopName('Goblin Pack')
        .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withDuration(TEST_CONSTANTS.DEFAULT_DURATION_MS)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      const simulator = new FakeBattleSimulator(expectedResult);
      const clock = new FakeClock();
      const useCase = new ExecuteBattleUseCase(simulator, clock);

      // Act
      const output = await useCase.execute(input);

      // Assert
      expect(output.result).toBe(expectedResult);
      expect(output.result.troopId).toBe(TEST_CONSTANTS.DEFAULT_TROOP_ID);
      expect(output.result.outcome).toBe('victory');
    });
  });
});
