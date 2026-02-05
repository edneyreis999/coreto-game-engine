import { DataLoadError, TroopNotFoundError, EnemyNotFoundError } from '@coreto/core';
import { DomainError } from '@coreto/core';

describe('DataLoadError', () => {
  describe('constructor', () => {
    it('should create error with critical severity by default', () => {
      const error = new DataLoadError('Data loading failed');

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(DataLoadError);
      expect(error.message).toBe('Data loading failed');
      expect(error.severity).toBe('critical');
      expect(error.name).toBe('DataLoadError');
    });

    it('should accept warning severity', () => {
      const error = new DataLoadError('Missing optional data', 'warning');

      expect(error.severity).toBe('warning');
    });

    it('should accept context data', () => {
      const context = { fileId: 'Troops.json', id: 5 };
      const error = new DataLoadError('Data not found', 'critical', context);

      expect(error.context).toEqual(context);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const error = new DataLoadError('Load error', 'critical', {
        file: 'data.json',
      });
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'DataLoadError');
      expect(json).toHaveProperty('message', 'Load error');
      expect(json).toHaveProperty('severity', 'critical');
      expect(json.context).toEqual({ file: 'data.json' });
    });
  });
});

describe('TroopNotFoundError', () => {
  describe('constructor', () => {
    it('should create error with troop ID in message', () => {
      const troopId = 42;
      const error = new TroopNotFoundError(troopId);

      expect(error).toBeInstanceOf(DataLoadError);
      expect(error).toBeInstanceOf(TroopNotFoundError);
      expect(error.message).toBe(`Troop ID ${troopId} not found in Troops.json`);
      expect(error.severity).toBe('critical');
    });

    it('should include troop ID in context', () => {
      const troopId = 42;
      const error = new TroopNotFoundError(troopId);

      expect(error.context).toHaveProperty('troopId', troopId);
    });

    it('should include optional trecho ID in context', () => {
      const troopId = 42;
      const trechoId = 'ato1-nivel1-10';
      const error = new TroopNotFoundError(troopId, trechoId);

      expect(error.context).toHaveProperty('troopId', troopId);
      expect(error.context).toHaveProperty('trechoId', trechoId);
    });

    it('should set trechoId to undefined when not provided', () => {
      const troopId = 42;
      const error = new TroopNotFoundError(troopId);

      expect(error.context).toHaveProperty('troopId', troopId);
      expect(error.context).toHaveProperty('trechoId', undefined);
    });
  });

  describe('toJSON', () => {
    it('should serialize with troop ID', () => {
      const troopId = 42;
      const error = new TroopNotFoundError(troopId);
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'TroopNotFoundError');
      expect(json).toHaveProperty('message');
      expect((json.message as string).includes(troopId.toString())).toBe(true);
      expect(json.context).toHaveProperty('troopId', troopId);
    });

    it('should serialize with trecho ID when provided', () => {
      const troopId = 42;
      const trechoId = 'ato1-nivel1-10';
      const error = new TroopNotFoundError(troopId, trechoId);
      const json = error.toJSON();

      expect(json.context).toHaveProperty('troopId', troopId);
      expect(json.context).toHaveProperty('trechoId', trechoId);
    });
  });
});

describe('EnemyNotFoundError', () => {
  describe('constructor', () => {
    it('should create error with warning severity', () => {
      const enemyId = 10;
      const troopId = 5;
      const error = new EnemyNotFoundError(enemyId, troopId);

      expect(error).toBeInstanceOf(DataLoadError);
      expect(error).toBeInstanceOf(EnemyNotFoundError);
      expect(error.message).toBe(`Enemy ID ${enemyId} not found in Enemies.json`);
      expect(error.severity).toBe('warning');
    });

    it('should include enemy ID and troop ID in context', () => {
      const enemyId = 10;
      const troopId = 5;
      const error = new EnemyNotFoundError(enemyId, troopId);

      expect(error.context).toHaveProperty('enemyId', enemyId);
      expect(error.context).toHaveProperty('troopId', troopId);
    });
  });

  describe('toJSON', () => {
    it('should serialize with enemy ID and troop ID', () => {
      const enemyId = 10;
      const troopId = 5;
      const error = new EnemyNotFoundError(enemyId, troopId);
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'EnemyNotFoundError');
      expect(json).toHaveProperty('message');
      expect((json.message as string).includes(enemyId.toString())).toBe(true);
      expect(json).toHaveProperty('severity', 'warning');
      expect(json.context).toHaveProperty('enemyId', enemyId);
      expect(json.context).toHaveProperty('troopId', troopId);
    });
  });

  
  describe('severity difference', () => {
    it('should have critical severity for TroopNotFoundError', () => {
      const troopError = new TroopNotFoundError(42);

      expect(troopError.severity).toBe('critical');
    });

    it('should have warning severity for EnemyNotFoundError', () => {
      const enemyError = new EnemyNotFoundError(10, 5);

      expect(enemyError.severity).toBe('warning');
    });
  });
});
