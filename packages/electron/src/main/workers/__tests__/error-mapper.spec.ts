/**
 * Error Mapper Unit Tests
 *
 * Tests the error mapping function that transforms technical errors
 * into user-friendly messages.
 *
 * @see src/main/workers/error-mapper.ts
 */

import { mapErrorToUserMessage } from '../error-mapper.js';
import {
  createFileSystemError,
  createConfigError,
  createDataLoadError,
  createBattleTimeoutError,
  createSkillFormulaError,
  createDomainError,
} from '../../../../tests/helpers/error-factory.js';

describe('ErrorMapper', () => {
  describe('FileSystemError mapping', () => {
    it('should map FileSystemError to user-friendly message', () => {
      const error = createFileSystemError('File not found', '/path/to/project');

      const result = mapErrorToUserMessage(error);

      expect(result.title).toBe('Project Not Found');
      expect(result.code).toBe('ERR_PROJECT_NOT_FOUND');
      expect(result.description).toContain('RPG Maker MZ project');
      expect(result.details).toContain('/path/to/project');
      expect(result.originalType).toBe('FileSystemError');
    });

    it('should handle FileSystemError without path context', () => {
      const error = createFileSystemError('Access denied');

      const result = mapErrorToUserMessage(error);

      expect(result.title).toBe('Project Not Found');
      expect(result.details).toContain('unknown');
    });
  });

  describe('ConfigError mapping', () => {
    it('should map ConfigError to user-friendly message', () => {
      const error = createConfigError('Invalid trecho configuration');

      const result = mapErrorToUserMessage(error);

      expect(result.title).toBe('Invalid Configuration');
      expect(result.code).toBe('ERR_INVALID_CONFIG');
      expect(result.originalType).toBe('ConfigError');
    });
  });

  describe('DataLoadError mapping', () => {
    it('should map DataLoadError to user-friendly message with entity info', () => {
      const error = createDataLoadError('Troop not found', 'Troop', '42');

      const result = mapErrorToUserMessage(error);

      expect(result.title).toBe('Troop Not Found');
      expect(result.code).toBe('ERR_ENTITY_NOT_FOUND');
      expect(result.description).toContain('troop'); // lowercase because of toLowerCase()
      expect(result.description).toContain('42');
      expect(result.originalType).toBe('DataLoadError');
    });

    it('should handle DataLoadError without context', () => {
      const error = createDataLoadError('Load failed', 'Entity', 'unknown');

      const result = mapErrorToUserMessage(error);

      expect(result.title).toBe('Entity Not Found');
      expect(result.description).toContain('entity'); // lowercase
    });
  });

  describe('BattleTimeoutError mapping', () => {
    it('should map BattleTimeoutError to user-friendly message', () => {
      const error = createBattleTimeoutError('Battle exceeded 1000 turns', 1000);

      const result = mapErrorToUserMessage(error);

      expect(result.title).toBe('Battle Simulation Timed Out');
      expect(result.code).toBe('ERR_TIMEOUT');
      expect(result.description).toContain('infinite loop');
      expect(result.details).toContain('1000');
      expect(result.originalType).toBe('BattleTimeoutError');
    });
  });

  describe('SkillFormulaError mapping', () => {
    it('should map SkillFormulaError to user-friendly message', () => {
      const error = createSkillFormulaError('Unexpected token in formula', 15, 'a.atk * 2 + b.def');

      const result = mapErrorToUserMessage(error);

      expect(result.title).toBe('Skill Formula Error');
      expect(result.code).toBe('ERR_FORMULA');
      expect(result.description).toContain('15');
      expect(result.details).toContain('a.atk * 2 + b.def');
      expect(result.originalType).toBe('SkillFormulaError');
    });
  });

  describe('DomainError mapping', () => {
    it('should map DomainError to user-friendly message', () => {
      const error = createDomainError('Validation failed', { field: 'ttk', value: -1 });

      const result = mapErrorToUserMessage(error);

      expect(result.title).toBe('Validation Error');
      expect(result.code).toBe('ERR_VALIDATION');
      expect(result.originalType).toBe('DomainError');
    });

    it('should serialize context to JSON when available', () => {
      const error = createDomainError('Validation failed', { field: 'ttk', value: -1 });

      const result = mapErrorToUserMessage(error);

      expect(result.details).toContain('"field"');
      expect(result.details).toContain('"ttk"');
    });
  });

  describe('Unknown error handling', () => {
    it('should map unknown Error to generic message', () => {
      const error = new Error('Something went wrong');

      const result = mapErrorToUserMessage(error);

      expect(result.title).toBe('Simulation Failed');
      expect(result.code).toBe('ERR_UNKNOWN');
      expect(result.description).toContain('try again');
      expect(result.details).toBe('Something went wrong');
    });

    it('should handle null error', () => {
      const result = mapErrorToUserMessage(null);

      expect(result.title).toBe('Unknown Error');
      expect(result.code).toBe('ERR_UNKNOWN');
      expect(result.originalType).toBe('null');
    });

    it('should handle undefined error', () => {
      const result = mapErrorToUserMessage(undefined);

      expect(result.title).toBe('Unknown Error');
      expect(result.code).toBe('ERR_UNKNOWN');
      expect(result.originalType).toBe('null');
    });

    it('should handle non-Error objects', () => {
      const result = mapErrorToUserMessage('string error');

      expect(result.title).toBe('Invalid Error');
      expect(result.code).toBe('ERR_INVALID_ERROR');
      expect(result.details).toBe('string error');
      expect(result.originalType).toBe('string');
    });

    it('should handle non-Error objects with primitive types', () => {
      const result = mapErrorToUserMessage(42);

      expect(result.title).toBe('Invalid Error');
      expect(result.details).toBe('42');
      expect(result.originalType).toBe('number');
    });
  });

  describe('Error payload structure', () => {
    it('should always return required fields', () => {
      const error = new Error('Test error');
      const result = mapErrorToUserMessage(error);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('originalType');
    });

    it('should include optional details when available', () => {
      const error = new Error('Test with context');
      const result = mapErrorToUserMessage(error);

      expect(result.details).toBeDefined();
    });
  });
});
