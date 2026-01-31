import { Trecho, TrechoData } from '@coreto/core/core/domain/Trecho.js';
import { PartyConfig } from '@coreto/core/core/domain/PartyConfig.js';
import { ValidationError } from '@coreto/core/core/errors/index.js';

describe('Trecho', () => {
  const validParty = new PartyConfig([{ classId: 1, level: 5 }]);

  const createValidTrechoData = (): TrechoData => ({
    id: 'ato1-nivel1-10',
    name: 'Ato 1 - Níveis 1-10',
    anchorLevelMin: 1,
    anchorLevelMax: 10,
    targetTtkTurns: 3,
    targetTtkActions: 8,
    tolerancePercent: 15,
    troopIds: [1, 2, 3],
    party: validParty,
  });

  describe('constructor', () => {
    it('should create trecho with valid data', () => {
      const data = createValidTrechoData();
      const trecho = new Trecho(data);

      expect(trecho.id).toBe('ato1-nivel1-10');
      expect(trecho.name).toBe('Ato 1 - Níveis 1-10');
      expect(trecho.anchorLevelMin).toBe(1);
      expect(trecho.anchorLevelMax).toBe(10);
      expect(trecho.targetTtkTurns).toBe(3);
      expect(trecho.targetTtkActions).toBe(8);
      expect(trecho.tolerancePercent).toBe(15);
      expect(trecho.troopIds).toEqual([1, 2, 3]);
      expect(trecho.party).toBe(validParty);
    });

    it('should throw ValidationError when id is empty', () => {
      const data = createValidTrechoData();
      data.id = '';

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Trecho id is required');
    });

    it('should throw ValidationError when id is whitespace only', () => {
      const data = createValidTrechoData();
      data.id = '   ';

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Trecho id is required');
    });

    it('should throw ValidationError when anchorLevelMin is 0', () => {
      const data = createValidTrechoData();
      data.anchorLevelMin = 0;

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Anchor level must be 1-99');
    });

    it('should throw ValidationError when anchorLevelMax exceeds 99', () => {
      const data = createValidTrechoData();
      data.anchorLevelMax = 100;

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Anchor level must be 1-99');
    });

    it('should throw ValidationError when anchorLevelMin > anchorLevelMax', () => {
      const data = createValidTrechoData();
      data.anchorLevelMin = 10;
      data.anchorLevelMax = 5;

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Anchor level min must be <= max');
    });

    it('should accept equal anchorLevelMin and anchorLevelMax', () => {
      const data = createValidTrechoData();
      data.anchorLevelMin = 5;
      data.anchorLevelMax = 5;

      const trecho = new Trecho(data);

      expect(trecho.anchorLevelMin).toBe(5);
      expect(trecho.anchorLevelMax).toBe(5);
    });

    it('should throw ValidationError when tolerancePercent is negative', () => {
      const data = createValidTrechoData();
      data.tolerancePercent = -1;

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Tolerance must be 0-100');
    });

    it('should throw ValidationError when tolerancePercent exceeds 100', () => {
      const data = createValidTrechoData();
      data.tolerancePercent = 101;

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Tolerance must be 0-100');
    });

    it('should accept tolerancePercent at boundaries (0 and 100)', () => {
      const data1 = createValidTrechoData();
      data1.tolerancePercent = 0;
      const trecho1 = new Trecho(data1);
      expect(trecho1.tolerancePercent).toBe(0);

      const data2 = createValidTrechoData();
      data2.tolerancePercent = 100;
      const trecho2 = new Trecho(data2);
      expect(trecho2.tolerancePercent).toBe(100);
    });

    it('should throw ValidationError when troopIds is empty', () => {
      const data = createValidTrechoData();
      data.troopIds = [];

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Trecho must have at least 1 troopId');
    });

    it('should throw ValidationError when targetTtkTurns is 0', () => {
      const data = createValidTrechoData();
      data.targetTtkTurns = 0;

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Target TTK turns must be >= 1');
    });

    it('should throw ValidationError when targetTtkTurns is negative', () => {
      const data = createValidTrechoData();
      data.targetTtkTurns = -1;

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Target TTK turns must be >= 1');
    });

    it('should throw ValidationError when targetTtkActions is 0', () => {
      const data = createValidTrechoData();
      data.targetTtkActions = 0;

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Target TTK actions must be >= 1');
    });

    it('should throw ValidationError when targetTtkActions is negative', () => {
      const data = createValidTrechoData();
      data.targetTtkActions = -1;

      expect(() => new Trecho(data)).toThrow(ValidationError);
      expect(() => new Trecho(data)).toThrow('Target TTK actions must be >= 1');
    });

    it('should include context in ValidationError for anchor level validation', () => {
      const data = createValidTrechoData();
      data.anchorLevelMin = 10;
      data.anchorLevelMax = 5;

      try {
        new Trecho(data);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context).toEqual({
          anchorLevelMin: 10,
          anchorLevelMax: 5,
        });
      }
    });
  });

  describe('isWithinTolerance', () => {
    it('should return true when measured values exactly match targets', () => {
      const data = createValidTrechoData();
      data.targetTtkTurns = 3;
      data.targetTtkActions = 8;
      data.tolerancePercent = 15;
      const trecho = new Trecho(data);

      expect(trecho.isWithinTolerance(3, 8)).toBe(true);
    });

    it('should return true when measured values are within tolerance', () => {
      const data = createValidTrechoData();
      data.targetTtkTurns = 10;
      data.targetTtkActions = 30;
      data.tolerancePercent = 20; // ±20%
      const trecho = new Trecho(data);

      // Within ±20%: 8-12 turns, 24-36 actions
      expect(trecho.isWithinTolerance(8, 24)).toBe(true);
      expect(trecho.isWithinTolerance(12, 36)).toBe(true);
      expect(trecho.isWithinTolerance(10, 30)).toBe(true);
    });

    it('should return false when turns outside tolerance', () => {
      const data = createValidTrechoData();
      data.targetTtkTurns = 10;
      data.targetTtkActions = 30;
      data.tolerancePercent = 20; // ±20%
      const trecho = new Trecho(data);

      // Outside ±20%: turns < 8 or > 12
      expect(trecho.isWithinTolerance(7, 30)).toBe(false);
      expect(trecho.isWithinTolerance(13, 30)).toBe(false);
    });

    it('should return false when actions outside tolerance', () => {
      const data = createValidTrechoData();
      data.targetTtkTurns = 10;
      data.targetTtkActions = 30;
      data.tolerancePercent = 20; // ±20%
      const trecho = new Trecho(data);

      // Outside ±20%: actions < 24 or > 36
      expect(trecho.isWithinTolerance(10, 23)).toBe(false);
      expect(trecho.isWithinTolerance(10, 37)).toBe(false);
    });

    it('should require BOTH metrics within tolerance', () => {
      const data = createValidTrechoData();
      data.targetTtkTurns = 10;
      data.targetTtkActions = 30;
      data.tolerancePercent = 20; // ±20%
      const trecho = new Trecho(data);

      // Turns OK, actions NOT OK
      expect(trecho.isWithinTolerance(10, 40)).toBe(false);

      // Turns NOT OK, actions OK
      expect(trecho.isWithinTolerance(15, 30)).toBe(false);
    });

    it('should handle 0% tolerance (exact match only)', () => {
      const data = createValidTrechoData();
      data.targetTtkTurns = 5;
      data.targetTtkActions = 15;
      data.tolerancePercent = 0;
      const trecho = new Trecho(data);

      expect(trecho.isWithinTolerance(5, 15)).toBe(true);
      expect(trecho.isWithinTolerance(5, 16)).toBe(false);
      expect(trecho.isWithinTolerance(6, 15)).toBe(false);
    });

    it('should handle 100% tolerance (very permissive)', () => {
      const data = createValidTrechoData();
      data.targetTtkTurns = 5;
      data.targetTtkActions = 15;
      data.tolerancePercent = 100; // ±100%
      const trecho = new Trecho(data);

      // Within ±100%: 0-10 turns, 0-30 actions
      expect(trecho.isWithinTolerance(0, 0)).toBe(true);
      expect(trecho.isWithinTolerance(10, 30)).toBe(true);
    });

    it('should handle boundary values at tolerance limits', () => {
      const data = createValidTrechoData();
      data.targetTtkTurns = 10;
      data.targetTtkActions = 30;
      data.tolerancePercent = 10; // ±10%
      const trecho = new Trecho(data);

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
      const data = createValidTrechoData();
      const trecho = new Trecho(data);

      expect(Object.isFrozen(trecho)).toBe(true);
    });

    it('should have frozen troopIds array', () => {
      const data = createValidTrechoData();
      const trecho = new Trecho(data);

      expect(Object.isFrozen(trecho.troopIds)).toBe(true);
    });

    it('should not allow modification of troopIds', () => {
      const data = createValidTrechoData();
      const trecho = new Trecho(data);

      expect(() => {
        (trecho.troopIds as number[]).push(99);
      }).toThrow();
    });

    it('should not share reference with input troopIds', () => {
      const data = createValidTrechoData();
      const originalTroopIds = [...data.troopIds];
      const trecho = new Trecho(data);

      data.troopIds.push(99);

      expect(trecho.troopIds).toEqual(originalTroopIds);
      expect(trecho.troopIds).toHaveLength(3);
    });
  });
});
