/**
 * Helper utilities for creating mock dependencies in tests.
 * Provides centralized factory functions for commonly mocked dependencies.
 *
 * This module reduces mock declaration overhead and ensures consistent mock behavior.
 *
 * @example
 * ```ts
 * import { createMockLogger, createMockConfigLoader } from '@electron/tests/helpers/mock-dependencies';
 *
 * const mockLogger = createMockLogger();
 * const mockConfigLoader = createMockConfigLoader({
 *   projectPath: '/test/project',
 *   trechos: [TrechoFakeBuilder.anEntity().build()],
 * });
 * ```
 */

import type {
  ILogger,
  IConfigLoader,
  IDataLoader,
  IBattleSimulator,
  Database,
} from '@coreto/core';
import type { Trecho } from '@coreto/core';
import type { BattleResult } from '@coreto/core';

/**
 * Creates a mock ILogger with Jest spies.
 */
export function createMockLogger(): ILogger {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
}

/**
 * Creates a mock IConfigLoader with specified trechos.
 */
export function createMockConfigLoader(config: {
  projectPath: string;
  reportOutputPath?: string;
  seed?: number;
  maxBattleTurns?: number;
  trechos: Trecho[];
}): jest.Mocked<IConfigLoader> {
  return {
    loadConfig: jest.fn().mockResolvedValue({
      projectPath: config.projectPath,
      reportOutputPath: config.reportOutputPath ?? 'temp/reports',
      seed: config.seed ?? 12345,
      maxBattleTurns: config.maxBattleTurns ?? 100,
      trechos: [],
    }),
    loadTrechos: jest.fn().mockResolvedValue(config.trechos),
  } as unknown as jest.Mocked<IConfigLoader>;
}

/**
 * Creates a mock IDataLoader with minimal database.
 */
export function createMockDataLoader(troopId: number = 42): jest.Mocked<IDataLoader> {
  const mockDatabase: Database = {
    system: { system: {} },
    troops: [
      {
        id: troopId,
        name: 'Goblin Scout',
        members: [
          { enemyId: 1, x: 1, y: 1, hidden: false },
        ],
      },
    ],
    classes: [],
    enemies: [],
    actors: [],
    skills: [],
    items: [],
    weapons: [],
    armors: [],
    states: [],
    animations: [],
    troops: [],
  };

  return {
    loadDatabase: jest.fn().mockResolvedValue(mockDatabase),
  } as unknown as jest.Mocked<IDataLoader>;
}

/**
 * Creates a mock IBattleSimulator that returns the given result.
 */
export function createMockBattleSimulator(result?: BattleResult): jest.Mocked<IBattleSimulator> {
  const mockResult = result ?? {
    troopId: 42,
    troopName: 'Goblin Scout',
    outcome: 'victory' as const,
    ttkTurns: 4,
    ttkActions: 10,
    durationMs: 1250,
    seed: 12345,
    expGained: 100,
  };

  return {
    initialize: jest.fn().mockResolvedValue(undefined),
    executeBattle: jest.fn().mockResolvedValue(mockResult),
  } as unknown as jest.Mocked<IBattleSimulator>;
}

/**
 * Creates a mock IBattleSimulator that returns different results per call.
 */
export function createMockBattleSimulatorWithSequence(results: BattleResult[]): jest.Mocked<IBattleSimulator> {
  let callCount = 0;

  return {
    initialize: jest.fn().mockResolvedValue(undefined),
    executeBattle: jest.fn().mockImplementation(async () => {
      const result = results[callCount];
      callCount++;
      return result;
    }),
  } as unknown as jest.Mocked<IBattleSimulator>;
}

/**
 * Creates a minimal IConfigLoader with a single trecho for basic tests.
 * Use this for tests that only need basic trecho validation.
 *
 * @param trechoId - Optional custom trecho ID (defaults to 'trecho-minimal')
 * @param troopId - Optional custom troop ID (defaults to 1)
 */
export function createMinimalConfigLoader(trechoId: string = 'trecho-minimal', troopId: number = 1): jest.Mocked<IConfigLoader> {
  const { TrechoFakeBuilder } = require('../fakes/TrechoFakeBuilder');

  const minimalTrecho = TrechoFakeBuilder.anEntity()
    .withId(trechoId)
    .withMinimalConfig()
    .withCustomTroops([troopId])
    .build();

  return createMockConfigLoader({
    projectPath: '/test/project',
    trechos: [minimalTrecho],
  });
}

/**
 * Creates a minimal IDataLoader with a single troop.
 * Use this for tests that only need basic troop validation.
 *
 * @param troopId - Optional custom troop ID (defaults to 1)
 */
export function createMinimalDataLoader(troopId: number = 1): jest.Mocked<IDataLoader> {
  return createMockDataLoader(troopId);
}

/**
 * Creates a minimal IBattleSimulator that returns a basic victory result.
 * Use this for tests that only need basic battle validation.
 *
 * @param troopId - Optional custom troop ID (defaults to 1)
 */
export function createMinimalBattleSimulator(troopId: number = 1): jest.Mocked<IBattleSimulator> {
  const { BattleResultFakeBuilder } = require('../fakes/BattleResultFakeBuilder');

  const minimalResult = BattleResultFakeBuilder.anEntity()
    .withMinimalVictory()
    .withTroopId(troopId)
    .build();

  return createMockBattleSimulator(minimalResult);
}
