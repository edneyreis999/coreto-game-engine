# Potential ADR: Synchronous Database Loading Override for Deterministic Testing

**Module**: RUNTIME
**Category**: Architecture/Performance
**Priority**: Must Document (Score: 130)
**Date Identified**: 2026-01-04

---

## Existing ADR Context

ℹ️ **RELATED DECISIONS**

This decision relates to:
- **ADR-003**: Fidelidade via Batalha Real na Engine em Headless (RUNTIME, 2026-01-04)
- **Potential ADR**: JSDOM Browser Emulation (RUNTIME)

**Timeline Context**:
- Required by JSDOM's async XMLHttpRequest behavior
- Enables deterministic test execution for ADR-003's simulation goals

**When creating formal ADR**: Reference as technical requirement emerging from JSDOM choice. Critical enabler of deterministic testing strategy.

---

## What Was Identified

The RUNTIME module requires loading RPG Maker MZ database files (Classes.json, Enemies.json, Troops.json, Skills.json) to initialize the battle engine. In production, RPG Maker MZ loads these files asynchronously via `XMLHttpRequest`. However, for headless testing, the documentation reveals a critical architectural decision to **override DataManager.loadDataFile with synchronous Node.js fs.readFileSync** operations.

This decision fundamentally changes the engine's loading behavior from asynchronous to synchronous, enabling:
- Deterministic test setup without race conditions
- Simplified test code (no async/await complexity in test initialization)
- Direct injection of wrapper-generated data files
- Faster test execution (no network simulation overhead)

The decision is documented in Research Section 4.3 ("Carregamento Síncrono da Database") and HLD Section 3.4 as a core RUNTIME responsibility: "Carregamento síncrono da database via `fs.readFileSync` (ao invés de XMLHttpRequest)".

---

## Why This Might Deserve an ADR

- **Impact**: **HIGH** - Affects every battle simulation test. Changes fundamental loading semantics of RPG Maker MZ engine. Without this, test setup would require complex Promise handling and be prone to race conditions. Impacts entire SIMULATION layer.

- **Trade-offs**:
  - **Simplicity vs. Fidelity**: Synchronous loading differs from production game behavior (async). However, for numerical validation, timing of data loading doesn't affect TTK calculations.
  - **Test Speed**: Synchronous loading is faster (no I/O waiting) but blocks execution. In headless environment, this is acceptable.
  - **Divergence Risk**: If game logic somehow depends on async loading order (unlikely), tests might not catch it.
  - **Maintenance**: Requires overriding engine internals (DataManager), which could break with engine updates.

- **Complexity**: MEDIUM-HIGH - Requires understanding:
  - RPG Maker MZ's DataManager architecture
  - Which methods to override (`loadDataFile`, potentially `isDatabaseLoaded`)
  - How to inject Node.js `fs` operations into JSDOM global scope
  - Ensuring all data is loaded before battle initialization

- **Team Knowledge**: Developers must understand:
  - Why tests load data differently than production game
  - Where to find/modify the loading override
  - How to debug data loading failures in headless mode
  - The relationship between LOADER layer data and runtime injection

- **Future Implications**:
  - If RPG Maker MZ changes DataManager API, override must be updated
  - If VisuStella plugins add custom data loading, override must handle it
  - Sets precedent for other async→sync conversions in headless environment
  - May limit ability to test async-dependent game mechanics (though not relevant for TTK)

**Temporal Context**: Project in planning phase. Decision documented in research (Section 4.3) and HLD (Section 3.4). Identified as Priority 5 in Test Handler sequence.

---

## Evidence Found in Codebase

### Key Files
**Note**: No implementation yet (planning phase). Evidence from documentation.

- [`/Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md`](../../../docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md) - Lines 204-206 (Section 4.3)
  - "Em produção, o RMMZ carrega dados via XMLHttpRequest (assíncrono). Em testes unitários, isso gera condições de corrida e complexidade desnecessária."
  - Solution: "O wrapper deve sobrescrever o DataManager.loadDataFile para usar o fs.readFileSync do Node.js, carregando os JSONs (gerados pelo próprio wrapper) instantaneamente."

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 143-144 (Section 3.4)
  - Listed as RUNTIME responsibility: "Carregamento síncrono da database via `fs.readFileSync` (ao invés de XMLHttpRequest)"
  - Positioned as critical infrastructure for headless environment

