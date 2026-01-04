# ADR-025: Diagnostic Mode for Headless Initialization Troubleshooting

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-015, ADR-014, ADR-007

## Context and Problem Statement

The RUNTIME module executes RPG Maker MZ in a headless JSDOM environment with extensive mocking of graphics dependencies. Initialization involves sequential loading of browser emulation, PIXI.js mocks, engine scripts, plugins, and global object validation. This multi-stage process creates a complex dependency chain where failures can occur at multiple points.

When initialization fails, standard error messages often originate deep in engine internals or third-party plugins, providing cryptic stack traces that don't indicate which initialization stage failed or which mock is incomplete. Developers waste hours debugging whether the issue is JSDOM configuration, incomplete mock APIs, plugin compatibility, or engine script loading order.

The high-risk nature of mock fragility (identified in ADR-003) and the critical-path dependency on successful initialization requires a systematic observability mechanism for rapid troubleshooting during development.

## Decision Drivers

- Complex multi-stage initialization with opaque failure points reduces developer velocity
- Mock infrastructure fragility requires visibility into which mocks loaded successfully
- VisuStella plugin integration may introduce unexpected API dependencies
- Development phase troubleshooting needs must not impact normal execution performance
- New team members need clear visibility into initialization sequence for effective onboarding
- Diagnostic output must balance verbosity with signal-to-noise ratio

## Considered Options

1. CLI flag-activated diagnostic mode with opt-in verbose logging
2. No diagnostic mode, rely on standard error messages only
3. Always-on verbose logging throughout initialization

## Decision Outcome

Chosen option: **CLI flag-activated diagnostic mode** (`--diagnostic`), because it provides comprehensive initialization visibility when needed without affecting normal execution performance. Developers opt-in to detailed logging per-run, enabling rapid troubleshooting during development while maintaining clean output for CI and production-like scenarios.

Implementation activates diagnostic logging when the `--diagnostic` flag is detected, instrumenting key initialization stages with structured logging that reports step success/failure, timing, and object state inspection.

## Pros and Cons of the Options

### CLI Flag-Activated Diagnostic Mode

**Pros:**

- Zero performance impact on normal execution when flag not used
- Contextual activation allows developers to toggle per-run based on debugging needs
- Clear explicit signal that verbose output is intentional, not accidental
- Compatible with CI execution (no log pollution)

**Cons:**

- Requires instrumentation code throughout RUNTIME initialization layer
- Diagnostic logging must be maintained as mocks and initialization evolve
- Additional complexity in logging infrastructure implementation
- Risk of excessive verbosity overwhelming developers if not carefully designed

### No Diagnostic Mode

**Pros:**

- No additional implementation or maintenance burden
- Simplest approach with zero code overhead
- Forces developers to understand system deeply through standard debugging

**Cons:**

- Cryptic error messages from engine internals waste hours per issue
- No visibility into which initialization stages succeeded before failure
- High-risk mock fragility makes lack of observability unacceptable
- Blocks rapid iteration during high-velocity development phases

### Always-On Verbose Logging

**Pros:**

- Maximum visibility into every execution without requiring flag
- Simplest implementation (no conditional logic)
- Ensures diagnostic data always available in CI logs

**Cons:**

- Performance overhead on every execution, including production-like runs
- Log pollution makes normal execution output unusable
- CI log files become massive, hindering log analysis
- Cannot distinguish intentional debugging from normal execution

## Consequences

Diagnostic mode becomes a mandatory developer tool for RUNTIME module work, requiring all initialization instrumentation to include diagnostic logging hooks. Every new initialization stage (additional mocks, engine scripts, plugin loading) must add corresponding diagnostic output to maintain troubleshooting effectiveness.

The logging infrastructure establishes informal output format contracts. While not formally documented as API, developers and potentially automated scripts may depend on diagnostic output structure. Changes to diagnostic format should be considered breaking for development workflows.

Diagnostic mode overhead (string formatting, object inspection, I/O) is acceptable because it's opt-in for debugging scenarios. However, the instrumentation code itself adds maintenance burden. As mocks evolve or new plugins are integrated, diagnostic logging must be updated to reflect new initialization steps.

The decision establishes precedent for CLI-based observability flags in other modules. Future expansion may include diagnostic modes for SIMULATION or LOADER components, creating consistency in debugging approaches across the codebase.

## References

- /Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-003-fidelidade-batalha-real-engine-headless.md:54
- /Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md:94
- /Users/edney/projects/coreto/game-engine/docs/adrs/generated/RUNTIME/ADR-015-graphics-mocking-strategy-headless-runtime.md:42
