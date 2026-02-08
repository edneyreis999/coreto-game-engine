# ADR-033: CLI Package Removal Due to Build Tool Incompatibility

**Status:** Accepted
**Date:** 2026-02-01
**Supersedes:** ADR-007
**Related ADRs:** ADR-028, ADR-029, ADR-032

## Context and Problem Statement

The Coreto Game Engine was originally designed as a three-package monorepo with a CLI interface for automation and CI/CD pipelines. The CLI package provided command-line TTK validation using the Oclif framework, enabling automated validation in CI/CD pipelines and scriptable testing for engine developers.

Two fundamental technical incompatibilities emerged that made the CLI package unsustainable:

**1. Build Tool Conflict (BLOCKING)**

The Oclif CLI framework requires esbuild for bundling, while the tsyringe DI container used in the core package requires TypeScript experimental decorators. Esbuild does not support TypeScript experimental decorators, creating an impossible build configuration where the CLI could not be compiled without breaking the core dependency injection system.

**2. Functional Redundancy**

The Electron Dev Portal provides complete TTK validation functionality with superior user experience, including project selection UI, configuration forms, real-time progress indicators, and color-coded result cards. The CLI offered no unique capabilities that justified the build system complexity.

## Decision Drivers

- esbuild does not support TypeScript experimental decorators required by tsyringe
- Workarounds (swc, babel) add significant toolchain complexity and fragmentation
- Electron Dev Portal provides complete CLI functionality with better UX
- Removing CLI simplifies build system and reduces maintenance burden
- Two-package architecture (core + Electron) provides clearer separation of concerns

## Considered Options

1. Remove @coreto/cli package entirely (chosen)
2. Keep CLI, switch from esbuild to swc
3. Keep CLI, use Babel for decorators

## Decision Outcome

Chosen option: **Remove @coreto/cli package entirely**, because the esbuild-decorator incompatibility is a blocking technical issue with no viable workaround that doesn't introduce additional complexity. The Electron Dev Portal already provides complete TTK validation functionality, making the CLI functionally redundant.

The monorepo simplifies from three packages to two: @coreto/core (shared business logic) and @coreto/electron (desktop application). CI/CD automation can use Electron with headless mode or future API interfaces.

## Pros and Cons of the Options

### Remove CLI Package

**Pros:**

- Eliminates esbuild/tsc/decorator build conflict completely
- Reduces maintenance burden by removing one package
- Simplifies build system with ~30% faster build times
- Clearer architecture with two-package separation
- Better UX through Electron visual interface

**Cons:**

- No native terminal-based interface for automation
- Remote SSH usage requires X11 forwarding or VNC for GUI
- Larger deployment footprint (Electron ~150MB vs CLI ~10MB)

### Switch to swc

**Pros:**

- swc has experimental decorator support
- Maintains CLI automation capability

**Cons:**

- Adds another build tool to the stack
- swc decorator support still experimental and unstable
- Does not solve functional redundancy problem
- Increases toolchain complexity

### Use Babel for Decorators

**Pros:**

- Babel supports decorators via plugins
- Could potentially bridge esbuild and tsyringe

**Cons:**

- Babel + esbuild creates complex dual toolchain
- Performance degradation from additional transpilation
- High maintenance burden of coordinating two build systems
- Still redundant with Electron functionality

## Consequences

The monorepo structure simplifies from three packages to two, with @coreto/core containing all shared business logic and @coreto/electron providing the complete user interface. Build system complexity decreases significantly with the removal of esbuild configuration and Oclif dependencies.

The Electron Dev Portal becomes the single interface for all TTK validation workflows. For automation scenarios, future implementation may include headless Electron mode with IPC-over-stdio or REST API interfaces for programmatic access.

All CLI-related documentation and ADRs are archived to the deprecated directory for reference, preserving the architectural decision history while acknowledging the superseded status of the CLI approach.

## References

- packages/cli/ (removed in commit ba8e1bf)
- docs/deprecated/adrs/CLI/ADR-007-oclif-cli-framework.md
- packages/electron/package.json:1-50
- docs/adrs/UI/ADR-032-electron-dev-portal-multi-tool-platform.md
- docs/adrs/FOUNDATION/ADR-029-tsyringe-di-container.md
