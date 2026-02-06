/**
 * FakeBuilder pattern exports for @coreto/core tests.
 *
 * Provides fluent builder interfaces for creating domain entities
 * in tests with sensible defaults and easy customization.
 *
 * @example
 * ```typescript
 * import { AnchorLevelRangeFakeBuilder, PartyConfigFakeBuilder } from '@coreto/core/tests/fakes';
 *
 * const range = new AnchorLevelRangeFakeBuilder()
 *   .withRange(5, 10)
 *   .build();
 *
 * const party = new PartyConfigFakeBuilder()
 *   .withFullParty(5)
 *   .build();
 * ```
 */

// Base builder
export { FakeBuilder } from './FakeBuilder';

// Domain entity builders
export { AnchorLevelRangeFakeBuilder } from './AnchorLevelRangeFakeBuilder';
export { TtkMetricsFakeBuilder } from './TtkMetricsFakeBuilder';
export { TtkTargetFakeBuilder } from './TtkTargetFakeBuilder';
export { PartyConfigFakeBuilder } from './PartyConfigFakeBuilder';
export { WarningFakeBuilder } from './WarningFakeBuilder';
export { BattleResultFakeBuilder } from './BattleResultFakeBuilder';
export { TrechoFakeBuilder } from './TrechoFakeBuilder';
export { ReportFakeBuilder } from './ReportFakeBuilder';

// In-memory fakes for ports
export { FakeBattleSimulator } from './FakeBattleSimulator';
export { FakeReporter } from './FakeReporter';
export { FakeClock } from './FakeClock';

// Additional builders
export { TrechoValidationResultFakeBuilder } from './TrechoValidationResultFakeBuilder';
export { RmmzDatabaseFakeBuilder } from './RmmzDatabaseFakeBuilder';
