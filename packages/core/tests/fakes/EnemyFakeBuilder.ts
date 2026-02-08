import { FakeBuilder } from './FakeBuilder.js';
import { Enemy, type EnemyEntityData } from '../../src/core/domain/Enemy.js';

export class EnemyFakeBuilder extends FakeBuilder<Enemy> {
  private id = 1;
  private name = 'Goblin';
  private params: [number, number, number, number, number, number, number, number] = [50, 0, 10, 5, 3, 3, 4, 4];
  private actions: Array<{ skillId: number; rating: number; conditionType: number }> = [
    { skillId: 1, rating: 5, conditionType: 0 },
    { skillId: 2, rating: 3, conditionType: 1 },
  ];
  private dropItems: Array<{ kind: number; dataId: number; denominator: number }> = [
    { kind: 0, dataId: 1, denominator: 2 },
    { kind: 1, dataId: 5, denominator: 4 },
  ];
  private exp = 10;
  private gold = 5;

  withId(id: number): this {
    this.id = id;
    return this;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withParams(params: [number, number, number, number, number, number, number, number]): this {
    this.params = params;
    return this;
  }

  withParam(index: number, value: number): this {
    this.params[index] = value;
    return this;
  }

  withActions(actions: Array<{ skillId: number; rating: number; conditionType: number }>): this {
    this.actions = actions;
    return this;
  }

  withDropItems(drops: Array<{ kind: number; dataId: number; denominator: number }>): this {
    this.dropItems = drops;
    return this;
  }

  withExp(exp: number): this {
    this.exp = exp;
    return this;
  }

  withGold(gold: number): this {
    this.gold = gold;
    return this;
  }

  withNoActions(): this {
    this.actions = [];
    return this;
  }

  withNoDropItems(): this {
    this.dropItems = [];
    return this;
  }

  build(): Enemy {
    const data: EnemyEntityData = {
      id: this.id,
      name: this.name,
      params: [...this.params],
      actions: [...this.actions],
      dropItems: [...this.dropItems],
      exp: this.exp,
      gold: this.gold,
    };
    return new Enemy(data);
  }

  withInvalidData(): this {
    return this.withId(0);
  }

  /**
   * Create an enemy with invalid params length (for validation testing).
   * Tests that Enemy constructor rejects params arrays not of length 8.
   *
   * @example
   * ```typescript
   * expect(() => new EnemyFakeBuilder()
   *   .withInvalidParams()
   *   .build()).toThrow(ValidationError);
   * ```
   */
  withInvalidParams(): this {
    this.params = [50, 0, 10] as unknown as [number, number, number, number, number, number, number, number];
    return this;
  }

  /**
   * Create a mutable params array reference (for immutability testing).
   * Returns a function that attempts to mutate the params array.
   * This should throw when the Enemy object is properly frozen.
   *
   * @example
   * ```typescript
   * const enemy = new EnemyFakeBuilder().build();
   * const mutator = new EnemyFakeBuilder().withParamsMutation();
   * expect(() => mutator(enemy.params)).toThrow();
   * ```
   */
  withParamsMutation(): (params: readonly number[]) => void {
    return (params: readonly number[]) => {
      (params as unknown as number[])[0] = 999;
    };
  }

  /**
   * Create a mutable actions array reference (for immutability testing).
   * Returns a function that attempts to mutate the actions array.
   * This should throw when the Enemy object is properly frozen.
   *
   * @example
   * ```typescript
   * const enemy = new EnemyFakeBuilder().build();
   * const mutator = new EnemyFakeBuilder().withActionsMutation();
   * expect(() => mutator(enemy.actions)).toThrow();
   * ```
   */
  withActionsMutation(): (actions: readonly unknown[]) => void {
    return (actions: readonly unknown[]) => {
      (actions as unknown as unknown[]).push({ skillId: 99, rating: 5, conditionType: 0 });
    };
  }
}
