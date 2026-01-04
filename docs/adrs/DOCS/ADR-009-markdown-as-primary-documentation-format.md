# ADR-009: Markdown as Primary Documentation Format

**Status:** Accepted
**Date:** 2026-01-02
**Related ADRs:** ADR-001, ADR-006

## Context and Problem Statement

The project established a documentation-first approach before any implementation code was written. With approximately 200KB of documentation spanning product requirements, high-level design, technical research, and architectural decision records, a foundational choice was needed for the documentation format.

The decision affects how all stakeholders access and contribute to project knowledge, establishes tooling requirements, defines review workflows, and impacts the long-term maintainability of technical documentation. The team needed a format that supports version control, enables collaborative review, and aligns with the project's Git-based, local-first philosophy.

## Decision Drivers

- Git-based versioning and diff-based review capabilities for documentation changes
- Cross-platform accessibility without proprietary tools or licenses
- Alignment with read-only wrapper philosophy and text-based workflows
- Support for complex technical documentation including tables, code blocks, and nested structures
- Integration with existing developer workflows and minimal tooling overhead
- Future extensibility for static site generation and automated validation

## Considered Options

1. Markdown files in version control
2. Collaborative platforms (Confluence, Notion, Google Docs)
3. WYSIWYG word processors (Microsoft Word, LibreOffice)

## Decision Outcome

Chosen option: Markdown files in version control, because it enables documentation-as-code practices with full Git versioning, supports PR-based collaborative review, requires no proprietary tools, and aligns with the project's text-based, local-first architectural philosophy.

The decision was implemented in the initial commit (2026-01-02) and has proven stable through intensive documentation work, producing 8 markdown files including a 1,637-line high-level design document and a comprehensive 455-line product requirements document.

## Pros and Cons of the Options

### Markdown files in version control

**Pros:**

- Full version control with Git history and diff-based reviews
- Cross-platform compatibility without proprietary software dependencies
- Plain text format enables automated validation and linting
- Supports static site generation for future documentation portals
- Documentation changes follow same PR workflow as code changes
- Lightweight syntax suitable for technical content with code examples

**Cons:**

- Requires technical literacy in Markdown syntax and Git operations
- No WYSIWYG editing or real-time collaboration features
- Interactive content (diagrams, videos) requires external hosting
- Learning curve for non-technical stakeholders such as game designers

### Collaborative platforms (Confluence, Notion, Google Docs)

**Pros:**

- WYSIWYG editing with real-time collaboration
- Rich media support for embedded diagrams and videos
- Lower barrier to entry for non-technical contributors
- Built-in commenting and discussion features

**Cons:**

- Requires network connectivity and external service dependencies
- Limited or no version control integration with Git
- Proprietary lock-in and potential licensing costs
- Difficult to enforce review workflows and approval processes
- Incompatible with documentation-as-code practices

### WYSIWYG word processors (Microsoft Word, LibreOffice)

**Pros:**

- Familiar interface for most users
- Advanced formatting capabilities
- No Markdown syntax learning required

**Cons:**

- Binary or XML formats difficult to diff in version control
- Requires specific software installations
- Merge conflicts are nearly impossible to resolve
- No automated validation or linting support
- Incompatible with text-based Git workflows

## Consequences

The Markdown decision establishes documentation-as-code as a core practice, requiring all contributors to develop basic Markdown and Git proficiency. Documentation changes follow the same PR-based review process as code, ensuring technical review and approval before merging.

This enables future automation including broken link checking, Markdown linting, and static site generation. The project can evolve toward automated documentation validation in CI/CD pipelines and integrate with tools like MkDocs, Docusaurus, or VitePress without format migration.

The text-based format constrains interactive content capabilities. Complex diagrams must be created externally and linked as images, and video demonstrations require external hosting. Non-technical stakeholders face a higher initial barrier to contribution compared to WYSIWYG alternatives.

## References

- /Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md:1-1637
- /Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md:1-455
- /Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md:1-356
