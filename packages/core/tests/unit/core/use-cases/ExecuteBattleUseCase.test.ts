import 'reflect-metadata';
import { ExecuteBattleUseCase, ExecuteBattleInput } from '@coreto/core';
import { IBattleSimulator, BattleSetup } from '@coreto/core';
import { BattleTimeoutError } from '@coreto/core';

import { BattleResultFakeBuilder } from '../../../fixtures/builders/BattleResultFakeBuilder';
import { PartyConfigFakeBuilder } from '../../../fixtures/builders/PartyConfigFakeBuilder';
import { TEST_CONSTANTS } from '../../../fixtures/test-constants';

describe('ExecuteBattleUseCase', () => {
  let useCase: ExecuteBattleUseCase;
  let mockSimulator: jest.Mocked<IBattleSimulator>;

  beforeEach(() => {
    // Create mock simulator
    mockSimulator = {
      initialize: jest.fn(),
      executeBattle: jest.fn(),
      getLastMetrics: jest.fn(),
      cleanup: jest.fn(),
    };

    // Inject mock simulator
    useCase = new ExecuteBattleUseCase(mockSimulator);
  });

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

      const mockResult = new BattleResultFakeBuilder()
        .withTroopId(TEST_CONSTANTS.DEFAULT_TROOP_ID)
        .withTroopName('Goblin Pack')
        .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withDuration(TEST_CONSTANTS.DEFAULT_DURATION_MS)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      mockSimulator.executeBattle.mockResolvedValue(mockResult);

      // Act
      const output = await useCase.execute(input);

      // Assert
      expect(mockSimulator.executeBattle).toHaveBeenCalledWith({
        troopId: TEST_CONSTANTS.DEFAULT_TROOP_ID,
        party,
        seed: TEST_CONSTANTS.DEFAULT_SEED,
        maxTurns: undefined,
      });
      expect(output.result).toEqual(mockResult);
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

      const mockResult = new BattleResultFakeBuilder()
        .withTroopId(TEST_CONSTANTS.DEFAULT_TROOP_ID)
        .withTroopName('Goblin Pack')
        .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withDuration(TEST_CONSTANTS.DEFAULT_DURATION_MS)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      mockSimulator.executeBattle.mockResolvedValue(mockResult);

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

      const mockResult = new BattleResultFakeBuilder()
        .withTroopId(TEST_CONSTANTS.DEFAULT_TROOP_ID)
        .withTroopName('Goblin Pack')
        .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withDuration(TEST_CONSTANTS.DEFAULT_DURATION_MS)
        .withSeed(customSeed)
        .build();

      mockSimulator.executeBattle.mockResolvedValue(mockResult);

      // Act
      await useCase.execute(input);

      // Assert
      const calledSetup = mockSimulator.executeBattle.mock.calls[0]?.[0] as BattleSetup;
      expect(calledSetup.seed).toBe(customSeed);
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
      mockSimulator.executeBattle.mockRejectedValue(timeoutError);

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

      const mockResult = new BattleResultFakeBuilder()
        .withTroopId(TEST_CONSTANTS.DEFAULT_TROOP_ID)
        .withTroopName('Goblin Pack')
        .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withDuration(TEST_CONSTANTS.DEFAULT_DURATION_MS)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      mockSimulator.executeBattle.mockResolvedValue(mockResult);

      // Act
      await useCase.execute(input);

      // Assert
      const calledSetup = mockSimulator.executeBattle.mock.calls[0]?.[0] as BattleSetup;
      expect(calledSetup.maxTurns).toBe(50);
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

      const mockResult = new BattleResultFakeBuilder()
        .withTroopId(TEST_CONSTANTS.DEFAULT_TROOP_ID)
        .withTroopName('Goblin Pack')
        .withTtkMetrics(TEST_CONSTANTS.DEFAULT_TTK_TURNS, TEST_CONSTANTS.DEFAULT_TTK_ACTIONS)
        .withDuration(TEST_CONSTANTS.DEFAULT_DURATION_MS)
        .withSeed(TEST_CONSTANTS.DEFAULT_SEED)
        .build();

      mockSimulator.executeBattle.mockResolvedValue(mockResult);

      // Act
      const output = await useCase.execute(input);

      // Assert
      expect(output.result).toBe(mockResult);
      expect(output.result.troopId).toBe(TEST_CONSTANTS.DEFAULT_TROOP_ID);
      expect(output.result.outcome).toBe('victory');
    });
  });
});
