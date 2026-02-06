/**
 * Domain Form Data Builders Barrel Export
 *
 * Exports all FakeBuilders for domain form data types.
 * These builders follow DDD testing patterns with Chance.js.
 *
 * @example
 * ```ts
 * import { TrechoFormBuilder, GlobalSettingsFormBuilder } from '@electron/tests/helpers/builders/domain';
 *
 * const validTrecho = TrechoFormBuilder.create()
 *   .withId('trecho-1')
 *   .withAnchorLevels(10, 15)
 *   .build();
 *
 * const settings = GlobalSettingsFormBuilder.create()
 *   .withDeterministicSeed()
 *   .build();
 * ```
 */

export { TrechoFormBuilder } from './TrechoFormBuilder';
export { GlobalSettingsFormBuilder } from './GlobalSettingsFormBuilder';
export { PartyMemberFormBuilder, PartyConfigFormBuilder } from './PartyMemberFormBuilder';
