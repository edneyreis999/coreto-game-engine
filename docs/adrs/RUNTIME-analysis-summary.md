# RUNTIME Module - ADR Identification Summary

**Module**: RUNTIME (Headless Runtime Environment)
**Analysis Date**: 2026-01-04
**Analyst**: ADR Identification System (Phase 2)

---

## Executive Summary

**Potential ADRs Identified**: 5 total
- **High Priority (must-document/)**: 3 ADRs
- **Medium Priority (consider/)**: 2 ADRs

**Module Scope**: Large (estimated 15-20 files when implemented)
**Current State**: Documentation/Planning phase - no implementation code exists yet
**Analysis Basis**: HLD Section 3.4, Research Document (35KB, 41 sources), ADR-003

---

## Key Findings

The RUNTIME module contains **critical architectural decisions** that form the foundation of the entire headless testing strategy. All identified decisions scored **≥85 points** (above medium priority threshold), with three reaching **maximum or near-maximum scores (130-150)**.

### Why RUNTIME Has High ADR Density

1. **Greenfield Technical Complexity**: Creating a headless Node.js environment that runs browser-based RPG Maker MZ engine
2. **Multiple Technology Choices**: JSDOM, mocking libraries, loading strategies
3. **High Risk, High Impact**: HLD identifies headless runtime as highest project risk (ALTA probability, BLOQUEIO impact)
4. **Foundational Dependencies**: All downstream modules (SIMULATION, REPORTER) depend on RUNTIME decisions

---

## High Priority ADRs (must-document/)

### 1. JSDOM for Browser Environment Emulation (Score: 150/150)

**Category**: Infrastructure/Architecture (Step 0: Category 1 - Infrastructure Service)

**Decision**: Use JSDOM to emulate browser environment in Node.js for running RPG Maker MZ engine headlessly.

**Why Maximum Score**:
- **Scope+Impact (25/25)**: Affects entire RUNTIME module + all downstream modules
- **Cost to Change (25/25)**: 6+ months or infeasible (complete architecture replacement)
- **Team Knowledge (25/25)**: Everyone must understand for any RUNTIME work
- **Base Score (75)**: Step 0 automatic qualification (foundational infrastructure)

**Evidence**:
- HLD Section 3.4: "Setup do ambiente JSDOM (simulação de browser)"
- Research Section 4.1: Detailed technical justification with alternative analysis
- ADR-003: References JSDOM as enabling technology

**Key Relationships**:
- **Enables**: All mocking strategies (PIXI, Graphics, Effekseer)
- **Related to**: ADR-003 (Fidelidade via Real Battle Engine)
- **Requires**: jest-canvas-mock, custom mock infrastructure

**File**: `potential-adrs/must-document/RUNTIME/jsdom-browser-emulation-headless-runtime.md`

---

### 2. Comprehensive Mocking Strategy for Graphics Dependencies (Score: 145/150)

**Category**: Architecture/Testing Strategy

**Decision**: Mock PIXI.js, Effekseer, Graphics, Canvas, and AudioManager with comprehensive stub implementations to enable headless execution.

**Why Critical**:
- **Scope+Impact (25/25)**: Without mocks, engine crashes on initialization
- **Cost to Change (20/25)**: 2-6 months (mocks spread across RUNTIME, fragile)
- **Team Knowledge (25/25)**: Critical for all RUNTIME debugging
- **Base Score (75)**: Step 0 infrastructure category

