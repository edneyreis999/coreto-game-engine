# ADR-015: Graphics Mocking Strategy for Headless Runtime

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-003

## Context and Problem Statement

The RUNTIME module executes RPG Maker MZ's battle engine in a headless JSDOM environment to measure TTK and validate game balance. The engine depends heavily on graphics libraries (PIXI.js for rendering, Effekseer for particle effects) and Canvas APIs. In headless JSDOM, these libraries either fail initialization or cause fatal crashes.

The validation tool requires only numerical battle outcomes (damage, turn counts, TTK measurements), not visual output. However, RPG Maker MZ's initialization sequence attempts to load and configure all graphics subsystems before allowing battle simulation. Without satisfying these API contracts, the engine cannot start.

This creates a critical technical challenge: enabling engine initialization and battle execution while preventing graphics-related crashes in a non-browser environment.

## Decision Drivers

- Fatal initialization blocker: Effekseer WASM module loading crashes JSDOM environment
- RPG Maker MZ requires PIXI.js Container, Sprite, and Graphics objects during startup
- Canvas API calls throughout engine initialization must succeed without actual rendering
- Battle calculations must remain completely unaffected by mock implementations
- Mocks must be maintainable across RPG Maker MZ and VisuStella plugin updates
- Performance impact of mock overhead affects simulation throughput

## Considered Options

1. Targeted comprehensive mocking of graphics subsystems
2. Minimal reactive mocking (stub only when crashes occur)
3. Full engine stubbing (replace battle logic)

## Decision Outcome

Chosen option: **Targeted comprehensive mocking**, because it provides the minimum viable API surface to satisfy engine initialization while preserving all battle calculation fidelity. This approach mocks only non-battle-affecting systems (graphics, audio, particles) while running the real RPG Maker MZ battle logic.

Implementation approach:

- PIXI.js mocks: Container, Sprite, Text, Graphics stub classes with minimal method implementations
- Graphics mock: RPG Maker MZ Graphics object (initialize, render, frameCount)
- Effekseer mock: WASM module stub to prevent fatal initialization crashes
- AudioManager mock: Prevent audio loading/playback attempts in headless environment
- Canvas mock: Using jest-canvas-mock library for Canvas API compatibility

Mock isolation in separate modules enables independent maintenance and diagnostic troubleshooting via `--diagnostic` mode.

## Pros and Cons of the Options

### Targeted Comprehensive Mocking

Good:

- Enables engine initialization without rendering infrastructure
- Preserves battle calculation fidelity (no reimplementation)
- Uses proven community libraries (jest-canvas-mock) where possible
- Modular design allows incremental updates when engine changes

Bad:

- Requires maintaining API surface synchronization with RPG Maker MZ updates
- VisuStella plugin changes may require mock extensions
- Fragile to unexpected API usage patterns in future plugins
- Adds maintenance overhead for non-functional code

### Minimal Reactive Mocking

Good:

- Lower initial implementation effort
- Only mocks what's proven necessary through testing
- Reduced maintenance surface area

Bad:

- Requires constant crash-debug-fix cycle during development
- No proactive understanding of required API surface
- High risk of production failures with new content or plugins
- Incompatible with project timeline (blocks Phase 1 critical path)

### Full Engine Stubbing

Good:

- Complete control over simulation behavior
- No dependency on RPG Maker MZ internals
- Potentially faster execution without engine overhead

Bad:

- Defeats fidelity goal from ADR-003 (run real engine)
- Requires reimplementing all VisuStella battle mechanics
- Impossible to maintain parity with plugin updates
- Loses automatic synchronization with game database formula changes

## Consequences

The mocking strategy enables headless battle simulation while introducing long-term maintenance obligations. Every RPG Maker MZ version update or new VisuStella plugin feature requires mock compatibility validation.

Mock isolation in separate modules reduces blast radius when changes are needed. The diagnostic mode provides observability into mock initialization, enabling rapid troubleshooting when new API calls are encountered.

Performance overhead from mock method calls is negligible compared to battle calculation complexity. However, incomplete mocking creates a binary failure mode: either the engine initializes successfully or crashes fatally during startup.

The team must understand which systems are mocked and maintain clear documentation of API coverage limitations. Test suites must validate mock compatibility with each engine and plugin update to prevent regression.

## References

- /Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md:179-206
- /Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md:137-150
- /Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-003-fidelidade-batalha-real-engine-headless.md:22-27
