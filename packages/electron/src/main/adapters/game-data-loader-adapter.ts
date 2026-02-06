/**
 * Game Data Loader Adapter
 *
 * Infrastructure adapter that implements IGameDataLoader port.
 * Delegates to domain use cases with injected dependencies.
 */

import type { IFileSystem, ILogger } from '@coreto/core';
import type {
  IGameDataLoader,
  TroopData,
  ClassData,
  EnemyData,
} from '@coreto/electron/domain/ports';
import { loadTroops, loadClasses, loadEnemies } from '@coreto/electron/domain/use-cases';

/**
 * Adapter implementation of IGameDataLoader port.
 * Bridges IPC handlers with domain use cases.
 */
export class GameDataLoaderAdapter implements IGameDataLoader {
  constructor(
    private readonly fs: IFileSystem,
    private readonly logger: ILogger
  ) {}

  /**
   * Loads troops using domain use case.
   */
  async loadTroops(projectPath: string): Promise<TroopData[]> {
    return loadTroops(projectPath, this.fs, this.logger);
  }

  /**
   * Loads classes using domain use case.
   */
  async loadClasses(projectPath: string): Promise<ClassData[]> {
    return loadClasses(projectPath, this.fs, this.logger);
  }

  /**
   * Loads enemies using domain use case.
   */
  async loadEnemies(projectPath: string): Promise<EnemyData[]> {
    return loadEnemies(projectPath, this.fs, this.logger);
  }
}

/**
 * Factory function for creating GameDataLoaderAdapter instances.
 * Simplifies dependency injection without full DI container.
 *
 * @param fs - File system implementation
 * @param logger - Logger implementation
 * @returns GameDataLoaderAdapter instance
 */
export function createGameDataLoader(fs: IFileSystem, logger: ILogger): IGameDataLoader {
  return new GameDataLoaderAdapter(fs, logger);
}
