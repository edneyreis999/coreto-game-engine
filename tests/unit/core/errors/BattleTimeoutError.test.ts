import { BattleTimeoutError } from '@coreto/core';
import { DomainError } from '@coreto/core';

describe('BattleTimeoutError', () => {
  describe('constructor', () => {
    it('should create error with critical severity', () => {
      const troopId = 5;
      const frames = 100000;
      const maxFrames = 50000;
      const error = new BattleTimeoutError(troopId, frames, maxFrames);

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(BattleTimeoutError);
      expect(error.message).toBe(`Battle timeout: exceeded ${maxFrames} frames`);
      expect(error.severity).toBe('critical');
      expect(error.name).toBe('BattleTimeoutError');
    });

    it('should include all parameters in context', () => {
      const troopId = 5;
      const frames = 100000;
      const maxFrames = 50000;
      const error = new BattleTimeoutError(troopId, frames, maxFrames);

      expect(error.context).toHaveProperty('troopId', troopId);
      expect(error.context).toHaveProperty('frames', frames);
      expect(error.context).toHaveProperty('maxFrames', maxFrames);
    });

    it('should format message with max frames', () => {
      const maxFrames = 75000;
      const error = new BattleTimeoutError(1, 90000, maxFrames);

      expect(error.message).toContain(maxFrames.toString());
    });
  });

  describe('toJSON', () => {
    it('should serialize with all battle context', () => {
      const troopId = 5;
      const frames = 100000;
      const maxFrames = 50000;
      const error = new BattleTimeoutError(troopId, frames, maxFrames);
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'BattleTimeoutError');
      expect(json).toHaveProperty('message');
      expect((json.message as string).includes(maxFrames.toString())).toBe(true);
      expect(json).toHaveProperty('severity', 'critical');
      expect(json.context).toHaveProperty('troopId', troopId);
      expect(json.context).toHaveProperty('frames', frames);
      expect(json.context).toHaveProperty('maxFrames', maxFrames);
    });
  });

  describe('Error inheritance', () => {
    it('should be instanceof DomainError', () => {
      const error = new BattleTimeoutError(5, 100000, 50000);

      expect(error instanceof DomainError).toBe(true);
    });

    it('should be instanceof BattleTimeoutError', () => {
      const error = new BattleTimeoutError(5, 100000, 50000);

      expect(error instanceof BattleTimeoutError).toBe(true);
    });

    it('should be throwable', () => {
      expect(() => {
        throw new BattleTimeoutError(5, 100000, 50000);
      }).toThrow('Battle timeout');
    });

    it('should be catchable as DomainError', () => {
      try {
        throw new BattleTimeoutError(5, 100000, 50000);
      } catch (error) {
        expect(error).toBeInstanceOf(DomainError);
      }
    });
  });

  describe('context data', () => {
    it('should provide debugging context for timeout investigation', () => {
      const troopId = 42;
      const frames = 150000;
      const maxFrames = 100000;
      const error = new BattleTimeoutError(troopId, frames, maxFrames);

      // Context should help debug why battle timed out
      expect(error.context.troopId).toBe(troopId);
      expect(error.context.frames).toBe(frames);
      expect(error.context.maxFrames).toBe(maxFrames);

      // Can calculate how much it exceeded by
      const exceededBy = (error.context.frames as number) - (error.context.maxFrames as number);
      expect(exceededBy).toBe(50000);
    });
  });
});
