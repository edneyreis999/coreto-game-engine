/**
 * Game Data Transformer Utilities
 *
 * Pure functions for transforming RPG Maker MZ data into UI-friendly formats.
 * Extracts data mapping logic from ConfigurationPanel component.
 *
 * @see Task #7 - Extract business logic from ConfigurationPanel
 */

import type { SelectOption } from '../components/ConfigurationPanel/types';

/**
 * Transforms RPG Maker MZ data items into dropdown options.
 *
 * Filters out invalid items (id <= 0 or empty name) and formats
 * as "id: name" for display in select dropdowns.
 *
 * @param items - Array of items with id and name properties
 * @returns Array of select options for dropdowns
 *
 * @example
 * ```typescript
 * const classes = [
 *   { id: 1, name: 'Warrior' },
 *   { id: 2, name: 'Mage' },
 *   { id: 0, name: '' } // Filtered out
 * ];
 *
 * const options = transformToDropdownOptions(classes);
 * // Result: [
 * //   { value: 1, label: '1: Warrior' },
 * //   { value: 2, label: '2: Mage' }
 * // ]
 * ```
 */
export function transformToDropdownOptions<T extends { id: number; name: string }>(
  items: T[]
): SelectOption[] {
  return items
    .filter((item) => item.id > 0 && item.name && item.name.trim().length > 0)
    .map((item) => ({
      value: item.id,
      label: `${item.id}: ${item.name}`,
    }));
}

/**
 * Transforms classes data into dropdown options.
 *
 * Convenience wrapper around transformToDropdownOptions for classes.
 *
 * @param classes - Classes data from RPG Maker MZ
 * @returns Select options for class dropdowns
 */
export function transformClassesToOptions<T extends { id: number; name: string }>(
  classes: T[]
): SelectOption[] {
  return transformToDropdownOptions(classes);
}

/**
 * Transforms troops data into dropdown options.
 *
 * Convenience wrapper around transformToDropdownOptions for troops.
 *
 * @param troops - Troops data from RPG Maker MZ
 * @returns Select options for troop dropdowns
 */
export function transformTroopsToOptions<T extends { id: number; name: string }>(
  troops: T[]
): SelectOption[] {
  return transformToDropdownOptions(troops);
}
