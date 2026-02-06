/**
 * FakeBuilder for UIProjectConfig in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/domain/schemas/project-config.schema.ts
 */

import Chance from 'chance';
import type { UIProjectConfig, UITrechoConfig } from '../../../src/domain/schemas/project-config.schema';

const chance = new Chance();

/**
 * Builder for creating UITrechoConfig in tests.
 */
export class UITrechoConfigBuilder {
  private data: Partial<UITrechoConfig> = {};

  static create(): UITrechoConfigBuilder {
    return new UITrechoConfigBuilder().withDefaults();
  }

  withDefaults(): this {
    this.data = {
      id: `ato${chance.natural({ min: 1, max: 3 })}-nivel${chance.natural({ min: 1, max: 10 })}-${chance.natural({ min: 1, max: 99 })}`,
      description: chance.sentence({ words: 5 }),
      heroTeam: {
        level: chance.natural({ min: 1, max: 50 }),
        actors: [1],
        weapons: { 1: chance.natural({ min: 1, max: 10 }) },
        armors: { 1: chance.natural({ min: 1, max: 5 }) },
      },
      enemyTeam: {
        troopId: chance.natural({ min: 1, max: 50 }),
      },
      expectedTTK: {
        min: chance.natural({ min: 1, max: 10 }),
        max: chance.natural({ min: 11, max: 20 }),
      },
    };
    return this;
  }

  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  withHeroLevel(level: number): this {
    if (this.data.heroTeam) {
      this.data.heroTeam = { ...this.data.heroTeam, level };
    }
    return this;
  }

  withActors(actors: number[]): this {
    if (this.data.heroTeam) {
      this.data.heroTeam = { ...this.data.heroTeam, actors };
    }
    return this;
  }

  withTroopId(troopId: number): this {
    if (this.data.enemyTeam) {
      this.data.enemyTeam = { ...this.data.enemyTeam, troopId };
    }
    return this;
  }

  withExpectedTTK(min: number, max: number): this {
    this.data.expectedTTK = { min, max };
    return this;
  }

  withInvalidId(): this {
    return this.withId('invalid-format');
  }

  withEmptyActors(): this {
    if (this.data.heroTeam) {
      this.data.heroTeam = { ...this.data.heroTeam, actors: [] };
    }
    return this;
  }

  build(): UITrechoConfig {
    return this.data as UITrechoConfig;
  }
}

/**
 * Builder for creating UIProjectConfig in tests.
 */
export class UIProjectConfigBuilder {
  private data: Partial<UIProjectConfig> = {};

  static create(): UIProjectConfigBuilder {
    return new UIProjectConfigBuilder().withDefaults();
  }

  withDefaults(): this {
    this.data = {
      version: '1.0',
      trechos: [UITrechoConfigBuilder.create().build()],
      metadata: {
        projectName: chance.word({ capitalize: true }),
        lastModified: Date.now(),
      },
    };
    return this;
  }

  withVersion(version: string): this {
    this.data.version = version;
    return this;
  }

  withTrechos(trechos: UITrechoConfig[]): this {
    this.data.trechos = trechos;
    return this;
  }

  addTrecho(trecho: UITrechoConfig): this {
    this.data.trechos = [...(this.data.trechos || []), trecho];
    return this;
  }

  withEmptyTrechos(): this {
    return this.withTrechos([]);
  }

  withMetadata(metadata: { projectName?: string; lastModified?: number }): this {
    this.data.metadata = metadata;
    return this;
  }

  withProjectName(name: string): this {
    if (this.data.metadata) {
      this.data.metadata = { ...this.data.metadata, projectName: name };
    } else {
      this.data.metadata = { projectName: name };
    }
    return this;
  }

  build(): UIProjectConfig {
    return this.data as UIProjectConfig;
  }
}
