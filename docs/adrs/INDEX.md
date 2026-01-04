# ADR Index - Coreto Game Engine

**Total ADRs:** 27
**Last Updated:** 2026-01-04

## Overview

This index organizes all Architecture Decision Records (ADRs) for the Coreto Game Engine project. ADRs are categorized by source (documented vs generated) and organized by system module.

---

## Documented ADRs (6)

These ADRs were extracted from existing design documentation (PRD and HLD).

| ID | Title | Module | Status |
|----|-------|--------|--------|
| [ADR-001](documented/ADR-001-wrapper-read-only.md) | Wrapper Read-Only | FOUNDATION | Accepted |
| [ADR-002](documented/ADR-002-progressao-skills-automatica-vs-manual.md) | Progressão de Skills - Automática vs Manual | SIMULATION | Accepted |
| [ADR-003](documented/ADR-003-fidelidade-batalha-real-engine-headless.md) | Fidelidade Batalha Real Engine Headless | RUNTIME | Accepted |
| [ADR-004](documented/ADR-004-escolha-skills-hp-mp-mvp.md) | Escolha de Skills - HP/MP MVP | SIMULATION | Accepted |
| [ADR-005](documented/ADR-005-referencias-banco-mz-por-id.md) | Referências ao Banco MZ por ID | FOUNDATION | Accepted |
| [ADR-006](documented/ADR-006-sem-ui-sem-ci-mvp.md) | Sem UI e Sem CI no MVP | FOUNDATION | Accepted |

---

## Generated ADRs - High Priority (14)

These ADRs were identified and generated through systematic codebase analysis for critical architectural decisions.

### CLI Module (1)

| ID | Title | Status |
|----|-------|--------|
| [ADR-007](generated/CLI/ADR-007-oclif-cli-framework.md) | Oclif CLI Framework | Accepted |

### CONFIG Module (1)

| ID | Title | Status |
|----|-------|--------|
| [ADR-008](generated/CONFIG/ADR-008-schema-validation-library-zod.md) | Schema Validation Library - Zod | Accepted |

### DOCS Module (2)

| ID | Title | Status |
|----|-------|--------|
| [ADR-009](generated/DOCS/ADR-009-markdown-as-primary-documentation-format.md) | Markdown as Primary Documentation Format | Accepted |
| [ADR-010](generated/DOCS/ADR-010-three-layer-documentation-architecture.md) | Three-Layer Documentation Architecture | Accepted |

### REPORTER Module (3)

| ID | Title | Status |
|----|-------|--------|
| [ADR-011](generated/REPORTER/ADR-011-json-file-based-report-output-format.md) | JSON File-Based Report Output Format | Accepted |
| [ADR-012](generated/REPORTER/ADR-012-statistical-aggregation-metrics.md) | Statistical Aggregation Metrics | Accepted |
| [ADR-013](generated/REPORTER/ADR-013-typed-warning-system-with-severity-levels.md) | Typed Warning System with Severity Levels | Accepted |

### RUNTIME Module (3)

| ID | Title | Status |
|----|-------|--------|
| [ADR-014](generated/RUNTIME/ADR-014-jsdom-browser-emulation-headless-runtime.md) | JSDOM Browser Emulation for Headless Runtime | Accepted |
| [ADR-015](generated/RUNTIME/ADR-015-graphics-mocking-strategy-headless-runtime.md) | Graphics Mocking Strategy for Headless Runtime | Accepted |
| [ADR-016](generated/RUNTIME/ADR-016-synchronous-database-loading-override.md) | Synchronous Database Loading Override | Accepted |

### SIMULATION Module (4)

| ID | Title | Status |
|----|-------|--------|
| [ADR-017](generated/SIMULATION/ADR-017-battle-termination-conditions-with-timeout-safety.md) | Battle Termination Conditions with Timeout Safety | Accepted |
| [ADR-018](generated/SIMULATION/ADR-018-seed-controlled-determinism-rng.md) | Seed-Controlled Determinism for RNG | Accepted |
| [ADR-019](generated/SIMULATION/ADR-019-damage-per-action-maximization-skill-selection.md) | Damage-Per-Action Maximization for Skill Selection | Accepted |
| [ADR-020](generated/SIMULATION/ADR-020-dual-metric-ttk-measurement-turns-and-actions.md) | Dual-Metric TTK Measurement (Turns and Actions) | Accepted |

