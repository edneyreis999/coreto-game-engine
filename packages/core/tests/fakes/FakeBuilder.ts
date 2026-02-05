/**
 * Abstract base class for FakeBuilder pattern in tests.
 * Provides fluent interface for creating test data with sensible defaults.
 *
 * @template T - The type of entity this builder creates
 *
 * @example
 * ```typescript
 * class MyEntityBuilder extends FakeBuilder<MyEntity> {
 *   private name = 'Default Name';
 *   private age = 25;
 *
 *   withName(name: string): this {
 *     this.name = name;
 *     return this;
 *   }
 *
 *   withAge(age: number): this {
 *     this.age = age;
 *     return this;
 *   }
 *
 *   build(): MyEntity {
 *     return new MyEntity(this.name, this.age);
 *   }
 * }
 * ```
 */
export abstract class FakeBuilder<T> {
  /**
   * Build the entity with current builder state.
   */
  abstract build(): T;

  /**
   * Create a builder with invalid data for negative testing.
   * Each concrete builder should implement this to provide
   * domain-specific invalid states.
   */
  abstract withInvalidData(): this;

  /**
   * Helper for generating random numbers within a range.
   * Uses deterministic seeded random for reproducibility.
   *
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (exclusive)
   * @returns Random number in range [min, max)
   */
  protected randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /**
   * Helper for picking a random element from an array.
   *
   * @param array - Array to pick from
   * @returns Random element from array
   */
  protected randomPick<T>(array: T[]): T {
    const index = this.randomInt(0, array.length);
    return array[index]!;
  }

  /**
   * Helper for generating a random string.
   *
   * @param prefix - Prefix for the string
   * @param length - Length of random suffix (default: 8)
   * @returns Random string with prefix
   */
  protected randomString(prefix: string, length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let suffix = '';
    for (let i = 0; i < length; i++) {
      suffix += chars[this.randomInt(0, chars.length)];
    }
    return `${prefix}-${suffix}`;
  }
}
