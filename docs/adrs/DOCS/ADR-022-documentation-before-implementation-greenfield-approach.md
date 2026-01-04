# ADR-022: Documentation-Before-Implementation Greenfield Approach

**Status:** Accepted
**Date:** 2026-01-02
**Related ADRs:** ADR-009, ADR-010

## Context and Problem Statement

The coreto game engine project adopted a documentation-first SDLC methodology where comprehensive planning occurs before any implementation code is written. Over 2 days (January 2-4, 2026), the team produced approximately 200KB of documentation (PRD, HLD, research papers, ADRs) across 8 markdown files without creating any production code directories or files.

This represents a methodological decision about development sequencing: Design → Document → Implement versus Implement → Refactor → Document versus concurrent evolution. The project currently sits in a greenfield planning phase with comprehensive requirements (455-line PRD), complete architecture (1,637-line HLD), exceptional research validation (356-line paper with 41 citations), and zero implementation.

The decision affects project velocity, risk profile, team collaboration patterns, and the relationship between planned architecture and implementation reality. The approach contrasts with iterative methodologies where minimal implementations guide design refinement through rapid feedback cycles.

## Decision Drivers

- Complex technical risk requiring upfront investigation (headless VisuStella plugin mocking is uncharted territory)
- Team domain expertise in RPG combat enables comprehensive specification without prototyping
- Enables distributed and asynchronous work when team members implement from specifications independently
- Documentation captures design rationale while context is fresh, before implementation details dominate
- Reduces implementation rework by identifying architectural conflicts early in design phase
- Supports parallel workstreams where multiple contributors implement different modules from shared specifications

## Considered Options

1. **Documentation-first waterfall approach** (chosen)
2. **Agile iterative MVP with minimal documentation**
3. **Concurrent documentation and code evolution**

## Decision Outcome

Chosen option: **Documentation-first waterfall approach**, because the project's high technical risk (JSDOM + VisuStella black-box mocking) justified upfront research and design validation before implementation investment. The team's RPG combat domain expertise enabled accurate specification without prototyping, and the solo/small team structure benefits from documented specifications for asynchronous work.

The approach was implemented from day one (2026-01-02) with initial commit creating full documentation structure. Three commits over 2 days refined documentation through "enhance PRD" and "refactor documentation" iterations, with implementation deliberately deferred until design validation completes.

Evidence of conscious methodology choice: HLD includes complete 5-phase implementation roadmap with 10-15 week estimates, research document addresses identified high-probability blocker risks (headless harness incompatibility), and git history shows zero prototyping spikes or throwaway experiments.

## Pros and Cons of the Options

### Documentation-first waterfall approach

**Pros:**

- Identifies critical risks early through research (35KB document validates headless feasibility before coding)
- Easier to change designs on paper than refactor implemented code
- Documents architectural "why" decisions before implementation details obscure original rationale
- Enables team alignment on architecture before divergent implementations create merge conflicts

**Cons:**

- Delays implementation feedback that could reveal infeasible designs (JSDOM mocking may fail in practice)
- Risk of analysis paralysis or over-engineering without reality checks from working code
- Documentation may become stale when implementation reveals new constraints or opportunities
- Upfront cost of 2+ days before value delivery or user feedback

### Agile iterative MVP with minimal documentation

**Pros:**

- Rapid feedback from real implementation validates or contradicts design assumptions
- Lower upfront investment before learning from actual system behavior
- Documentation evolves organically as patterns stabilize
- Faster time-to-market for minimal viable features

**Cons:**

- Implementation rework costs when design flaws discovered late
- Harder to parallelize work without shared architectural specifications
- Risk of losing design rationale as implementation details dominate
- Distributed teams struggle without documented contracts between modules

### Concurrent documentation and code evolution

**Pros:**

- Balances planning benefits with implementation reality checks
- Documentation and code inform each other iteratively
- Moderate upfront investment with continuous refinement

**Cons:**

- Requires discipline to keep documentation synchronized with code changes
- Interleaved commits create review complexity (design vs implementation feedback)
- Unclear "definition of done" for documentation before implementation proceeds
- Risk of documentation lagging as implementation velocity increases

## Consequences

The waterfall approach establishes "docs-first" culture for all future features: requirements → design → implementation sequencing becomes the expected workflow. New contributors must understand that design discussions happen in PRs against documentation files, not code files.

Technical debt emerges if documentation diverges from implementation reality. The team must maintain documentation-code synchronization discipline once coding begins, with explicit documentation update requirements when implementation reveals design changes.

The approach enables distributed work patterns where implementers work independently from specifications. This supports async collaboration but creates dependency on documentation completeness and accuracy. Implementation blockers (JSDOM mocking failures) may require significant documentation revision rather than quick code pivots.

Sets precedent for "definition of done" for documentation quality: PRD at 455 lines, HLD at 1,637 lines, research with 41 citations establishes high bar for future planning phases. The 5-phase implementation roadmap with 10-15 week estimates constrains agile pivots if market feedback demands rapid direction changes.

## References

- docs/hld-coreto-game-engine.md:732-760
- docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md:1-455
- docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md:1-356
- .gitignore:1-10
