import { FakeBuilder } from './FakeBuilder.js';
import type { RmmzDatabase } from '@coreto/core/core/ports/IDataLoader.js';
import type { ClassData } from '@coreto/core/core/domain/data/ClassData.js';
import type { EnemyData } from '@coreto/core/core/domain/data/EnemyData.js';
import type { TroopData } from '@coreto/core/core/domain/data/TroopData.js';
import type { SkillData } from '@coreto/core/core/domain/data/SkillData.js';
import type { ItemData } from '@coreto/core/core/domain/data/ItemData.js';
import type { SystemData } from '@coreto/core/core/domain/data/SystemData.js';

/**
 * Builder for creating RmmzDatabase instances in tests.
 *
 * Provides sensible defaults and fluent interface for customization.
 * Supports creating minimal valid databases and empty databases.
 *
 * @example
 * ```typescript
 * const database = new RmmzDatabaseFakeBuilder()
 *   .withMinimalValidDatabase()
 *   .build();
 *
 * const emptyDb = new RmmzDatabaseFakeBuilder()
 *   .withEmptyDatabase()
 *   .build();
 * ```
 */
export class RmmzDatabaseFakeBuilder extends FakeBuilder<RmmzDatabase> {
  private actors: unknown[] = [null];
  private classes: Array<ClassData | null> = [null];
  private skills: Array<SkillData | null> = [null];
  private items: Array<ItemData | null> = [null];
  private weapons: unknown[] = [null];
  private armors: unknown[] = [null];
  private enemies: Array<EnemyData | null> = [null];
  private troops: Array<TroopData | null> = [null];
  private states: unknown[] = [null];
  private system: SystemData | null = null;

  withClass(classData: ClassData): this {
    this.classes.push(classData);
    return this;
  }

  withEnemy(enemyData: EnemyData): this {
    this.enemies.push(enemyData);
    return this;
  }

  withTroop(troopData: TroopData): this {
    this.troops.push(troopData);
    return this;
  }

  withSkill(skillData: SkillData): this {
    this.skills.push(skillData);
    return this;
  }

  withItem(itemData: ItemData): this {
    this.items.push(itemData);
    return this;
  }

  withSystem(systemData: SystemData): this {
    this.system = systemData;
    return this;
  }

  /**
   * Create a minimal valid database with one of each required type.
   */
  withMinimalValidDatabase(): this {
    this.withClass({
      id: 1,
      expParams: [1, 10, 20, 30],
      traits: [],
      learnings: [],
      name: 'Warrior',
      note: '',
      params: Array(8).fill(0).map(() => Array(100).fill(10)),
    });

    this.withEnemy({
      id: 1,
      actions: [
        {
          conditionParam1: 0,
          conditionParam2: 0,
          conditionType: 0,
          rating: 5,
          skillId: 1,
        },
      ],
      battlerHue: 0,
      battlerName: 'Goblin',
      dropItems: [
        { dataId: 1, denominator: 2, kind: 0 },
        { dataId: 0, denominator: 1, kind: 0 },
        { dataId: 0, denominator: 1, kind: 0 },
      ],
      exp: 10,
      traits: [],
      gold: 5,
      name: 'Goblin',
      note: '',
      params: [100, 0, 10, 5, 3, 3, 4, 4],
    });

    this.withTroop({
      id: 1,
      members: [
        { enemyId: 1, x: 300, y: 400, hidden: false },
      ],
      name: 'Goblin Pack',
      pages: [],
    });

    this.withSkill({
      id: 1,
      animationId: 0,
      damage: {
        critical: false,
        elementId: 0,
        formula: 'a.atk * 2 - b.def',
        type: 1,
        variance: 20,
      },
      description: '',
      effects: [],
      hitType: 1,
      iconIndex: 0,
      message1: '',
      message2: '',
      mpCost: 0,
      name: 'Attack',
      note: '',
      occasion: 0,
      repeats: 1,
      requiredWtypeId1: 0,
      requiredWtypeId2: 0,
      scope: 1,
      speed: 0,
      stypeId: 1,
      successRate: 100,
      tpCost: 0,
      tpGain: 0,
      messageType: 1,
    });

    this.withItem({
      id: 1,
      animationId: 0,
      consumable: true,
      damage: {
        critical: false,
        elementId: 0,
        formula: '0',
        type: 0,
        variance: 20,
      },
      description: '',
      effects: [],
      hitType: 0,
      iconIndex: 0,
      itypeId: 1,
      name: 'Potion',
      note: '',
      occasion: 0,
      price: 50,
      repeats: 1,
      scope: 7,
      speed: 0,
      successRate: 100,
      tpGain: 0,
    });

    this.withSystem({
      advanced: {},
      airship: {},
      armorTypes: ['', 'Light Armor', 'Heavy Armor', 'Robe', 'Shield'],
      attackMotions: [],
      battleBgm: {},
      battleback1Name: '',
      battleback2Name: '',
      battlerHue: 0,
      battlerName: '',
      battleSystem: 0,
      boat: {},
      currencyUnit: 'G',
      defeatMe: {},
      editMapId: 1,
      elements: ['', 'Physical', 'Fire', 'Ice', 'Thunder'],
      equipTypes: ['', 'Weapon', 'Shield', 'Head', 'Body', 'Accessory'],
      gameTitle: 'Test Game',
      gameoverMe: {},
      itemCategories: [],
      locale: 'en_US',
      magicSkills: [1, 2],
      menuCommands: [],
      optAutosave: true,
      optDisplayTp: true,
      optDrawTitle: true,
      optExtraExp: false,
      optFloorDeath: false,
      optFollowers: true,
      optKeyItemsNumber: true,
      optSideView: false,
      optSlipDeath: false,
      optTransparent: false,
      partyMembers: [1],
      ship: {},
      skillTypes: ['', 'Magic', 'Special'],
      sounds: [],
      startMapId: 1,
      startX: 0,
      startY: 0,
      switches: Array(100).fill(null).map((_, i) => `Switch ${i}`),
      terms: {
        abbreviations: {},
        attributes: {},
        commands: {},
        equipment: {},
        messages: {},
        params: {},
        param: {},
        system: {},
      },
      testBattlers: [],
      testTroopId: 1,
      title1Name: '',
      title2Name: '',
      titleBgm: {},
      titleCommandWindow: {},
      variables: Array(100).fill(null).map((_, i) => `Variable ${i}`),
      versionId: 1,
      victoryMe: {},
      weaponTypes: ['', 'Dagger', 'Sword', 'Flail', 'Axe', 'Staff', 'Bow'],
      windowTone: [0, 0, 0],
    });

    return this;
  }

