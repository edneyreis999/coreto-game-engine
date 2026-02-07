/**
 * DataMapper - Maps RPG Maker MZ infrastructure types to domain DTOs.
 *
 * Bridges the infrastructure layer (raw RMMZ data types from types/rmmz-data.ts)
 * to the domain layer (pure domain DTOs from core/domain/data/).
 *
 * Maintains Clean Architecture by keeping infrastructure types out of the domain layer.
 *
 * @example
 * ```typescript
 * import { DataMapper } from './DataMapper.js';
 *
 * const rmmzEnemy: RmmzEnemyData = loadedEnemies[1];
 * const domainEnemy = DataMapper.toDomainEnemyData(rmmzEnemy);
 * ```
 */

import type {
  DomainEnemyData,
  DomainSkillData,
  DomainClassData,
  DomainTroopData,
  DomainItemData,
  DomainSystemData,
} from '@coreto/core';
import type * as Infra from '../../../types/rmmz-data.js';

/**
 * Maps RPG Maker MZ data types to domain DTOs.
 *
 * All methods are pure functions that perform deep conversions
 * from infrastructure types to domain types.
 */
export class DataMapper {
  /**
   * Convert infrastructure EnemyData to domain EnemyData.
   *
   * @param data - Raw RPG Maker MZ EnemyData from Enemies.json
   * @returns Domain-level EnemyData DTO
   */
  static toDomainEnemyData(data: Infra.EnemyData): DomainEnemyData {
    return {
      id: data.id,
      actions: data.actions.map((action) => ({
        conditionParam1: action.conditionParam1,
        conditionParam2: action.conditionParam2,
        conditionType: action.conditionType,
        rating: action.rating,
        skillId: action.skillId,
      })),
      battlerHue: data.battlerHue,
      battlerName: data.battlerName,
      dropItems: data.dropItems.map((drop) => ({
        dataId: drop.dataId,
        denominator: drop.denominator,
        kind: drop.kind,
      })),
      exp: data.exp,
      traits: data.traits.map((trait) => ({
        code: trait.code,
        dataId: trait.dataId,
        value: trait.value,
      })),
      gold: data.gold,
      name: data.name,
      note: data.note,
      params: [...data.params],
    };
  }

  /**
   * Convert infrastructure SkillData to domain SkillData.
   *
   * @param data - Raw RPG Maker MZ SkillData from Skills.json
   * @returns Domain-level SkillData DTO
   */
  static toDomainSkillData(data: Infra.SkillData): DomainSkillData {
    return {
      id: data.id,
      animationId: data.animationId,
      damage: {
        critical: data.damage.critical,
        elementId: data.damage.elementId,
        formula: data.damage.formula,
        type: data.damage.type,
        variance: data.damage.variance,
      },
      description: data.description,
      effects: data.effects.map((effect) => ({
        code: effect.code,
        dataId: effect.dataId,
        value1: effect.value1,
        value2: effect.value2,
      })),
      hitType: data.hitType,
      iconIndex: data.iconIndex,
      message1: data.message1,
      message2: data.message2,
      mpCost: data.mpCost,
      name: data.name,
      note: data.note,
      occasion: data.occasion,
      repeats: data.repeats,
      requiredWtypeId1: data.requiredWtypeId1,
      requiredWtypeId2: data.requiredWtypeId2,
      scope: data.scope,
      speed: data.speed,
      stypeId: data.stypeId,
      successRate: data.successRate,
      tpCost: data.tpCost,
      tpGain: data.tpGain,
      messageType: data.messageType,
    };
  }

  /**
   * Convert infrastructure ClassData to domain ClassData.
   *
   * @param data - Raw RPG Maker MZ ClassData from Classes.json
   * @returns Domain-level ClassData DTO
   */
  static toDomainClassData(data: Infra.ClassData): DomainClassData {
    return {
      id: data.id,
      expParams: [...data.expParams],
      traits: data.traits.map((trait) => ({
        code: trait.code,
        dataId: trait.dataId,
        value: trait.value,
      })),
      learnings: data.learnings.map((learning) => ({
        level: learning.level,
        note: learning.note,
        skillId: learning.skillId,
      })),
      name: data.name,
      note: data.note,
      params: data.params.map((paramArray) => [...paramArray]),
    };
  }

  /**
   * Convert infrastructure TroopData to domain TroopData.
   *
   * @param data - Raw RPG Maker MZ TroopData from Troops.json
   * @returns Domain-level TroopData DTO
   */
  static toDomainTroopData(data: Infra.TroopData): DomainTroopData {
    return {
      id: data.id,
      members: data.members.map((member) => ({
        enemyId: member.enemyId,
        x: member.x,
        y: member.y,
        hidden: member.hidden,
      })),
      name: data.name,
      pages: data.pages.map((page) => ({
        conditions: {
          actorHp: page.conditions.actorHp,
          actorId: page.conditions.actorId,
          actorValid: page.conditions.actorValid,
          enemyHp: page.conditions.enemyHp,
          enemyIndex: page.conditions.enemyIndex,
          enemyValid: page.conditions.enemyValid,
          switchId: page.conditions.switchId,
          switchValid: page.conditions.switchValid,
          turnA: page.conditions.turnA,
          turnB: page.conditions.turnB,
          turnEnding: page.conditions.turnEnding,
          turnValid: page.conditions.turnValid,
        },
        list: page.list.map((cmd) => ({
          code: cmd.code,
          indent: cmd.indent,
          parameters: cmd.parameters,
        })),
        span: page.span,
      })),
    };
  }

