# Potential ADR: Comprehensive Mocking Strategy for Graphics Dependencies (PIXI/Effekseer/Canvas)

**Module**: RUNTIME
**Category**: Architecture/Testing Strategy
**Priority**: Must Document (Score: 145)
**Date Identified**: 2026-01-04

---

## Existing ADR Context

ℹ️ **RELATED DECISIONS**

This decision relates to:
- **ADR-003**: Fidelidade via Batalha Real na Engine em Headless (RUNTIME, 2026-01-04)
- **Potential ADR**: JSDOM for Browser Emulation (RUNTIME)

**Timeline Context**:
- Implements the mocking requirements introduced by JSDOM choice
- Builds upon ADR-003's commitment to run real engine in headless mode

**When creating formal ADR**: Reference ADR-003 as parent decision and JSDOM ADR as enabling infrastructure. This ADR documents the critical bridge between JSDOM limitations and RPG Maker MZ requirements.

---

## What Was Identified

The RUNTIME module must execute RPG Maker MZ's battle engine, which heavily depends on graphics libraries (PIXI.js for rendering, Effekseer for particle effects) and Canvas APIs. However, in a headless JSDOM environment, these libraries either fail completely or cause crashes.

The documentation reveals a **comprehensive mocking strategy** that replaces all graphics-related dependencies with stub implementations that satisfy the engine's API contract without performing actual rendering. This is essential because the validation tool only needs numerical battle outcomes (TTK measurements), not visual output.

The strategy involves:
- **PIXI.js mocks**: Stub classes for Container, Sprite, Text, Graphics with minimal implementations
- **Graphics mock**: RPG Maker MZ's Graphics object (initialize, render, frameCount)
- **Effekseer mock**: Critical WASM module mock to prevent initialization crashes
- **AudioManager mock**: Prevent audio loading/playback attempts
- **Canvas mock**: Using jest-canvas-mock library to handle Canvas API calls

This decision is documented extensively in the research paper (Section 4.2: "Estratégia de Mocking e Stubbing") and identified as one of the top technical priorities for the RUNTIME module.

---

## Why This Might Deserve an ADR

- **Impact**: **CRITICAL** - Without this mocking strategy, the RPG Maker MZ engine cannot initialize in JSDOM. Affects all battle simulation capabilities. The research document identifies Effekseer mock failure as a "fatal" blocker.

- **Trade-offs**:
  - **Complexity**: Requires maintaining stubs synchronized with RPG Maker MZ engine updates and VisuStella plugin expectations
  - **Fragility**: Any change to how engine/plugins access these APIs could break mocks
  - **Coverage**: Mocks must be comprehensive enough to prevent crashes but minimal enough to be maintainable
  - **Fidelity Risk**: If battle calculations somehow depend on rendering state (unlikely but possible), mocks could introduce divergence

- **Complexity**: HIGH - Involves understanding multiple third-party APIs (PIXI.js, Effekseer WASM, RPG Maker Graphics), reverse-engineering minimum viable interfaces, handling edge cases. The Effekseer mock is particularly complex due to WASM loading requirements.

- **Team Knowledge**: ANY developer touching RUNTIME must understand:
  - Which APIs are mocked and why
  - How to extend mocks when new RPG Maker features are needed
  - How to debug when mocks cause unexpected behavior
  - The diagnostic mode (`--diagnostic`) for mock troubleshooting

- **Future Implications**:
  - **Maintenance burden**: Every RPG Maker MZ or VisuStella update may require mock adjustments
  - **Documentation debt**: Mocks must be documented explaining what they do and don't support
  - **Testing strategy**: Requires regression tests validating mocks remain compatible
  - **Performance**: Mock implementation choices affect simulation speed

**Temporal Context**: Project in planning phase. Mocking strategy is documented across 3 major sections of technical research (4.2.1, 4.2.2, test handler priorities).

---

## Evidence Found in Codebase

### Key Files
**Note**: No implementation yet (planning phase). Evidence from documentation.

- [`/Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md`](../../../docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md) - Lines 179-206 (Section 4.2)
  - "O RMMZ utiliza bibliotecas pesadas como PIXI.js (renderização) e Effekseer (partículas). Estas bibliotecas tentam acessar o Canvas e WebGL, que não funcionam bem (ou de todo) no JSDOM."
  - Identifies Effekseer as "WASM loading blocker" - critical priority
  - Documents jest-canvas-mock as recommended solution

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 137-150 (Section 3.4)
  - Lists mocking requirements:
    - "Mock de PIXI.js (Container, Sprite stubs)"
    - "Mock de Graphics (initialize, render, frameCount)"
    - "Mock de Effekseer (initRuntime, update, release - WASM blocker)"
    - "Mock de AudioManager"
    - "Canvas mock (using jest-canvas-mock)"

