import { FakeBuilder } from './FakeBuilder.js';
import { Trecho, TrechoData, PartyConfig } from '@coreto/core';
import { PartyConfigFakeBuilder } from './PartyConfigFakeBuilder.js';

/**
 * Builder for creating Trecho instances in tests.
 * Provides sensible defaults and fluent interface for customization.
 *
 * @example
 * ```typescript
 * const trecho = new TrechoFakeBuilder()
 *   .withId('ato1-nivel1-10')
 *   .withLevelRange(1, 10)
 *   .withTroopIds([1, 2, 3])
 *   .build();
 *
 * const invalid = new TrechoFakeBuilder()
 *   .withEmptyId()
 *   .build();
 * ```
 */
export class TrechoFakeBuilder extends FakeBuilder<Trecho> {
  private id = 'ato1-nivel1-10';
  private name = 'Ato 1 - Níveis 1-10';
  private anchorLevelMin = 1;
  private anchorLevelMax = 10;
  private targetTtkTurns = 3;
  private targetTtkActions = 8;
  private tolerancePercent = 15;
  private troopIds: number[] = [1, 2, 3];
  private party = new PartyConfigFakeBuilder().build();

  /**
   * Set the trecho ID.
   *
   * @param id - Unique identifier
   * @returns This builder for chaining
   */
  withId(id: string): this {
    this.id = id;
    return this;
  }

  /**
   * Set the trecho name.
   *
   * @param name - Human-readable name
   * @returns This builder for chaining
   */
  withName(name: string): this {
    this.name = name;
    return this;
  }

  /**
   * Set the anchor level range.
   *
   * @param min - Minimum level
   * @param max - Maximum level
   * @returns This builder for chaining
   */
  withLevelRange(min: number, max: number): this {
    this.anchorLevelMin = min;
    this.anchorLevelMax = max;
    return this;
  }

  /**
   * Set the minimum anchor level.
   *
   * @param min - Minimum level
   * @returns This builder for chaining
   */
  withAnchorLevelMin(min: number): this {
    this.anchorLevelMin = min;
    return this;
  }

  /**
   * Set the maximum anchor level.
   *
   * @param max - Maximum level
   * @returns This builder for chaining
   */
  withAnchorLevelMax(max: number): this {
    this.anchorLevelMax = max;
    return this;
  }

  /**
   * Set both TTK targets.
   *
   * @param turns - Target TTK turns
   * @param actions - Target TTK actions
   * @returns This builder for chaining
   */
  withTargetTtk(turns: number, actions: number): this {
    this.targetTtkTurns = turns;
    this.targetTtkActions = actions;
    return this;
  }

  /**
   * Set target TTK turns.
   *
   * @param turns - Target TTK turns
   * @returns This builder for chaining
   */
  withTargetTtkTurns(turns: number): this {
    this.targetTtkTurns = turns;
    return this;
  }

  /**
   * Set target TTK actions.
   *
   * @param actions - Target TTK actions
   * @returns This builder for chaining
   */
  withTargetTtkActions(actions: number): this {
    this.targetTtkActions = actions;
    return this;
  }

  /**
   * Set tolerance percentage.
   *
   * @param tolerance - Tolerance percentage (0-100)
   * @returns This builder for chaining
   */
  withTolerance(tolerance: number): this {
    this.tolerancePercent = tolerance;
    return this;
  }

  /**
   * Set troop IDs.
   *
   * @param troopIds - Array of troop IDs
   * @returns This builder for chaining
   */
  withTroopIds(troopIds: number[]): this {
    this.troopIds = [...troopIds];
    return this;
  }

  /**
   * Add a single troop ID.
   *
   * @param troopId - Troop ID to add
   * @returns This builder for chaining
   */
  withTroopId(troopId: number): this {
    this.troopIds.push(troopId);
    return this;
  }

  /**
   * Set the party configuration.
   *
   * @param party - PartyConfig instance
   * @returns This builder for chaining
   */
  withParty(party: PartyConfig): this {
    this.party = party;
    return this;
  }

  /**
   * Set party using PartyConfigFakeBuilder.
   *
   * @param builder - Configured party builder
   * @returns This builder for chaining
   */
  withPartyBuilder(builder: PartyConfigFakeBuilder): this {
    this.party = builder.build();
    return this;
  }

  /**
   * Create a trecho with empty ID (invalid).
   *
   * @returns This builder for chaining
   */
  withEmptyId(): this {
    return this.withId('');
  }

  /**
   * Create a trecho with whitespace-only ID (invalid).
   *
   * @returns This builder for chaining
   */
  withWhitespaceId(): this {
    return this.withId('   ');
  }

  /**
   * Create a trecho with invalid level range (min > max).
   *
   * @returns This builder for chaining
   */
  withInvalidLevelRange(): this {
    return this.withLevelRange(10, 1);
  }

  /**
   * Create a trecho with level below valid range.
   *
   * @returns This builder for chaining
   */
  withBelowMinLevel(): this {
    return this.withAnchorLevelMin(0);
  }

  /**
   * Create a trecho with level above valid range.
   *
   * @returns This builder for chaining
   */
  withAboveMaxLevel(): this {
    return this.withAnchorLevelMax(100);
  }

  /**
   * Create a trecho with negative tolerance.
   *
   * @returns This builder for chaining
   */
  withNegativeTolerance(): this {
    return this.withTolerance(-1);
  }

  /**
   * Create a trecho with tolerance above 100%.
   *
   * @returns This builder for chaining
   */
  withAboveMaxTolerance(): this {
    return this.withTolerance(101);
  }

  /**
   * Create a trecho with no troop IDs (invalid).
   *
   * @returns This builder for chaining
   */
  withNoTroopIds(): this {
    return this.withTroopIds([]);
  }

  /**
   * Create a trecho with invalid TTK turns (zero).
   *
   * @returns This builder for chaining
   */
  withZeroTtkTurns(): this {
    return this.withTargetTtkTurns(0);
  }

  /**
   * Create a trecho with invalid TTK actions (zero).
   *
   * @returns This builder for chaining
   */
  withZeroTtkActions(): this {
    return this.withTargetTtkActions(0);
  }

  /**
   * Create a trecho with full level range (1-99).
   *
   * @returns This builder for chaining
   */
  withFullLevelRange(): this {
    return this.withLevelRange(1, 99);
  }

  /**
   * Build the Trecho instance.
   *
   * @returns Trecho instance
   * @throws {ValidationError} If trecho configuration is invalid
   */
  build(): Trecho {
    const data: TrechoData = {
      id: this.id,
      name: this.name,
      anchorLevelMin: this.anchorLevelMin,
      anchorLevelMax: this.anchorLevelMax,
      targetTtkTurns: this.targetTtkTurns,
      targetTtkActions: this.targetTtkActions,
      tolerancePercent: this.tolerancePercent,
      troopIds: [...this.troopIds],
      party: this.party,
    };
    return new Trecho(data);
  }

  /**
   * Create builder with invalid data.
   */
  withInvalidData(): this {
    return this.withEmptyId();
  }
}
