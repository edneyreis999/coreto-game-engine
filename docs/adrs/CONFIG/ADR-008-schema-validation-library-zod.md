# ADR-008: Schema Validation Library for Configuration

**Status:** Proposed
**Date:** Unknown

---

## Context and Problem Statement

The CONFIG module serves as the foundation layer for the coreto game engine, a deterministic TTK validation system for RPG Maker MZ. Every module in the architecture depends on CONFIG for validated configuration data from `project.config.json`.

The configuration structure is complex, containing nested objects with strict validation requirements: numeric ranges (seed > 0, levels 1-99), array constraints (minimum elements), and deeply nested structures (Trecho → PartyConfig → members → TrechoConfig). The system must reject invalid configurations at startup to prevent runtime errors during headless battle simulations.

A runtime schema validation library is required to enforce type safety, data integrity, and provide clear error messages for CLI users. The decision must consider TypeScript integration, developer experience, bundle size, and validation feature richness. This choice is foundational because CONFIG has no dependencies and all seven modules (CLI, LOADER, RUNTIME, SIMULATION, REPORTER, EXPORTER) depend on it.

## Decision Drivers

- TypeScript integration quality and type inference capabilities for schema-to-type conversion
- Error message clarity for end-user CLI feedback when configuration is invalid
- Complex validation requirements including nested objects, arrays, ranges, and strict mode
- Developer experience for defining and maintaining extensive schemas across project lifecycle
- Runtime performance impact at application startup
- Bundle size and dependency footprint for CLI distribution

## Considered Options

1. Zod - TypeScript-first schema validation library
2. Joi - Mature JavaScript-first validation library
3. Manual validation with custom TypeScript interfaces

## Decision Outcome

Chosen option: Zod, because it provides native TypeScript integration with automatic type inference from schemas, eliminating dual maintenance of schemas and types. The TypeScript-first approach aligns with the project's planned technology stack and offers superior developer experience for defining complex nested structures. Smaller bundle size (8KB vs 145KB) is beneficial for CLI distribution, and modern ecosystem adoption provides good long-term support.

### Positive Consequences

- Automatic TypeScript type inference reduces boilerplate and prevents schema-type drift
- Smaller bundle size improves CLI installation and startup performance
- TypeScript-first design matches project technology choices
- Modern chainable API simplifies complex nested schema definitions
- Growing ecosystem adoption ensures continued support

### Negative Consequences

- Less mature than Joi (2018 vs 2012), potential edge cases in validation features
- Smaller community means fewer Stack Overflow resources and examples
- Migration to alternative validation library would require complete schema rewrite
- Team must learn Zod-specific syntax and patterns

## Pros and Cons of the Options

### Zod

- Good: Native TypeScript type inference eliminates manual type definitions
- Good: Smaller bundle (8KB minified) reduces CLI distribution size
- Good: Modern chainable API improves schema readability
- Good: Growing adoption in TypeScript ecosystem
- Bad: Younger library with potentially fewer battle-tested edge cases
- Bad: Smaller community and documentation compared to Joi
- Bad: Less rich validation feature set out-of-box

### Joi

- Good: Mature and battle-tested since 2012 with extensive production use
- Good: Richer validation features available out-of-box
- Good: Larger community and comprehensive documentation
- Good: Excellent error message customization capabilities
- Bad: JavaScript-first requires manual TypeScript type definitions
- Bad: Larger bundle (145KB with dependencies) increases CLI size
- Bad: No automatic type inference creates dual maintenance burden
- Bad: Verbose schema definition syntax for nested structures

### Manual Validation

- Good: Zero external dependencies
- Good: Complete control over validation logic and error messages
- Good: No learning curve for validation library syntax
- Bad: High maintenance burden for complex nested schemas
- Bad: Error-prone manual type checking and range validation
- Bad: No schema reusability or composition patterns
- Bad: Requires extensive custom test coverage

## Consequences

Schema definitions will be centralized in the CONFIG module and must handle complex nested structures including Trecho configurations with anchor level ranges, TTK targets, tolerances, troop IDs, and party member arrays. The chosen library will shape how validation errors are surfaced to CLI users, affecting the quality of developer feedback during configuration debugging.

Future schema extensions (additional validation rules, new configuration sections) must work within Zod's feature set. If migration becomes necessary, all schemas must be rewritten in the new library's syntax, affecting all modules that consume CONFIG types.

Testing strategy will use Zod's schema parsing in fixtures and mocks. CLI error messages will leverage Zod's built-in error formatting to provide actionable feedback for configuration issues.

## References

- docs/hld-coreto-game-engine.md:116 - Config Layer validation requirements
- docs/hld-coreto-game-engine.md:902 - Security validation specification
- docs/adrs/mapping.md:180 - CONFIG module technology choices
