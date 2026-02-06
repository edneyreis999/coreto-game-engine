/**
 * Test-only exports
 *
 * Import from '@coreto/core/testing' in tests.
 *
 * WARNING: These APIs are UNSTABLE and may change without notice.
 * They are exported solely for testing purposes.
 */

// Re-export public API
export * from './index.js';

// =============================================================================
// TEST-ONLY EXPORTS
// =============================================================================

// Runtime internals
export * from './infrastructure/runtime/index.js';
export * from './infrastructure/runtime/loaders/index.js';
export * from './infrastructure/runtime/shims/index.js';
export * from './infrastructure/runtime/simulation/index.js';
export * from './infrastructure/runtime/overrides/HeadlessOverrides.js';

// Simulation internals
export * from './infrastructure/simulation/index.js';
export { HeadlessBattleSimulator as BattleSimulator } from './infrastructure/simulation/BattleSimulator.js';
export { TtkMeasurer } from './infrastructure/simulation/TtkMeasurer.js';
export { DeterministicRNG } from './infrastructure/simulation/DeterministicRNG.js';

// Security internals
export * from './infrastructure/security/index.js';

// Adapter internals
export * from './infrastructure/adapters/index.js';

// Data adapters
export * from './infrastructure/adapters/data/index.js';

// Filesystem adapters
export * from './infrastructure/adapters/filesystem/index.js';

// Logger adapters
export { ConsoleLogger } from './infrastructure/adapters/logger/ConsoleLogger.js';

// Reporter adapters
export * from './infrastructure/adapters/reporter/index.js';
