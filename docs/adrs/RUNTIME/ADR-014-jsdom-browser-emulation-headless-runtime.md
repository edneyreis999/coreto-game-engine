# ADR-014: JSDOM for Browser Environment Emulation in Headless Runtime

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-003

## Context and Problem Statement

The RUNTIME module must execute RPG Maker MZ's browser-based engine (HTML5/JavaScript) in a Node.js environment without an actual browser. RPG Maker MZ depends on browser-specific global objects (`window`, `document`, `XMLHttpRequest`) and DOM APIs that Node.js does not provide natively.

The headless runtime strategy (established in ADR-003) requires a technology that can emulate a browser environment with sufficient fidelity to run the game engine's core systems, handle DOM operations, and support third-party plugins like VisuStella.

## Decision Drivers

- Headless execution requires browser API emulation without launching a real browser instance
- RPG Maker MZ engine expects a comprehensive set of DOM APIs and global browser objects
- Solution must support Jest-based testing infrastructure for battle simulation validation
- Performance overhead must remain acceptable for high-speed deterministic simulations
- Browser emulation gaps (Canvas, WebGL, WASM) must be addressable through extension mechanisms
- VisuStella plugin compatibility depends on stable DOM environment

## Considered Options

1. **JSDOM (Chosen)** - Pure JavaScript DOM implementation for Node.js
2. **Puppeteer/Playwright** - Real browser automation with headless Chrome/Firefox
3. **Custom Minimal DOM** - Build purpose-specific browser API subset

## Decision Outcome

Chosen option: **JSDOM**, because it provides comprehensive DOM API coverage in a pure JavaScript implementation that integrates seamlessly with Jest, operates without browser process overhead, and can be extended with custom mocks to address its limitations.

JSDOM serves as the foundational infrastructure layer, configured via Jest's `testEnvironment: 'jsdom'` with custom setup files to provide additional mocks for graphics dependencies (PIXI.js, Canvas, Effekseer).

## Pros and Cons of the Options

### JSDOM

**Pros**

- Pure JavaScript implementation runs in Node.js without external browser processes
- Comprehensive DOM API coverage handles most RPG Maker MZ engine requirements
- Native Jest integration via `testEnvironment` option enables seamless test infrastructure
- Extensible mock architecture allows custom implementations for missing APIs

**Cons**

- No native Canvas or WebGL support requires extensive mocking layer
- Performance overhead compared to native Node.js execution
- Async XMLHttpRequest behavior requires synchronous overrides for database loading
- May not support future browser features that advanced plugins require

### Puppeteer/Playwright

**Pros**

- True browser environment provides complete API compatibility including Canvas/WebGL
- No mock infrastructure required for standard browser features
- Renders actual visual output for debugging purposes

**Cons**

- Significant resource overhead from managing browser instances
- Slower execution incompatible with high-speed simulation requirements
- Unnecessary complexity for pure numerical battle calculations
- External browser process adds deployment and maintenance burden

### Custom Minimal DOM

**Pros**

- Tailored to exact RPG Maker MZ requirements with no unnecessary features
- Potentially smallest performance footprint

**Cons**

- Massive development effort to reimplement browser APIs
- Ongoing maintenance burden tracking engine and plugin API changes
- High risk of subtle incompatibilities with third-party code
- Reinvents well-tested existing solutions

## Consequences

JSDOM becomes the mandatory foundation for all RUNTIME module components. Every test and simulation runs within JSDOM's emulated browser environment, establishing specific operational constraints and development patterns.

The decision commits the project to working within JSDOM's limitations, requiring a comprehensive mocking strategy for graphics dependencies (PIXI.js, Effekseer, Canvas API). The mock infrastructure becomes a critical maintenance surface that must stay synchronized with RPG Maker MZ engine updates and VisuStella plugin evolution.

Performance characteristics differ from native Node.js execution, introducing overhead that may impact simulation speed for large-scale balancing validation runs. The team must monitor performance degradation and potentially optimize hot paths in the mock layer.

If future VisuStella plugins or RPG Maker MZ updates require browser features JSDOM cannot emulate (advanced WebGL, WebAssembly threading), the project may face migration pressure toward real browser automation, though this risk is acknowledged and accepted given current requirements.

## References

- docs/hld-coreto-game-engine.md:135-151
- docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md:154-178
