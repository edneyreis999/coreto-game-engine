# Potential ADR: Documentation-Before-Implementation (Greenfield Approach)

**Module**: DOCS
**Category**: Architecture
**Priority**: Consider (Score: 90)
**Date Identified**: 2026-01-04

---

## Existing ADR Context

ℹ️ **RELATED DECISIONS**

This decision relates to:
- **ADR-006**: Sem UI e Sem CI no MVP v1 (DOCS, 2026-01-04) - MVP scope planning before implementation
- **ADR-003**: Fidelidade via Batalha Real na Engine em Headless (DOCS, 2026-01-04) - Technical strategy documented upfront

**Timeline Context**:
- All ADRs dated 2026-01-04, created BEFORE any implementation
- Follows waterfall-like planning phase with comprehensive upfront design

**When creating formal ADR**: Reference these in Related ADRs section

---

## What Was Identified

The project follows a **documentation-first, waterfall-style approach** where 100% of initial work (3 commits, 200KB+ documentation) was completed BEFORE writing any implementation code. This is observable through:

- **Initial commit (2026-01-02)**: "chore: initial docs" - created entire documentation structure with no code
- **Second commit (2026-01-04)**: "docs: enhance PRD" - refined requirements, still no implementation
- **Third commit (2026-01-04)**: "Refactor documentation" - final documentation polish, implementation remains at 0%

The mapping.md analysis explicitly states: "**Current State:** Documentation is comprehensive but implementation is absent - This is a greenfield project in planning stage"

This represents a **methodological decision** about SDLC (Software Development Lifecycle) sequencing: Design → Document → Implement vs. Implement → Refactor → Document vs. Concurrent approaches.

Temporal context: Established 2026-01-02, refined over 2 days through January 4th, 2026. The team invested ~200KB of documentation (PRD, HLD, research, ADRs) before writing a single line of production code.

---

## Why This Might Deserve an ADR

- **Impact**: Affects project velocity, flexibility, and risk profile:
  - **Upfront cost**: 2+ days of planning before value delivery
  - **Risk reduction**: Identifies technical challenges (VisuStella mocking, JSDOM setup) before coding
  - **Team alignment**: Ensures shared understanding of architecture before divergent implementation
  - **Change cost**: Easier to change designs on paper than in code

- **Trade-offs**:
  - **Positive**: Reduces implementation rework by catching design flaws early
  - **Positive**: Enables parallel work (team can implement from specs)
  - **Positive**: Documents "why" decisions while context is fresh
  - **Negative**: Delays feedback from real implementation (JSDOM mocking might not work as planned)
  - **Negative**: Risk of over-engineering or analysis paralysis
  - **Negative**: Documentation may become stale if implementation reveals new constraints

- **Complexity**: Moderate - requires discipline to:
  - Resist jumping into coding ("just build it and see")
  - Maintain documentation-code synchronization when implementation starts
  - Know when documentation is "good enough" to begin implementation

- **Team Knowledge**: Important for workflow expectations:
  - New contributors must understand the "docs-first" culture
  - Design discussions happen in PRs against documentation, not code
  - Implementation phase will require documentation updates as reality diverges from plan

- **Future Implications**:
  - Sets precedent: future features should follow PRD → HLD → Implement sequence
  - Creates technical debt if documentation isn't updated post-implementation
  - Enables distributed/async work (implementers can work from specs independently)
  - May conflict with agile/iterative methodologies if team pivots to that approach

**Temporal Context**: Still in Phase 0 (documentation phase). No implementation code exists yet to validate or contradict the upfront designs.

---

## Evidence Found in Codebase

### Key Files
- [`/Users/edney/projects/coreto/game-engine/docs/`](/Users/edney/projects/coreto/game-engine/docs/) - All documentation
  - 8 markdown files, ~200KB total
  - Created before any `/src`, `/test`, or `/lib` directories exist

- [`.gitignore`](/.gitignore) - Lines N/A
  - No evidence of deleted implementation attempts (no references to `node_modules`, `dist`, `build`)
  - Confirms documentation-first approach, not "code then delete"

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 732-760
  - Section 11.2 "Implementation Roadmap" with 5 phases estimated at 10-15 weeks
  - Proves implementation was planned AFTER documentation was finalized

