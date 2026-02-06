/**
 * Test Builders Barrel Export
 *
 * Exports all FakeBuilders for creating realistic test data.
 * Follows DDD testing patterns with Chance.js.
 *
 * @example
 * ```ts
 * import { SimulationHistoryInputBuilder, RecentProjectBuilder } from '@electron/tests/helpers/builders';
 *
 * const mockInput = SimulationHistoryInputBuilder.create()
 *   .withVictory()
 *   .build();
 * ```
 */

export * from './simulation-history-input.builder';
export * from './user-preferences.builder';
export * from './recent-project.builder';
export * from './warning.builder';
export * from './trecho-summary.builder';
export * from './report-data.builder';
export * from './ui-project-config.builder';
export * from './domain';
