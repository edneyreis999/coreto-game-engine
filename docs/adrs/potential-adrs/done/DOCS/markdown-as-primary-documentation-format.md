# Potential ADR: Markdown as Primary Documentation Format

**Module**: DOCS
**Category**: Architecture/Technology
**Priority**: Must Document (Score: 120)
**Date Identified**: 2026-01-04

---

## Existing ADR Context

ℹ️ **RELATED DECISIONS**

This decision relates to:
- **ADR-001**: Wrapper Read-Only (DOCS, 2026-01-04)
- **ADR-006**: Sem UI e Sem CI no MVP v1 (DOCS, 2026-01-04)

**Timeline Context**:
- Follows overall tool philosophy of simplicity and text-based workflows
- Aligns with read-only wrapper approach (documentation as code)

**When creating formal ADR**: Reference these in Related ADRs section

---

## What Was Identified

The project uses **Markdown (.md files)** as the primary and exclusive format for all documentation. This pattern was introduced with the initial commit on 2026-01-02 ("chore: initial docs"), establishing a comprehensive documentation-first approach before any implementation code was written.

The documentation corpus includes 8 markdown files totaling ~200KB across multiple categories:
- Product requirements (PRD)
- High-level design (HLD)
- Technical research (3 research documents)
- Plugin-specific documentation (3 VisuStella plugin docs)
- Planning summaries
- ADRs (6 formal architectural decision records)

This represents a **structural technology choice** that affects how the entire team communicates technical decisions, requirements, and architectural patterns. The decision to use Markdown exclusively (vs. alternatives like Confluence, Google Docs, Word documents, or specialized tools) has system-wide implications for versioning, review processes, and accessibility.

Temporal context: Introduced in January 2026 with "chore: initial docs" commit, refined through "docs: enhance PRD" and "Refactor documentation" commits over 2 days, indicating rapid iteration and stability.

---

## Why This Might Deserve an ADR

- **Impact**: Affects how all stakeholders (developers, designers, future team members) access and contribute to project knowledge. Establishes tooling requirements (text editors, Git familiarity) and review workflows (PR-based documentation reviews).

- **Trade-offs**:
  - Enables version control and diff-based reviews (Git-friendly)
  - Requires technical literacy (Markdown syntax, Git operations)
  - No WYSIWYG editing or real-time collaboration features
  - Cross-platform compatibility without proprietary tools

- **Complexity**: Moderate - requires team alignment on conventions (file naming, directory structure, linking patterns). The decision to use Markdown influences downstream tooling choices (static site generators, documentation viewers, CI/CD validation).

- **Team Knowledge**: Critical for onboarding and knowledge sharing. Every contributor must understand:
  - Where to find documentation (docs/ directory structure)
  - How to update it (Markdown syntax, Git workflow)
  - Naming conventions (kebab-case, descriptive filenames)
  - Review processes (documentation changes via PRs)

- **Future Implications**:
  - Enables automated documentation validation (linting, broken link checking)
  - Facilitates static site generation (MkDocs, Docusaurus, VitePress)
  - Supports documentation-as-code practices (versioned alongside implementation)
  - Constrains to text-based tooling (no embedded interactive diagrams, videos require external hosting)

**Temporal Context**: Stable for 2+ days of intensive documentation work (3 commits with significant refactoring). Pattern has proven effective for capturing 1,637 lines of HLD and 455 lines of PRD without deviation.

---

## Evidence Found in Codebase

### Key Files
- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 1-1637
  - Comprehensive 85KB architectural documentation in pure Markdown
  - Uses advanced Markdown features: code blocks, tables, nested lists, links

- [`/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`](/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) - Lines 1-455
  - Versioned PRD with structured requirements, metrics tables, acceptance criteria
  - Demonstrates Markdown's capability for formal documentation

- [`/Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md`](/Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md) - Lines 1-356
  - 35KB research document with 41 cited sources
  - Shows Markdown can handle academic-quality technical writing

### Code Evidence
```markdown
// Example from hld-coreto-game-engine.md:1-10
# HLD - coreto game engine

**Versão:** 1.0
**Data:** 2026-01-04
**Sistema:** coreto game engine - Validação Determinística de TTK

---

## 1. Contexto e Objetivo Técnico
```

### Impact Analysis
- Introduced: 2026-01-02
- Modified: 3 commits over 2 days
- Last change: 2026-01-04 ("Refactor documentation for coreto game engine")
- Recent themes: "enhance PRD", "refactor documentation", "update objectives"
- Affects: 17 files (8 markdown docs + 6 ADRs + mapping + index), entire DOCS module
- Related commits: All 3 project commits focused on documentation establishment

### Alternatives (if observable)
No alternative formats observed in codebase. Comments in ADR files and HLD suggest explicit rejection of:
- **Heavyweight documentation platforms** (Confluence, Notion): Implied by choice of local Markdown files
- **WYSIWYG editors** (Word, Google Docs): Incompatible with Git-based versioning philosophy
- **Code comments as primary documentation**: HLD Section 8.5.4 mentions "documentation (README, troubleshooting)" as separate Phase 4 deliverable

---

## Questions to Address in ADR (if created)

- Why was Markdown chosen over other documentation formats (Google Docs, Confluence, Wiki systems)?
- What specific benefits does Markdown provide for this project's workflow?
- How does this choice align with the project's Git-based, local-first, read-only philosophy?
- What are the trade-offs in terms of accessibility for non-technical stakeholders (game designers)?
- What conventions will be enforced (file naming, directory structure, linking patterns)?
- How will documentation quality be maintained (review processes, linting, validation)?
- What happens if the team needs features Markdown doesn't provide (diagrams, interactive content)?

---

## Related Potential ADRs
- (Pending identification) Documentation directory structure organization
- (Pending identification) Separation of research, requirements, and design documentation

---

## Additional Notes

**Documentation-First Approach**: The project demonstrates exceptional commitment to upfront planning - 100% of initial work was documentation before any implementation. This is unusual and suggests a mature, deliberate engineering culture.

**Markdown Proficiency**: The quality and sophistication of Markdown usage (complex tables, nested lists, code blocks, consistent formatting) indicates this wasn't an arbitrary choice but a deliberate selection by experienced practitioners.

**Git Integration**: All documentation is tracked in Git with meaningful commits ("docs: enhance PRD", "Refactor documentation"), treating documentation as first-class code artifacts.

**Uncertainty**: No explicit ADR exists documenting this decision, despite its foundational nature. This may be because it was considered "obvious" or predated the ADR practice adoption.
