# Potential ADR: MADR Format for Architecture Decision Records

**Module**: DOCS
**Category**: Architecture
**Priority**: Consider (Score: 85)
**Date Identified**: 2026-01-04

---

## Existing ADR Context

ℹ️ **RELATED DECISIONS**

This decision relates to:
- Markdown as Primary Documentation Format (DOCS module, pending) - ADRs inherit Markdown choice
- Structured Documentation Hierarchy (DOCS module, pending) - ADRs as separate concern layer

**Timeline Context**:
- ADRs created 2026-01-04, same day as HLD refactoring
- Follows documentation-first approach established 2026-01-02

**When creating formal ADR**: Reference these in Related ADRs section

---

## What Was Identified

The project uses a **lightweight, MADR-inspired format** for documenting architectural decisions, distinct from heavyweight templates (RFC, formal IEEE standards) or unstructured approaches (commit messages, code comments).

Observable ADR structure from 6 existing records (ADR-001 through ADR-006):

```markdown
# ADR-XXX: [Descriptive Title in Portuguese]

**Status:** [Decidido | Decidido para MVP v1 | etc.]
**Data:** YYYY-MM-DD
**Contexto:** [One-line summary]

## Contexto e Problema
[Business/technical problem description]

## Decisão
[What was decided, with implementation details]

## Consequências
### Positivas
- ✅ [Benefits]

### Negativas
- ❌ [Trade-offs/costs]

## Alternativas Consideradas
[Rejected options with rationale]

## Referências
[Links to PRD, HLD sections, or external sources]
```

This format is:
- **Lightweight**: 20-80 lines per ADR (vs. 200+ for formal RFCs)
- **Consistent**: All 6 ADRs follow identical structure
- **Bilingual headers**: English keys ("Status:", "Data:") with Portuguese content
- **Status-explicit**: "Decidido" vs "Decidido para MVP v1, Evolução Planejada" indicates decision durability
- **Consequence-focused**: Mandatory positive/negative split forces honest trade-off analysis

This represents a **structural decision** affecting how architectural knowledge is captured, reviewed, and evolved. The format choice impacts cognitive load (how easy to write/read ADRs), discoverability (can search for "Consequências"), and cultural norms (must document alternatives, not just chosen path).

Temporal context: All 6 ADRs created 2026-01-04 in single commit batch, suggesting the format was pre-established (perhaps from team template or MADR familiarity). No format evolution observable yet (too early).

---

## Why This Might Deserve an ADR

- **Impact**: Affects how all architectural decisions are documented across the project's lifetime. Establishes the "contract" for what constitutes a valid ADR (must have alternatives, must split consequences, must cite references).

- **Trade-offs**:
  - **Positive**: Lightweight encourages adoption (lower barrier to document decisions)
  - **Positive**: Structured format ensures consistency (all ADRs are comparable)
  - **Positive**: Consequence sections force honest trade-off thinking
  - **Negative**: Less formal than Y-statements or RFC-style formats (may lack rigor for compliance contexts)
  - **Negative**: Bilingual mixing (English keys, Portuguese content) could confuse international contributors
  - **Negative**: No explicit "superseded by" or "relates to" fields (relying on References section)

- **Complexity**: Low-moderate. The format is simple enough for anyone to adopt, but requires:
  - Discipline to document alternatives (not just chosen path)
  - Honesty in negative consequences (avoid glossing over trade-offs)
  - Awareness of what deserves an ADR vs. implementation note

- **Team Knowledge**: Important for consistency:
  - Contributors must know where ADRs live (`docs/adrs/documented/`)
  - Must understand when to create ADR vs. update HLD vs. comment in code
  - Bilingual team members may question English headers with Portuguese content

- **Future Implications**:
  - Enables automated validation (linting for required sections)
  - Supports ADR visualization tools (dependency graphs from References)
  - Constrains to text-based tooling (no interactive ADR dashboards without parsing)
  - May need evolution if team grows internationally (full English vs. full Portuguese decision)

**Temporal Context**: Format is brand new (2 days old). Too early to assess long-term stability, but batch creation of 6 ADRs suggests confidence in the structure.

---

## Evidence Found in Codebase

### Key Files
- [`/Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-001-wrapper-read-only.md`](/Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-001-wrapper-read-only.md) - Lines 1-44
  - Canonical example of the format
  - 44 lines: lightweight but complete

- [`/Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-003-fidelidade-batalha-real-engine-headless.md`](/Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-003-fidelidade-batalha-real-engine-headless.md) - Lines 1-~60
  - Longer ADR (~60 lines) showing format scales to complex decisions

- [`/Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-006-sem-ui-sem-ci-mvp.md`](/Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-006-sem-ui-sem-ci-mvp.md) - Lines 1-~65
  - Shows "Post-MVP" section extension (format flexibility)

