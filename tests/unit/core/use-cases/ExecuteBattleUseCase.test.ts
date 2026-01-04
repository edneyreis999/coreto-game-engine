import 'reflect-metadata';
import { ExecuteBattleUseCase, ExecuteBattleInput } from '@/core/use-cases/ExecuteBattleUseCase.js';
import { IBattleSimulator, BattleSetup } from '@/core/ports/IBattleSimulator.js';
import { BattleResult } from '@/core/domain/BattleResult.js';
import { PartyConfig } from '@/core/domain/PartyConfig.js';
import { BattleTimeoutError } from '@/core/errors/BattleTimeoutError.js';

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
      const party = new PartyConfig([{ classId: 1, level: 5 }]);
      const input: ExecuteBattleInput = {
        troopId: 1,
        troopName: 'Goblin Pack',
        party,
        seed: 12345,
      };

      const mockResult = new BattleResult({
        troopId: 1,
        troopName: 'Goblin Pack',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1250,
        seed: 12345,
      });

      mockSimulator.executeBattle.mockResolvedValue(mockResult);

      // Act
      const output = await useCase.execute(input);

      // Assert
      expect(mockSimulator.executeBattle).toHaveBeenCalledWith({
        troopId: 1,
        party,
        seed: 12345,
        maxTurns: undefined,
      });
      expect(output.result).toEqual(mockResult);
    });

    it('should return duration in milliseconds', async () => {
      // Arrange
      const party = new PartyConfig([{ classId: 1, level: 5 }]);
      const input: ExecuteBattleInput = {
        troopId: 1,
        troopName: 'Goblin Pack',
        party,
        seed: 12345,
      };

      const mockResult = new BattleResult({
        troopId: 1,
        troopName: 'Goblin Pack',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1250,
        seed: 12345,
      });

      mockSimulator.executeBattle.mockResolvedValue(mockResult);

      // Act
      const output = await useCase.execute(input);

      // Assert
      expect(output.durationMs).toBeGreaterThanOrEqual(0);
      expect(typeof output.durationMs).toBe('number');
    });

    it('should pass seed to simulator', async () => {
      // Arrange
      const party = new PartyConfig([{ classId: 1, level: 5 }]);
      const customSeed = 99999;
      const input: ExecuteBattleInput = {
        troopId: 1,
        troopName: 'Goblin Pack',
        party,
        seed: customSeed,
      };

      const mockResult = new BattleResult({
        troopId: 1,
        troopName: 'Goblin Pack',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1250,
        seed: customSeed,
      });

      mockSimulator.executeBattle.mockResolvedValue(mockResult);

      // Act
      await useCase.execute(input);

      // Assert
      const calledSetup = mockSimulator.executeBattle.mock.calls[0]?.[0] as BattleSetup;
      expect(calledSetup.seed).toBe(customSeed);
    });

    it('should handle battle timeout error', async () => {
      // Arrange
      const party = new PartyConfig([{ classId: 1, level: 5 }]);
      const input: ExecuteBattleInput = {
        troopId: 1,
        troopName: 'Goblin Pack',
        party,
        seed: 12345,
      };

      const timeoutError = new BattleTimeoutError(1, 10000, 100);
      mockSimulator.executeBattle.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(BattleTimeoutError);
    });

    it('should use maxTurns when provided', async () => {
      // Arrange
      const party = new PartyConfig([{ classId: 1, level: 5 }]);
      const input: ExecuteBattleInput = {
        troopId: 1,
        troopName: 'Goblin Pack',
        party,
        seed: 12345,
        maxTurns: 50,
      };

      const mockResult = new BattleResult({
        troopId: 1,
        troopName: 'Goblin Pack',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1250,
        seed: 12345,
      });

      mockSimulator.executeBattle.mockResolvedValue(mockResult);

      // Act
      await useCase.execute(input);

      // Assert
      const calledSetup = mockSimulator.executeBattle.mock.calls[0]?.[0] as BattleSetup;
      expect(calledSetup.maxTurns).toBe(50);
    });

    it('should include result from simulator', async () => {
      // Arrange
      const party = new PartyConfig([{ classId: 1, level: 5 }]);
      const input: ExecuteBattleInput = {
        troopId: 1,
        troopName: 'Goblin Pack',
        party,
        seed: 12345,
      };

      const mockResult = new BattleResult({
        troopId: 1,
        troopName: 'Goblin Pack',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1250,
        seed: 12345,
      });

      mockSimulator.executeBattle.mockResolvedValue(mockResult);

      // Act
      const output = await useCase.execute(input);

      // Assert
      expect(output.result).toBe(mockResult);
      expect(output.result.troopId).toBe(1);
      expect(output.result.outcome).toBe('victory');
    });
  });
});
