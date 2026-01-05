/**
 * SummaryFormatter - Terminal output formatting for battle results
 *
 * Provides formatted, human-readable summary of TTK validation results
 * Supports both compact and verbose output modes
 */

import type { BattleSummary } from './types.js';

/**
 * Formats battle summary for terminal display
 *
 * Features:
 * - Color-coded success/failure indicators
 * - Percentage formatting
 * - Alignment and visual hierarchy
 * - Configurable verbosity
 */
export class SummaryFormatter {
  /**
   * Format summary for terminal display
   *
   * @param summary - Battle summary data
   * @param verbose - Include detailed statistics
   * @returns Formatted string for terminal output
   */
  static format(summary: BattleSummary, verbose = false): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('='.repeat(50));
    lines.push('📈 TTK VALIDATION SUMMARY');
    lines.push('='.repeat(50));
    lines.push('');

    // Core metrics
    lines.push(`Total Battles:    ${summary.totalBattles}`);
    lines.push(`Total Trechos:    ${summary.totalTrechos}`);
    lines.push(`Success Rate:     ${this.formatPercentage(summary.successRate)}`);
    lines.push(`Warnings:         ${this.formatWarnings(summary.totalWarnings)}`);

    // Verbose metrics (if available)
    if (verbose && summary.averageTtkTurns !== undefined) {
      lines.push('');
      lines.push('--- Average TTK ---');
      lines.push(`Turns:            ${summary.averageTtkTurns.toFixed(2)}`);
      if (summary.averageTtkActions !== undefined) {
        lines.push(`Actions:          ${summary.averageTtkActions.toFixed(2)}`);
      }
    }

    lines.push('');
    lines.push('='.repeat(50));

    return lines.join('\n');
  }

  /**
   * Format percentage with color coding
   *
   * @param rate - Success rate (0-1)
   * @returns Formatted percentage string
   */
  private static formatPercentage(rate: number): string {
    const percentage = (rate * 100).toFixed(1);
    const icon = rate >= 0.9 ? '✅' : rate >= 0.7 ? '⚠️' : '❌';
    return `${percentage}% ${icon}`;
  }

  /**
   * Format warnings count with severity indicator
   *
   * @param count - Number of warnings
   * @returns Formatted warnings string
   */
  private static formatWarnings(count: number): string {
    if (count === 0) {
      return `${count} ✅`;
    }
    if (count <= 5) {
      return `${count} ⚠️`;
    }
    return `${count} ❌`;
  }

  /**
   * Format verbose battle details
   *
   * @param _trechoId - Trecho identifier (unused, for future extension)
   * @param troopId - Troop identifier
   * @param ttkTurns - TTK in turns
   * @param ttkActions - TTK in actions
   * @param durationMs - Battle duration in milliseconds
   * @returns Formatted battle detail string
   */
  static formatBattleDetail(
    _trechoId: string,
    troopId: number,
    ttkTurns: number,
    ttkActions: number,
    durationMs: number
  ): string {
    return `   ├─ Troop ${troopId}: ${ttkTurns} turns, ${ttkActions} actions (${durationMs}ms)`;
  }

  /**
   * Format trecho header for verbose output
   *
   * @param trechoId - Trecho identifier
   * @param battleCount - Number of battles in trecho
   * @returns Formatted trecho header
   */
  static formatTrechoHeader(trechoId: string, battleCount: number): string {
    return `\n⚔️  Trecho: ${trechoId} (${battleCount} battles)`;
  }
}
