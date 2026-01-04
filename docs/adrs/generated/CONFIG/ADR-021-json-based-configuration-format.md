# ADR-021: JSON-Based Configuration File Format

**Status:** Accepted
**Date:** Unknown
**Related ADRs:** ADR-008, ADR-011

---

## Context and Problem Statement

The coreto game engine requires a configuration file format for defining project settings, trechos (game sections), TTK targets, and party configurations in `project.config.json`. This choice affects how game designers interact with the tool, as manual configuration file editing is required in the MVP (Electron UI is planned for post-MVP).

The configuration structure is complex and deeply nested, containing multiple trechos with anchor level ranges, TTK targets, tolerance values, troop IDs, and party member arrays. Alternative formats like YAML, TOML, TypeScript config files, or environment variables offer different trade-offs in human readability, comment support, type safety, and ecosystem integration.

The decision must consider alignment with the RPG Maker MZ ecosystem (which uses JSON for all data files like Classes.json, Enemies.json, Troops.json), tooling support for validation and editing, and the path toward future UI-based configuration management.

## Decision Drivers

- Consistency with RPG Maker MZ data format ecosystem and conventions
- Native parsing support in Node.js runtime without additional libraries
- Integration with schema validation approach for startup-time validation
- Manual editability by game designers during MVP phase without UI tools
- Version control compatibility for Git-based configuration management
- Migration path toward future Electron UI for visual configuration editing

## Considered Options

1. JSON configuration files
2. YAML configuration files
3. TypeScript configuration files with code execution

## Decision Outcome

Chosen option: JSON configuration files, because JSON provides seamless consistency with the RPG Maker MZ ecosystem (which uses JSON for all data files), offers native Node.js parsing without dependencies, integrates naturally with the chosen Zod schema validation library, and supports programmatic generation for the planned Electron UI.

The decision accepts the trade-off of no comment support and manual editing challenges in exchange for ecosystem alignment and tooling simplicity. Error-prone manual JSON editing is acknowledged as a temporary MVP constraint, mitigated by JSON Schema validation in IDEs and resolved by the planned Electron UI.

## Pros and Cons of the Options

### JSON configuration files

**Pros:**

- Perfect alignment with RPG Maker MZ data format conventions (Classes.json, Enemies.json, Troops.json)
- Native Node.js parsing without external dependencies
- Direct integration with Zod validation library
- Programmatic generation from future Electron UI is straightforward
- Well-understood format with extensive tooling support
- Git diff-friendly for version control tracking

**Cons:**

- No native comment support for documenting complex trecho definitions
- Manual editing is error-prone (missing commas, bracket mismatches)
- Requires JSON Schema in IDE or validation tooling to prevent syntax errors
- Learning curve for non-programmer game designers

### YAML configuration files

**Pros:**

- Comment support for documenting configuration decisions
- More human-readable with less punctuation and clearer structure
- Indentation-based syntax reduces bracket errors
- Better manual editability during MVP phase

**Cons:**

- Inconsistent with RPG Maker MZ ecosystem conventions
- Requires YAML parsing library dependency
- Indentation-sensitive format creates different error patterns
- Less common in Node.js configuration contexts
- Complicates future Electron UI generation logic

### TypeScript configuration files

**Pros:**

- Type safety and autocompletion during configuration authoring
- Code validation at development time catches errors early
- Supports programmatic configuration generation with full JavaScript logic

**Cons:**

- Requires compilation or execution introducing security concerns
- Significant complexity increase for configuration loading
- Incompatible with visual Electron UI editing approach
- Inappropriate for end-user game designer workflows

## Consequences

Configuration files will use JSON format with schema validation enforced by Zod at CLI startup. Validation errors will reference JSON structure (line numbers, property paths) in error messages, requiring clear feedback design.

Game designers must either develop JSON editing proficiency or rely on IDE plugins with JSON Schema support during the MVP phase. The project will provide JSON Schema files to enable IDE autocompletion and validation, reducing manual editing errors.

The Electron UI development (post-MVP) will read and write JSON configuration files, requiring bidirectional conversion between UI state and JSON structure. The JSON format choice simplifies this integration compared to executable configuration formats.

Version control workflows will track JSON configuration changes with standard Git diff, enabling code review of balance adjustments and configuration evolution over time.

## References

- docs/hld-coreto-game-engine.md:108
- docs/hld-coreto-game-engine.md:304-309
- docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md:351
