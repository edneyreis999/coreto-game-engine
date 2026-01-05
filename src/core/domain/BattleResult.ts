/**
 * Battle outcome types.
 * Represents the final state of a battle simulation.
 */
export type BattleOutcome = 'victory' | 'defeat' | 'timeout';

/**
 * Battle result data structure.
 * Contains all data needed to construct a BattleResult entity.
 */
export interface BattleResultData {
  /**
   * Troop ID from RPG Maker MZ Troops.json (1-based index).
   */
  troopId: number;

  /**
   * Human-readable troop name.
   */
  troopName: string;

  /**
   * Battle outcome (victory, defeat, or timeout).
   */
  outcome: BattleOutcome;

  /**
   * Time-to-Kill measured in full battle turns.
   * Number of complete turns until all enemies defeated.
   */
  ttkTurns: number;

  /**
   * Time-to-Kill measured in total actions.
   * Total number of actions executed by party members.
   */
  ttkActions: number;

  /**
   * Battle duration in milliseconds.
   */
  durationMs: number;

  /**
   * RNG seed used for this battle (for determinism).
   */
  seed: number;

  /**
   * Total EXP gained from this battle (usually the troop reward on victory).
   * For defeat/timeout this should be 0.
   */
  expGained?: number;
}

/**
 * Battle result entity.
 * Represents the outcome and metrics of a single battle simulation.
 *
 * Immutable entity following domain-driven design principles.
 * Contains TTK metrics measured in both turns and actions (ADR-020).
 *
 * @example
 * ```typescript
 * const result = new BattleResult({
 *   troopId: 1,
 *   troopName: 'Goblin Pack',
 *   outcome: 'victory',
 *   ttkTurns: 3,
 *   ttkActions: 8,
 *   durationMs: 1250,
 *   seed: 12345
 * });
 * ```
 */
export class BattleResult {
  readonly troopId: number;
  readonly troopName: string;
  readonly outcome: BattleOutcome;
  readonly ttkTurns: number;
  readonly ttkActions: number;
  readonly durationMs: number;
  readonly seed: number;
  readonly expGained: number;

  /**
   * Creates a new BattleResult.
   *
   * @param data - Battle result data
   */
  constructor(data: BattleResultData) {
    this.troopId = data.troopId;
    this.troopName = data.troopName;
    this.outcome = data.outcome;
    this.ttkTurns = data.ttkTurns;
    this.ttkActions = data.ttkActions;
    this.durationMs = data.durationMs;
    this.seed = data.seed;
    this.expGained = data.expGained ?? 0;

    // Freeze to ensure immutability
    Object.freeze(this);
  }
}
