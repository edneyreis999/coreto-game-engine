import Chance from 'chance';
import type { ReportMetadata } from '../../../src/core/domain/Report';

/**
 * FakeBuilder for ReportMetadata interface.
 * Provides fluent interface for creating test report metadata with realistic defaults.
 */
export class ReportMetadataFakeBuilder {
  private chance = new Chance();
  private metadata: ReportMetadata = {
    version: '1.0.0',
    generatedAt: new Date('2024-01-01T00:00:00Z'),
    seed: 12345,
    projectPath: '/path/to/project',
  };

  /**
   * Sets the report version.
   */
  withVersion(version: string): this {
    this.metadata.version = version;
    return this;
  }

  /**
   * Sets the generation timestamp.
   */
  withTimestamp(timestamp: Date): this {
    this.metadata.generatedAt = timestamp;
    return this;
  }

  /**
   * Sets the RNG seed.
   */
  withSeed(seed: number): this {
    this.metadata.seed = seed;
    return this;
  }

  /**
   * Sets the project path.
   */
  withProjectPath(projectPath: string): this {
    this.metadata.projectPath = projectPath;
    return this;
  }

  /**
   * Sets a random valid report metadata.
   */
  withRandomData(): this {
    this.metadata = {
      version: `${this.chance.integer({ min: 1, max: 5 })}.${this.chance.integer({ min: 0, max: 9 })}.${this.chance.integer({ min: 0, max: 9 })}`,
      generatedAt: this.chance.date(),
      seed: this.chance.integer({ min: 1000, max: 99999 }),
      projectPath: this.chance.pickone(['/path/to/project', '/home/user/project', '/Users/dev/game']),
    };
    return this;
  }

  /**
   * Builds the ReportMetadata object.
   */
  build(): ReportMetadata {
    return this.metadata;
  }
}
