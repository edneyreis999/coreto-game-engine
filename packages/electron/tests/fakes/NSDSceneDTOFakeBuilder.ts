/**
 * FakeBuilder for NSDSceneDTO in tests.
 * Provides realistic test data following DDD testing patterns.
 *
 * @see packages/electron/src/domain/types/nsd-types.ts
 */

import type { NSDSceneDTO } from '@coreto/electron/domain/types';

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * Builder for creating NSDSceneDTO in tests.
 *
 * @example
 * ```ts
 * const scene = NSDSceneDTOFakeBuilder.anEntity()
 *   .withId('scene-001')
 *   .withTitle('Tavern Meeting')
 *   .withSummary('Introduction to quest giver')
 *   .build();
 *
 * const scenes = NSDSceneDTOFakeBuilder.theEntities(3).build();
 * ```
 */
export class NSDSceneDTOFakeBuilder {
  private chance: import('chance').Chance.Chance;
  private countObjs: number;
  private baseIndex: number;
  private static globalIndex = 0;

  private _id: PropOrFactory<string> = (index: number) => `scene-${this.baseIndex + index + 1}`;
  private _title: PropOrFactory<string> = (index: number) => `Scene ${this.baseIndex + index + 1}`;
  private _sceneNumber: PropOrFactory<number> = (index: number) => this.baseIndex + index + 1;
  private _content: PropOrFactory<string> = (index: number) =>
    `The hero enters scene ${this.baseIndex + index + 1}. `;
  private _summary: PropOrFactory<string | undefined> = (index: number) =>
    `Summary for scene ${this.baseIndex + index + 1}`;

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = require('chance').Chance();
    this.baseIndex = NSDSceneDTOFakeBuilder.globalIndex * 100;
    NSDSceneDTOFakeBuilder.globalIndex += 1;
  }

  static anEntity(): NSDSceneDTOFakeBuilder {
    return new NSDSceneDTOFakeBuilder(1);
  }

  static theEntities(countObjs: number): NSDSceneDTOFakeBuilder {
    return new NSDSceneDTOFakeBuilder(countObjs);
  }

  withId(valueOrFactory: PropOrFactory<string>): this {
    this._id = valueOrFactory;
    return this;
  }

  withTitle(valueOrFactory: PropOrFactory<string>): this {
    this._title = valueOrFactory;
    return this;
  }

  withSceneNumber(valueOrFactory: PropOrFactory<number>): this {
    this._sceneNumber = valueOrFactory;
    return this;
  }

  withContent(valueOrFactory: PropOrFactory<string>): this {
    this._content = valueOrFactory;
    return this;
  }

  withSummary(valueOrFactory: PropOrFactory<string | undefined>): this {
    this._summary = valueOrFactory;
    return this;
  }

  withoutSummary(): this {
    this._summary = () => undefined;
    return this;
  }

  /**
   * Creates a scene with long content for testing truncation.
   */
  withLongContent(charCount: number = 300): this {
    this._content = () => 'A'.repeat(charCount);
    return this;
  }

  build(): NSDSceneDTO | NSDSceneDTO[] {
    const entities = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const id = this.callFactory(this._id, index);
        const title = this.callFactory(this._title, index);
        const sceneNumber = this.callFactory(this._sceneNumber, index);
        const content = this.callFactory(this._content, index);
        const summary = this.callFactory(this._summary, index);

        const scene: NSDSceneDTO = {
          id,
          title,
          sceneNumber,
          content,
        };

        if (summary !== undefined) {
          scene.summary = summary;
        }

        return scene;
      });

    return this.countObjs === 1 ? entities[0]! : entities;
  }

  private callFactory<T>(factoryOrValue: PropOrFactory<T>, index: number): T {
    return typeof factoryOrValue === 'function'
      ? (factoryOrValue as (index: number) => T)(index)
      : factoryOrValue;
  }
}
