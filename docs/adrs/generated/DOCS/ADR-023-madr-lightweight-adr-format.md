# ADR-023: MADR-Inspired Lightweight ADR Format

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-009, ADR-010

## Context and Problem Statement

The coreto game engine project needed a standard format for documenting architectural decisions that balances rigor with accessibility. With documentation-as-code practices established and a three-layer documentation architecture in place, the team required a consistent template for capturing decision rationale, alternatives, and trade-offs.

The format choice directly impacts cognitive load for contributors, discoverability of past decisions, and the cultural expectation around what constitutes a valid architectural decision record. Without standardization, ADRs risk becoming inconsistent, incomplete, or difficult to compare across the project lifecycle.

## Decision Drivers

- Lightweight barrier to entry encourages consistent adoption across all architectural decisions
- Structured format ensures comparability and completeness across all ADRs
- Consequence-focused approach forces honest trade-off analysis rather than justification of predetermined choices
- Bilingual accessibility balances Portuguese-speaking team with international technical keywords
- Alignment with Markdown format and documentation-as-code practices established in ADR-009
- Support for ADR lifecycle management including status evolution and cross-referencing

## Considered Options

1. MADR-inspired lightweight format (bilingual headers, consequence-focused)
2. Y-statement format (Michael Nygard's original ADR style)
3. RFC-style formal specification

## Decision Outcome

Chosen option: MADR-inspired lightweight format with bilingual headers and mandatory consequence sections, because it provides sufficient structure to ensure completeness while maintaining a low barrier to adoption. The format enforces documentation of alternatives and honest trade-off analysis through dedicated positive/negative consequence sections.

Evidence from the codebase shows 100% consistency across 6 initial ADRs created in a single batch, demonstrating that the format was pre-established and successfully applied. ADRs range from 44 to 65 lines, validating the lightweight objective without sacrificing necessary detail.

## Pros and Cons of the Options

### MADR-inspired lightweight format

**Pros:**

- Low cognitive overhead (20-80 lines per ADR) encourages consistent documentation
- Mandatory Consequências sections force honest examination of positive and negative trade-offs
- Consistent structure enables automated validation and tooling
- Bilingual approach (English keywords, Portuguese content) supports local team with international accessibility

**Cons:**

- Less formal rigor than RFC-style formats, may not satisfy compliance contexts requiring detailed specification
- Bilingual mixing could confuse international contributors unfamiliar with Portuguese
- No explicit supersession fields (relying on References section for ADR relationships)

### Y-statement format

**Pros:**

- Extremely concise one-liner format minimizes documentation overhead
- Forces clarity of decision context and outcome

**Cons:**

- Too terse for complex architectural decisions with multiple trade-offs
- Difficult to document alternatives and rationale in single-sentence format
- Limited support for consequence analysis

### RFC-style formal specification

**Pros:**

- Maximum rigor with Abstract, Specification, Security Considerations sections
- Standards-track metadata supports compliance and formal review processes

**Cons:**

- High barrier to entry (200+ line documents) discourages documentation
- Overhead inappropriate for tactical architectural decisions
- Requires formal versioning and approval workflows

## Consequences

The lightweight format establishes a cultural norm where documenting decisions is expected but not burdensome. Contributors understand that ADRs must include alternatives considered and honest negative consequences, preventing decision records from becoming mere justifications.

The consistent structure enables future automation including linting for required sections, ADR visualization tools for dependency graphs, and traceability validation. However, the format constrains tooling to text-based approaches, precluding interactive ADR dashboards without custom parsing.

The bilingual approach may require evolution if the team grows internationally, necessitating a choice between full English standardization or full Portuguese localization. The absence of explicit supersession fields means ADR lifecycle management relies on References sections and Status field extensions.

## References

- /Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-001-wrapper-read-only.md:1-44
- /Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-003-fidelidade-batalha-real-engine-headless.md:1-60
- /Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-006-sem-ui-sem-ci-mvp.md:1-65
