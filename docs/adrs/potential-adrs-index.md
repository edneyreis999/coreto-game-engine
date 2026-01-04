# Potential ADRs Index

**Last Updated:** 2026-01-04

---

## Analysis Progress

### Analyzed Modules
- **CONFIG**: Configuration and Validation Layer - 2026-01-04 - **1 high, 1 medium ADRs**
- **EXPORTER**: AI Context Exporter - 2026-01-04 - **0 potential ADRs identified**
- **LOADER**: RPG Maker MZ Data Loader - 2026-01-04 - **0 potential ADRs identified**
- **CLI**: Command-line Interface Layer - 2026-01-04 - **1 high priority ADR**
- **DOCS**: Documentation Module - 2026-01-04 - **2 high, 2 medium ADRs**

### Analyzed Modules (continued)
- **RUNTIME**: Headless Runtime Environment - 2026-01-04 - **3 high, 2 medium ADRs**
- **REPORTER**: Report Generation Layer - 2026-01-04 - **3 high, 1 medium ADRs**
- **SIMULATION**: Battle Simulation Engine - 2026-01-04 - **4 high, 1 medium ADRs**

### Pending Analysis

(All modules analyzed)

---

## High Priority ADRs (must-document/)

### Module: CLI

| Title | Category | Score | File |
|-------|----------|-------|------|
| Commander.js vs Yargs for CLI Argument Parsing | Technology/Architecture | 120/150 | [commander-vs-yargs-cli-framework.md](./potential-adrs/must-document/CLI/commander-vs-yargs-cli-framework.md) |


### Module: CONFIG
| Title | Category | Score | File |
|-------|----------|-------|------|
| Schema Validation Library for Configuration (Zod vs Joi) | Technology | 145 | [schema-validation-library-zod-joi.md](./potential-adrs/must-document/CONFIG/schema-validation-library-zod-joi.md) |

### Module: DOCS
| Title | Category | Score | File |
|-------|----------|-------|------|
| Markdown as Primary Documentation Format | Architecture/Technology | 120 | [markdown-as-primary-documentation-format.md](./potential-adrs/must-document/DOCS/markdown-as-primary-documentation-format.md) |
| Structured Documentation Hierarchy (PRD → HLD → Research) | Architecture | 115 | [structured-documentation-hierarchy-prd-hld-research.md](./potential-adrs/must-document/DOCS/structured-documentation-hierarchy-prd-hld-research.md) |

| Title | Category | Score | File |
|-------|----------|-------|------|
| JSON File-Based Report Output Format | Architecture | 125/150 | [json-report-output-format.md](./potential-adrs/must-document/REPORTER/json-report-output-format.md) |
| Typed Warning System with Severity Levels | Architecture/Observability | 120/150 | [typed-warning-system-with-severity.md](./potential-adrs/must-document/REPORTER/typed-warning-system-with-severity.md) |
| Statistical Aggregation Metrics (Average, P50, P95, Max) | Architecture | 115/150 | [statistical-aggregation-metrics.md](./potential-adrs/must-document/REPORTER/statistical-aggregation-metrics.md) |

### Module: SIMULATION

| Title | Category | Score | File |
|-------|----------|-------|------|
| Seed-Controlled Determinism for Battle Simulation RNG | Architecture | 150 | [seed-controlled-determinism-rng.md](./potential-adrs/must-document/SIMULATION/seed-controlled-determinism-rng.md) |
| Skill Selection Strategy - Damage Per Action Maximization | Architecture | 145 | [skill-selection-strategy-damage-per-action.md](./potential-adrs/must-document/SIMULATION/skill-selection-strategy-damage-per-action.md) |
| TTK Measurement with Dual Metrics (Turns and Actions) | Architecture | 135 | [ttk-measurement-dual-metrics.md](./potential-adrs/must-document/SIMULATION/ttk-measurement-dual-metrics.md) |
| Battle Termination Conditions with Timeout Safety | Architecture/Performance | 130 | [battle-termination-conditions-timeout.md](./potential-adrs/must-document/SIMULATION/battle-termination-conditions-timeout.md) |

---

## Medium Priority ADRs (consider/)

### Module: CONFIG
| Title | Category | Score | File |
|-------|----------|-------|------|
| JSON-Based Configuration File Format | Architecture | 85 | [json-based-configuration-format.md](./potential-adrs/consider/CONFIG/json-based-configuration-format.md) |

### Module: DOCS
| Title | Category | Score | File |
|-------|----------|-------|------|
| Documentation-Before-Implementation (Greenfield Approach) | Architecture | 90 | [documentation-before-implementation-greenfield-approach.md](./potential-adrs/consider/DOCS/documentation-before-implementation-greenfield-approach.md) |
| MADR Format for Architecture Decision Records | Architecture | 85 | [madr-format-for-architecture-decision-records.md](./potential-adrs/consider/DOCS/madr-format-for-architecture-decision-records.md) |

| Title | Category | Score | File |
|-------|----------|-------|------|
| Synchronous File Write Strategy for Report Output | Performance/Architecture | 85/150 | [synchronous-file-write-strategy.md](./potential-adrs/consider/REPORTER/synchronous-file-write-strategy.md) |

### Module: SIMULATION

| Title | Category | Score | File |
|-------|----------|-------|------|
| Party Skill Derivation from Level-Based Learnings (MVP v1) | Architecture | 90 | [party-skill-derivation-level-based.md](./potential-adrs/consider/SIMULATION/party-skill-derivation-level-based.md) |