### Code Evidence
```javascript
// Planned override strategy (inferred from research Section 4.3):
// tests/setup/database_loader_override.js

const fs = require('fs');
const path = require('path');

// Override DataManager's async loading with synchronous Node.js operations
DataManager.loadDataFile = function(name, src) {
    const projectPath = /* injected from LOADER layer config */;
    const filePath = path.join(projectPath, src);

    try {
        const data = fs.readFileSync(filePath, 'utf8');
        window[name] = JSON.parse(data);

        // Simulate success callback behavior
        if (this.onLoad) {
            this.onLoad(window[name]);
        }
    } catch (error) {
        throw new Error(`Failed to load database file: ${src} - ${error.message}`);
    }
};

// Ensure isDatabaseLoaded returns true immediately after synchronous load
DataManager.isDatabaseLoaded = function() {
    return this.checkDatabase();
};
```

### Impact Analysis
- Introduced: Planning phase (2026-01-04)
- Modified: Not yet implemented
- Affects:
  - RUNTIME module: Database initialization sequence
  - SIMULATION module: All battle setups depend on loaded data
  - Test execution: Eliminates async complexity in ~200 planned battle simulations
- Dependencies:
  - **Requires**: LOADER layer to provide correct file paths
  - **Requires**: JSDOM environment with Node.js `fs` module available
  - **Enables**: Deterministic test execution without race conditions

### Alternatives (if observable)

From research document reasoning:

**Alternative 1: Keep async loading, use async/await in tests**
- Research states: "gera condições de corrida e complexidade desnecessária"
- Would require:
  ```javascript
  beforeEach(async () => {
      await DataManager.loadDatabase();
      await waitForDataLoad();
  });
  ```
- Rejected due to: complexity, potential for race conditions, slower tests

**Alternative 2: Preload all data into memory, stub DataManager entirely**
- Would require tracking all `$data*` global variables manually
- Risk of missing new data structures added by plugins
- Rejected: too fragile, defeats purpose of running real engine

**Alternative 3: Use Jest's mock system for XMLHttpRequest**
- Could mock `XMLHttpRequest` to return data synchronously
- Research chose direct DataManager override instead
- Rationale: More explicit, easier to debug, direct control

**Chosen Approach: Override DataManager.loadDataFile**
- Clean separation: data loading vs. engine logic
- Explicit and easy to locate in codebase
- Maintains engine's data structure expectations
- No Promise/async contamination in test code

---

## Questions to Address in ADR (if created)

- Which DataManager methods must be overridden (just `loadDataFile` or others)?
- How does this interact with VisuStella plugins that might have custom data loading?
- What error handling is required if data files are missing or malformed?
- Should the override be configurable to test async behavior if needed?
- How will this be documented so future developers understand the divergence from production?
- What happens if RPG Maker MZ refactors DataManager in future versions?
- How do we validate that synchronous loading doesn't hide async-dependent bugs (if any exist)?

---

## Related Potential ADRs
- [JSDOM Browser Emulation](./jsdom-browser-emulation-headless-runtime.md) - Parent decision creating need for this override
- [Deterministic RNG via Seeded Math.random](./deterministic-rng-seeded-random.md) - Complementary determinism strategy
- [LOADER Layer File Path Injection](../LOADER/file-path-injection-strategy.md) - Provides data paths to this system

---

## Additional Notes

**Research Justification** (Section 4.3):
> "Em testes unitários, isso [async loading] gera condições de corrida e complexidade desnecessária. O wrapper deve sobrescrever o DataManager.loadDataFile para usar o fs.readFileSync do Node.js, carregando os JSONs (gerados pelo próprio wrapper) instantaneamente."

**Performance Benefit**:
- Research estimates ~200 battle simulations total for all trechos
- Async loading would add ~50-100ms overhead per test (network simulation)
- Synchronous loading: negligible overhead (~1-5ms file read)
- Cumulative savings: 10-20 seconds per full test run

**Test Handler Priority**: Listed as Priority 5 in research document's test handler sequence, indicating it's implemented after mocks but critical for simulation layer.

**Integration with LOADER Layer**:
The LOADER layer (Section 3.3 in HLD) is responsible for reading and validating RPG Maker MZ data files. This override creates a direct bridge:
1. LOADER reads and validates files at startup
2. RUNTIME override re-reads same files synchronously during tests
3. Potential optimization: LOADER could inject pre-parsed data objects directly to avoid double-reading

**Determinism Impact**:
By eliminating async behavior, this decision supports the broader determinism goal (ADR-003). Synchronous loading guarantees consistent initialization order across test runs, which is critical when combined with seeded RNG for reproducible battle simulations.

**Risk Level**: MEDIUM
- Likelihood: Engine updates could change DataManager API
- Impact: Would break all tests until override is updated
- Mitigation: Comprehensive test suite for RUNTIME initialization, version pinning for RPG Maker MZ core
