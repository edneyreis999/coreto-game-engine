/**
 * FakeBuilder for UIProjectConfig in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/domain/schemas/ui-config.schema.ts
 */

import Chance from 'chance';
import type { UIProjectConfig, UITrechoConfig, UIPartyMemberConfig } from '../../../src/domain/schemas';

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
    const level = chance.natural({ min: 1, max: 50 });
    this.data = {
      id: `ato${chance.natural({ min: 1, max: 3 })}-nivel${chance.natural({ min: 1, max: 10 })}-${chance.natural({ min: 1, max: 99 })}`,
      name: chance.sentence({ words: 5 }),
      anchorLevelMin: level,
      anchorLevelMax: level + chance.natural({ min: 1, max: 10 }),
      targetTtkTurns: chance.natural({ min: 5, max: 30 }),
      targetTtkActions: chance.natural({ min: 10, max: 50 }),
      tolerancePercent: chance.natural({ min: 5, max: 25 }),
      troopIds: [chance.natural({ min: 1, max: 50 })],
      party: {
        members: [
          {
            classId: 1,
            level: chance.natural({ min: 1, max: 50 }),
          },
        ],
      },
    };
    return this;
  }

  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  withAnchorLevelMin(level: number): this {
    this.data.anchorLevelMin = level;
    return this;
  }

  withAnchorLevelMax(level: number): this {
    this.data.anchorLevelMax = level;
    return this;
  }

  withTargetTtkTurns(turns: number): this {
    this.data.targetTtkTurns = turns;
    return this;
  }

  withTargetTtkActions(actions: number): this {
    this.data.targetTtkActions = actions;
    return this;
  }

  withTolerancePercent(percent: number): this {
    this.data.tolerancePercent = percent;
    return this;
  }

  withTroopIds(troopIds: number[]): this {
    this.data.troopIds = troopIds;
    return this;
  }

  withParty(members: UIPartyMemberConfig[]): this {
    this.data.party = { members };
    return this;
  }

  withInvalidId(): this {
    return this.withId('');
  }

  withEmptyName(): this {
    return this.withName('');
  }

  withEmptyTroopIds(): this {
    return this.withTroopIds([]);
  }

  withEmptyParty(): this {
    return this.withParty([]);
  }

  withInvalidAnchorLevelRange(): this {
    this.data.anchorLevelMin = 10;
    this.data.anchorLevelMax = 5;
    return this;
  }

  withNegativeTolerance(): this {
    this.data.tolerancePercent = -1;
    return this;
  }

  withToleranceOver100(): this {
    this.data.tolerancePercent = 150;
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

  withGlobalSettings(globalSettings: { seed: number; maxBattleTurns?: number }): this {
    this.data.globalSettings = globalSettings;
    return this;
  }

  build(): UIProjectConfig {
    return this.data as UIProjectConfig;
  }
}