**Note**: This medium-priority item may be a consolidation candidate for existing ADR-002. Review recommended before generating formal ADR.

---

## Modules with No ADRs

### LOADER: RPG Maker MZ Data Loader

**Analysis Date:** 2026-01-04

**Summary:** No potential ADRs identified. LOADER module's architectural decisions are well-covered by existing documented ADRs.

**Analysis Notes:**
- **Module Scope:** Medium (8-12 files estimated)
- **Primary Function:** Validate RPG Maker MZ project structure and load game data JSON files
- **Decisions Analyzed:**
  1. **Synchronous File Loading (fs.readFileSync)** - Already documented in ADR-003 (Fidelidade via Real Battle Engine)
  2. **Project Structure Validation Strategy** - Score: 55/75 (implementation detail)
  3. **Fail-Fast vs Graceful Degradation for Missing IDs** - Score: 70/75 (just below threshold)

**Key Findings:**
- LOADER's architectural decisions are covered by existing ADRs:
  - **ADR-001**: Wrapper Read-Only Pattern (defines read-only file access with fs.readFileSync)
  - **ADR-003**: Fidelidade via Real Battle Engine (includes synchronous database loading strategy)
  - **ADR-005**: ID-Based References (defines validation approach for troopIds, enemyIds, etc.)
- Remaining decisions scored below 75-point threshold and are sufficiently documented in HLD
- As greenfield project (no implementation yet), patterns may evolve during Phase 1 development

**Recommendations:**
- Follow existing ADR-001 (read-only pattern) and ADR-005 (ID validation) during implementation
- Document validation and error handling patterns in code comments
- Re-evaluate after Phase 1 implementation (Foundation: 4-6 weeks) to capture emergent patterns
- If error handling becomes more complex, consider consolidating into "Data Integrity Strategy" ADR

---

### EXPORTER: AI Context Exporter

**Analysis Date:** 2026-01-04

**Summary:** No potential ADRs identified. The EXPORTER module is a utility layer with straightforward implementation patterns.

**Analysis Notes:**
- **Module Scope:** Small (3-5 files estimated)
- **Primary Function:** Split large RPG Maker MZ JSON files into entity-per-file structure for AI tool consumption
- **Key Decision Analyzed:** "Entity-per-file JSON Splitting Strategy"
  - **Score:** 35/150 (below 75-point threshold)
  - **Reasoning:**
    - Low scope impact (primarily EXPORTER module)
    - Low cost to change (1-2 weeks)
    - Minimal team knowledge requirement (occasionally relevant)
    - Straightforward implementation detail rather than architectural decision

**Recommendations:**
- Implement using standard file I/O patterns
- Follow existing Node.js conventions for directory organization
- Document in code comments or README, not as formal ADR
- Consider code review for implementation quality, but no ADR needed

---

## Summary

- **High Priority ADRs:** 11
- **Medium Priority ADRs:** 5
- **Modules Analyzed:** 7 of 7 (All complete)
- **Modules with No ADRs:** 2 (LOADER, EXPORTER)
- **Total Potential ADRs:** 16
- **Existing Documented ADRs:** 6 (ADR-001 through ADR-006)

---

## Analysis Methodology

This index follows the ADR identification framework:
1. **Step 0:** Positive identification of structural decisions (Infrastructure, Framework, ORM, API)
2. **Step 1:** Red Flag filtering (Domain Modeling, Business Workflow, Config Details, Trivial Implementation, Overly Granular)
3. **Step 2:** Scoring across 3 dimensions (Scope+Impact, Cost to Change, Team Knowledge)
4. **3 E's Rule:** Estrutural (Structural), Evidente (Evident), Estável (Stable)

**Thresholds:**
- ≥100 points → must-document/ (HIGH PRIORITY)
- 75-99 points → consider/ (MEDIUM PRIORITY)
- <75 points → DISCARD

---

## Next Steps

**Phase 2 Complete** - All modules analyzed.

**Phase 3 - Generate Formal ADRs:**
Generate formal MADR-formatted ADRs from potential ADRs:

```bash
# Generate all potential ADRs
/adr-generate

# Or generate specific modules
/adr-generate SIMULATION
/adr-generate RUNTIME SIMULATION REPORTER
```

**Recommended Priority**:
1. SIMULATION module (4 high-priority ADRs) - Core validation logic
2. RUNTIME module (3 high-priority ADRs) - Headless environment foundation
3. REPORTER module (3 high-priority ADRs) - Output and observability

### Module: RUNTIME
| Title | Category | Score | File |
|-------|----------|-------|------|
| JSDOM for Browser Environment Emulation in Headless Runtime | Infrastructure/Architecture | 150 | [jsdom-browser-emulation-headless-runtime.md](./potential-adrs/must-document/RUNTIME/jsdom-browser-emulation-headless-runtime.md) |
| Comprehensive Mocking Strategy for Graphics Dependencies (PIXI/Effekseer/Canvas) | Architecture/Testing Strategy | 145 | [mocking-strategy-graphics-dependencies.md](./potential-adrs/must-document/RUNTIME/mocking-strategy-graphics-dependencies.md) |
| Synchronous Database Loading Override for Deterministic Testing | Architecture/Performance | 130 | [synchronous-database-loading-override.md](./potential-adrs/must-document/RUNTIME/synchronous-database-loading-override.md) |