### Code Evidence
```markdown
// From ADR-001-wrapper-read-only.md:1-24
# ADR-001: Wrapper Read-Only e Alterações no Editor RPG Maker

**Status:** Decidido
**Data:** 2026-01-04
**Contexto:** Reduzir risco de corrupção de dados e manter o editor RPG Maker MZ como fonte final de alteração de dados

## Contexto e Problema

O design de balanceamento de combate em RPGs de turno enfrenta um ciclo lento que pode levar 2-3 dias para validar a progressão. Uma ferramenta que escreva no banco do RPG Maker aumenta risco de divergência e corrupção de dados do projeto.

## Decisão

O sistema MVP v1 funciona como **wrapper read-only**, sem escrever em `data/` do projeto MZ. Todas as alterações de fórmulas, stats e dados continuam sendo feitas diretamente no editor RPG Maker MZ.

### Implementação

- NUNCA usar `fs.writeFileSync()`, `fs.appendFileSync()`, `fs.unlinkSync()` em `projectPath/data/`
- Usar apenas `fs.readFileSync()` para arquivos do projeto MZ
- Permitir escrita APENAS em `report/` (relatórios e exports)
- Criar `report/` se não existir, mas NUNCA dentro do `projectPath`
```

### Impact Analysis
- Introduced: 2026-01-04 (all 6 ADRs in single commit batch)
- Modified: 1 commit (initial creation, no evolution yet)
- Last change: 2026-01-04 (batch creation)
- Recent themes: "documented architectural decisions" (inferred)
- Affects: 6 ADR files, establishes pattern for all future ADRs
- Pattern consistency: 100% (all 6 ADRs follow identical structure)

### Alternatives (if observable)

**Evidence of rejected ADR formats** (inferred from chosen structure):

1. **Y-statements (Michael Nygard's original ADR format)**: Rejected
   - Observable: No "In the context of [use case], facing [concern], we decided for [option] to achieve [quality], accepting [downside]" structure
   - Chosen format is more verbose/explanatory vs. one-liner Y-statement

2. **RFC-style (IETF RFC format)**: Rejected
   - Observable: No "Abstract", "Introduction", "Specification", "Security Considerations" sections
   - No formal versioning or standards track metadata

3. **Unstructured commit messages**: Rejected
   - Observable: Decisions documented in dedicated files, not just commit messages
   - Git log has "chore: initial docs" vs. "ADR: Decide to use wrapper read-only pattern"

4. **HLD-embedded ADRs**: Rejected
   - Observable: ADRs in separate `docs/adrs/documented/` directory
   - HLD Section "Architectural Decisions (Documented)" references ADRs but doesn't contain them

5. **English-only ADRs**: Rejected
   - Observable: Portuguese content with English structural keywords
   - Suggests team preference for native language with international accessibility

---

## Questions to Address in ADR (if created)

- Why was this specific MADR-inspired format chosen over alternatives (Y-statements, RFCs, AsciiDoc ADRs)?
- Why the bilingual approach (English headers, Portuguese content) - who is the audience?
- What criteria determine if a decision deserves an ADR vs. HLD section vs. code comment?
- How will ADR lifecycle be managed (superseded, deprecated, amended)?
- Should there be tooling enforcement (linters checking for required sections)?
- How do ADRs relate to Git history (one ADR per PR, or batch commits)?
- What happens if the format proves insufficient (need diagrams, interactive decision trees)?
- Will there be ADR templates or examples for common decision types (technology selection, security, performance)?

---

## Related Potential ADRs
- Markdown as Primary Documentation Format (DOCS module) - Inheritance of text format
- Structured Documentation Hierarchy (DOCS module) - ADRs as separate layer from HLD/PRD
- (Pending) Portuguese as primary language for internal documentation

---

## Additional Notes

**MADR Influence**: The format closely resembles MADR (Markdown Any Decision Records) template, particularly:
- Status field at top
- Context and Problem Statement separation
- Considered Options (mapped to "Alternativas Consideradas")
- Pros/Cons lists (mapped to Consequências Positivas/Negativas)
- Likely the team is familiar with MADR or similar lightweight ADR practices

**Bilingual Quirk**: English structural keywords ("Status:", "Contexto:") with Portuguese content suggests:
- Team is Portuguese-speaking but wants international accessibility
- OR using a template with English headers but writing in native language
- This could be revisited if non-Portuguese contributors join

**Consistency Evidence**: All 6 ADRs:
- Start with `# ADR-XXX: [Title]`
- Have Status, Data, Contexto metadata
- Include Consequências split (positive/negative)
- Reference PRD/HLD in Referências section
- This 100% consistency in a batch creation suggests pre-established template, not ad-hoc invention

**No "Supersedes" Field**: Unlike some ADR formats, there's no explicit "Supersedes ADR-YYY" or "Amended by ADR-ZZZ" field. ADR-002 has "**Status:** Decidido para MVP v1, Evolução Planejada" which implies future revision, but no formal linking mechanism.

**Scoring Justification**:
- Not Step 0 category (format choice, not infrastructure)
- Passes Red Flags (not trivial config, affects system-wide documentation practice)
- Passes 3 E's (Structural to docs, Evident to contributors, Stable template)
- Score: Scope (10 - affects DOCS module primarily, referenced by others) + Cost (15 - changing ADR format mid-project is disruptive) + Knowledge (10 - important for contributors to know format) = 85/150
- Classification: **Consider** (75-99 range)
- Note: Could argue for higher score if ADRs are considered critical to project governance, but format choice is less impactful than content
