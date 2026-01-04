# ADR-030: tsx/esbuild Build Tooling

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-028 (TypeScript), ADR-007 (Oclif CLI)

## Context and Problem Statement

The coreto game engine is a TypeScript-based CLI tool requiring fast development iteration cycles and optimized production builds. The project needs a build tooling strategy that balances two competing requirements: rapid feedback during development (hot-reload, minimal startup overhead) and production bundle optimization (tree-shaking, single executable output).

Traditional TypeScript compilation with tsc provides type checking but results in slow startup times due to multi-file output and lack of bundling. Modern tools like esbuild offer 10-100x faster builds but skip type checking entirely. The project needs a hybrid approach that optimizes for developer experience in development mode while maintaining production quality in distribution builds.

## Decision Drivers

- Development mode hot-reload with ≤1 second restart latency
- Production builds must include type checking as validation gate
- Single-file bundle output for simplified distribution and faster CLI startup
- Tree-shaking to eliminate unused RPG Maker MZ core script code
- Minimal configuration overhead aligned with Oclif CLI conventions
- Support for TypeScript path aliases (@/ for src/) without runtime overhead
- Compatibility with experimental decorators for TSyringe (ADR-029)

## Considered Options

1. tsx (development) + esbuild (production) - Hybrid dual-mode approach
2. ts-node + tsc - Traditional TypeScript compilation
3. swc + swc-node - Rust-based TypeScript compiler
4. Vite - Frontend-focused build tool with TypeScript support

## Decision Outcome

Chosen option: tsx for development mode + esbuild for production builds, because it provides the optimal developer experience through fast hot-reload while maintaining production bundle quality. The dual-mode strategy separates concerns: tsx handles rapid iteration with module-level caching, while esbuild generates optimized single-file bundles with aggressive tree-shaking.

This approach requires running tsc --noEmit separately for type checking, establishing a clear validation gate in the CI/CD pipeline (future ADR). The split responsibility model prevents type errors from blocking local development while ensuring production builds maintain type safety.

## Pros and Cons of the Options

### tsx + esbuild

**Pros:**

- Development: Hot-reload ≤1s via tsx with incremental module caching
- Production: Single-file bundle with tree-shaking via esbuild
- Explicit separation of type checking (tsc) from bundling (esbuild)
- Native ESM support without transpilation overhead in development
- esbuild minification reduces bundle size by ~40% compared to tsc output
- Path alias resolution (@/) works in both modes via tsconfig.json

**Cons:**

- Requires separate tsc --noEmit step for type validation (not automatic)
- Dual tooling increases configuration surface (tsx + esbuild + tsc)
- esbuild experimental decorator support may lag TypeScript spec updates
- Developers must remember to run type check before committing (pre-commit hook required)

### ts-node + tsc

**Pros:**

- Single toolchain with unified type checking and execution
- Official TypeScript tooling with guaranteed spec compliance
- Automatic type checking on every execution

**Cons:**

- Slow startup (3-5s) due to full project compilation on each run
- Multi-file output complicates distribution (requires node_modules in bundle)
- No tree-shaking or dead code elimination
- Poor development experience for rapid iteration cycles

### swc + swc-node

**Pros:**

- Rust-based compilation 20x faster than tsc
- Single toolchain for development and production
- Built-in minification and bundling

**Cons:**

- Less mature TypeScript support (decorator edge cases)
- Smaller ecosystem compared to esbuild (fewer plugins)
- Configuration complexity for path aliases and Oclif integration
- Bundling feature set less comprehensive than esbuild

### Vite

**Pros:**

- Excellent development experience with HMR and instant server startup
- Rich plugin ecosystem for TypeScript transformations
- Built-in optimizations for code splitting

**Cons:**

- Frontend-focused architecture (assumes browser runtime)
- Overhead inappropriate for CLI tool context (dev server, HTML entry point)
- Requires custom configuration to generate Node.js executable
- Code splitting unnecessary for single-command CLI application

## Consequences

The hybrid tooling strategy establishes a clear workflow separation: tsx npm run dev for rapid development iteration, esbuild npm run build for production bundle generation, and tsc --noEmit as a validation gate before commits.

Developers gain fast feedback loops during development without waiting for full type checking on every file save. The development mode uses Node.js native module resolution, eliminating bundling overhead entirely. However, this creates a risk that developers skip type checking, necessitating pre-commit hooks (git-commit-helper skill) to enforce tsc validation.

The production build generates a single-file bundle with tree-shaking, eliminating unused RPG Maker MZ core scripts and reducing bundle size by approximately 60% compared to unbundled tsc output. This optimization directly impacts CLI startup time, supporting the ≤10 minute validation cycle requirement.

The split responsibility model requires maintaining configuration parity across three tools (tsconfig.json for tsc, esbuild.config.js for bundling, tsx CLI flags for development). Any changes to TypeScript compiler options (experimentalDecorators, path aliases) must be synchronized manually.

The esbuild experimental decorator support relies on TypeScript's legacy decorator implementation. If the project migrates to TC39 stage 3 decorators in future TypeScript versions, esbuild configuration may require updates or replacement.

## References

- tsx GitHub: https://github.com/esbuild-kit/tsx
- esbuild Documentation: https://esbuild.github.io/
- ADR-007: Oclif CLI Framework
- ADR-028: TypeScript as Primary Implementation Language
- HLD Section 10: Build and Distribution Strategy
