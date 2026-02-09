/**
 * LogBundleFakeBuilder
 *
 * FakeBuilder pattern for creating LogBundle test data.
 * Provides fluent interface for building test fixtures with sensible defaults.
 *
 * @see packages/electron/test-health-action-plan.md Task 5
 * @see DDD FakeBuilder Pattern
 */

import { randomUUID } from 'node:crypto';
import type { LogBundle } from '@coreto/electron/domain/types';

/**
 * Builder for creating LogBundle instances in tests.
 *
 * @example
 * const bundle = logBundleFake()
 *   .withAppVersion('2.0.0')
 *   .withPlatform('linux')
 *   .build();
 */
export class LogBundleFakeBuilder {
  private id = randomUUID();
  private timestamp = new Date().toISOString();
  private appVersion = '1.0.0-test';
  private electronVersion = process.versions.electron ?? 'unknown';
  private platform = process.platform;
  private projectPath: string | undefined = undefined;
  private logs: unknown[] = [];

  /**
   * Sets a specific UUID for the bundle.
   * @param id - UUID v4 string
   */
  withId(id: string): this {
    this.id = id;
    return this;
  }

  /**
   * Sets a specific timestamp for the bundle.
   * @param timestamp - ISO 8601 timestamp string
   */
  withTimestamp(timestamp: string): this {
    this.timestamp = timestamp;
    return this;
  }

  /**
   * Sets the app version for the bundle.
   * @param version - Semantic version string (e.g., '1.0.0')
   */
  withAppVersion(version: string): this {
    this.appVersion = version;
    return this;
  }

  /**
   * Sets the Electron version for the bundle.
   * @param version - Electron version string
   */
  withElectronVersion(version: string): this {
    this.electronVersion = version;
    return this;
  }

  /**
   * Sets the platform for the bundle.
   * @param platform - Node.js platform (darwin, linux, win32)
   */
  withPlatform(platform: NodeJS.Platform): this {
    this.platform = platform;
    return this;
  }

  /**
   * Sets the project path for the bundle.
   * @param path - Absolute path to project directory
   */
  withProjectPath(path: string): this {
    this.projectPath = path;
    return this;
  }

  /**
   * Sets the logs array for the bundle.
   * @param logs - Array of log entries
   */
  withLogs(logs: unknown[]): this {
    this.logs = logs;
    return this;
  }

  /**
   * Adds a single log entry to the logs array.
   * @param log - Log entry to add
   */
  addLog(log: unknown): this {
    this.logs.push(log);
    return this;
  }

  /**
   * Builds the LogBundle instance.
   * @returns A complete LogBundle object
   */
  build(): LogBundle {
    const bundle: LogBundle = {
      id: this.id,
      timestamp: this.timestamp,
      appVersion: this.appVersion,
      electronVersion: this.electronVersion,
      platform: this.platform,
      logs: this.logs,
    };

    // Only include projectPath if it was explicitly set
    if (this.projectPath !== undefined) {
      bundle.projectPath = this.projectPath;
    }

    return bundle;
  }
}

/**
 * Factory function for creating a new LogBundleFakeBuilder.
 *
 * @example
 * const bundle = logBundleFake().build();
 * const customBundle = logBundleFake().withAppVersion('2.0.0').build();
 *
 * @returns A new LogBundleFakeBuilder instance
 */
export const logBundleFake = (): LogBundleFakeBuilder => new LogBundleFakeBuilder();
