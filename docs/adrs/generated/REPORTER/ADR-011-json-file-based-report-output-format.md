# ADR-011: JSON File-Based Report Output Format

**Status:** Accepted
**Date:** 2026-01-04

---

## Context and Problem Statement

The REPORTER module needs a standardized format to output validation results from game balance analysis. The system must support consumption by multiple downstream tools including CLI displays, future Electron UI, CI/CD pipelines, and AI analysis tools.

The report output strategy must align with MVP v1 constraints (offline-first, no server infrastructure, single-developer workflow) while remaining extensible for future enhancements like historical tracking and collaborative analysis.

Key consumption patterns include:

- Manual review by game designers analyzing balance issues
- Automated CI/CD integration for pass/fail decisions
- AI-powered analysis of validation patterns
- Future UI development requiring structured data contract

## Decision Drivers

- **Offline-first requirement**: System must operate without network dependencies
- **AI-friendly design goal**: Output must be easily parseable by AI tools and scripts
- **MVP simplicity**: Avoid database infrastructure and server components in v1
- **Multi-consumer contract**: CLI, future Electron UI, and CI/CD tools need consistent format
- **Git-friendly workflow**: Reports should be version-controllable alongside game data
- **Schema evolution**: Format must support adding fields without breaking existing parsers

## Considered Options

1. **JSON file on local filesystem** (chosen)
2. **Database storage** (SQLite or PostgreSQL)
3. **Multiple granular files** (per-trecho or per-module JSON files)

## Decision Outcome

Chosen option: **JSON file on local filesystem**, specifically writing to `report/report.json` with complete validation results overwritten on each execution.

**Rationale**: This approach directly satisfies the offline-first requirement, eliminates database dependencies for MVP v1, provides human and AI-readable format, and integrates seamlessly with Git-based workflows. The single-file design simplifies consumption by downstream tools while remaining compatible with planned Electron UI integration.

The JSON structure includes metadata (timestamp, seed, project path), execution summary (timing, warning counts, success rates), detailed trecho-level results, and aggregated statistics.

## Pros and Cons of the Options

### JSON file on local filesystem

**Pros:**

- Zero infrastructure dependencies (no database, no server)
- Human-readable and diff-friendly for version control
- Native AI tool compatibility (parseable by LLMs and scripts)
- Simple error handling (file I/O only)
- Portable across development environments
- Supports offline usage completely

**Cons:**

- No built-in versioning or historical tracking (overwrite-per-run)
- Limited querying capabilities compared to databases
- Manual retention management required
- Potential file locking issues with concurrent access
- Less efficient than binary formats for large datasets

### Database storage

**Pros:**

- Advanced querying and filtering of historical results
- Built-in indexing and aggregation capabilities
- Concurrent access handling
- Transaction-based consistency guarantees

**Cons:**

- Introduces infrastructure dependency (SQLite file or PostgreSQL server)
- Complicates offline-first requirement
- Adds complexity to MVP v1 scope
- Requires migration tooling and backup strategies
- Not directly Git-versionable

### Multiple granular files

**Pros:**

- Enables partial result processing
- Reduces memory footprint for large reports
- Supports parallel generation of per-trecho outputs

**Cons:**

- Complicates consumption logic (multiple file reads)
- Increases directory management complexity
- Makes atomic updates harder to guarantee
- Reduces portability (must zip/bundle for sharing)

## Consequences

**Positive:**

- **Simplified deployment**: No database setup or migration scripts needed
- **Developer experience**: Reports immediately inspectable with text editors or jq
- **CI/CD integration**: Standard JSON parsing libraries work out-of-box
- **Version control**: Report snapshots can be committed alongside game data for regression testing
- **Future UI readiness**: JSON contract already defined for Electron app integration

**Negative:**

- **Manual history management**: Developers must manually archive reports before re-running if preservation needed
- **Scalability limitations**: Large game projects may generate multi-MB JSON files with performance implications
- **Query constraints**: Analyzing trends across multiple runs requires custom scripting

**Neutral:**

- **Schema evolution burden**: Adding fields requires coordination with all consuming tools, though backward-compatible additions are safe
- **Migration path defined**: Future database migration is feasible by batch-importing historical JSON files if needed

## References

- `docs/hld-coreto-game-engine.md:172-186` - Reporter Layer architecture definition
- `docs/hld-coreto-game-engine.md:599-616` - FinalReport data model specification
- `docs/hld-coreto-game-engine.md:724-776` - Reporter interface and JSON schema
- `docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md:249-272` - FR-008 functional requirement