  /**
   * Create an empty database with all arrays set to [null].
   */
  withEmptyDatabase(): this {
    this.actors = [null];
    this.classes = [null];
    this.skills = [null];
    this.items = [null];
    this.weapons = [null];
    this.armors = [null];
    this.enemies = [null];
    this.troops = [null];
    this.states = [null];
    this.system = null;
    return this;
  }

  build(): RmmzDatabase {
    return {
      $dataActors: this.actors,
      $dataClasses: this.classes,
      $dataSkills: this.skills,
      $dataItems: this.items,
      $dataWeapons: this.weapons,
      $dataArmors: this.armors,
      $dataEnemies: this.enemies,
      $dataTroops: this.troops,
      $dataStates: this.states,
      $dataSystem: this.system ?? this.createDefaultSystem(),
    } as RmmzDatabase;
  }

  private createDefaultSystem(): SystemData {
    return {
      advanced: {},
      airship: {},
      armorTypes: [],
      attackMotions: [],
      battleBgm: {},
      battleback1Name: '',
      battleback2Name: '',
      battlerHue: 0,
      battlerName: '',
      battleSystem: 0,
      boat: {},
      currencyUnit: '',
      defeatMe: {},
      editMapId: 1,
      elements: [],
      equipTypes: [],
      gameTitle: '',
      gameoverMe: {},
      itemCategories: [],
      locale: 'en_US',
      magicSkills: [],
      menuCommands: [],
      optAutosave: false,
      optDisplayTp: false,
      optDrawTitle: false,
      optExtraExp: false,
      optFloorDeath: false,
      optFollowers: false,
      optKeyItemsNumber: false,
      optSideView: false,
      optSlipDeath: false,
      optTransparent: false,
      partyMembers: [],
      ship: {},
      skillTypes: [],
      sounds: [],
      startMapId: 1,
      startX: 0,
      startY: 0,
      switches: [],
      terms: {
        abbreviations: {},
        attributes: {},
        commands: {},
        equipment: {},
        messages: {},
        params: {},
        param: {},
        system: {},
      },
      testBattlers: [],
      testTroopId: 1,
      title1Name: '',
      title2Name: '',
      titleBgm: {},
      titleCommandWindow: {},
      variables: [],
      versionId: 1,
      victoryMe: {},
      weaponTypes: [],
      windowTone: [0, 0, 0],
    };
  }

  withInvalidData(): this {
    return this.withEmptyDatabase();
  }
}
