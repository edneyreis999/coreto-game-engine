# ADR-010: Three-Layer Documentation Architecture (PRD → HLD → Research)

**Status:** Accepted
**Date:** 2026-01-02

## Context and Problem Statement

The coreto game engine project requires a structured approach to organize knowledge across business requirements, technical design, and research validation. As a greenfield project with significant upfront documentation (2,448 total lines across 8 files), there was a need to prevent documentation chaos, reduce duplication, and establish clear boundaries for different types of information.

Without a formal structure, projects typically suffer from:
- Mixed concerns in monolithic README files (business goals, architecture, implementation details)
- Difficulty tracing requirements to design decisions
- Research findings scattered or lost in code comments
- Unclear ownership of documentation updates

The decision establishes three distinct documentation layers with explicit separation of concerns and dependency flow.

## Decision Drivers

- **Traceability requirement**: Need to trace business requirements (FR-XXX) to technical implementations and research justifications
- **Role-based access**: Different stakeholders focus on different layers (designers on PRD, engineers on HLD, researchers on validation)
- **Documentation scale**: 2,448 lines of upfront documentation requires organization to prevent cognitive overload
- **Evidence-based methodology**: Research-grade validation (41 citations) demands separate treatment from requirements or design
- **Version management**: Independent evolution of business requirements and technical architecture requires separate versioning (PRD v2, HLD v1.0)

## Considered Options

1. **Three-layer structure (PRD → HLD → Research)** - Chosen option
2. **Single monolithic README** - All information in one file
3. **Flat multi-file approach** - Multiple files without layered hierarchy

## Decision Outcome

Chosen option: **Three-layer structure (PRD → HLD → Research)**, because it provides clear separation of concerns while enabling traceability across business, technical, and research dimensions. The structure successfully supported 2 days of intensive documentation work without structural changes, validating its stability.

The implementation enforces separation through:
- Distinct filename conventions (PRD_*.md, hld-*.md, pesquisas/*.md)
- Different content structures (FR-XXX requirements, numbered technical sections, academic citations)
- Explicit cross-references (HLD references PRD sections, ADRs reference both layers)

## Pros and Cons of the Options

### Option 1: Three-layer structure (PRD → HLD → Research)

**Pros:**
- Prevents PRD bloat with implementation details, keeping business layer focused
- Enables deep research without cluttering requirements or design documents
- Supports automated traceability validation (every HLD component traces to PRD requirement)
- Facilitates role-based workflows (stakeholders consume only relevant layers)

**Cons:**
- Requires discipline to maintain separation (boundary between business logic and technical design can blur)
- Higher cognitive load to navigate 3+ documents for complete picture
- Potential for redundancy or inconsistency across layers if not actively managed
- Demands understanding of which layer to update for different change types

### Option 2: Single monolithic README

**Pros:**
- Single source of truth, no navigation required
- Simpler mental model for contributors
- No synchronization concerns across files

**Cons:**
- Scales poorly beyond 500 lines (coreto has 2,448 lines)
- Mixes concerns, making it difficult to update business requirements without touching technical details
- No version independence (business changes force technical doc updates)
- Research depth would bloat the file or be omitted entirely

### Option 3: Flat multi-file approach

**Pros:**
- Separation of content into manageable files
- Flexible organization without rigid structure

**Cons:**
- No enforced dependency flow (unclear which document depends on which)
- Weak traceability (no convention for cross-references)
- Ambiguous update targets (where does new information belong?)
- Inconsistent versioning across files

## Consequences

**Positive:**
- Established clear update protocols: Business changes → PRD, architecture changes → HLD, validation work → Research
- Enables requirements traceability matrices for compliance or quality audits
- Supports independent versioning (PRD v2 can exist while HLD remains v1.0)
- Subdirectory structure (`docs/pesquisas/`) naturally segregates research from requirements

**Negative:**
- Contributors must learn three-layer model before documenting
- Cross-layer consistency requires manual verification (no automated checks currently)
- Version synchronization becomes critical (PRD v2 + HLD v1.0 must align)

**Neutral:**
- Pattern requires periodic review to prevent layer creep (business logic bleeding into HLD)
- Future expansion may require additional layers (API docs, user guides, troubleshooting)

## References

- docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md:1-455
- docs/hld-coreto-game-engine.md:1-1637
- docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md:1-356
