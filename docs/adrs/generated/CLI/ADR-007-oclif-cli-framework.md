# ADR-007: Oclif for CLI Framework

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-006

## Context and Problem Statement

The validation tool requires a robust CLI framework to handle argument parsing, command orchestration, and user interaction. The CLI layer serves as the primary entry point for all user interactions in MVP v1 (as established in ADR-006), exposing two main commands: `run-ttk` for executing TTK validation and `export-context` for splitting large JSON files.

The CLI must support required arguments (config paths), optional flags (seed, trecho, verbose, diagnostic), type validation, automatic help text generation, and user-friendly error handling. Critically, this is an **internal tool with long lifecycle expectations** that will evolve organically. What starts as a TTK validator may expand to include linters, generators, and build tools. Since the CLI will later become the backend when Electron UI is added post-MVP, the framework choice impacts both immediate developer experience and long-term extensibility.

## Decision Drivers

- Plugin architecture for organic tool growth (linters, generators, build tools)
- Native TypeScript integration to prevent runtime errors with complex flags
- Automatic documentation generation to reduce maintenance burden
- Framework maturity and enterprise backing for long-term support
- Support for modular development (separate npm packages)
- Future Electron UI backend integration
- Developer productivity when implementing new commands

## Considered Options

1. **Oclif (Open CLI Framework)** - Plugin-based architecture with TypeScript-first design
2. **Commander.js** - Simple, opinionated framework with explicit command definitions
3. **Yargs** - Flexible framework with powerful middleware and validation

## Decision Outcome

Chosen option: **Oclif**, because it provides the only architecture suitable for long-lifecycle internal tools. The plugin-based design allows modules to be developed and maintained as separate npm packages (@company/plugin-map-linter, @company/plugin-build), loaded dynamically by the core CLI. Native TypeScript integration eliminates runtime errors when manipulating complex game data structures. Automatic help text and README generation ensures documentation stays current without engineer intervention.

Oclif's maintenance by Heroku and Salesforce provides enterprise-grade stability critical for internal infrastructure tools.

## Pros and Cons of the Options

### Oclif (Open CLI Framework)

**Pros:**

- Plugin architecture enables organic growth without monolith bloat
- TypeScript-first design catches flag/argument errors at compile time
- Auto-generates help text and README documentation
- Enterprise backing (Heroku/Salesforce) ensures long-term support
- Class-based architecture provides clear separation of concerns
- Built-in support for multi-command CLIs with subcommands

**Cons:**

- Steeper initial learning curve than Commander.js
- More boilerplate for simple single-command tools
- Heavier dependency footprint than minimal alternatives

### Commander.js

**Pros:**

- Simplest API with minimal boilerplate
- Massive community adoption (5M+ weekly downloads)
- Excellent for single-purpose CLIs

**Cons:**

- No plugin architecture for modular growth
- TypeScript support is secondary (JavaScript-first design)
- Manual documentation maintenance required
- Becomes unwieldy as tool complexity grows

### Yargs

**Pros:**

- Powerful middleware system for complex validation
- Flexible and customizable
- Strong community support

**Cons:**

- No plugin architecture for separation of concerns
- Verbose API increases boilerplate
- Flexibility leads to inconsistent patterns across large codebases
- Not designed for long-lifecycle internal tools

## Consequences

Adopting Oclif establishes a modular, extensible foundation for the CLI tool. Future capabilities (map linting, build generation, asset validation) can be developed as independent plugins without polluting the core codebase. The TypeScript-first design prevents entire classes of runtime errors when handling complex RPG Maker MZ data structures.

Documentation auto-generation ensures game designers can use the tool without constant engineer support. When Electron UI is added post-MVP, each CLI command maps cleanly to a backend handler with identical semantics.

Migration to a different framework would require significant refactoring (estimated 4-6 weeks), but this risk is acceptable given Oclif's enterprise backing and the architectural benefits for a tool expected to grow over multiple years.

## References

- /Users/edney/projects/coreto/game-engine/docs/pesquisas/Arquitetura CLI Node.js RPG Maker MZ.md:40-48
- /Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md:91-101
- /Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-006-sem-ui-sem-ci-mvp.md
