import { FakeBuilder } from './FakeBuilder.js';
import { PartyConfig, PartyMemberData } from '@coreto/core';

/**
 * Builder for creating PartyConfig instances in tests.
 * Provides sensible defaults and fluent interface for customization.
 *
 * @example
 * ```typescript
 * const party = new PartyConfigFakeBuilder()
 *   .withMembers(4, 5)  // 4 members at level 5
 *   .build();
 *
 * const single = new PartyConfigFakeBuilder()
 *   .withMember(1, 10)  // Class 1, level 10
 *   .build();
 * ```
 */
export class PartyConfigFakeBuilder extends FakeBuilder<PartyConfig> {
  private members: PartyMemberData[] = [
    { classId: 1, level: 5 },
  ];

  /**
   * Add a single party member.
   *
   * @param classId - Class ID from RPG Maker MZ
   * @param level - Member level (1-99)
   * @returns This builder for chaining
   */
  withMember(classId: number, level: number): this {
    this.members.push({ classId, level });
    return this;
  }

  /**
   * Create multiple party members at the same level.
   *
   * @param count - Number of members to create
   * @param level - Level for all members
   * @param startClassId - Starting class ID (default: 1)
   * @returns This builder for chaining
   */
  withMembers(count: number, level: number, startClassId: number = 1): this {
    this.members = Array.from({ length: count }, (_, i) => ({
      classId: startClassId + i,
      level,
    }));
    return this;
  }

  /**
   * Set the members array directly.
   *
   * @param members - Array of party member data
   * @returns This builder for chaining
   */
  withMembersData(members: PartyMemberData[]): this {
    this.members = [...members];
    return this;
  }

  /**
   * Create a party with invalid member level.
   *
   * @returns This builder for chaining
   */
  withInvalidMemberLevel(): this {
    return this.withMembersData([{ classId: 1, level: 0 }]);
  }

  /**
   * Create a party with out of range member level.
   *
   * @returns This builder for chaining
   */
  withOutOfRangeMemberLevel(): this {
    return this.withMembersData([{ classId: 1, level: 100 }]);
  }

  /**
   * Create a party with a member above max level.
   *
   * @returns This builder for chaining
   */
  withAboveMaxLevelMember(): this {
    return this.withMembersData([{ classId: 1, level: 100 }]);
  }

  /**
   * Create an empty party (invalid state).
   *
   * @returns This builder for chaining
   */
  withEmptyParty(): this {
    this.members = [];
    return this;
  }

  /**
   * Create a full 4-member party at specified level.
   *
   * @param level - Level for all members
   * @returns This builder for chaining
   */
  withFullParty(level: number = 5): this {
    return this.withMembers(4, level);
  }

  /**
   * Build the PartyConfig instance.
   *
   * @returns PartyConfig instance
   * @throws {ValidationError} If party configuration is invalid
   */
  build(): PartyConfig {
    return new PartyConfig([...this.members]);
  }

  /**
   * Create builder with invalid data.
   */
  withInvalidData(): this {
    return this.withEmptyParty();
  }
}
