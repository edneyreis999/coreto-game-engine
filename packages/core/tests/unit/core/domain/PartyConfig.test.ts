import { PartyConfig, PartyMemberData } from '@coreto/core';
import { ValidationError } from '@coreto/core';
import { PartyConfigFakeBuilder } from '../../../fakes';

describe('PartyConfig', () => {
  describe('constructor', () => {
    it('should create party with valid single member', () => {
      const party = new PartyConfigFakeBuilder().build();

      expect(party.members).toHaveLength(1);
      expect(party.members[0]?.classId).toBe(1);
      expect(party.members[0]?.level).toBe(5);
    });

    it('should create party with multiple members', () => {
      const party = new PartyConfigFakeBuilder().withMembers(3, 5, 1).build();

      expect(party.members).toHaveLength(3);
      expect(party.members[0]?.classId).toBe(1);
      expect(party.members[1]?.level).toBe(5);
      expect(party.members[2]?.classId).toBe(3);
    });

    it('should accept level 1 (min boundary)', () => {
      const party = new PartyConfigFakeBuilder().withMembers(1, 1).build();

      expect(party.members[0]?.level).toBe(1);
    });

    it('should accept level 99 (max boundary)', () => {
      const party = new PartyConfigFakeBuilder().withMembers(1, 99).build();

      expect(party.members[0]?.level).toBe(99);
    });

    it('should throw ValidationError when party is empty', () => {
      const builder = new PartyConfigFakeBuilder().withEmptyParty();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Party must have at least 1 member');
    });

    it('should throw ValidationError when member level is 0', () => {
      const builder = new PartyConfigFakeBuilder().withInvalidMemberLevel();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Member level must be 1-99');
    });

    it('should throw ValidationError when member level is negative', () => {
      const members: PartyMemberData[] = [{ classId: 1, level: -1 }];

      expect(() => new PartyConfig(members)).toThrow(ValidationError);
      expect(() => new PartyConfig(members)).toThrow('Member level must be 1-99');
    });

    it('should throw ValidationError when member level exceeds 99', () => {
      const builder = new PartyConfigFakeBuilder().withOutOfRangeMemberLevel();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Member level must be 1-99');
    });

    it('should include context in ValidationError for invalid level', () => {
      const members: PartyMemberData[] = [{ classId: 5, level: 100 }];

      expect(() => new PartyConfig(members)).toThrow(ValidationError);
      try {
        new PartyConfig(members);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context).toEqual({
          classId: 5,
          level: 100,
        });
      }
    });

    it('should throw ValidationError for first invalid member in mixed party', () => {
      const members: PartyMemberData[] = [
        { classId: 1, level: 5 },
        { classId: 2, level: 0 }, // Invalid
        { classId: 3, level: 10 },
      ];

      expect(() => new PartyConfig(members)).toThrow(ValidationError);
      expect(() => new PartyConfig(members)).toThrow('Member level must be 1-99');
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const party = new PartyConfigFakeBuilder().build();

      expect(Object.isFrozen(party)).toBe(true);
    });

    it('should have frozen members array', () => {
      const party = new PartyConfigFakeBuilder().build();

      expect(Object.isFrozen(party.members)).toBe(true);
    });

    it('should not allow modification of members array', () => {
      const party = new PartyConfigFakeBuilder().build();

      expect(() => {
        (party.members as PartyMemberData[]).push({ classId: 2, level: 10 });
      }).toThrow();
    });

    it('should not share reference with input array', () => {
      const members: PartyMemberData[] = [{ classId: 1, level: 5 }];
      const party = new PartyConfig(members);

      members.push({ classId: 2, level: 10 });

      expect(party.members).toHaveLength(1);
    });
  });
});