- [`/Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-003-fidelidade-batalha-real-engine-headless.md`](../../../docs/adrs/documented/ADR-003-fidelidade-batalha-real-engine-headless.md) - Lines 22-27, 40-43, 52-55
  - Lists mocks as core implementation requirement
  - Identifies mock maintenance as negative consequence
  - Mitigation: "Isolamento de mocks em módulos separados para facilitar ajustes"

### Code Evidence
```javascript
// Planned implementation from research document (Section 4.2.1):
// tests/setup/rmmz_mocks.js
global.PIXI = {
    Container: class { addChild() {} removeChild() {} },
    Sprite: class { constructor() { this.anchor = {x:0, y:0}; } },
    // Stubs adicionais conforme necessário para evitar crash
};

global.Graphics = {
    initialize: () => {},
    render: () => {},
    frameCount: 0
};

// Section 4.2.2 identifies Effekseer WASM mock as critical:
// "É crítico mockar o objeto global effekseer para evitar que a
//  inicialização de batalha trave"
global.effekseer = {
    initRuntime: () => {},
    update: () => {},
    release: () => {}
};
```

### Impact Analysis
- Introduced: Planning phase (2026-01-04)
- Modified: Not yet implemented
- Scope: Estimated 15-20 files in RUNTIME module (per mapping.md)
- **Test Handler Priority Order** (from research):
  1. JSDOM initialization
  2. **PIXI Container/Sprite mocks** (Priority 2)
  3. **Graphics mock** (Priority 3)
  4. **Effekseer mock** (Priority 4 - labeled "WASM loading blocker")
  5. Synchronous database loading

### Alternatives (if observable)

From research document analysis:

**Alternative 1: Minimal mocks (reactive approach)**
- Start with empty stubs, add methods only when engine crashes
- Rejected implicitly: too fragile, would require constant debugging
- Research took proactive approach documenting all known requirements upfront

**Alternative 2: Use pre-existing RPG Maker test frameworks**
- No evidence of existing headless test frameworks for RPG Maker MZ found
- Community plugins focus on in-game unit testing, not external validation

**Alternative 3: Stub entire RPG Maker engine**
- Would defeat purpose of ADR-003 (run real engine for fidelity)
- Would require reimplementing battle logic, losing VisuStella compatibility

**Chosen Approach: Targeted, comprehensive mocking**
- Mock only graphics/audio (non-battle-affecting systems)
- Preserve all battle calculation logic (formulas, actions, states)
- Use community-proven libraries where possible (jest-canvas-mock)

---

## Questions to Address in ADR (if created)

- What is the minimum viable API surface for each mock (PIXI, Graphics, Effekseer)?
- How will mocks be tested to ensure they satisfy engine expectations?
- What is the strategy for handling future RPG Maker MZ updates that add new graphics API calls?
- How will the team identify which mocks are causing issues in diagnostic mode?
- Should mocks be maintained as separate npm packages for reusability?
- What documentation is required for each mock explaining its coverage and limitations?
- How will the team validate that mocks don't accidentally affect battle calculation fidelity?

---

## Related Potential ADRs
- [JSDOM Browser Emulation](./jsdom-browser-emulation-headless-runtime.md) - Parent infrastructure decision requiring this mocking
- [Diagnostic Mode for Headless Debugging](./diagnostic-mode-headless-debugging.md) - Observability for mock failures
- [Modular Mock Architecture](./modular-mock-architecture.md) - Implementation pattern for mock isolation (mentioned in ADR-003 mitigation)

---

## Additional Notes

**Critical Research Findings**:
- **Effekseer WASM blocker**: "Effekseer é carregado como um módulo WASM (effekseer.wasm). O JSDOM falhará ao tentar carregar binários WASM. É crítico mockar o objeto global effekseer para evitar que a inicialização de batalha trave."
- **Community pain points**: Research cites RPG Maker forums showing Effekseer loading failures are "comuns e fatais" (common and fatal)
- **Canvas complexity**: Research recommends jest-canvas-mock specifically to avoid "erros quando o RMMZ tenta criar elementos de Canvas contextuais"

**Mitigations Documented** (ADR-003):
1. Isolation of mocks in separate modules
2. Diagnostic mode (`--diagnostic`) for initialization debugging
3. Test suite validating headless initialization with VisuStella plugins

**Risk Assessment** (HLD Section 10.1):
- Priority: HIGH
- Probability: ALTA (High)
- Impact: BLOQUEIO (Blocking)
- Description: "Harness headless incompatível com plugins ou updates"

**Implementation Phase**: Phase 1 (Foundation), estimated 4-6 weeks, critical path

**External Dependencies**:
- jest-canvas-mock (npm package)
- JSDOM (via Jest testEnvironment)
- Understanding of PIXI.js API surface
- Understanding of RPG Maker MZ Graphics module
- Reverse-engineered knowledge of Effekseer WASM interface
