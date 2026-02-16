/**
 * FakeBuilders for @coreto/electron test fixtures.
 *
 * This module exports all FakeBuilders for creating realistic test data
 * following DDD testing patterns with Chance.js.
 *
 * @example
 * ```ts
 * import { ReportDataFakeBuilder, RecentProjectFakeBuilder } from '@electron/tests/fakes';
 *
 * const report = ReportDataFakeBuilder.anEntity().withTotalBattles(100).build();
 * const projects = RecentProjectFakeBuilder.theEntities(5).build();
 * ```
 */

export { ReportDataFakeBuilder } from './ReportDataFakeBuilder.js';
export { ProjectConfigResponseFakeBuilder } from './ProjectConfigResponseFakeBuilder.js';
export { ProgressPayloadFakeBuilder } from './ProgressPayloadFakeBuilder.js';
export { WorkerToMainMessageFakeBuilder } from './WorkerToMainMessageFakeBuilder.js';
export { RecentProjectFakeBuilder } from './RecentProjectFakeBuilder.js';
export { ErrorPayloadFakeBuilder } from './ErrorPayloadFakeBuilder.js';
export { SimulationResultPayloadFakeBuilder } from './SimulationResultPayloadFakeBuilder.js';
export { TrechoFakeBuilder } from './TrechoFakeBuilder.js';
export { BattleResultFakeBuilder } from './BattleResultFakeBuilder.js';
export { LogBundleFakeBuilder, logBundleFake } from './LogBundleFakeBuilder.js';
export { LogEntryFakeBuilder, logEntryFake } from './LogEntryFakeBuilder.js';
export { NSDSceneDTOFakeBuilder } from './NSDSceneDTOFakeBuilder.js';
