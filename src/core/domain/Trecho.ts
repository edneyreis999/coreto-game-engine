import { ValidationError } from '@/core/errors/index.js';
import { PartyConfig } from './PartyConfig.js';

/**
 * Trecho data structure.
 * Contains all data needed to construct a Trecho entity.
 */
export interface TrechoData {
  /**
   * Unique identifier for this trecho (e.g., "ato1-nivel1-10").
   */
  id: string;

  /**
   * Human-readable name for this trecho.
   */
  name: string;

  /**
   * Minimum level in the anchor level range.
   */
  anchorLevelMin: number;

  /**
   * Maximum level in the anchor level range.
   */
  anchorLevelMax: number;

  /**
   * Target TTK measured in turns.
   */
  targetTtkTurns: number;

  /**
   * Target TTK measured in actions.
   */
  targetTtkActions: number;

  /**
   * Tolerance percentage (0-100, e.g., 15 = ±15%).
   */
  tolerancePercent: number;

  /**
   * Array of troop IDs to test in this trecho.
   */
  troopIds: number[];

  /**
   * Party configuration for this trecho.
   */
  party: PartyConfig;
}

/**
 * Trecho entity.
 * Represents a story segment with combat balance configuration and validation rules.
 *
 * A trecho defines:
 * - Level range for combat encounters
 * - Target TTK metrics (turns and actions)
 * - Tolerance window for validation
 * - Associated troops for testing
 * - Party composition
 *
 * Immutable entity following domain-driven design principles.
 * All validation occurs in the constructor, ensuring invalid states are impossible.
 *
 * @example
 * ```typescript
 * const trecho = new Trecho({
 *   id: 'ato1-nivel1-10',
 *   name: 'Ato 1 - Níveis 1-10',
 *   anchorLevelMin: 1,
 *   anchorLevelMax: 10,
 *   targetTtkTurns: 3,
 *   targetTtkActions: 8,
 *   tolerancePercent: 15,
 *   troopIds: [1, 2, 3],
 *   party: new PartyConfig([{ classId: 1, level: 5 }])
 * });
 * ```
 */
export class Trecho {
  readonly id: string;
  readonly name: string;
  readonly anchorLevelMin: number;
  readonly anchorLevelMax: number;
  readonly targetTtkTurns: number;
  readonly targetTtkActions: number;
  readonly tolerancePercent: number;
  readonly troopIds: readonly number[];
  readonly party: PartyConfig;

  /**
   * Creates a new Trecho.
   *
   * @param data - Trecho configuration data
   * @throws {ValidationError} If any validation rule fails
   */
  constructor(data: TrechoData) {
    // Validate ID
    if (!data.id || data.id.trim() === '') {
      throw new ValidationError('Trecho id is required');
    }

    // Validate anchor level range
    if (data.anchorLevelMin < 1 || data.anchorLevelMax > 99) {
      throw new ValidationError('Anchor level must be 1-99', {
        anchorLevelMin: data.anchorLevelMin,
        anchorLevelMax: data.anchorLevelMax,
      });
    }

    if (data.anchorLevelMin > data.anchorLevelMax) {
      throw new ValidationError('Anchor level min must be <= max', {
        anchorLevelMin: data.anchorLevelMin,
        anchorLevelMax: data.anchorLevelMax,
      });
    }

    // Validate tolerance
    if (data.tolerancePercent < 0 || data.tolerancePercent > 100) {
      throw new ValidationError('Tolerance must be 0-100', {
        tolerancePercent: data.tolerancePercent,
      });
    }

    // Validate troop IDs
    if (data.troopIds.length === 0) {
      throw new ValidationError('Trecho must have at least 1 troopId');
    }

    // Validate TTK targets
    if (data.targetTtkTurns < 1) {
      throw new ValidationError('Target TTK turns must be >= 1', {
        targetTtkTurns: data.targetTtkTurns,
      });
    }

    if (data.targetTtkActions < 1) {
      throw new ValidationError('Target TTK actions must be >= 1', {
        targetTtkActions: data.targetTtkActions,
      });
    }

    // Assign validated data
    this.id = data.id;
    this.name = data.name;
    this.anchorLevelMin = data.anchorLevelMin;
    this.anchorLevelMax = data.anchorLevelMax;
    this.targetTtkTurns = data.targetTtkTurns;
    this.targetTtkActions = data.targetTtkActions;
    this.tolerancePercent = data.tolerancePercent;
    this.troopIds = Object.freeze([...data.troopIds]);
    this.party = data.party;

    // Freeze to ensure immutability
    Object.freeze(this);
  }

  /**
   * Checks if measured TTK is within tolerance window.
   *
   * Calculates deviation from target for both turns and actions.
   * Returns true only if BOTH metrics are within tolerance.
   *
   * @param measuredTurns - Measured TTK in turns
   * @param measuredActions - Measured TTK in actions
   * @returns True if both metrics within tolerance, false otherwise
   *
   * @example
   * ```typescript
   * const trecho = new Trecho({
   *   targetTtkTurns: 3,
   *   targetTtkActions: 8,
   *   tolerancePercent: 15,
   *   // ... other fields
   * });
   *
   * trecho.isWithinTolerance(3, 8);  // true (exact match)
   * trecho.isWithinTolerance(4, 9);  // true (within ±15%)
   * trecho.isWithinTolerance(5, 12); // false (outside tolerance)
   * ```
   */
  isWithinTolerance(measuredTurns: number, measuredActions: number): boolean {
    const turnsDev = Math.abs(measuredTurns - this.targetTtkTurns) / this.targetTtkTurns;
    const actionsDev = Math.abs(measuredActions - this.targetTtkActions) / this.targetTtkActions;
    const toleranceFraction = this.tolerancePercent / 100;

    return turnsDev <= toleranceFraction && actionsDev <= toleranceFraction;
  }
}
