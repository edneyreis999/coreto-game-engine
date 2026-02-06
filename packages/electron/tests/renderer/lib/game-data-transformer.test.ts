/**
 * Game Data Transformer Tests
 *
 * Tests for pure functions that transform RPG Maker MZ data into UI formats.
 *
 * @see Task #7 - Extract business logic from ConfigurationPanel
 */

import { describe, it, expect } from 'vitest';
import {
  transformToDropdownOptions,
  transformClassesToOptions,
  transformTroopsToOptions,
} from '@/lib/game-data-transformer';

describe('game-data-transformer', () => {
  describe('transformToDropdownOptions', () => {
    it('should transform valid items to dropdown options', () => {
      const items = [
        { id: 1, name: 'Warrior' },
        { id: 2, name: 'Mage' },
        { id: 3, name: 'Thief' },
      ];

      const result = transformToDropdownOptions(items);

      expect(result).toEqual([
        { value: 1, label: '1: Warrior' },
        { value: 2, label: '2: Mage' },
        { value: 3, label: '3: Thief' },
      ]);
    });

    it('should filter out items with id <= 0', () => {
      const items = [
        { id: 0, name: 'Invalid' },
        { id: 1, name: 'Valid' },
        { id: -1, name: 'Negative' },
      ];

      const result = transformToDropdownOptions(items);

      expect(result).toEqual([{ value: 1, label: '1: Valid' }]);
    });

    it('should filter out items with empty name', () => {
      const items = [
        { id: 1, name: '' },
        { id: 2, name: 'Valid' },
        { id: 3, name: '   ' }, // Whitespace only
      ];

      const result = transformToDropdownOptions(items);

      expect(result).toEqual([{ value: 2, label: '2: Valid' }]);
    });

    it('should handle empty array', () => {
      const items: Array<{ id: number; name: string }> = [];

      const result = transformToDropdownOptions(items);

      expect(result).toEqual([]);
    });

    it('should preserve name with special characters', () => {
      const items = [
        { id: 1, name: 'Dark Knight (Special)' },
        { id: 2, name: 'Mage - Level 10' },
      ];

      const result = transformToDropdownOptions(items);

      expect(result).toEqual([
        { value: 1, label: '1: Dark Knight (Special)' },
        { value: 2, label: '2: Mage - Level 10' },
      ]);
    });

    it('should work with types that extend base interface', () => {
      interface ExtendedItem {
        id: number;
        name: string;
        description: string;
        level: number;
      }

      const items: ExtendedItem[] = [
        { id: 1, name: 'Warrior', description: 'Strong fighter', level: 5 },
        { id: 2, name: 'Mage', description: 'Magic user', level: 10 },
      ];

      const result = transformToDropdownOptions(items);

      expect(result).toEqual([
        { value: 1, label: '1: Warrior' },
        { value: 2, label: '2: Mage' },
      ]);
    });
  });

  describe('transformClassesToOptions', () => {
    it('should work as alias for transformToDropdownOptions', () => {
      const classes = [
        { id: 1, name: 'Warrior' },
        { id: 2, name: 'Mage' },
      ];

      const result = transformClassesToOptions(classes);

      expect(result).toEqual([
        { value: 1, label: '1: Warrior' },
        { value: 2, label: '2: Mage' },
      ]);
    });
  });

  describe('transformTroopsToOptions', () => {
    it('should work as alias for transformToDropdownOptions', () => {
      const troops = [
        { id: 1, name: 'Goblin Squad' },
        { id: 2, name: 'Dragon Horde' },
      ];

      const result = transformTroopsToOptions(troops);

      expect(result).toEqual([
        { value: 1, label: '1: Goblin Squad' },
        { value: 2, label: '2: Dragon Horde' },
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle very large ids', () => {
      const items = [{ id: 999999, name: 'High ID Item' }];

      const result = transformToDropdownOptions(items);

      expect(result).toEqual([{ value: 999999, label: '999999: High ID Item' }]);
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(500);
      const items = [{ id: 1, name: longName }];

      const result = transformToDropdownOptions(items);

      expect(result).toEqual([{ value: 1, label: `1: ${longName}` }]);
    });

    it('should handle unicode characters in names', () => {
      const items = [
        { id: 1, name: '戦士 (Warrior)' },
        { id: 2, name: 'Маг' },
        { id: 3, name: 'Thief 🗡️' },
      ];

      const result = transformToDropdownOptions(items);

      expect(result).toEqual([
        { value: 1, label: '1: 戦士 (Warrior)' },
        { value: 2, label: '2: Маг' },
        { value: 3, label: '3: Thief 🗡️' },
      ]);
    });
  });
});
