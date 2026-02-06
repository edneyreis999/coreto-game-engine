import { ValidationError } from '../errors/index.js';

/**
 * Data structure for a party member.
 * Represents a single character in the party with class and level.
 */
export interface PartyMemberData {
  /**
   * Class ID from RPG Maker MZ Classes.json (1-based index).
   */
  classId: number;

  /**
   * Character level (1-99).
   */
  level: number;
}

/**
 * Party configuration entity.
 * Represents the player party composition for battle simulations.
 *
 * Immutable entity following domain-driven design principles.
 * All validation occurs in the constructor, ensuring invalid states are impossible.
 *
 * @example
 * ```typescript
 * const party = new PartyConfig([
 *   { classId: 1, level: 5 },
 *   { classId: 2, level: 5 }
 * ]);
 * ```
 */
export class PartyConfig {
  /**
   * Readonly array of party members.
   * Frozen to ensure immutability.
   */
  readonly members: readonly PartyMemberData[];

  /**
   * Creates a new PartyConfig.
   *
   * @param members - Array of party members (1-4 members)
   * @throws {ValidationError} If party is empty, member classIds are invalid, or member levels are invalid
   */
  constructor(members: PartyMemberData[]) {
    // Validate party size
    if (members.length === 0) {
      throw new ValidationError('Party must have at least 1 member');
    }

    // Validate each member
    for (const member of members) {
      if (member.classId < 1) {
        throw new ValidationError('Member classId must be >= 1', {
          classId: member.classId,
        });
      }
      if (member.level < 1 || member.level > 99) {
        throw new ValidationError('Member level must be 1-99', {
          classId: member.classId,
          level: member.level,
        });
      }
    }

    // Deep freeze to ensure immutability
    this.members = Object.freeze([...members]);
    Object.freeze(this);
  }
}
