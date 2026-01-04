# Potential ADR: jest-canvas-mock Library for Canvas API Stubbing

**Module**: RUNTIME
**Category**: Technology/Tooling
**Priority**: Consider (Score: 85)
**Date Identified**: 2026-01-04

---

## Existing ADR Context

ℹ️ **RELATED DECISIONS**

This decision relates to:
- **Potential ADR**: Mocking Strategy for Graphics Dependencies (RUNTIME)
- **Potential ADR**: JSDOM Browser Emulation (RUNTIME)

**Timeline Context**:
- Implementation detail of broader mocking strategy
- Addresses specific Canvas API gap in JSDOM

**When creating formal ADR**: Could be consolidated into "Mocking Strategy for Graphics Dependencies" as implementation detail, or stand alone if canvas handling requires special considerations.

---

## What Was Identified

The RUNTIME module's JSDOM environment lacks native Canvas API support. RPG Maker MZ and PIXI.js heavily use Canvas for rendering contexts (`getContext('2d')`, `getContext('webgl')`). The documentation reveals a specific technology choice to use the **jest-canvas-mock** npm package to provide Canvas API stubs.

This is a targeted, surgical decision within the broader mocking strategy: rather than manually implementing Canvas API stubs (dozens of methods), the team chose to leverage a community-proven library that handles the complexity.

From research document:
- Recommended in Section 4.2.1: "O uso de jest-canvas-mock é altamente recomendado para evitar erros quando o RMMZ tenta criar elementos de Canvas contextuais."
- Referenced in HLD Section 3.4: "Canvas mock (using jest-canvas-mock)"
- Cross-referenced with Stack Overflow discussions on Canvas testing

---

## Why This Might Deserve an ADR

- **Impact**: MEDIUM - Affects Canvas-related API calls in PIXI.js and RPG Maker Graphics. Without it, engine initialization crashes when attempting Canvas context creation. Impacts RUNTIME module initialization, but is one component of larger mocking strategy.

- **Trade-offs**:
  - **Convenience vs. Control**: Using library is faster than custom implementation, but adds external dependency
  - **Coverage**: jest-canvas-mock covers common Canvas 2D APIs but may not support WebGL APIs (potential gap)
  - **Maintenance**: Dependency on third-party package (risk if abandoned)
  - **Debugging**: Harder to debug issues inside black-box library vs. custom stubs

- **Complexity**: LOW-MEDIUM - Using the library is simple (just import in setup), but team must understand:
  - What Canvas APIs are mocked vs. not mocked
  - How to extend if RPG Maker uses unsupported Canvas features
  - When to debug library vs. application code

- **Team Knowledge**: Developers need to know:
  - That Canvas APIs are mocked (not real)
  - Limitations of jest-canvas-mock
  - How to add custom Canvas stubs if needed beyond library's scope

- **Future Implications**:
  - Locked into jest-canvas-mock's update cycle
  - If library is abandoned, must fork or replace
  - May need supplemental mocks for WebGL if RPG Maker MZ evolves
  - Precedent for using community libraries vs. custom solutions

**Temporal Context**: Planning phase. Decision mentioned in research (4.2.1) with recommendation strength ("altamente recomendado"). Stack Overflow reference (source 33) validates community practice.

---

## Evidence Found in Codebase

### Key Files
**Note**: No implementation yet (planning phase). Evidence from documentation.

- [`/Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md`](../../../docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md) - Lines 184-198 (Section 4.2.1)
  - "O uso de jest-canvas-mock é altamente recomendado para evitar erros quando o RMMZ tenta criar elementos de Canvas contextuais."
  - Cites GitHub source: https://github.com/hustcc/jest-canvas-mock
  - Cites Stack Overflow validation: Source 33

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Line 149 (Section 3.4)
  - Listed as technology: "jest-canvas-mock"
  - Context: Part of RUNTIME mock infrastructure

