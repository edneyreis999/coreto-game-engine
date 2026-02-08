import { Trecho, TrechoData } from '@coreto/core';
import { ValidationError } from '@coreto/core';
import { TrechoFakeBuilder, PartyConfigFakeBuilder } from '../../../fakes';

describe('Trecho', () => {
  const validParty = new PartyConfigFakeBuilder().build();

  describe('constructor', () => {
    it('should create trecho with valid data', () => {
      const trecho = new TrechoFakeBuilder().withParty(validParty).build();

      expect(trecho.id).toBe('ato1-nivel1-10');
      expect(trecho.name).toBe('Ato 1 - Níveis 1-10');
      expect(trecho.anchorLevelMin).toBe(1); // Default from FakeBuilder
      expect(trecho.anchorLevelMax).toBe(10); // Default from FakeBuilder
      expect(trecho.targetTtkTurns).toBe(3); // Default from FakeBuilder
      expect(trecho.targetTtkActions).toBe(8); // Default from FakeBuilder
      expect(trecho.tolerancePercent).toBe(15); // Default from FakeBuilder
      expect(trecho.troopIds).toEqual([1, 2, 3]); // Default from FakeBuilder
      expect(trecho.party).toBe(validParty);
    });

    it('should throw ValidationError when id is empty', () => {
      const builder = new TrechoFakeBuilder().withEmptyId();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Trecho id is required');
    });

    it('should throw ValidationError when id is whitespace only', () => {
      const builder = new TrechoFakeBuilder().withId('   ');

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Trecho id is required');
    });

    it('should throw ValidationError when anchorLevelMin is 0', () => {
      const builder = new TrechoFakeBuilder().withBelowMinLevel();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Anchor level must be 1-99');
    });

    it('should throw ValidationError when anchorLevelMax exceeds LEVEL_CONSTANTS.MAX_LEVEL', () => {
      const builder = new TrechoFakeBuilder().withAboveMaxLevel();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Anchor level must be 1-99');
    });

    it('should throw ValidationError when anchorLevelMin > anchorLevelMax', () => {
      const builder = new TrechoFakeBuilder().withInvalidLevelRange();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Anchor level min must be <= max');
    });

    it('should accept equal anchorLevelMin and anchorLevelMax', () => {
      const trecho = new TrechoFakeBuilder().withLevelRange(5, 5).build();

      expect(trecho.anchorLevelMin).toBe(5);
      expect(trecho.anchorLevelMax).toBe(5);
    });

    it('should throw ValidationError when tolerancePercent is negative', () => {
      const builder = new TrechoFakeBuilder().withNegativeTolerance();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Tolerance must be 0-100');
    });

    it('should throw ValidationError when tolerancePercent exceeds 100', () => {
      const builder = new TrechoFakeBuilder().withAboveMaxTolerance();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Tolerance must be 0-100');
    });

    it('should accept tolerancePercent at boundaries (0 and 100)', () => {
      const trecho1 = new TrechoFakeBuilder().withTolerance(0).build();
      expect(trecho1.tolerancePercent).toBe(0);

      const trecho2 = new TrechoFakeBuilder().withTolerance(100).build();
      expect(trecho2.tolerancePercent).toBe(100);
    });

    it('should throw ValidationError when troopIds is empty', () => {
      const builder = new TrechoFakeBuilder().withNoTroopIds();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Trecho must have at least 1 troopId');
    });

    it('should throw ValidationError when targetTtkTurns is 0', () => {
      const builder = new TrechoFakeBuilder().withZeroTtkTurns();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Target TTK turns must be >= 1');
    });

    it('should throw ValidationError when targetTtkTurns is negative', () => {
      const data: TrechoData = {
        id: 'test',
        name: 'Test',
        anchorLevelMin: 1,
        anchorLevelMax: 10,
        targetTtkTurns: -1,
        targetTtkActions: 8,
        tolerancePercent: 15,
        troopIds: [1],
        party: validParty,
      };

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Target TTK turns must be >= 1');
    });

    it('should throw ValidationError when targetTtkActions is 0', () => {
      const builder = new TrechoFakeBuilder().withZeroTtkActions();

      expect(() => builder.build()).toThrow(ValidationError);
      expect(() => builder.build()).toThrow('Target TTK actions must be >= 1');
    });

    it('should throw ValidationError when targetTtkActions is negative', () => {
      const data: TrechoData = {
        id: 'test',
        name: 'Test',
        anchorLevelMin: 1,
        anchorLevelMax: 10,
        targetTtkTurns: 3,
        targetTtkActions: -1,
        tolerancePercent: 15,
        troopIds: [1],
        party: validParty,
      };

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Target TTK actions must be >= 1');
    });

    it('should include context in ValidationError for anchor level validation', () => {
      const builder = new TrechoFakeBuilder().withInvalidLevelRange();

      expect(() => builder.build()).toThrow(ValidationError);
      try {
        builder.build();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        // The builder sets min=10, max=1 internally for invalid range
        expect(validationError.context).toHaveProperty('anchorLevelMin');
        expect(validationError.context).toHaveProperty('anchorLevelMax');
      }
    });
  });

  describe('isWithinTolerance', () => {
    it('should return true when measured values exactly match targets', () => {
      const trecho = new TrechoFakeBuilder().withParty(validParty).build();

      expect(trecho.isWithinTolerance(3, 8)).toBe(true);
    });

    it('should return true when measured values are within tolerance', () => {
      const trecho = new TrechoFakeBuilder()
        .withTargetTtk(10, 30)
        .withTolerance(20)
        .withParty(validParty)
        .build();

      // Within ±20%: 8-12 turns, 24-36 actions
      expect(trecho.isWithinTolerance(8, 24)).toBe(true);
      expect(trecho.isWithinTolerance(12, 36)).toBe(true);
      expect(trecho.isWithinTolerance(10, 30)).toBe(true);
    });

    it('should return false when turns outside tolerance', () => {
      const trecho = new TrechoFakeBuilder()
        .withTargetTtk(10, 30)
        .withTolerance(20)
        .withParty(validParty)
        .build();

      // Outside ±20%: turns < 8 or > 12
      expect(trecho.isWithinTolerance(7, 30)).toBe(false);
      expect(trecho.isWithinTolerance(13, 30)).toBe(false);
    });

    it('should return false when actions outside tolerance', () => {
      const trecho = new TrechoFakeBuilder()
        .withTargetTtk(10, 30)
        .withTolerance(20)
        .withParty(validParty)
        .build();

      // Outside ±20%: actions < 24 or > 36
      expect(trecho.isWithinTolerance(10, 23)).toBe(false);
      expect(trecho.isWithinTolerance(10, 37)).toBe(false);
    });

    it('should require BOTH metrics within tolerance', () => {
      const trecho = new TrechoFakeBuilder()
        .withTargetTtk(10, 30)
        .withTolerance(20)
        .withParty(validParty)
        .build();

      // Turns OK, actions NOT OK
      expect(trecho.isWithinTolerance(10, 40)).toBe(false);

      // Turns NOT OK, actions OK
      expect(trecho.isWithinTolerance(15, 30)).toBe(false);
    });

    it('should handle 0% tolerance (exact match only)', () => {
      const trecho = new TrechoFakeBuilder()
        .withTargetTtk(5, 15)
        .withTolerance(0)
        .withParty(validParty)
        .build();

      expect(trecho.isWithinTolerance(5, 15)).toBe(true);
      expect(trecho.isWithinTolerance(5, 16)).toBe(false);
      expect(trecho.isWithinTolerance(6, 15)).toBe(false);
    });

    it('should handle 100% tolerance (very permissive)', () => {
      const trecho = new TrechoFakeBuilder()
        .withTargetTtk(5, 15)
        .withTolerance(100)
        .withParty(validParty)
        .build();

      // Within ±100%: 0-10 turns, 0-30 actions
      expect(trecho.isWithinTolerance(0, 0)).toBe(true);
      expect(trecho.isWithinTolerance(10, 30)).toBe(true);
    });

    it('should handle boundary values at tolerance limits', () => {
      const trecho = new TrechoFakeBuilder()
        .withTargetTtk(10, 30)
        .withTolerance(10)
        .withParty(validParty)
        .build();

      // Exactly at ±10%: 9-11 turns, 27-33 actions
      expect(trecho.isWithinTolerance(9, 27)).toBe(true);
      expect(trecho.isWithinTolerance(11, 33)).toBe(true);

      // Just outside ±10%
      expect(trecho.isWithinTolerance(8, 27)).toBe(false);
      expect(trecho.isWithinTolerance(9, 26)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const trecho = new TrechoFakeBuilder().withParty(validParty).build();

      expect(Object.isFrozen(trecho)).toBe(true);
    });

    it('should have frozen troopIds array', () => {
      const trecho = new TrechoFakeBuilder().withParty(validParty).build();

      expect(Object.isFrozen(trecho.troopIds)).toBe(true);
    });

    it('should not allow modification of troopIds', () => {
      const trecho = new TrechoFakeBuilder().withParty(validParty).build();

      expect(() => {
        (trecho.troopIds as number[]).push(99);
      }).toThrow();
    });

    it('should not share reference with input troopIds', () => {
      const data: TrechoData = {
        id: 'test',
        name: 'Test',
        anchorLevelMin: 1,
        anchorLevelMax: 10,
        targetTtkTurns: 3,
        targetTtkActions: 8,
        tolerancePercent: 15,
        troopIds: [1, 2, 3],
        party: validParty,
      };
      const originalTroopIds = [...data.troopIds];
      const trecho = new Trecho(data);

      data.troopIds.push(99);

      expect(trecho.troopIds).toEqual(originalTroopIds);
      expect(trecho.troopIds).toHaveLength(3);
    });
  });
});
