/**
 * Builder for SimulationResultPayload in tests.
 * Provides sensible defaults and fluent interface.
 *
 * @see packages/electron/src/main/workers/types.ts
 */

import type { SimulationResultPayload } from '../../../workers/types.js';
import type { Report } from '@coreto/core';

/**
 * Builder for creating SimulationResultPayload in tests.
 */
export class SimulationResultPayloadBuilder {
  private simulationId: string = 'test-simulation-id';
  private projectPath: string = '/test/project';
  private report: Report;
  private duration: number = 60000;
  private seed: number = 12345;

  constructor() {
    // Create minimal report - use empty Report instance
    // In production, this would use ReportFakeBuilder from @coreto/core
    this.report = {} as Report;
  }

  /**
   * Sets the simulation ID.
   */
  withSimulationId(id: string): this {
    this.simulationId = id;
    return this;
  }

  /**
   * Sets the project path.
   */
  withProjectPath(path: string): this {
    this.projectPath = path;
    return this;
  }

  /**
   * Sets the report.
   */
  withReport(report: Report): this {
    this.report = report;
    return this;
  }

  /**
   * Sets the execution duration in milliseconds.
   */
  withDuration(duration: number): this {
    this.duration = duration;
    return this;
  }

  /**
   * Sets the RNG seed.
   */
  withSeed(seed: number): this {
    this.seed = seed;
    return this;
  }

  /**
   * Creates a quick success payload (1 minute duration).
   */
  asQuickSuccess(): this {
    return this.withDuration(1000);
  }

  /**
   * Creates a long running payload (1 hour duration).
   */
  asLongRunning(): this {
    return this.withDuration(3600000);
  }

  /**
   * Builds the SimulationResultPayload.
   */
  build(): SimulationResultPayload {
    return {
      simulationId: this.simulationId,
      projectPath: this.projectPath,
      report: this.report,
      duration: this.duration,
      seed: this.seed,
    };
  }
}
