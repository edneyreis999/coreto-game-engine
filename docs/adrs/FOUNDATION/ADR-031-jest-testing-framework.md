# ADR-031: Jest Testing Framework

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-014 (JSDOM), ADR-026 (jest-canvas-mock), ADR-018 (Determinism)

## Context and Problem Statement

The coreto game engine requires comprehensive testing coverage across unit tests (domain logic, skill selection algorithms), integration tests (headless runtime initialization, database loading), and validation tests (deterministic TTK measurement). The testing framework must support JSDOM browser emulation (ADR-014), canvas API mocking (ADR-026), and snapshot testing for deterministic battle outputs (ADR-018).

The framework choice directly impacts test execution speed, mocking capabilities, and developer experience for TDD workflows. Given the project's reliance on RPG Maker MZ core scripts (browser-targeted JavaScript) running in Node.js via JSDOM, the testing framework must provide seamless integration with DOM APIs and module mocking without excessive configuration overhead.

## Decision Drivers

- Native JSDOM integration for browser API emulation (window, document, localStorage)
- Snapshot testing for validating deterministic battle outputs with fixed RNG seeds
- Built-in mocking system for stubbing Graphics, Effekseer, AudioManager dependencies
- TypeScript support with minimal configuration (ts-jest or esbuild-jest)
- jest-canvas-mock compatibility for canvas getContext stubbing (ADR-026)
- Watch mode for TDD workflow with file change detection
- Coverage reporting with thresholds for domain/application layers (≥80%)

## Considered Options

1. Jest 29.7.0 - Mature testing framework with built-in JSDOM and mocking
2. Vitest - Vite-powered testing framework with native ESM support
3. Mocha + Chai + Sinon - Flexible testing stack with separate libraries
4. AVA - Minimalist test runner with concurrent execution

## Decision Outcome

Chosen option: Jest 29.7.0, because it provides the most comprehensive out-of-box solution for the project's unique requirements: JSDOM environment, canvas mocking, snapshot testing, and TypeScript integration. The mature ecosystem includes jest-canvas-mock (ADR-026) as a maintained library, eliminating the need for custom canvas API stubbing.

Jest's snapshot testing feature aligns perfectly with the deterministic battle requirement (ADR-018), allowing regression detection when TTK measurements change across code refactors. The built-in mocking system (jest.fn(), jest.mock()) simplifies stubbing of RPG Maker MZ global objects without additional libraries.

The performance trade-off (2-3s startup time vs Vitest's instant startup) is acceptable for CLI tool context where test suite runs are infrequent compared to rapid development builds (handled by tsx in ADR-030).

## Pros and Cons of the Options

### Jest 29.7.0

**Pros:**

- Native JSDOM environment setup via testEnvironment: 'jsdom' configuration
- Snapshot testing with .toMatchSnapshot() for deterministic battle validation
- Built-in coverage reporting with threshold enforcement (coverageThreshold)
- jest-canvas-mock library provides complete canvas API stubbing (ADR-026)
- Extensive TypeScript support via ts-jest or @swc/jest transformers
- Watch mode with intelligent test re-run based on file dependencies
- Large ecosystem with solutions for common mocking patterns (timers, modules, globals)

**Cons:**

- Slower startup time (2-3s) due to full JSDOM initialization per test suite
- CommonJS-based architecture complicates native ESM module testing
- Configuration complexity for TypeScript path aliases (@/ resolution)
- Memory overhead with JSDOM can impact large test suites (mitigated by --maxWorkers)

### Vitest

**Pros:**

- Instant test startup via Vite's on-demand compilation
- Native ESM support without transpilation overhead
- Compatible with Jest API (expect, describe, it) for easy migration
- Better watch mode performance with Vite's HMR integration

**Cons:**

- Less mature JSDOM integration (environment setup requires manual configuration)
- No established canvas mocking library (would require custom implementation)
- Smaller ecosystem for RPG Maker MZ-specific testing patterns
- Vite dependency adds frontend-focused tooling to backend CLI project

### Mocha + Chai + Sinon

**Pros:**

- Maximum flexibility with separate assertion (Chai) and mocking (Sinon) libraries
- Lightweight test runner with minimal overhead
- No opinionated structure (can mix BDD/TDD styles)

**Cons:**

- No built-in snapshot testing (requires additional library: chai-jest-snapshot)
- Manual JSDOM setup in before/after hooks (no automatic environment)
- No integrated coverage reporting (requires nyc or c8 separately)
- Fragmented ecosystem with compatibility issues between libraries
- Higher configuration overhead for TypeScript integration

### AVA

**Pros:**

- Concurrent test execution for faster overall suite runtime
- Minimal API surface with focus on simplicity
- Native TypeScript support via built-in transpilation

**Cons:**

- No built-in JSDOM environment (requires manual setup)
- Weaker mocking capabilities (no jest.fn() equivalent)
- Smaller community with fewer RPG Maker MZ-specific testing examples
- No snapshot testing without third-party library

## Consequences

The adoption of Jest establishes a standard testing pattern where each module (CLI, Config, Loader, Simulation, Reporter) has a corresponding __tests__/ directory with .test.ts files. The JSDOM environment becomes the default for all tests, eliminating the need for manual window/document setup in test fixtures.

Snapshot testing for deterministic battles creates a regression detection mechanism: any code change that alters TTK output (for the same RNG seed) will fail tests, forcing developers to explicitly review and update snapshots. This provides strong validation of the determinism guarantee (ADR-018) across refactoring cycles.

The jest-canvas-mock integration (ADR-026) enables testing of RPG Maker MZ core scripts that rely on canvas.getContext('2d') without manual stubbing. However, tests become dependent on the canvas-mock implementation details, creating a risk if the library is abandoned (last updated 2023, active maintenance uncertain).

The slower test startup time (2-3s) compared to Vitest is acceptable for the project's scale (estimated 100-200 test cases at MVP completion). If test suite runtime becomes a bottleneck (>30s total), Jest's --maxWorkers flag can parallelize execution across CPU cores.

The configuration overhead for TypeScript path aliases requires additional setup in jest.config.js using moduleNameMapper to resolve @/ imports. This creates a configuration synchronization requirement between tsconfig.json and jest.config.js that must be maintained manually.

The watch mode provides an excellent TDD workflow for simulation layer development, where rapid feedback on TTK measurement changes is critical. However, developers must ensure watch mode is disabled in CI/CD pipeline to prevent hanging test processes.

## References

- Jest Documentation: https://jestjs.io/
- jest-canvas-mock: https://github.com/hustcc/jest-canvas-mock
- ADR-014: JSDOM Browser Emulation for Headless Runtime
- ADR-026: jest-canvas-mock Library for Canvas API Stubbing
- ADR-018: Seed-Controlled Determinism for RNG
- HLD Section 9: Testing Strategy
