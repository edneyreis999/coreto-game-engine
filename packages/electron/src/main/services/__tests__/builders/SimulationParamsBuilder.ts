/**
 * Builder for SimulationParams in tests.
 * Provides sensible defaults and fluent interface.
 *
 * Task 09: Config loading now uses SQLite storage (no configPath needed).
 *
 * @see packages/electron/src/main/workers/types.ts
 */

import type { SimulationParams } from '../../../workers/types.js';

/**
 * Builder for creating SimulationParams in tests.
 */
export class SimulationParamsBuilder {
  private simulationId: string = 'test-simulation-id';
  private projectPath: string = '/test/project';
  private seed: number = 12345;
  private diagnostic: boolean = false;

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
   * Sets the RNG seed.
   */
  withSeed(seed: number): this {
    this.seed = seed;
    return this;
  }

  /**
   * Enables diagnostic mode.
   */
  withDiagnostic(): this {
    this.diagnostic = true;
    return this;
  }

  /**
   * Creates params without simulation ID.
   * Use this when testing the start() method which generates its own ID.
   */
  buildWithoutId(): Omit<SimulationParams, 'simulationId'> {
    return {
      projectPath: this.projectPath,
      seed: this.seed,
      diagnostic: this.diagnostic,
    };
  }

  /**
   * Builds complete SimulationParams.
   */
  build(): SimulationParams {
    return {
      simulationId: this.simulationId,
      projectPath: this.projectPath,
      seed: this.seed,
      diagnostic: this.diagnostic,
    };
  }
}
