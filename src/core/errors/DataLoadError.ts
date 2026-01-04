import { DomainError } from './DomainError.js';

/**
 * Base error for data loading failures.
 * Used when loading or validating RPG Maker MZ data files (Troops.json, Enemies.json, etc.).
 *
 * Can be non-critical (warning) when the system can continue with degraded functionality.
 */
export class DataLoadError extends DomainError {
  /**
   * Creates a new DataLoadError.
   *
   * @param message - Human-readable error message
   * @param severity - Error severity (default: 'critical')
   * @param context - Additional data loading context
   */
  constructor(
    message: string,
    severity: 'critical' | 'warning' = 'critical',
    context?: Record<string, unknown>
  ) {
    super(message, severity, context);
  }
}

/**
 * Error thrown when a troop ID referenced in configuration is not found in Troops.json.
 *
 * This is a critical error because the battle cannot proceed without the troop data.
 *
 * @example
 * ```typescript
 * const troop = $dataTroops[troopId];
 * if (!troop) {
 *   throw new TroopNotFoundError(troopId, trechoId);
 * }
 * ```
 */
export class TroopNotFoundError extends DataLoadError {
  /**
   * Creates a new TroopNotFoundError.
   *
   * @param troopId - The troop ID that was not found
   * @param trechoId - Optional trecho ID where the troop was referenced
   */
  constructor(troopId: number, trechoId?: string) {
    super(`Troop ID ${troopId} not found in Troops.json`, 'critical', {
      troopId,
      trechoId,
    });
  }
}

/**
 * Error thrown when an enemy ID referenced in a troop is not found in Enemies.json.
 *
 * This is a warning because the system can continue without this enemy,
 * but the battle results may be inaccurate.
 *
 * @example
 * ```typescript
 * const enemy = $dataEnemies[enemyId];
 * if (!enemy) {
 *   throw new EnemyNotFoundError(enemyId, troopId);
 * }
 * ```
 */
export class EnemyNotFoundError extends DataLoadError {
  /**
   * Creates a new EnemyNotFoundError.
   *
   * @param enemyId - The enemy ID that was not found
   * @param troopId - The troop ID where the enemy was referenced
   */
  constructor(enemyId: number, troopId: number) {
    super(`Enemy ID ${enemyId} not found in Enemies.json`, 'warning', {
      enemyId,
      troopId,
    });
  }
}