  /**
   * Convert infrastructure ItemData to domain ItemData.
   *
   * @param data - Raw RPG Maker MZ ItemData from Items.json
   * @returns Domain-level ItemData DTO
   */
  static toDomainItemData(data: Infra.ItemData): DomainItemData {
    return {
      id: data.id,
      animationId: data.animationId,
      consumable: data.consumable,
      damage: {
        critical: data.damage.critical,
        elementId: data.damage.elementId,
        formula: data.damage.formula,
        type: data.damage.type,
        variance: data.damage.variance,
      },
      description: data.description,
      effects: data.effects.map((effect) => ({
        code: effect.code,
        dataId: effect.dataId,
        value1: effect.value1,
        value2: effect.value2,
      })),
      hitType: data.hitType,
      iconIndex: data.iconIndex,
      itypeId: data.itypeId,
      name: data.name,
      note: data.note,
      occasion: data.occasion,
      price: data.price,
      repeats: data.repeats,
      scope: data.scope,
      speed: data.speed,
      successRate: data.successRate,
      tpGain: data.tpGain,
    };
  }

  /**
   * Convert infrastructure SystemData to domain SystemData.
   *
   * @param data - Raw RPG Maker MZ SystemData from System.json
   * @returns Domain-level SystemData DTO
   */
  static toDomainSystemData(data: Infra.SystemData): DomainSystemData {
    return {
      advanced: { ...data.advanced },
      airship: { ...data.airship },
      armorTypes: Array.isArray(data.armorTypes) ? [...data.armorTypes] : [],
      attackMotions: Array.isArray(data.attackMotions) ? [...data.attackMotions] : [],
      battleBgm: { ...data.battleBgm },
      battleback1Name: data.battleback1Name,
      battleback2Name: data.battleback2Name,
      battlerHue: data.battlerHue,
      battlerName: data.battlerName,
      battleSystem: data.battleSystem,
      boat: { ...data.boat },
      currencyUnit: data.currencyUnit,
      defeatMe: { ...data.defeatMe },
      editMapId: data.editMapId,
      elements: Array.isArray(data.elements) ? [...data.elements] : [],
      equipTypes: Array.isArray(data.equipTypes) ? [...data.equipTypes] : [],
      gameTitle: data.gameTitle,
      gameoverMe: { ...data.gameoverMe },
      itemCategories: Array.isArray(data.itemCategories) ? [...data.itemCategories] : [],
      locale: data.locale,
      magicSkills: Array.isArray(data.magicSkills) ? [...data.magicSkills] : [],
      menuCommands: Array.isArray(data.menuCommands) ? [...data.menuCommands] : [],
      optAutosave: data.optAutosave,
      optDisplayTp: data.optDisplayTp,
      optDrawTitle: data.optDrawTitle,
      optExtraExp: data.optExtraExp,
      optFloorDeath: data.optFloorDeath,
      optFollowers: data.optFollowers,
      optKeyItemsNumber: data.optKeyItemsNumber,
      optSideView: data.optSideView,
      optSlipDeath: data.optSlipDeath,
      optTransparent: data.optTransparent,
      partyMembers: Array.isArray(data.partyMembers) ? [...data.partyMembers] : [],
      ship: { ...data.ship },
      skillTypes: Array.isArray(data.skillTypes) ? [...data.skillTypes] : [],
      sounds: Array.isArray(data.sounds) ? [...data.sounds] : [],
      startMapId: data.startMapId,
      startX: data.startX,
      startY: data.startY,
      switches: Array.isArray(data.switches) ? [...data.switches] : [],
      terms: { ...data.terms },
      testBattlers: Array.isArray(data.testBattlers) ? [...data.testBattlers] : [],
      testTroopId: data.testTroopId,
      title1Name: data.title1Name,
      title2Name: data.title2Name,
      titleBgm: { ...data.titleBgm },
      titleCommandWindow: { ...data.titleCommandWindow },
      variables: Array.isArray(data.variables) ? [...data.variables] : [],
      versionId: data.versionId,
      victoryMe: { ...data.victoryMe },
      weaponTypes: Array.isArray(data.weaponTypes) ? [...data.weaponTypes] : [],
      windowTone: Array.isArray(data.windowTone) ? [...data.windowTone] : [0, 0, 0],
      ...(data.optSplashScreen !== undefined && { optSplashScreen: data.optSplashScreen }),
      ...(data.optMessageSkip !== undefined && { optMessageSkip: data.optMessageSkip }),
      ...(data.tileSize !== undefined && { tileSize: data.tileSize }),
      ...(data.editor !== undefined && { editor: { ...data.editor } }),
      ...(data.faceSize !== undefined && { faceSize: data.faceSize }),
      ...(data.iconSize !== undefined && { iconSize: data.iconSize }),
    };
  }
}
