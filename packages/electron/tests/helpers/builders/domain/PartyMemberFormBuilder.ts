/**
 * FakeBuilders for Party form data in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/domain/types/form-types.ts
 */

import Chance from 'chance';
import type { PartyMemberFormData, PartyFormData } from '../../../../src/domain/types/form-types';

const chance = new Chance();

/**
 * Builder for creating PartyMemberFormData in tests.
 */
export class PartyMemberFormBuilder {
  private data: Partial<PartyMemberFormData> = {};

  static create(): PartyMemberFormBuilder {
    return new PartyMemberFormBuilder().withDefaults();
  }

  withDefaults(): this {
    this.data = {
      classId: chance.natural({ min: 1, max: 99 }),
      level: chance.natural({ min: 1, max: 99 }),
    };
    return this;
  }

  withClassId(classId: number): this {
    this.data.classId = classId;
    return this;
  }

  withLevel(level: number): this {
    this.data.level = level;
    return this;
  }

  /**
   * Creates a warrior with sword (classId 1).
   */
  withWarriorDefaults(): this {
    this.data.classId = 1;
    this.data.level = 12;
    return this;
  }

  /**
   * Creates a mage with magic (classId 2).
   */
  withMageDefaults(): this {
    this.data.classId = 2;
    this.data.level = 10;
    return this;
  }

  build(): PartyMemberFormData {
    return {
      classId: this.data.classId ?? chance.natural({ min: 1, max: 99 }),
      level: this.data.level ?? chance.natural({ min: 1, max: 99 }),
    };
  }
}

/**
 * Builder for creating PartyFormData in tests.
 */
export class PartyConfigFormBuilder {
  private members: PartyMemberFormData[] = [];
  private allowEmpty: boolean = false;

  static create(): PartyConfigFormBuilder {
    return new PartyConfigFormBuilder().withDefaults();
  }

  withDefaults(): this {
    this.members = [
      PartyMemberFormBuilder.create()
        .withClassId(1)
        .withLevel(12)
        .build(),
    ];
    return this;
  }

  withMember(member: PartyMemberFormData): this {
    this.members.push(member);
    return this;
  }

  withMembers(members: PartyMemberFormData[]): this {
    this.members = members;
    // Allow empty array if explicitly set
    if (members.length === 0) {
      this.allowEmpty = true;
    }
    return this;
  }

  /**
   * Creates a balanced party of 4 members.
   */
  withBalancedParty(): this {
    this.members = [
      PartyMemberFormBuilder.create().withClassId(1).withLevel(12).build(), // Warrior
      PartyMemberFormBuilder.create().withClassId(2).withLevel(10).build(), // Mage
      PartyMemberFormBuilder.create().withClassId(3).withLevel(11).build(), // Healer
      PartyMemberFormBuilder.create().withClassId(4).withLevel(13).build(), // Rogue
    ];
    return this;
  }

  /**
   * Creates a minimal party with 1 member.
   */
  withMinimalParty(): this {
    this.members = [
      PartyMemberFormBuilder.create()
        .withClassId(1)
        .withLevel(1)
        .build(),
    ];
    return this;
  }

  /**
   * Creates a full party of 4 members at specified level.
   */
  withFullParty(level: number = 12): this {
    this.members = [
      PartyMemberFormBuilder.create().withClassId(1).withLevel(level).build(),
      PartyMemberFormBuilder.create().withClassId(2).withLevel(level).build(),
      PartyMemberFormBuilder.create().withClassId(3).withLevel(level).build(),
      PartyMemberFormBuilder.create().withClassId(4).withLevel(level).build(),
    ];
    return this;
  }

  /**
   * Creates a party with specific class IDs and levels.
   * @param configs Array of {classId, level} tuples
   */
  withCustomParty(configs: Array<{ classId: number; level: number }>): this {
    this.members = configs.map((config) =>
      PartyMemberFormBuilder.create()
        .withClassId(config.classId)
        .withLevel(config.level)
        .build()
    );
    return this;
  }

  build(): PartyFormData {
    // Ensure at least one member unless explicitly allowed to be empty
    if (this.members.length === 0 && !this.allowEmpty) {
      this.members.push(PartyMemberFormBuilder.create().build());
    }

    return { members: this.members };
  }
}
