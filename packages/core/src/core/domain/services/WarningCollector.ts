import { Warning, type WarningData } from '../Warning.js';
import type { WarningType, WarningSeverity } from '../Warning.js';

/**
 * WarningCollector domain service.
 * Collects and manages warnings during battle simulation and validation.
 *
 * Implements ADR-013 (Typed Warning System with Severity Levels).
 * Domain service responsible for accumulating warnings instead of throwing exceptions.
 *
 * @example
 * ```typescript
 * const collector = new WarningCollector();
 *
 * // Add warnings during battle
 * collector.add({
 *   type: 'troop_not_found',
 *   severity: 'critical',
 *   message: 'Troop ID 999 not found in Troops.json',
 *   context: { troopId: 999 }
 * });
 *
 * // Check warnings
 * collector.hasWarnings(); // true
 * collector.hasCriticalWarnings(); // true
 * collector.getWarnings(); // [Warning, ...]
 * ```
 */
export class WarningCollector {
  private warnings: Warning[] = [];

  /**
   * Add a warning to the collection.
   *
   * @param data - Warning data
   */
  add(data: WarningData): void {
    const warning = new Warning(data);
    this.warnings.push(warning);
  }

  /**
   * Add multiple warnings at once.
   *
   * @param warnings - Array of warning data or Warning instances
   */
  addMany(warnings: (WarningData | Warning)[]): void {
    for (const warning of warnings) {
      if (warning instanceof Warning) {
        this.warnings.push(warning);
      } else {
        this.add(warning);
      }
    }
  }

  /**
   * Get all collected warnings.
   *
   * @returns Readonly array of warnings
   */
  getWarnings(): readonly Warning[] {
    return [...this.warnings];
  }

  /**
   * Get warnings filtered by type.
   *
   * @param type - Warning type to filter
   * @returns Array of warnings matching the type
   */
  getByType(type: WarningType): Warning[] {
    return this.warnings.filter((w) => w.isType(type));
  }

  /**
   * Get warnings filtered by severity.
   *
   * @param severity - Severity level to filter
   * @returns Array of warnings matching the severity
   */
  getBySeverity(severity: WarningSeverity): Warning[] {
    return this.warnings.filter((w) => w.severity === severity);
  }

  /**
   * Get critical warnings only.
   *
   * @returns Array of critical warnings
   */
  getCriticalWarnings(): Warning[] {
    return this.getBySeverity('critical');
  }

  /**
   * Check if any warnings have been collected.
   *
   * @returns True if there are any warnings
   */
  hasWarnings(): boolean {
    return this.warnings.length > 0;
  }

  /**
   * Check if any critical warnings exist.
   *
   * @returns True if there are critical warnings
   */
  hasCriticalWarnings(): boolean {
    return this.warnings.some((w) => w.isCritical());
  }

  /**
   * Get total warning count.
   *
   * @returns Number of warnings collected
   */
  count(): number {
    return this.warnings.length;
  }

  /**
   * Get warning count by type.
   * Returns a record mapping warning types to counts.
   *
   * @returns Record of warning types to counts
   */
  countByType(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const warning of this.warnings) {
      counts[warning.type] = (counts[warning.type] || 0) + 1;
    }

    return counts;
  }

  /**
   * Get warning count by severity.
   * Returns a record mapping severity levels to counts.
   *
   * @returns Record of severity levels to counts
   */
  countBySeverity(): Record<WarningSeverity, number> {
    const counts: Record<WarningSeverity, number> = {
      critical: 0,
      warning: 0,
      info: 0,
    };

    for (const warning of this.warnings) {
      counts[warning.severity]++;
    }

    return counts;
  }

  /**
   * Clear all collected warnings.
   * Useful for resetting state between test runs.
   */
  clear(): void {
    this.warnings = [];
  }

  /**
   * Merge warnings from another collector.
   *
   * @param other - Another WarningCollector to merge from
   */
  merge(other: WarningCollector): void {
    this.warnings.push(...other.getWarnings());
  }

  /**
   * Convert all warnings to plain objects for serialization.
   *
   * @returns Array of plain warning objects
   */
  toJSON(): WarningData[] {
    return this.warnings.map((w) => w.toJSON());
  }
}
