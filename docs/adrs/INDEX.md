# ADR Index - Coreto Game Engine

**Total ADRs:** 34
**Last Updated:** 2026-02-07

## Overview

This index organizes all 34 Architecture Decision Records (ADRs) for the Coreto Game Engine project, organized by system module.

---

## ADRs by Module

### CLI Module (1 ADR)

| ID | Title | Status |
|----|-------|--------|
| [ADR-007](CLI/ADR-007-oclif-cli-framework.md) | Oclif CLI Framework | Accepted |

### CONFIG Module (3 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-008](CONFIG/ADR-008-schema-validation-library-zod.md) | Schema Validation Library - Zod | Accepted |
| [ADR-021](CONFIG/ADR-021-json-based-configuration-format.md) | JSON-Based Configuration Format | Accepted |
| [ADR-028](CONFIG/ADR-028-typescript-as-implementation-language.md) | TypeScript as Primary Implementation Language | Accepted |

### DOCS Module (4 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-009](DOCS/ADR-009-markdown-as-primary-documentation-format.md) | Markdown as Primary Documentation Format | Accepted |
| [ADR-010](DOCS/ADR-010-three-layer-documentation-architecture.md) | Three-Layer Documentation Architecture | Accepted |
| [ADR-022](DOCS/ADR-022-documentation-before-implementation-greenfield-approach.md) | Documentation-Before-Implementation Greenfield Approach | Accepted |
| [ADR-023](DOCS/ADR-023-madr-lightweight-adr-format.md) | MADR-Inspired Lightweight ADR Format | Accepted |

### FOUNDATION Module (8 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](FOUNDATION/ADR-001-wrapper-read-only.md) | Wrapper Read-Only | Accepted |
| [ADR-005](FOUNDATION/ADR-005-referencias-banco-mz-por-id.md) | Referências ao Banco MZ por ID | Accepted |
| [ADR-006](FOUNDATION/ADR-006-sem-ui-sem-ci-mvp.md) | Sem UI e Sem CI no MVP | Accepted |
| [ADR-029](FOUNDATION/ADR-029-tsyringe-di-container.md) | TSyringe DI Container | Accepted |
| [ADR-030](FOUNDATION/ADR-030-tsx-esbuild-build-tooling.md) | tsx/esbuild Build Tooling | Accepted |
| [ADR-031](FOUNDATION/ADR-031-jest-testing-framework.md) | Jest Testing Framework | Accepted |
| [ADR-032](FOUNDATION/ADR-032-ports-and-adapters-layer-contracts.md) | Ports and Adapters Layer Contracts | Accepted |
| [ADR-033](FOUNDATION/ADR-033-cli-package-removal.md) | CLI Package Removal | Accepted |

### REPORTER Module (4 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-011](REPORTER/ADR-011-json-file-based-report-output-format.md) | JSON File-Based Report Output Format | Accepted |
| [ADR-012](REPORTER/ADR-012-statistical-aggregation-metrics.md) | Statistical Aggregation Metrics | Accepted |
| [ADR-013](REPORTER/ADR-013-typed-warning-system-with-severity-levels.md) | Typed Warning System with Severity Levels | Accepted |
| [ADR-024](REPORTER/ADR-024-synchronous-file-write-strategy.md) | Synchronous File Write Strategy for Report Output | Accepted |

### RUNTIME Module (6 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-003](RUNTIME/ADR-003-fidelidade-batalha-real-engine-headless.md) | Fidelidade Batalha Real Engine Headless | Accepted |
| [ADR-014](RUNTIME/ADR-014-jsdom-browser-emulation-headless-runtime.md) | JSDOM Browser Emulation for Headless Runtime | Accepted |
| [ADR-015](RUNTIME/ADR-015-graphics-mocking-strategy-headless-runtime.md) | Graphics Mocking Strategy for Headless Runtime | Accepted |
| [ADR-016](RUNTIME/ADR-016-synchronous-database-loading-override.md) | Synchronous Database Loading Override | Accepted |
| [ADR-025](RUNTIME/ADR-025-diagnostic-mode-for-headless-initialization-troubleshooting.md) | Diagnostic Mode for Headless Initialization Troubleshooting | Accepted |
| [ADR-026](RUNTIME/ADR-026-jest-canvas-mock-library-for-canvas-api-stubbing.md) | jest-canvas-mock Library for Canvas API Stubbing | Accepted |