---

## Generated ADRs - Medium Priority (7)

These ADRs document important but less critical architectural decisions identified during analysis.

### CONFIG Module (1)

| ID | Title | Status |
|----|-------|--------|
| [ADR-021](generated/CONFIG/ADR-021-json-based-configuration-format.md) | JSON-Based Configuration Format | Accepted |

### DOCS Module (2)

| ID | Title | Status |
|----|-------|--------|
| [ADR-022](generated/DOCS/ADR-022-documentation-before-implementation-greenfield-approach.md) | Documentation-Before-Implementation Greenfield Approach | Accepted |
| [ADR-023](generated/DOCS/ADR-023-madr-lightweight-adr-format.md) | MADR-Inspired Lightweight ADR Format | Accepted |

### REPORTER Module (1)

| ID | Title | Status |
|----|-------|--------|
| [ADR-024](generated/REPORTER/ADR-024-synchronous-file-write-strategy.md) | Synchronous File Write Strategy for Report Output | Accepted |

### RUNTIME Module (2)

| ID | Title | Status |
|----|-------|--------|
| [ADR-025](generated/RUNTIME/ADR-025-diagnostic-mode-for-headless-initialization-troubleshooting.md) | Diagnostic Mode for Headless Initialization Troubleshooting | Accepted |
| [ADR-026](generated/RUNTIME/ADR-026-jest-canvas-mock-library-for-canvas-api-stubbing.md) | jest-canvas-mock Library for Canvas API Stubbing | Accepted |

### SIMULATION Module (1)

| ID | Title | Status |
|----|-------|--------|
| [ADR-027](generated/SIMULATION/ADR-027-level-based-skill-derivation-from-learnings.md) | Level-Based Skill Derivation from Class Learnings | Accepted |

---

## Summary by Module

| Module | Documented | High Priority | Medium Priority | Total |
|--------|-----------|---------------|-----------------|-------|
| CLI | 0 | 1 | 0 | 1 |
| CONFIG | 0 | 1 | 1 | 2 |
| DOCS | 0 | 2 | 2 | 4 |
| FOUNDATION | 3 | 0 | 0 | 3 |
| REPORTER | 0 | 3 | 1 | 4 |
| RUNTIME | 1 | 3 | 2 | 6 |
| SIMULATION | 2 | 4 | 1 | 7 |
| **TOTAL** | **6** | **14** | **7** | **27** |

---

## Key Cross-References

### High-Impact Decision Chains

1. **Headless Runtime Architecture**:
   - ADR-003 (Real Engine Headless) → ADR-014 (JSDOM) → ADR-015 (Graphics Mocking) → ADR-016 (Sync Loading)
   - Supporting: ADR-025 (Diagnostic Mode), ADR-026 (Canvas Mock)

2. **Battle Simulation Fidelity**:
   - ADR-018 (Deterministic RNG) → ADR-017 (Termination Conditions) → ADR-020 (TTK Measurement)

3. **Skill System Design**:
   - ADR-002 (Auto Progression) → ADR-027 (Learnings Derivation) → ADR-004 (HP/MP Filtering) → ADR-019 (Selection Algorithm)

4. **Configuration & Validation**:
   - ADR-005 (ID References) → ADR-021 (JSON Format) → ADR-008 (Zod Validation)

5. **Reporting Pipeline**:
   - ADR-011 (JSON Output) → ADR-012 (Aggregation) → ADR-013 (Warnings) → ADR-024 (Sync Write)

6. **Documentation Standards**:
   - ADR-022 (Docs-First) → ADR-010 (Three Layers) → ADR-009 (Markdown) → ADR-023 (MADR Format)

---

## Navigation

- **Source Documentation**: See `docs/hld-coreto-game-engine.md` and `docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`
- **Codebase Mapping**: See `docs/adrs/mapping.md`
- **Potential ADRs Archive**: See `docs/adrs/potential-adrs/done/`

---

## ADR Lifecycle

All ADRs currently have **Status: Accepted** as they were created during the initial architectural design phase (pre-implementation). As the project evolves:

- **Superseded**: ADRs replaced by newer decisions will be marked as superseded with references
- **Deprecated**: ADRs for removed features will be marked as deprecated
- **Amended**: Significant changes will create new ADRs that amend (not replace) existing ones
