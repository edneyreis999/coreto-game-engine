import Chance from 'chance';
import { PartyConfig } from '../../../src/core/domain/PartyConfig';
import type { PartyMemberData } from '../../../src/core/domain/PartyConfig';

/**
 * FakeBuilder for PartyConfig domain entity.
 * Provides fluent interface for creating test data with realistic defaults.
 */
export class PartyConfigFakeBuilder {
  private chance = new Chance();
  private members: PartyMemberData[] = [
    { classId: 1, level: 5 },
  ];

  /**
   * Sets a single party member.
   */
  withSingleMember(classId: number, level: number): this {
    this.members = [{ classId, level }];
    return this;
  }

  /**
   * Adds a party member to the existing members.
   */
  withMember(classId: number, level: number): this {
    this.members = [...this.members, { classId, level }];
    return this;
  }

  /**
   * Sets multiple party members.
   */
  withMembers(members: PartyMemberData[]): this {
    this.members = members;
    return this;
  }

  /**
   * Sets a random party configuration.
   */
  withRandomMembers(count: number = 4): this {
    this.members = Array.from({ length: count }, () => ({
      classId: this.chance.integer({ min: 1, max: 10 }),
      level: this.chance.integer({ min: 1, max: 99 }),
    }));
    return this;
  }

  /**
   * Builds the PartyConfig instance.
   */
  build(): PartyConfig {
    return new PartyConfig(this.members);
  }
}