### SIMULATION Module (7 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-002](SIMULATION/ADR-002-progressao-skills-automatica-vs-manual.md) | Progressão de Skills - Automática vs Manual | Accepted |
| [ADR-004](SIMULATION/ADR-004-escolha-skills-hp-mp-mvp.md) | Escolha de Skills - HP/MP MVP | Accepted |
| [ADR-017](SIMULATION/ADR-017-battle-termination-conditions-with-timeout-safety.md) | Battle Termination Conditions with Timeout Safety | Accepted |
| [ADR-018](SIMULATION/ADR-018-seed-controlled-determinism-rng.md) | Seed-Controlled Determinism for RNG | Accepted |
| [ADR-019](SIMULATION/ADR-019-damage-per-action-maximization-skill-selection.md) | Damage-Per-Action Maximization for Skill Selection | Accepted |
| [ADR-020](SIMULATION/ADR-020-dual-metric-ttk-measurement-turns-and-actions.md) | Dual-Metric TTK Measurement (Turns and Actions) | Accepted |
| [ADR-027](SIMULATION/ADR-027-level-based-skill-derivation-from-learnings.md) | Level-Based Skill Derivation from Class Learnings | Accepted |

### UI Module (2 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-032](UI/ADR-032-electron-dev-portal-multi-tool-platform.md) | Electron Dev Portal for Multi-Tool Platform | Accepted |
| [ADR-033](UI/ADR-033-clean-architecture-electron-package.md) | Clean Architecture Implementation for Electron Package | Accepted |

**Architecture Enforcement:**
- **Automated Guardian:** `packages/electron/tests/architecture/architecture.test.ts`
  - Validates 16 architectural rules across 9 categories:
    * Domain Layer Purity (2 rules)
    * Handler Thin Adapter Pattern (2 rules)
    * Dependency Direction / Module Aliases (2 rules)
    * Domain Structure (2 rules)
    * File Placement (1 rule)
    * ESM Import Conventions (1 rule)
    * Dependency Injection Registration (2 rules) ← NEW
    * Naming Conventions (3 rules) ← NEW
    * Type Leakage Prevention (1 rule) ← NEW
  - Provides AI-friendly error messages with step-by-step fix instructions
  - Run: `pnpm --filter @coreto/electron test architecture.test.ts`
  - See also: `packages/electron/CLAUDE.md` (import conventions reference)

---

## Summary by Module

| Module | Total ADRs | Key Focus Areas |
|--------|-----------|-----------------|
| CLI | 1 | Command-line interface framework |
| CONFIG | 3 | Configuration format, validation, type system |
| DOCS | 4 | Documentation standards and processes |
| FOUNDATION | 7 | Core architectural principles, DI, ports/adapters, build tooling, testing |
| REPORTER | 4 | Report generation and output |
| RUNTIME | 6 | Headless execution environment |
| SIMULATION | 7 | Battle simulation mechanics |
| UI | 2 | Multi-tool platform, Clean Architecture |
| **TOTAL** | **33** | **All architectural decisions** |

---

## Key Cross-References

### High-Impact Decision Chains

1. **Technology Stack Foundation**:
   - ADR-028 (TypeScript) → ADR-029 (TSyringe DI) → ADR-007 (Oclif CLI) → ADR-008 (Zod Validation)
   - ADR-030 (tsx/esbuild Tooling) → ADR-031 (Jest Testing)
   - Rationale: TypeScript-first ecosystem enables type-safe CLI, DI, and schema inference

2. **Headless Runtime Architecture**:
   - ADR-003 (Real Engine Headless) → ADR-014 (JSDOM) → ADR-015 (Graphics Mocking) → ADR-016 (Sync Loading)
   - Supporting: ADR-025 (Diagnostic Mode), ADR-026 (Canvas Mock)

3. **Battle Simulation Fidelity**:
   - ADR-018 (Deterministic RNG) → ADR-017 (Termination Conditions) → ADR-020 (TTK Measurement)

4. **Skill System Design**:
   - ADR-002 (Auto Progression) → ADR-027 (Learnings Derivation) → ADR-004 (HP/MP Filtering) → ADR-019 (Selection Algorithm)

5. **Configuration & Validation**:
   - ADR-005 (ID References) → ADR-021 (JSON Format) → ADR-008 (Zod Validation) → ADR-028 (TypeScript Types)

6. **Reporting Pipeline**:
   - ADR-011 (JSON Output) → ADR-012 (Aggregation) → ADR-013 (Warnings) → ADR-024 (Sync Write)

7. **Documentation Standards**:
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
