import { ValidationError } from '../errors/index.js';

/**
 * Enemy action pattern data structure.
 * Defines what skills an enemy can use in battle.
 */
export interface EnemyActionData {
  /**
   * Skill ID from RPG Maker MZ Skills.json (1-based index).
   */
  skillId: number;

  /**
   * Action priority rating (1-10, higher = more likely to use).
   */
  rating: number;

  /**
   * Condition type for when action can be used.
   * 0 = Always usable
   * Other values determine specific conditions (HP threshold, turn count, etc.)
   */
  conditionType: number;
}

/**
 * Drop item data structure.
 * Defines what items an enemy can drop when defeated.
 */
export interface DropItemData {
  /**
   * Type of item to drop.
   * 0 = Item (references Items.json)
   * 1 = Weapon (references Weapons.json)
   * 2 = Armor (references Armors.json)
   */
  kind: number;

  /**
   * ID of the item/weapon/armor to drop.
   * Meaning depends on 'kind' field.
   */
  dataId: number;

  /**
   * Drop rate denominator (1/denominator chance).
   * 1 = 100%, 2 = 50%, 3 = 33.3%, etc.
   */
  denominator: number;
}

/**
 * Enemy entity data structure.
 * Contains all data needed to construct an Enemy entity.
 */
export interface EnemyEntityData {
  /**
   * Unique enemy ID from RPG Maker MZ Enemies.json (1-based index).
   */
  id: number;

  /**
   * Human-readable enemy name.
   */
  name: string;

  /**
   * Enemy base parameters [MaxHP, MaxMP, ATK, DEF, MAT, MDF, AGI, LUK].
   * Fixed array of 8 numbers (must be non-negative).
   */
  params: readonly [number, number, number, number, number, number, number, number];

  /**
   * Action patterns for AI behavior (skills enemy can use).
   */
  actions: readonly EnemyActionData[];

  /**
   * Items that can be dropped when enemy is defeated.
   */
  dropItems: readonly DropItemData[];

  /**
   * Experience points awarded when enemy is defeated.
   */
  exp: number;

  /**
   * Gold awarded when enemy is defeated.
   */
  gold: number;
}

/**
 * Enemy entity.
 * Represents an enemy from RPG Maker MZ with stats, skills, and drops.
 *
 * Immutable entity following domain-driven design principles.
 * All validation occurs in the constructor, ensuring invalid states are impossible.
 *
 * Domain entity for combat simulation, encapsulating enemy properties
 * that affect TTK calculations (stats, available skills, rewards).
 *
 * @example
 * ```typescript
 * const enemy = new Enemy({
 *   id: 1,
 *   name: 'Goblin',
 *   params: [50, 0, 10, 5, 3, 3, 4, 4],
 *   actions: [{ skillId: 1, rating: 5, conditionType: 0 }],
 *   dropItems: [],
 *   exp: 10,
 *   gold: 5
 * });
 *
 * enemy.maxHp; // 50
 * enemy.attack; // 10
 * enemy.canUseSkill(1); // true
 * ```
 */
export class Enemy {
  readonly id: number;
  readonly name: string;
  readonly params: readonly [
    number, // MaxHP
    number, // MaxMP
    number, // ATK (Attack)
    number, // DEF (Defense)
    number, // MAT (Magic Attack)
    number, // MDF (Magic Defense)
    number, // AGI (Agility)
    number, // LUK (Luck)
  ];
  readonly actions: readonly EnemyActionData[];
  readonly dropItems: readonly DropItemData[];
  readonly exp: number;
  readonly gold: number;

  /**
   * Creates a new Enemy.
   *
   * @param data - Enemy entity data
   * @throws {ValidationError} If any validation rule fails
   */
  constructor(data: EnemyEntityData) {
    // Validate ID
    if (data.id < 1) {
      throw new ValidationError('Enemy ID must be >= 1', { id: data.id });
    }

    // Validate name
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Enemy name cannot be empty', { id: data.id });
    }

    // Validate params array length
    if (data.params.length !== 8) {
      throw new ValidationError('Enemy params must have exactly 8 values', {
        id: data.id,
        paramsLength: data.params.length,
      });
    }

    // Validate each param is non-negative
    for (let i = 0; i < data.params.length; i++) {
      const param = data.params[i];
      if (param === undefined) {
        throw new ValidationError(`Missing parameter at index ${i}`, {
          id: data.id,
          paramIndex: i,
        });
      }
      if (param < 0) {
        throw new ValidationError(`Enemy param[${i}] cannot be negative`, {
          id: data.id,
          paramIndex: i,
          paramValue: param,
        });
      }
    }