### Code Evidence
```markdown
// From mapping.md analysis (lines 763-775)
**Overall Maturity:** **Planning Phase** (Pre-Alpha)

| Aspect | Status | Quality |
|--------|--------|---------|
| **Requirements** | ✅ Complete | Excellent (comprehensive PRD) |
| **Architecture** | ✅ Complete | Excellent (85KB HLD) |
| **Research** | ✅ Complete | Exceptional (35KB technical deep-dive) |
| **Implementation** | ❌ Not Started | N/A (greenfield) |
```

```bash
# Git log shows documentation-only commits
2026-01-04 05:14:41 -0300|Refactor documentation for coreto game engine...
2026-01-04 03:53:40 -0300|docs: enhance PRD with additional context and requirements
2026-01-02 17:33:02 -0300|chore: initial docs
```

### Impact Analysis
- Introduced: 2026-01-02 (explicit methodology choice from day 1)
- Modified: 3 commits over 2 days (all documentation refinement)
- Last change: 2026-01-04 (still no implementation)
- Recent themes: "enhance", "refactor", "clarify" - all documentation verbs
- Affects: Entire project development workflow, not just DOCS module
- Time investment: Estimated 2+ days (based on 200KB+ documentation creation time)

### Alternatives (if observable)

**Evidence of rejected approaches** (inferred from commit history and content):

1. **Agile/iterative MVP approach**: Rejected
   - Observable: No minimal viable code with TODO comments
   - Observable: HLD has complete 5-phase roadmap (waterfall planning)
   - No evidence of "spike" prototypes or throwaway experiments

2. **README-driven development**: Rejected
   - Observable: No simple README with "how to run" instructions
   - Instead: 1,637-line HLD with complete architecture

3. **Code-first, document-later**: Rejected
   - Observable: Zero implementation code in initial 3 commits
   - Git history shows intentional sequence: docs → (planned) implementation

4. **Concurrent doc/code evolution**: Rejected
   - Observable: No interleaved doc + code commits
   - Clean separation of planning phase from (future) implementation phase

---

## Questions to Address in ADR (if created)

- Why was a waterfall-style, documentation-first approach chosen over agile/iterative methods?
- What are the specific benefits for this project (headless testing complexity, VisuStella black-box risk)?
- How will documentation be kept synchronized with implementation once coding begins?
- What is the "definition of done" for documentation before implementation can start?
- What happens if implementation reveals that documented designs are infeasible (JSDOM mocking fails)?
- Should this approach apply to all future features, or just the MVP foundation?
- How does this approach affect time-to-market vs. quality trade-offs?
- What mechanisms prevent documentation from becoming stale post-implementation?

---

## Related Potential ADRs
- Structured Documentation Hierarchy (PRD → HLD → Research) - DOCS module
- (Existing) ADR-006: Sem UI e Sem CI no MVP v1 - Scope reduction to focus on core

---

## Additional Notes

**Context Matters**: This approach is likely justified by:
1. **High technical risk**: Headless VisuStella mocking is uncharted territory - upfront research reduces costly rework
2. **Game design domain expertise**: Team knows RPG combat well enough to spec comprehensively
3. **Solo/small team**: Documentation enables knowledge transfer and async work
4. **Compliance/quality culture**: Game balancing errors are costly in released games

**Counter-Evidence**: The 35KB research document on "Balanceamento Determinístico RPG Maker MZ" with 41 sources suggests this ISN'T blind waterfall. The team did deep technical investigation BEFORE committing to the approach, which is more like "research → design → implement" vs. pure waterfall "assume → design → implement."

**Risk**: The HLD Section 10.1 lists "Harness headless incompatible with plugins or updates" as HIGH probability, BLOCKER impact. If this risk materializes, 200KB of upfront documentation may need significant revision. However, the research document explicitly addresses this risk, suggesting conscious acceptance.

**Scoring Justification**:
- Not Step 0 category (not infrastructure/framework/ORM)
- Passes Red Flags (not domain modeling, business workflow, or trivial config)
- Passes 3 E's (Structural to workflow, Evident to contributors, Stable methodology)
- Score: Scope (15 - affects all modules via workflow) + Cost (20 - methodology shifts take months) + Knowledge (15 - critical for contributors) = 90/150
- Classification: **Consider** (75-99 range)
