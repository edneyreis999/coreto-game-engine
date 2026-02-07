/**
 * EnemyMapper - Maps RPG Maker MZ EnemyData to domain Enemy entity.
 *
 * Infrastructure mapper that bridges the gap between raw RMMZ data structures
 * and the domain-level Enemy entity. Converts infrastructure-specific types
 * (Action, DropItem, EnemyData) into domain-level types (EnemyActionData,
 * DropItemData, EnemyEntityData).
 *
 * @example
 * ```typescript
 * import { EnemyMapper } from './EnemyMapper.js';
 *
 * const rmmzData: EnemyData = loadedEnemies[1];
 * const enemy = EnemyMapper.fromRmmzData(rmmzData);
 * console.log(enemy.maxHp); // Domain entity ready for use
 * ```
 */

import { Enemy } from '@coreto/core';
import type { EnemyActionData, DropItemData } from '@coreto/core';
import type { Action, DropItem as RmmzDropItem, EnemyData } from '../../../types/rmmz-data.js';

/**
 * Maps RPG Maker MZ enemy data to domain Enemy entities.
 *
 * Responsible for translating infrastructure-level RMMZ data structures
 * into domain-level types that the Enemy constructor accepts.
 */
export class EnemyMapper {
  /**
   * Create Enemy domain entity from RPG Maker MZ EnemyData.
   *
   * Maps RMMZ-specific action and drop item structures to their
   * domain-level equivalents, stripping infrastructure-only fields
   * (conditionParam1, conditionParam2, battlerHue, battlerName, traits, note).
   *
   * @param data - Raw RPG Maker MZ EnemyData from Enemies.json
   * @returns Enemy domain entity with validated data
   * @throws {ValidationError} If the mapped data fails Enemy constructor validation
   */
  static fromRmmzData(data: EnemyData): Enemy {
    const actions: EnemyActionData[] = data.actions.map((action: Action) => ({
      skillId: action.skillId,
      rating: action.rating,
      conditionType: action.conditionType,
    }));

    const dropItems: DropItemData[] = data.dropItems.map((drop: RmmzDropItem) => ({
      kind: drop.kind,
      dataId: drop.dataId,
      denominator: drop.denominator,
    }));

    return new Enemy({
      id: data.id,
      name: data.name,
      params: Object.freeze([...data.params]),
      actions,
      dropItems,
      exp: data.exp,
      gold: data.gold,
    });
  }
}