### Code Evidence
```javascript
// Planned setup (inferred from research + jest-canvas-mock docs):
// tests/setup/rmmz_mocks.js or jest.config.js setupFiles

// Option 1: Global setup
import 'jest-canvas-mock';

// Option 2: Explicit require in setup file
require('jest-canvas-mock');

// This automatically mocks:
// - HTMLCanvasElement.prototype.getContext()
// - CanvasRenderingContext2D methods (fillRect, drawImage, etc.)
// - Canvas measurement methods (measureText, etc.)

// Expected usage in PIXI/Graphics initialization:
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d'); // Returns mock context
ctx.fillRect(0, 0, 100, 100); // No-op, doesn't crash
```

### Impact Analysis
- Introduced: Planning phase (2026-01-04)
- Modified: Not yet implemented
- Affects:
  - PIXI.js initialization (Canvas creation for sprites)
  - RPG Maker Graphics module (Canvas context operations)
  - Any plugin code that uses Canvas APIs
- Dependencies:
  - **External**: jest-canvas-mock npm package
  - **Requires**: Jest testing framework
  - **Enables**: Safe Canvas API calls in headless environment

### Alternatives (if observable)

**Alternative 1: Manual Canvas API mocks**
```javascript
global.HTMLCanvasElement.prototype.getContext = function(contextType) {
    if (contextType === '2d') {
        return {
            fillRect: () => {},
            drawImage: () => {},
            measureText: () => ({ width: 0 }),
            // ... 50+ more methods
        };
    }
    return null;
};
```
- Rejected: Tedious, error-prone, incomplete coverage
- Research recommendation indicates community library is superior

**Alternative 2: canvas npm package (node-canvas)**
- Provides actual Canvas implementation in Node.js
- Rejected: Too heavy (requires native dependencies, C++ compilation)
- Overkill for testing that doesn't need real rendering

**Alternative 3: No Canvas mocking, rely on JSDOM's implementation**
- JSDOM has minimal Canvas support
- Research indicates this causes crashes: "evitar erros quando o RMMZ tenta criar elementos de Canvas contextuais"
- Not viable

**Chosen Approach: jest-canvas-mock**
- Proven in community (GitHub repo, Stack Overflow references)
- Lightweight (no native dependencies)
- Comprehensive Canvas 2D API coverage
- Actively maintained (as of research date)

---

## Questions to Address in ADR (if created)

- Does jest-canvas-mock support WebGL contexts (getContext('webgl'))? If not, how will that gap be filled?
- What is the fallback plan if jest-canvas-mock is abandoned or incompatible with future Jest versions?
- Should canvas mocking be abstracted behind an interface to enable swapping libraries?
- How will the team identify if RPG Maker MZ uses Canvas features not covered by jest-canvas-mock?
- Is there a performance difference between jest-canvas-mock and custom minimal stubs?

---

## Related Potential ADRs
- [Mocking Strategy for Graphics Dependencies](../must-document/RUNTIME/mocking-strategy-graphics-dependencies.md) - Parent decision
- [JSDOM Browser Emulation](../must-document/RUNTIME/jsdom-browser-emulation-headless-runtime.md) - Creates Canvas API gap this library fills

---

## Additional Notes

**Library Details** (from research sources):
- **GitHub**: https://github.com/hustcc/jest-canvas-mock
- **Purpose**: Mocks Canvas API for Jest tests
- **Coverage**: Primarily Canvas 2D API, may have limited WebGL support
- **Community Validation**: Referenced in Stack Overflow (source 33) for similar use cases

**Recommendation Strength**: Research states "altamente recomendado" (highly recommended), indicating strong preference based on analysis of alternatives.

**Potential Consolidation**: This decision could be merged into "Mocking Strategy for Graphics Dependencies" ADR as an implementation detail. Stand-alone ADR only justified if:
1. Canvas mocking requires special handling beyond other mocks
2. Team wants to document evaluation of canvas mocking libraries separately
3. Canvas API coverage becomes a recurring maintenance concern

**Score Justification** (85 points):
- Scope+Impact: 15 (affects RUNTIME initialization but is one of several mocks)
- Cost to Change: 10 (swapping npm packages is relatively easy)
- Team Knowledge: 10 (need to understand library's limitations but not complex)
- **Total: 85 (Consider category)**

**WebGL Gap Risk**: Research doesn't explicitly confirm WebGL support. If RPG Maker MZ or VisuStella plugins use WebGL contexts, supplemental mocks may be needed. This should be validated during implementation.
