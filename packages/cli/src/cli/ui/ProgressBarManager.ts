/**
 * ProgressBarManager - CLI progress bar management
 *
 * Uses cli-progress library to display battle execution progress
 * Supports verbose mode with detailed updates
 *
 * @see https://www.npmjs.com/package/cli-progress
 */

import cliProgress from 'cli-progress';
import type { ProgressUpdate } from './types.js';

/**
 * Manages CLI progress bar lifecycle and updates
 *
 * Features:
 * - Customizable progress bar format
 * - Battle-specific context display
 * - Graceful start/stop/update
 * - Thread-safe updates
 */
export class ProgressBarManager {
  private bar: cliProgress.SingleBar | null = null;
  private isActive = false;

  /**
   * Initialize and start progress bar
   *
   * @param total - Total number of battles to execute
   */
  start(total: number): void {
    if (this.isActive) {
      throw new Error('Progress bar already active');
    }

    this.bar = new cliProgress.SingleBar(
      {
        format:
          '⚔️  Battles [{bar}] {percentage}% | {current}/{total} | Trecho: {trecho} | ETA: {eta}s',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
      },
      cliProgress.Presets.shades_classic
    );

    this.bar.start(total, 0, {
      trecho: 'N/A',
    });

    this.isActive = true;
  }

  /**
   * Update progress bar with current battle info
   *
   * @param update - Progress update data
   */
  update(update: ProgressUpdate): void {
    if (!this.isActive || !this.bar) {
      return;
    }

    const payload: Record<string, unknown> = {
      trecho: update.trechoId,
    };

    if (update.troopId !== undefined) {
      payload.troopId = update.troopId;
    }

    this.bar.update(update.current, payload);
  }

  /**
   * Increment progress by 1
   *
   * @param trechoId - Current trecho ID
   * @param troopId - Current troop ID (optional)
   */
  increment(trechoId: string, troopId?: number): void {
    if (!this.isActive || !this.bar) {
      return;
    }

    const payload: Record<string, unknown> = {
      trecho: trechoId,
    };

    if (troopId !== undefined) {
      payload.troopId = troopId;
    }

    this.bar.increment(payload);
  }

  /**
   * Stop and destroy progress bar
   */
  stop(): void {
    if (!this.isActive || !this.bar) {
      return;
    }

    this.bar.stop();
    this.bar = null;
    this.isActive = false;
  }

  /**
   * Check if progress bar is currently active
   *
   * @returns True if active
   */
  getIsActive(): boolean {
    return this.isActive;
  }
}
