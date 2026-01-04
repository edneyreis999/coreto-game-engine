# Potential ADR: JSON File-Based Report Output Format

**Module**: REPORTER
**Category**: Architecture
**Priority**: Must Document (Score: 125/150)
**Date Identified**: 2026-01-04

---

## What Was Identified

The REPORTER module is designed to output validation results as a **structured JSON file** (`report/report.json`) written to the local filesystem, rather than alternative formats like databases, streaming APIs, or real-time dashboards. This architectural choice establishes JSON as the primary contract for report consumption.

The decision encompasses:
- **File-based persistence**: Reports written to `report/report.json` (overwritten each run)
- **JSON serialization**: Structured data with metadata, summary, trechos array, warnings, and aggregates
- **Local filesystem**: No remote storage, databases, or cloud services in MVP v1
- **Single file output**: Complete report in one JSON file (vs. multiple files or streaming)

This pattern was documented in the HLD (Section 3.6, 6.4) and PRD (FR-008), indicating it's a foundational architectural decision made during the planning phase.

## Why This Might Deserve an ADR

**Impact**: Affects system integration boundaries and tooling ecosystem
- Determines how downstream tools (CI/CD, analytics, visualization) consume validation results
- Establishes contract for future UI development (Electron, planned post-MVP)
- Influences data retention, versioning, and historical analysis capabilities
- Affects error handling strategy (file I/O vs. database transactions)

**Trade-offs**: Clear constraints visible in documentation
- **Simplicity vs. Scalability**: File-based approach prioritizes MVP simplicity over advanced querying/analytics
- **Offline-first vs. Collaboration**: Local files enable offline usage but complicate team sharing
- **Overwrite vs. History**: Each run overwrites previous report (no built-in versioning)
- **Portability vs. Performance**: JSON is portable but less efficient than binary formats for large datasets

**Complexity**: Non-trivial implications
- Requires directory management (`report/` creation if not exists)
- Error handling for file permissions, disk space, concurrent access
- Schema evolution strategy (adding fields without breaking parsers)
- Future migration path if database becomes necessary

**Team Knowledge**: Critical for integration and tooling
- Any engineer building downstream tools must understand JSON schema
- CI/CD integration depends on parsing this format
- Future UI development starts with this contract
- Game designers need to understand report structure to interpret results

**Future Implications**: Long-term architectural consequences
- **Post-MVP UI** (Section 8.5.4 HLD): Electron app will parse this JSON
- **Historical tracking**: Documented as potential future need (Section 7.1 HLD: "rotation optional")
- **CI Integration** (planned post-MVP): Will consume JSON for pass/fail decisions
- **Migration cost**: Moving to database/API later requires significant rework

## Evidence Found in Codebase

### Key Files
This is a **documentation-only decision** (greenfield project). Evidence comes from:

- [`docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 172-186 (Reporter Layer definition)
- [`docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 599-616 (FinalReport data model)
- [`docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 724-776 (Interface specification)
- [`docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`](../../../docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) - Lines 249-272 (FR-008)

### Code Evidence (from HLD documentation)

**Documented Interface (HLD Section 6.4):**
```json
{
  "timestamp": "2026-01-04T12:00:00Z",
  "seed": 12345,
  "projectPath": "/Users/edney/projects/coreto/projectX/frontend",
  "summary": {
    "executionTimeMs": 589432,
    "totalTrechos": 6,
    "totalBattles": 48,
    "totalWarnings": 3,
    "warningsByType": {
      "ttk_out_of_tolerance": 2,
      "troop_not_found": 1
    },
    "successRate": 93.75,
    "peakMemoryMB": 1024
  },
  "trechos": [...]
}
```

**Documented Responsibilities (HLD Section 3.6):**
- "Serializar `report/report.json` com estrutura completa"
- "Criar diretório `report/` se não existir"
- "Node.js `fs` (writeFileSync), JSON serialization"

### Impact Analysis
- **Project Phase**: Planning/Documentation (TRL 3)
- **Decision Date**: Documented 2026-01-04 (HLD creation)
- **Files Affected**: Future implementation (`src/reporter/*.js/ts`, estimated 6-10 files per mapping)
- **Modules Affected**:
  - REPORTER (producer)
  - CLI (consumer - displays summary)
  - AI EXPORTER (potential consumer)
  - Future UI (Electron, documented in Section 8.5.4)

### Alternatives (explicitly mentioned in documentation)

**HLD Section 7.1 notes:**
- **Historical tracking with rotation**: "report.json pode crescer com histórico. Estratégia de rotação opcional (manter últimas N execuções)"
  - Implies file-based approach chosen over database for MVP
  - Acknowledges future need for retention management

**Implicit alternatives (not chosen):**
- **Database storage**: Rejected for MVP v1 (no DB in tech stack, Section 2.1)
- **Multiple output files**: Rejected in favor of single `report.json`
- **Streaming/real-time output**: Not compatible with batch CLI design
- **Binary formats** (Protobuf, MessagePack): Not mentioned, JSON prioritized for readability

**Rationale for JSON file (inferred from design):**
- Aligns with "IA friendly" goal (PRD line 52): JSON is parseable by AI tools
- Matches CLI-only MVP scope (no server/API needed)
- Supports offline-first requirement (RNF: "rodar localmente sem dependência de rede")
- Enables version control of reports (Git-friendly format)

## Questions to Address in ADR (if created)

**Context and Problem:**
- What are the report consumption patterns (manual review, CI automation, AI analysis)?
- Why prioritize simplicity over advanced querying/analytics in MVP v1?
- What are retention and historical analysis requirements?

**Decision:**
- Why JSON over binary formats (Protobuf, MessagePack)?
- Why single file over multiple files (per-trecho outputs)?
- Why local filesystem over database or remote storage?
- Why overwrite-per-run vs. append/version strategy?

**Alternatives Considered:**
- Database storage (SQLite, PostgreSQL) for queryable results
- Multiple JSON files (per-trecho, per-module) for granular access
- Streaming output (NDJSON) for real-time monitoring
- Binary serialization for performance

**Consequences:**
- **Positive**: Simple, offline-capable, Git-friendly, AI-parseable, no DB dependency
- **Negative**: No built-in versioning, limited querying, manual history management
- **Risks**: File size growth, concurrent access issues, schema evolution complexity
- **Migration path**: How to transition to database if scalability becomes issue?

## Related Potential ADRs
- *None identified yet* (this is the first REPORTER module analysis)
- **Future consideration**: Report schema versioning strategy
- **Future consideration**: Historical report retention and rotation

## Additional Notes

**Greenfield Status**: This decision exists only in documentation. No implementation code has been written yet. The architectural choice was made during planning phase (HLD v1.0, dated 2026-01-04).

**Post-MVP Evolution Hints**:
- HLD Section 7.1 mentions "estratégia de rotação opcional" - indicates awareness of retention needs
- HLD Section 8.5.4 plans Electron UI - JSON will be the integration point
- PRD line 43 mentions "Facilitar uso de IA" - JSON format supports this goal

**Scoring Rationale**:
- **Scope + Impact**: 25/25 (affects all downstream consumers: CLI, future UI, CI, AI tools)
- **Cost to Change**: 25/25 (changing output format requires rework of all consumers + migration)
- **Team Knowledge**: 25/25 (every role needs to understand: developers parse it, designers read it, CI uses it)
- **Base Score**: 50 (architectural decision about primary interface contract)
- **Total**: 125/150 → Must Document
