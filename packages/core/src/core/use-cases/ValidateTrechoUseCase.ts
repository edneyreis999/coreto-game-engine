/**
 * Validates TTK results against configured targets and tolerances per trecho.
 * Generates pass/fail status and warnings for out-of-tolerance results.
 *
 * @trace FR-007
 */

import { Trecho } from '../domain/Trecho.js';
import { BattleResult } from '../domain/BattleResult.js';

/**
 * Validation result for a single trecho.
 * Contains aggregated metrics and pass/fail status.
 */
export interface TrechoValidationResult {
  /** Trecho unique identifier */
  readonly trechoId: string;
  /** Human-readable trecho name */
  readonly trechoName: string;
  /** True if average TTK is within tolerance */
  readonly passed: boolean;
  /** Average TTK in turns across all battles */
  readonly avgTtkTurns: number;
  /** Average TTK in actions across all battles */
  readonly avgTtkActions: number;
  /** All battle results for this trecho */
  readonly battles: BattleResult[];
  /** Subset of battles that failed tolerance check */
  readonly failedBattles: BattleResult[];
}

/**
 * Use Case: Validate Trecho
 *
 * Validates a trecho based on its battle results against configured TTK targets.
 * Implements the core business logic for TTK validation:
 * - Calculates average TTK metrics across all battles
 * - Checks if average is within tolerance window (ADR-012)
 * - Identifies individual battles that failed validation
 *
 * Validation logic (ADR-020):
 * - Average TTK must be within tolerance for BOTH turns and actions
 * - Individual battles can fail, but average determines overall pass/fail
 * - Tolerance is calculated as ±N% from target (configurable per trecho)
 *
 * Follows Clean Architecture principles:
 * - Pure domain logic (no infrastructure dependencies)
 * - Uses domain entities (Trecho, BattleResult)
 * - Easily testable with mock data
 *
 * @example
 * ```typescript
 * const useCase = new ValidateTrechoUseCase();
 * const trecho = new Trecho({
 *   id: 'ato1-nivel1-10',
 *   name: 'Ato 1 - Níveis 1-10',
 *   targetTtkTurns: 3,
 *   targetTtkActions: 8,
 *   tolerancePercent: 15,
 *   // ... other fields
 * });
 * const battleResults = [result1, result2, result3];
 * const validation = useCase.execute(trecho, battleResults);
 * console.log(`Trecho ${validation.passed ? 'PASSED' : 'FAILED'}`);
 * console.log(`Average TTK: ${validation.avgTtkTurns} turns`);
 * ```
 */
export class ValidateTrechoUseCase {
  /**
   * Validate a trecho based on battle results.
   *
   * Calculates average TTK metrics and checks if within tolerance window.
   * Returns detailed validation result with pass/fail status and metrics.
   *
   * Edge cases:
   * - Empty battle results → fails validation with zero averages
   * - Single battle → average equals single result
   * - Mixed victories/defeats → all results included in average
   *
   * @param trecho - Trecho entity with validation rules
   * @param battleResults - Array of battle results to validate
   * @returns Validation result with aggregated metrics and pass/fail status
   */
  execute(trecho: Trecho, battleResults: BattleResult[]): TrechoValidationResult {
    // Handle edge case: no battle results
    if (battleResults.length === 0) {
      return {
        trechoId: trecho.id,
        trechoName: trecho.name,
        passed: false,
        avgTtkTurns: 0,
        avgTtkActions: 0,
        battles: [],
        failedBattles: [],
      };
    }

    // Calculate average TTK metrics
    const totalTurns = battleResults.reduce((sum, r) => sum + r.ttkTurns, 0);
    const totalActions = battleResults.reduce((sum, r) => sum + r.ttkActions, 0);
    const avgTtkTurns = totalTurns / battleResults.length;
    const avgTtkActions = totalActions / battleResults.length;

    // Identify individual battles that failed tolerance check
    const failedBattles = battleResults.filter(
      (r) => !trecho.isWithinTolerance(r.ttkTurns, r.ttkActions)
    );

    // Trecho passes if average TTK is within tolerance (ADR-012)
    const passed = trecho.isWithinTolerance(avgTtkTurns, avgTtkActions);

    return {
      trechoId: trecho.id,
      trechoName: trecho.name,
      passed,
      avgTtkTurns,
      avgTtkActions,
      battles: battleResults,
      failedBattles,
    };
  }
}