    // Validate actions
    for (const action of data.actions) {
      if (action.skillId < 1) {
        throw new ValidationError('Enemy action skillId must be >= 1', {
          enemyId: data.id,
          skillId: action.skillId,
        });
      }
      if (action.rating < 1 || action.rating > 10) {
        throw new ValidationError('Enemy action rating must be 1-10', {
          enemyId: data.id,
          skillId: action.skillId,
          rating: action.rating,
        });
      }
    }

    // Validate drop items
    for (const drop of data.dropItems) {
      if (drop.kind < 0 || drop.kind > 2) {
        throw new ValidationError('Drop item kind must be 0-2', {
          enemyId: data.id,
          kind: drop.kind,
        });
      }
      if (drop.dataId < 0) {
        throw new ValidationError('Drop item dataId cannot be negative', {
          enemyId: data.id,
          dataId: drop.dataId,
        });
      }
      if (drop.denominator < 1) {
        throw new ValidationError('Drop item denominator must be >= 1', {
          enemyId: data.id,
          denominator: drop.denominator,
        });
      }
    }

    // Validate rewards
    if (data.exp < 0) {
      throw new ValidationError('Enemy EXP cannot be negative', { id: data.id, exp: data.exp });
    }
    if (data.gold < 0) {
      throw new ValidationError('Enemy gold cannot be negative', { id: data.id, gold: data.gold });
    }

    // Assign validated data
    this.id = data.id;
    this.name = data.name;
    this.params = Object.freeze([...data.params]) as readonly [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    this.actions = Object.freeze([...data.actions]);
    this.dropItems = Object.freeze([...data.dropItems]);
    this.exp = data.exp;
    this.gold = data.gold;

    // Freeze to ensure immutability
    Object.freeze(this);
  }

  /**
   * Get MaxHP (maximum hit points).
   */
  get maxHp(): number {
    return this.params[0];
  }

  /**
   * Get MaxMP (maximum magic points).
   */
  get maxMp(): number {
    return this.params[1];
  }

  /**
   * Get ATK (attack power).
   */
  get attack(): number {
    return this.params[2];
  }

  /**
   * Get DEF (defense power).
   */
  get defense(): number {
    return this.params[3];
  }

  /**
   * Get MAT (magic attack power).
   */
  get magicAttack(): number {
    return this.params[4];
  }

  /**
   * Get MDF (magic defense power).
   */
  get magicDefense(): number {
    return this.params[5];
  }

  /**
   * Get AGI (agility/speed).
   */
  get agility(): number {
    return this.params[6];
  }

  /**
   * Get LUK (luck).
   */
  get luck(): number {
    return this.params[7];
  }

  /**
   * Check if enemy can use a specific skill.
   * Returns true if the skill is in the enemy's action patterns.
   *
   * @param skillId - Skill ID to check
   * @returns True if enemy has this skill in its action patterns
   */
  canUseSkill(skillId: number): boolean {
    return this.actions.some((action) => action.skillId === skillId);
  }

  /**
   * Get all skill IDs this enemy can use.
   * Returns unique skill IDs from action patterns.
   *
   * @returns Readonly array of skill IDs
   */
  getAvailableSkillIds(): readonly number[] {
    const uniqueSkills = new Set(this.actions.map((a) => a.skillId));
    return Object.freeze(Array.from(uniqueSkills));
  }

  /**
   * Calculate drop chance for an item.
   * Returns the probability (0-1) of receiving the drop.
   *
   * @param dropIndex - Index of drop item (0-2)
   * @returns Drop probability as fraction (e.g., 0.5 = 50%)
   */
  getDropChance(dropIndex: number): number {
    if (dropIndex < 0 || dropIndex >= this.dropItems.length) {
      return 0;
    }
    const drop = this.dropItems[dropIndex];
    if (!drop) {
      return 0;
    }
    return 1 / drop.denominator;
  }

  /**
   * Value equality check.
   * Two enemies are equal if they have the same ID.
   *
   * @param other - The other Enemy to compare
   * @returns True if both enemies have the same ID
   */
  equals(other: Enemy): boolean {
    return this.id === other.id;
  }

  /**
   * String representation of the enemy.
   *
   * @returns String in format "Enemy #{id}: {name}"
   */
  toString(): string {
    return `Enemy #${this.id}: ${this.name}`;
  }
}
