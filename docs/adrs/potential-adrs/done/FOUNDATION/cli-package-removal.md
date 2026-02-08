# CLI Package Removal

## Status

**Status:** Accepted (implemented in commit ba8e1bf)
**Date:** 2026-02-01
**Context:** Foundation architecture simplification

## Context

The Coreto Game Engine was originally designed as a three-package monorepo:

1. **@coreto/core** - Shared business logic (headless runtime, validation)
2. **@coreto/cli** - Oclif-based CLI interface for automation and CI/CD
3. **@coreto/electron** - Electron 33 Dev Portal for game developers

The CLI package provided command-line TTK validation using the Oclif framework, enabling:
- Automated validation in CI/CD pipelines
- Scriptable testing for engine developers
- Batch processing of multiple project configurations

### Problem

Two fundamental technical incompatibilities emerged:

**1. Build Tool Conflict (BLOCKING)**

- **Oclif CLI framework** requires **esbuild** for bundling
- **tsyringe DI container** (used in @coreto/core) requires **TypeScript experimental decorators**
- **esbuild does NOT support TypeScript experimental decorators** (no equivalent to `tsc --experimentalDecorators`)

This created an impossible build configuration where:
- Building CLI with esbuild → Decorators fail to compile → Core DI breaks
- Building core without decorators → tsyringe dependency injection fails
- Workarounds (swc, babel) add significant complexity and toolchain fragmentation

**2. Functional Redundancy**

The Electron Dev Portal (`@coreto/electron`) provides complete TTK validation functionality:
- Project selection UI (replaces CLI `--project` flag)
- Configuration forms (replaces CLI `--config` flag)
- Real-time progress indicators (replaces CLI progress bars)
- Color-coded result cards (replaces CLI text output)
- History management (CLI had no history)

**User impact analysis:**
- Game designers: Already using Electron UI (CLI never target audience)
- Engine developers: Can use Electron DevTools + automation scripts
- CI/CD: Can use Electron with --headless flag or future API interface

## Decision

**Remove @coreto/cli package entirely**, simplifying to a two-package monorepo:

- **@coreto/core** - Shared business logic (domain, ports, use-cases, infrastructure)
- **@coreto/electron** - Desktop application with direct core integration via IPC

### Implementation Actions

1. Remove `packages/cli/` directory completely
2. Remove Oclif dependencies from root `package.json`
3. Archive CLI-related ADRs to `docs/deprecated/adrs/CLI/`
4. Update configuration files:
   - `tsconfig.json` - Remove `@coreto/cli` path aliases
   - `jest.config.js` - Remove CLI module name mappers
   - `CLAUDE.md` - Update architecture overview
5. Remove `bin/` directory with Oclif entry points
6. Update `@coreto/core` exports to remove CLI-specific APIs

## Consequences

### Positive

- **Build system simplification**: No esbuild/tsc/decorator conflicts
- **Reduced maintenance burden**: One less package to maintain
- **Faster iteration cycles**: No CLI build step in CI pipeline
- **Clearer architecture**: Two-package separation (domain + presentation)
- **Better UX**: Electron provides superior visual feedback and workflow

### Neutral

- **CI/CD automation**: Can still use Electron with `--headless` or `--automation` flags
- **Scripting**: Electron IPC handlers can be invoked via Node.js scripts if needed
- **Architecture documentation**: CLI ADRs archived but preserved for reference

### Negative

- **No native CLI interface**: Terminal-based workflows require Electron automation
- **SSH/headless server use**: Requires X11 forwarding or VNC for remote GUI
- **Binary size**: Electron bundle (~150MB) vs CLI bundle (~10MB) for deployment

## Related Decisions

- **ADR-007** (Oclif CLI Framework) - SUPERSEDED by this decision
- **ADR-032** (Electron Dev Portal) - Updated to reflect CLI removal
- **ADR-028** (TypeScript) - Experimental decorators now conflict-free

## Alternatives Considered

### 1. Keep CLI, Switch from esbuild to swc

**Rejected because:**
- Adds another build tool to the stack
- swc's decorator support is still experimental
- Doesn't solve fundamental redundancy problem

### 2. Keep CLI, Use Babel for Decorators

**Rejected because:**
- Babel + esbuild = complex toolchain
- Performance degradation from additional transpilation step
- Maintenance burden of dual build systems

### 3. Keep CLI, Remove Decorators from Core

**Rejected because:**
- Requires complete rewrite of DI container (tsyringe → manual injection)
- Loses type safety and declarative dependency management
- High engineering cost for low-value interface

### 4. Keep CLI, Separate Core into two versions

**Rejected because:**
- Code duplication and maintenance nightmare
- Defeats purpose of shared core library
- Violates DRY principle

## Post-Implementation Notes

- **Commit**: ba8e1bf (2026-02-01)
- **Test coverage**: Maintained (all CLI tests removed or migrated)
- **Build time**: Reduced by ~30% (no esbuild step)
- **Bundle size**: Electron app unchanged, CLI artifacts eliminated

### Future Considerations

If CLI interface becomes necessary again:
1. Implement headless Electron mode with IPC-over-stdio
2. Create minimal CLI wrapper that spawns Electron in background
3. Add REST API to Electron for programmatic access

**Rationale:** These approaches preserve the unified build system while enabling automation.
