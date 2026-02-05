/**
 * Runtime Infrastructure Module
 *
 * Módulo responsável pela inicialização e gerenciamento do headless runtime
 * para execução do RPG Maker MZ em ambiente Node.js.
 *
 * Componentes principais:
 * - HeadlessRuntimeBootstrapper: Orquestração da sequência de inicialização
 * - ScriptLoader: Carregamento de core scripts do RPG Maker MZ
 * - SyncWarpLoop: Loop síncrono de alta velocidade para simulação
 * - Shims: Mocks e polyfills para APIs de browser
 *
 * ADRs aplicáveis:
 * - ADR-014: JSDOM Browser Emulation
 * - ADR-015: Graphics Mocking
 * - ADR-018: Determinism
 * - ADR-025: Diagnostic Mode
 * - ADR-029: Sync Warp Loop Architecture
 */

export { HeadlessRuntimeBootstrapper } from './HeadlessRuntimeBootstrapper.js';
export { ScriptLoader, DatabaseLoader } from './loaders/index.js';
export { SyncWarpLoop } from './simulation/index.js';
export { HeadlessOverrides } from './overrides/HeadlessOverrides.js';

// Export shims for testing and headless runtime
export * from './shims/index.js';
