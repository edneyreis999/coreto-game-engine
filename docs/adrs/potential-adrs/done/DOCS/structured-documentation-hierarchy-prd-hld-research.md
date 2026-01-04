# Potential ADR: Structured Documentation Hierarchy (PRD → HLD → Research)

**Module**: DOCS
**Category**: Architecture
**Priority**: Must Document (Score: 115)
**Date Identified**: 2026-01-04

---

## What Was Identified

The project follows a **formal, layered documentation architecture** separating concerns across three distinct levels:

1. **Product Requirements (PRD)**: Business context, objectives, functional requirements, acceptance criteria
2. **High-Level Design (HLD)**: Technical architecture, component design, data models, ADRs
3. **Research Documents**: Deep technical investigations, academic-quality analysis with citations

This architectural pattern was established in the initial commit (2026-01-02) and consistently maintained through all documentation iterations. The separation is enforced through:
- **Distinct filenames**: `PRD_*.md`, `hld-*.md`, `pesquisas/*.md`
- **Different content structures**: PRD uses FR-XXX requirements, HLD uses numbered sections, research uses academic citation format
- **Clear dependency flow**: PRD defines WHAT → HLD defines HOW → Research validates WHY

This represents a **structural decision** affecting how the team organizes knowledge, traces requirements to design, and justifies technical choices. The pattern is observable across all 8 documentation files with zero cross-contamination of concerns.

Temporal context: Introduced 2026-01-02 with "chore: initial docs", refined 2026-01-04 with "Refactor documentation for coreto game engine: update objectives, MVP scope". The structure has remained stable across 3 commits spanning 2 days.

---

## Why This Might Deserve an ADR

- **Impact**: Affects how requirements flow to implementation, how technical decisions are justified, and how knowledge is organized. Establishes clear boundaries for what information belongs where, reducing documentation chaos and duplication.

- **Trade-offs**:
  - **Positive**: Clear separation of concerns prevents PRD bloat with implementation details
  - **Positive**: Research can be deep without cluttering requirements or design
  - **Positive**: Traceability from requirement → design → justification
  - **Negative**: Requires discipline to maintain separation (where does "business logic" end and "technical design" begin?)
  - **Negative**: Potential for redundancy or inconsistency across layers
  - **Negative**: Higher cognitive load to navigate 3+ documents for complete picture

- **Complexity**: High - this is a sophisticated information architecture requiring:
  - Understanding of when to write PRD vs HLD vs Research content
  - Cross-referencing discipline (HLD Section 8.1 references PRD requirements)
  - Version synchronization (PRD v2, HLD v1.0 - must track alignment)

- **Team Knowledge**: Critical for documentation contributions. Every author must understand:
  - Which layer to update for different types of changes
  - How to maintain traceability across layers
  - When research justifies design, and design implements requirements

- **Future Implications**:
  - Enables requirements traceability matrices
  - Supports automated validation (every HLD component should trace to PRD requirement)
  - Facilitates role-based access (designers focus on PRD, engineers on HLD, researchers on deep-dives)
  - Constrains documentation evolution (can't easily merge layers without architectural change)

**Temporal Context**: Stable for 2 days of intensive work. The structure successfully supported capturing 455 lines (PRD) + 1,637 lines (HLD) + 356 lines (research) without structural changes.

---

## Evidence Found in Codebase

### Key Files
- [`/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`](/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) - Lines 1-455
  - Business-focused: objectives, metrics, functional requirements (FR-001 to FR-006)
  - No implementation details or code references
  - Acceptance criteria for each requirement

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 1-1637
  - Technical architecture: component diagrams, API contracts, data models
  - References PRD: "PRD: `docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`"
  - Contains ADR decisions with implementation implications

- [`/Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md`](/Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md) - Lines 1-356
  - Research-focused: 41 cited academic and technical sources
  - Deep technical validation of headless testing approach
  - No requirements or business context

### Code Evidence
```markdown
// Example from PRD:1-6 (Product Layer)
### PRD: coreto game engine Validação determinística de TTK por trechos (read-only)

Versão: 2
Data: 2026-01-02
Responsável: coreto game design (hipótese)
```

```markdown
// Example from HLD:1-6 (Design Layer)
# HLD - coreto game engine

**Versão:** 1.0
**Data:** 2026-01-04
**Sistema:** coreto game engine - Validação Determinística de TTK
```

```markdown
// Example from Research (Investigation Layer)
# Balanceamento Determinístico RPG Maker MZ
[35KB technical investigation with 41 sources]
```

### Impact Analysis
- Introduced: 2026-01-02 (all three layers in initial commit)
- Modified: 3 commits over 2 days
- Last change: 2026-01-04 ("Refactor documentation")
- Recent themes: "enhance PRD", "update objectives, MVP scope", "clarify project structure"
- Affects: 8 files (1 PRD + 1 HLD + 3 research + 1 planning summary + 2 specialized docs), entire DOCS module
- Modules: DOCS (primary), indirectly affects all modules (they reference this documentation)

### Alternatives (if observable)

**Evidence of rejected alternatives** (inferred from structure):

1. **Single "README" approach**: Rejected - would mix business, technical, and research concerns in one file
   - Observable: No monolithic README.md at project root containing all information

2. **Code-comment-driven documentation**: Rejected - extensive upfront documentation before any code
   - Observable: HLD Section 11.2 lists "Documentation (README, troubleshooting)" as Phase 4 (after implementation)

3. **Confluence/Wiki multi-page structure**: Rejected - local Markdown files in Git
   - Observable: All documentation in `/docs` directory, versioned alongside code

4. **Flat documentation directory**: Rejected - clear subdirectory structure (`pesquisas/`, `plugins-visustella/`, `adrs/`)
   - Observable: Research segregated to `docs/pesquisas/`, plugin docs to `docs/plugins-visustella/`

---

## Questions to Address in ADR (if created)

- Why was a three-layer structure (PRD/HLD/Research) chosen over simpler alternatives (single README, code comments)?
- What specific problems does this separation solve for the coreto project?
- How should authors decide which layer to update for different types of changes?
- What mechanisms ensure consistency and traceability across layers (version numbering, cross-references)?
- How will this structure scale as the project grows (more features, more researchers)?
- What happens when business logic bleeds into technical design (where's the boundary)?
- Should there be additional layers (API documentation, user guides, troubleshooting)?
- How does this align with the project's development methodology (documentation-first, TDD, waterfall vs agile)?

---

## Related Potential ADRs
- Markdown as Primary Documentation Format (DOCS module)
- (Pending identification) Separation of plugin-specific documentation
- (Pending identification) Research document citation and academic rigor standards

---

## Additional Notes

**Exceptional Rigor**: The documentation demonstrates professional/enterprise-grade information architecture rarely seen in indie game tooling projects. The separation of PRD/HLD/Research suggests influence from software engineering best practices (IEEE standards, DoD-STD-2167A, or similar frameworks).

**Version Discipline**: PRD is at v2, HLD at v1.0, indicating explicit versioning strategy. This suggests awareness of documentation lifecycle management and potential API stability guarantees.

**Cross-References**: HLD explicitly references PRD sections, ADRs reference both PRD and HLD. This indicates conscious effort to maintain traceability, not just accidental structure.

**Research Quality**: The 35KB research document with 41 citations is university thesis-grade work. This level of rigor suggests the team values evidence-based decision making and deep understanding over "move fast and break things."

**Uncertainty**: No explicit ADR documents WHY this structure was chosen, only HOW it's organized. The decision predates the ADR practice adoption (ADRs dated 2026-01-04, structure from 2026-01-02).
