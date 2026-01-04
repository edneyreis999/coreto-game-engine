# ADR-013: Typed Warning System with Severity Levels

**Status:** Accepted
**Date:** 2026-01-04

---

## Context and Problem Statement

The REPORTER module requires a structured approach to communicate errors and warnings from game balance validation. The system must handle various failure scenarios including missing data (troops/enemies not found), validation issues (TTK outside tolerance), runtime errors (skill formula failures), and execution problems (battle timeouts).

The challenge is designing an error communication mechanism that is both machine-parseable (for CI automation and analytics) and human-readable (for game designers). The system must support batch processing where failures in one troop don't block validation of others, while still providing actionable feedback to designers.

Key requirements from documentation:

- Generate warnings for TTK outside tolerance, missing troops, invalid enemies, formula errors, and timeouts
- Enable resilient execution where individual troop failures don't stop the pipeline
- Support future CI integration where build decisions depend on warning severity
- Provide both detailed diagnostic information and high-level summaries

## Decision Drivers

- **Automation enablement**: CI systems need structured, parseable warnings to make build pass/fail decisions
- **Designer experience**: Game designers need clear, actionable error messages to fix balance issues quickly
- **Batch processing efficiency**: Validating all troops in one run (vs. stopping at first failure) saves designer time
- **Future extensibility**: New game mechanics will require new warning types without breaking existing tooling
- **Debugging efficiency**: Typed warnings enable filtering, searching, and analytics on common issues
- **Resilience requirements**: Non-functional requirement that failures in one troop must not interrupt others

## Considered Options

1. **Typed enumeration with severity levels** (chosen)
2. **Free-text error messages**
3. **Numeric error codes**

## Decision Outcome

Chosen option: **Typed enumeration with severity levels**, because it provides the optimal balance of machine parseability and human readability while supporting graduated automation responses.

The system defines five warning types for MVP: `troop_not_found`, `enemy_not_found`, `ttk_out_of_tolerance`, `skill_formula_error`, `battle_timeout`. Each warning includes a severity level (`critical`, `warning`, `info`), a human-readable message, and type-specific context for debugging.

Warnings are non-blocking by default. The system continues execution and accumulates warnings in the report, enabling comprehensive feedback in a single validation run. Reports include both detailed warnings array and aggregated summary counts by type.

## Pros and Cons of the Options

### Typed enumeration with severity levels

**Pros:**

- Machine-parseable structure enables CI automation and analytics
- Type safety prevents typos and enables IDE autocomplete in typed languages
- Severity levels allow graduated responses (fail on critical, alert on warnings)
- Aggregated counts provide quick assessment of validation health
- Extensible taxonomy can accommodate future game mechanics

**Cons:**

- Requires upfront design of warning taxonomy
- Adding new types requires schema evolution and backwards compatibility management
- Severity assignment requires judgment for ambiguous cases
- May not handle completely unexpected errors gracefully

### Free-text error messages

**Pros:**

- Maximum flexibility for describing any error scenario
- No upfront taxonomy design required
- Natural language is immediately understandable

**Cons:**

- Not machine-parseable for automation
- Inconsistent messaging across different code paths
- Cannot filter or aggregate by error type
- No structured context for debugging

### Numeric error codes

**Pros:**

- Extremely concise representation
- Easy to map to documentation or localized messages

**Cons:**

- Less semantic than named types
- Requires separate lookup table to understand meaning
- Codes become meaningless without documentation

## Consequences

**Positive:**

- CI integration can automatically fail builds on critical warnings while allowing informational warnings
- Designers get comprehensive reports showing all issues in one validation run instead of iterative fix-run cycles
- Analytics can track warning trends over time to identify systemic balance problems
- Structured context enables precise debugging (e.g., which specific troop/enemy/skill caused the issue)
- Non-blocking execution maximizes validation efficiency in batch processing scenarios

**Negative:**

- Warning taxonomy becomes part of the public API and requires careful evolution
- New warning types require coordinated updates to parsers, CI scripts, and documentation
- Potential for warning fatigue if low-severity warnings are too frequent
- Non-blocking approach requires discipline to review reports (critical issues don't halt execution)

**Evolution considerations:**

- Adding new warning types requires schema versioning strategy
- Severity assignment guidelines must be documented for consistency
- Future plugin/extension system may need dynamic warning type registration
- International teams may require warning message localization

## References

- `/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md:589-597` (Warning data model)
- `/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md:172-186` (Reporter Layer responsibilities)
- `/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md:740-743` (warningsByType aggregation)
- `/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md:260` (FR-008 requirements)
