/**
 * DiagnosticLogger - Performance profiling and diagnostic output
 *
 * Implements ADR-025 diagnostic mode for troubleshooting
 * Tracks timing, memory usage, and execution stages
 *
 * @see docs/adrs/RUNTIME/ADR-025-diagnostic-mode-for-headless-initialization-troubleshooting.md
 */

import type { PerformanceMetrics, DiagnosticEntry } from './types.js';

/**
 * Logs diagnostic information for troubleshooting
 *
 * Features:
 * - Stage-based timing profiling
 * - Memory usage tracking
 * - Structured diagnostic output
 * - Optional activation (opt-in via --diagnostic flag)
 */
export class DiagnosticLogger {
  private entries: DiagnosticEntry[] = [];
  private stageTimers: Map<string, number> = new Map();
  private enabled: boolean;
  private startTime: number | null = null;

  /**
   * Create diagnostic logger
   *
   * @param enabled - Whether diagnostic logging is active
   */
  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Start overall execution timing
   */
  startExecution(): void {
    if (!this.enabled) {
      return;
    }

    this.startTime = Date.now();
    this.log('execution', 'Pipeline execution started');
  }

  /**
   * Start timing a specific stage
   *
   * @param stage - Stage identifier (e.g., "config_load", "battle_execution")
   */
  startStage(stage: string): void {
    if (!this.enabled) {
      return;
    }

    this.stageTimers.set(stage, Date.now());
    this.log(stage, `Stage started: ${stage}`);
  }

  /**
   * End timing for a specific stage
   *
   * @param stage - Stage identifier
   */
  endStage(stage: string): void {
    if (!this.enabled) {
      return;
    }

    const startTime = this.stageTimers.get(stage);
    if (!startTime) {
      this.log(stage, `Warning: Stage "${stage}" ended without start`, {
        warning: 'timer_mismatch',
      });
      return;
    }

    const duration = Date.now() - startTime;
    this.log(stage, `Stage completed: ${stage}`, {
      durationMs: duration,
    });

    this.stageTimers.delete(stage);
  }

  /**
   * Log diagnostic message with optional data
   *
   * @param stage - Stage identifier
   * @param message - Diagnostic message
   * @param data - Optional structured data
   */
  log(stage: string, message: string, data?: Record<string, unknown>): void {
    if (!this.enabled) {
      return;
    }

    const entry: DiagnosticEntry = {
      timestamp: new Date(),
      stage,
      message,
      ...(data !== undefined && { data }),
    };

    this.entries.push(entry);

    // Output to console immediately for real-time visibility
    const timestamp = entry.timestamp.toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    console.log(`[DIAGNOSTIC] [${timestamp}] [${stage}] ${message}${dataStr}`);
  }

  /**
   * Calculate and return performance metrics
   *
   * @param totalBattles - Total battles executed
   * @returns Performance metrics summary
   */
  getMetrics(totalBattles: number): PerformanceMetrics {
    const memUsage = process.memoryUsage();
    const totalDuration = this.startTime ? Date.now() - this.startTime : 0;
    const averageBattleDuration = totalBattles > 0 ? totalDuration / totalBattles : 0;

    return {
      totalDurationMs: totalDuration,
      averageBattleDurationMs: averageBattleDuration,
      peakMemoryMb: memUsage.heapUsed / 1024 / 1024,
      currentMemoryMb: memUsage.heapUsed / 1024 / 1024,
      totalBattles,
    };
  }

  /**
   * Print performance summary to console
   *
   * @param totalBattles - Total battles executed
   */
  printSummary(totalBattles: number): void {
    if (!this.enabled) {
      return;
    }

    const metrics = this.getMetrics(totalBattles);

    console.log('');
    console.log('=== DIAGNOSTIC SUMMARY ===');
    console.log(`Total Duration: ${metrics.totalDurationMs}ms`);
    console.log(`Average Battle Duration: ${metrics.averageBattleDurationMs.toFixed(2)}ms`);
    console.log(`Peak Memory: ${metrics.peakMemoryMb.toFixed(2)}MB`);
    console.log(`Current Memory: ${metrics.currentMemoryMb.toFixed(2)}MB`);
    console.log(`Total Battles: ${metrics.totalBattles}`);
    console.log(`Total Diagnostic Entries: ${this.entries.length}`);
    console.log('=========================');
  }

  /**
   * Check if diagnostic logging is enabled
   *
   * @returns True if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get all diagnostic entries
   *
   * @returns Array of diagnostic entries
   */
  getEntries(): DiagnosticEntry[] {
    return [...this.entries];
  }
}
