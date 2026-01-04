# Potential ADR: JSDOM for Browser Environment Emulation in Headless Runtime

**Module**: RUNTIME
**Category**: Infrastructure/Architecture
**Priority**: Must Document (Score: 150)
**Date Identified**: 2026-01-04

---

## Existing ADR Context

ℹ️ **RELATED DECISIONS**

This decision relates to:
- **ADR-003**: Fidelidade via Batalha Real na Engine em Headless (RUNTIME, 2026-01-04)

**Timeline Context**:
- This decision is a foundational implementation detail of ADR-003
- ADR-003 established the high-level decision to use headless execution
- This ADR would document the specific technology choice for browser emulation

**When creating formal ADR**: Reference ADR-003 as the parent architectural decision. This ADR documents the technical implementation choice that enables ADR-003.

---

## What Was Identified

The RUNTIME module requires a Node.js environment that can execute RPG Maker MZ's browser-based engine (HTML5/JavaScript) without an actual browser. The documentation reveals a critical architectural decision to use **JSDOM** as the browser environment emulator.

JSDOM is chosen as the foundational infrastructure that provides the `window`, `document`, `XMLHttpRequest`, and DOM APIs that RPG Maker MZ expects. This decision appears throughout the technical research document (35KB) and HLD architecture specifications, with detailed implementation strategies for handling the engine's browser dependencies.

The decision involves:
- JSDOM as the primary browser environment simulator
- Jest configured with `testEnvironment: 'jsdom'`
- Custom setup files (`tests/setup/rmmz_mocks.js`) to extend JSDOM with additional mocks
- Synchronous database loading as override to JSDOM's async XMLHttpRequest

---

## Why This Might Deserve an ADR

- **Impact**: **FOUNDATIONAL** - Affects the entire RUNTIME module architecture and all downstream simulation capabilities. Without JSDOM, the headless runtime cannot exist. Every component in the RUNTIME layer depends on this choice.

- **Trade-offs**:
  - JSDOM provides comprehensive DOM API coverage but has known limitations (no Canvas/WebGL native support, performance overhead)
  - Alternative approaches (Puppeteer, Playwright) offer real browser environments but add significant complexity and resource costs
  - The decision commits the project to working within JSDOM's constraints

- **Complexity**: Requires extensive mock infrastructure to handle JSDOM's gaps (PIXI.js, Effekseer WASM, Canvas API). The research document identifies this as one of the highest technical risks in the project.

- **Team Knowledge**: Any developer working on the RUNTIME module must understand JSDOM's capabilities and limitations. Critical for debugging why certain RPG Maker MZ features may not work in headless mode.

- **Future Implications**:
  - Constrains testing to JSDOM's performance characteristics (slower than native Node.js)
  - May require migration if VisuStella plugins evolve to require features JSDOM cannot emulate
  - Sets precedent for mock-based testing strategy vs. real browser automation

**Temporal Context**: Project is in documentation/planning phase. No git history available yet. This decision is documented across multiple planning artifacts (HLD Section 3.4, Research Section 4.1).

---

## Evidence Found in Codebase

### Key Files
**Note**: Project is in planning phase - no implementation files exist yet. Evidence comes from documentation.

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 135-151 (Section 3.4)
  - Defines JSDOM as core technology for Headless Runtime
  - Lists responsibilities: "Setup do ambiente JSDOM (simulação de browser)"

- [`/Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md`](../../../docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md) - Lines 154-178 (Section 4.1)
  - Technical justification: "O RPG Maker MZ é uma aplicação web baseada em HTML5, dependendo de objetos globais como window, document, e XMLHttpRequest. O Node.js não possui esses objetos nativamente."
  - Proposes jest.config.js structure with `testEnvironment: 'jsdom'`

### Code Evidence
```javascript
// Planned implementation from research document (Section 4.1.1):
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['./tests/setup/rmmz_mocks.js'],
  moduleNameMapper: {
    // Mocks para arquivos estáticos que o Jest não processa
    '\\.(jpg|png|ogg)$': '<rootDir>/tests/mocks/fileMock.js',
  },
};
```

### Impact Analysis
- Introduced: Planning phase (documentation dated 2026-01-04)
- Modified: Not yet implemented
- Affects: Entire RUNTIME module (~15-20 estimated files when implemented per mapping.md)
- Dependencies:
  - **Requires**: jest-canvas-mock for Canvas API support
  - **Requires**: Custom mocks for PIXI.js, Graphics, Effekseer
  - **Enables**: All battle simulation functionality in SIMULATION module

### Alternatives (if observable)

From Research Document Section 4.1 and HLD discussions:

**Alternative 1: Puppeteer/Playwright (Real Browser Automation)**
- Mentioned but implicitly rejected
- Would provide true browser environment with full Canvas/WebGL support
- Rejected due to: significant resource overhead, complexity of managing browser instances, slower execution, unnecessary for pure numerical simulation

**Alternative 2: Custom Minimal DOM Implementation**
- Not explicitly discussed but implied as unfeasible
- Would require reimplementing massive portions of browser APIs
- Maintenance burden would be prohibitive

**Alternative 3: Run in actual RPG Maker MZ Player**
- Would require automation of the game executable
- No access to internal state for TTK measurement
- Cannot run deterministically or at high speed

---

## Questions to Address in ADR (if created)

- Why was JSDOM chosen over real browser automation (Puppeteer/Playwright)?
- What are the specific JSDOM limitations that require mitigation (Canvas, WebGL, WASM)?
- How will the team handle incompatibilities if VisuStella plugins require browser features JSDOM cannot provide?
- What is the performance impact of JSDOM vs. native Node.js execution?
- What is the upgrade/maintenance strategy if JSDOM API changes or RPG Maker MZ engine evolves?
- How does this decision interact with the deterministic RNG requirements?

---

## Related Potential ADRs
- [Mocking Strategy for Graphics Dependencies (PIXI/Effekseer/Canvas)](./mocking-strategy-graphics-dependencies.md) - Implementation detail of this decision
- [Synchronous Database Loading Override](./synchronous-database-loading.md) - Required because JSDOM's XMLHttpRequest is async

---

## Additional Notes

**Critical Risk Identified in Documentation (HLD Section 10.1)**:
> "Risco: Harness headless incompatível com plugins ou updates: Alta probabilidade, Bloqueio impact"

The research document (35KB, 41 sources) dedicates Section 4 entirely to "Ambiente de Simulação Headless com Jest e JSDOM", indicating this was thoroughly researched. The decision appears well-justified but carries acknowledged high risk.

**Implementation Priority**: Documented as Phase 1 (Foundation, 4-6 weeks) in HLD Section 11.2, Step 4: "Headless Runtime (JSDOM, mocks, engine loading)"

**Test Handler Priority** (from research):
1. JSDOM initialization
2. PIXI Container/Sprite mocks
3. Graphics mock
4. Effekseer mock (identified as "WASM loading blocker")
5. Synchronous database loading via fs.readFileSync