**Evidence**:
- Research Section 4.2: "Estratégia de Mocking e Stubbing" (dedicated section)
- **Effekseer identified as "WASM loading blocker"** - critical priority
- Test Handler Priority: PIXI (#2), Graphics (#3), Effekseer (#4)
- ADR-003 Mitigation: "Isolamento de mocks em módulos separados"

**Key Risks**:
- **HLD Section 10.1**: High probability of incompatibility with plugin updates
- Maintenance burden: mocks must track engine/plugin API changes
- Coverage gaps: WebGL APIs may not be fully covered

**File**: `potential-adrs/must-document/RUNTIME/mocking-strategy-graphics-dependencies.md`

---

### 3. Synchronous Database Loading Override (Score: 130/150)

**Category**: Architecture/Performance

**Decision**: Override RPG Maker MZ's async `DataManager.loadDataFile` with synchronous `fs.readFileSync` to enable deterministic test setup.

**Why High Priority**:
- **Scope+Impact (25/25)**: Affects all battle simulations, eliminates race conditions
- **Cost to Change (20/25)**: 2-6 months (core initialization dependency)
- **Team Knowledge (10/25)**: Important for RUNTIME/SIMULATION developers
- **Base Score (75)**: Architectural pattern choice

**Evidence**:
- Research Section 4.3: "Carregamento Síncrono da Database"
  - Justification: "Em testes unitários, isso [async] gera condições de corrida e complexidade desnecessária"
- HLD Section 3.4: Listed as core RUNTIME responsibility
- Test Handler Priority: #5 (after mocks, before simulation)

**Benefits**:
- Eliminates async/await complexity in tests (~200 battle simulations)
- Faster execution: sync file read (~1-5ms) vs. XMLHttpRequest simulation (~50-100ms)
- Supports determinism goal (ADR-003)

**File**: `potential-adrs/must-document/RUNTIME/synchronous-database-loading-override.md`

---

## Medium Priority ADRs (consider/)

### 4. jest-canvas-mock Library Choice (Score: 85/150)

**Category**: Technology/Tooling

**Decision**: Use jest-canvas-mock npm package for Canvas API stubbing instead of custom implementation.

**Why Consider**:
- **Scope+Impact (15/25)**: Affects Canvas-related APIs but is component of broader mocking
- **Cost to Change (10/25)**: 1-2 weeks (swapping npm packages relatively easy)
- **Team Knowledge (10/25)**: Need to understand limitations but not complex

**Consolidation Opportunity**: Could be merged into "Mocking Strategy" ADR as implementation detail.

**Evidence**:
- Research Section 4.2.1: "altamente recomendado" (highly recommended)
- Community validation: GitHub repo + Stack Overflow references (source 33)

**File**: `potential-adrs/consider/RUNTIME/jest-canvas-mock-library-choice.md`

---

### 5. Diagnostic Mode for Troubleshooting (Score: 90/150)

**Category**: Observability/Developer Experience

**Decision**: Implement `--diagnostic` CLI flag for verbose logging of headless initialization steps to aid debugging.

**Why Consider (near Must Document)**:
- **Scope+Impact (15/25)**: Developer experience, not runtime architecture
- **Cost to Change (15/25)**: 2-8 weeks (instrumentation spreads across RUNTIME)
- **Team Knowledge (10/25)**: All RUNTIME developers should use it

**Strategic Value**: Given high risk of mock fragility (HLD 10.1), diagnostic mode is critical risk mitigation.

**Evidence**:
- ADR-003 Line 54: Listed as third mitigation strategy
- HLD Section 3.1: CLI arguments include `--diagnostic`
- Positioned as essential developer tool, not optional

**File**: `potential-adrs/consider/RUNTIME/diagnostic-mode-for-mock-troubleshooting.md`

---

## Decisions Analyzed but Discarded

### Jest Testing Framework
- **Score**: N/A (not scored)
- **Reason**: Testing framework, not architectural decision (tooling choice)
- **Already Documented**: Mentioned in HLD/Research but no ADR needed

### Node.js Runtime
- **Score**: N/A
- **Reason**: Project-wide technology choice, not RUNTIME-specific
- **Context**: Covered by overall project architecture

---

## Analysis Methodology Applied

### Step 0: Positive Identification
- **JSDOM**: Category 1 (Infrastructure Service) ✓ → Auto-qualify with base score 75
- **Mocking Strategy**: Category 1 (Infrastructure) ✓ → Auto-qualify with base score 75
- **Database Loading**: Not Category 1-4, proceed to Red Flags

### Step 1: Red Flags (for non-Step-0 decisions)
- **Database Loading Override**: Passed all Red Flags
  - NOT domain modeling ✓
  - NOT business workflow ✓
  - NOT trivial config ✓
  - NOT trivial implementation (affects core initialization) ✓
  - NOT overly granular ✓

### Step 2: Scoring (3 E's Rule Applied)
All decisions passed the **3 E's**:
1. **Estrutural (Structural)**: Affects how system is built/integrated ✓
2. **Evidente (Evident)**: Other engineers need to understand "why" ✓
3. **Estável (Stable)**: Will last months/years, not weeks ✓

### Git History Integration
**Note**: Project in planning phase (no implementation), therefore:
- No git history available for temporal enrichment
- Evidence extracted from documentation timestamps
- Cross-referenced with HLD phases and research document structure

---

## Relationships to Existing ADRs

### Direct Dependencies
- **ADR-003**: Fidelidade via Batalha Real na Engine em Headless
  - All RUNTIME decisions are implementation details of this parent ADR
  - JSDOM decision enables ADR-003's headless execution goal
  - Mocking strategy addresses ADR-003's identified risks

### Complementary Decisions
- **ADR-001**: Wrapper Read-Only Pattern
  - RUNTIME respects read-only constraint
  - Database loading override maintains read-only approach (fs.readFileSync)

---

## Timeline and Context

### Documentation Dates
- **Mapping.md**: 2026-01-04 (established RUNTIME module scope)
- **HLD Section 3.4**: 2026-01-04 (defined RUNTIME architecture)
- **Research Document**: 2026-01-04 (35KB technical analysis, 41 sources)
- **ADR-003**: 2026-01-04 (established headless execution decision)

### Implementation Roadmap Context
- **Phase 1 (Foundation)**: Weeks 4-6 of 4-6 week phase
  - Step 4: "Headless Runtime (JSDOM, mocks, engine loading)"
  - **Critical Path**: Project cannot proceed to Phase 2 (Simulation) without RUNTIME

### Risk Context (from HLD Section 10.1)
**Risk ID**: Harness headless incompatível com plugins ou updates
- **Probability**: ALTA (High)
- **Impact**: BLOQUEIO (Blocking)
- **Mitigation**: Isolamento de mocks, modo diagnóstico, suite de testes

This risk assessment validates **why RUNTIME has highest ADR density**: it's the highest-risk, highest-impact module in the system.

---

## Recommendations

### Immediate Actions
1. **Create formal ADRs** for all 3 high-priority decisions before Phase 1 implementation
2. **Consider consolidating** jest-canvas-mock into Mocking Strategy ADR (reduce to 4 total ADRs)
3. **Elevate Diagnostic Mode** to must-document given risk mitigation importance

### Implementation Guidance
1. **Follow documented priorities**: JSDOM → PIXI → Graphics → Effekseer → Database Loading
2. **Implement diagnostic mode early**: Critical for debugging subsequent steps
3. **Create mock isolation modules**: As specified in ADR-003 mitigations
4. **Document WebGL gaps**: Validate jest-canvas-mock WebGL support during implementation

### Future Re-evaluation
- **After Phase 1** (4-6 weeks): Capture any emergent patterns from actual implementation
- **After VisuStella integration**: Document any plugin-specific mock requirements
- **If mocks fail**: Consider escalating to Puppeteer/Playwright alternative (major architecture change)

---

## Files Generated

### High Priority (must-document/)
```
docs/adrs/potential-adrs/must-document/RUNTIME/
├── jsdom-browser-emulation-headless-runtime.md (7.5KB)
├── mocking-strategy-graphics-dependencies.md (10KB)
└── synchronous-database-loading-override.md (10KB)
```

### Medium Priority (consider/)
```
docs/adrs/potential-adrs/consider/RUNTIME/
├── jest-canvas-mock-library-choice.md (8.6KB)
└── diagnostic-mode-for-mock-troubleshooting.md (9.8KB)
```

### Total Documentation
- **5 potential ADR files**: ~46KB of detailed analysis
- **Average detail level**: 9KB per ADR (comprehensive evidence and context)

---

## Next Steps

To generate formal MADR-formatted ADRs from these potential ADRs:

```bash
# Generate all RUNTIME ADRs
/adr-generate RUNTIME

# Or generate specific high-priority ADRs
/adr-generate RUNTIME --filter must-document
```

To continue Phase 2 identification for remaining modules:

```bash
# Suggested next: SIMULATION module (likely high ADR density)
/adr-identify SIMULATION
```

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| **Potential ADRs Identified** | 5 |
| **Must Document (≥100)** | 3 (60%) |
| **Consider (75-99)** | 2 (40%) |
| **Discarded (<75)** | 0 (0%) |
| **Average Score** | 120/150 |
| **Max Score** | 150/150 (JSDOM) |
| **Min Score** | 85/150 (jest-canvas-mock) |
| **Total Documentation** | ~46KB |

**Analysis Quality**: Comprehensive - all decisions have detailed evidence, alternatives analysis, and relationship mapping despite greenfield status.

**Readiness for Phase 3**: HIGH - Sufficient documentation exists to create formal ADRs with minimal additional research.
