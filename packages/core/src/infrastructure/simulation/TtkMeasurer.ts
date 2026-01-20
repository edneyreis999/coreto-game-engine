import { injectable } from 'tsyringe';
import { TtkMetrics } from '../../core/domain/TtkMetrics.js';
import { TtkTarget } from '../../core/domain/TtkTarget.js';
import { ValidationError } from '../../core/errors/ValidationError.js';

/**
 * Type assertion for accessing global RMMZ objects
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-undef
const globalScope = global as any;

/**
 * TTK measurement result with deviation analysis.
 * Contains measured metrics, deviations from target, and pass/fail status.
 */
export interface TtkMeasurement {
  /** Measured TTK turns from BattleManager._turnCount */
  ttkTurns: number;
  /** Measured TTK actions from party action counter */
  ttkActions: number;
  /** Turn deviation from target (actual - target) */
  turnDeviation: number;
  /** Action deviation from target (actual - target) */
  actionDeviation: number;
  /** Whether TTK is within tolerance of target */
  passed: boolean;
}

/**
 * TtkMeasurer - Extracts TTK metrics from BattleManager and calculates deviations.
 *
 * This implementation (ADR-020):
 * - Extracts turn count from BattleManager._turnCount
 * - Tracks party actions via action counter injection
 * - Calculates absolute deviations (actual - target)
 * - Determines pass/fail based on tolerance windows
 *
 * IMPORTANT:
 * - Requires BattleManager to be initialized and battle completed
 * - Action tracking must be injected before battle execution
 * - Uses TtkTarget for tolerance validation
 *
 * @example
 * ```typescript
 * const measurer = new TtkMeasurer();
 * measurer.injectActionTracking(); // Before battle
 *
 * // ... execute battle ...
 *
 * const target = new TtkTarget(10, 40, 15); // 10T/40A ±15%
 * const measurement = measurer.measureTtk(target);
 *
 * console.log(measurement.passed); // true if within tolerance
 * console.log(measurement.turnDeviation); // e.g., 2 (12T - 10T)
 * ```
 */
@injectable()
export class TtkMeasurer {
  private actionCount = 0;

  /**
   * Inject action tracking into Game_BattlerBase.prototype.
   * Must be called BEFORE battle execution to track party actions.
   *
   * This hooks into the action execution flow:
   * - Game_Battler.performAction() increments counter for party members
   * - Counter is reset on each battle start
   *
   * @throws {ValidationError} If Game_Battler not available in global scope
   */
  injectActionTracking(): void {
    const Game_Battler = globalScope.Game_Battler;

    if (!Game_Battler || !Game_Battler.prototype) {
      throw new ValidationError('Game_Battler not available. Runtime not initialized.');
    }

    // Reset action counter for new battle
    this.actionCount = 0;

    // Store original performAction method
    const originalPerformAction = Game_Battler.prototype.performAction;

    // Bind this context for closure
    const self = this;

    // Inject action counter
    Game_Battler.prototype.performAction = function (action: any) {
      // Increment counter only for party members (not enemies)
      if (this.isActor && this.isActor()) {
        self.actionCount++;
      }

      // Call original method
      return originalPerformAction.call(this, action);
    };
  }

  /**
   * Measure TTK metrics from current BattleManager state.
   * Extracts turn count and action count, then calculates deviations from target.
   *
   * @param target - TTK target with tolerance for deviation calculation
   * @returns TTK measurement with metrics, deviations, and pass/fail status
   * @throws {ValidationError} If BattleManager not initialized
   */
  measureTtk(target: TtkTarget): TtkMeasurement {
    const BattleManager = globalScope.BattleManager;

    if (!BattleManager) {
      throw new ValidationError('BattleManager not initialized');
    }

    // Extract turn count from BattleManager._turnCount
    const ttkTurns = BattleManager._turnCount || 0;

    // Get action count from our injected tracker
    const ttkActions = this.actionCount;

    // Calculate absolute deviations (actual - target)
    const turnDeviation = ttkTurns - target.turns;
    const actionDeviation = ttkActions - target.actions;

    // Determine if within tolerance using TtkTarget
    const passed = target.isWithinTolerance(ttkTurns, ttkActions);

    return {
      ttkTurns,
      ttkActions,
      turnDeviation,
      actionDeviation,
      passed,
    };
  }

  /**
   * Get measured TTK metrics without target comparison.
   * Useful when target is not available or for diagnostic purposes.
   *
   * @returns TtkMetrics value object
   * @throws {ValidationError} If BattleManager not initialized
   */
  getMetrics(): TtkMetrics {
    const BattleManager = globalScope.BattleManager;

    if (!BattleManager) {
      throw new ValidationError('BattleManager not initialized');
    }

    const ttkTurns = BattleManager._turnCount || 0;
    const ttkActions = this.actionCount;

    return new TtkMetrics(ttkTurns, ttkActions);
  }

  /**
   * Reset action counter.
   * Should be called before each new battle execution.
   */
  reset(): void {
    this.actionCount = 0;
  }

  /**
   * Restore original Game_Battler.performAction method.
   * Call this during cleanup to prevent memory leaks and side effects.
   *
   * Note: This requires storing the original method reference.
   * For simplicity, current implementation expects runtime restart between sessions.
   */
  cleanup(): void {
    this.actionCount = 0;
    // Original method restoration would require storing reference
    // Currently relies on runtime reinitialization
  }
}
