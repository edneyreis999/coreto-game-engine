# Potential ADR: JSON-Based Configuration File Format

**Module**: CONFIG
**Category**: Architecture
**Priority**: Consider (Score: 85)
**Date Identified**: 2026-01-04

---

## What Was Identified

The system uses **JSON** as the configuration file format (`project.config.json`) for defining project settings, trechos (game sections), TTK targets, and party configurations. This decision appears implicit in the documentation but represents a significant architectural choice.

Alternative formats commonly used for configuration include YAML, TOML, JavaScript/TypeScript files, or environment variables. The choice affects:

- Human readability and editability
- Comments and documentation support
- Type safety and validation
- Integration with RPG Maker MZ ecosystem (which uses JSON for all data files)
- Tooling and editor support

**Current State:** Documentation assumes JSON format throughout, with extensive schema examples. No implementation exists yet (greenfield project).

## Why This Might Deserve an ADR

- **Impact**: Affects how game designers interact with the tool - they must manually edit configuration files
- **Trade-offs**:
  - **Pro**: Consistent with RPG Maker MZ data format (Classes.json, Enemies.json, etc.)
  - **Pro**: Easy programmatic parsing with native Node.js support
  - **Con**: No comment support for documenting complex trecho definitions
  - **Con**: Manual editing is error-prone (missing commas, brackets)
- **Complexity**: Config structure is nested and extensive (multiple trechos × troops × party members)
- **Team Knowledge**: Game designers need to understand JSON syntax or use helper tools
- **Future Implications**:
  - May drive need for UI tool (Electron app planned for post-MVP)
  - Affects validation error messages (pointing to JSON line/column)
  - Integration with version control (merge conflicts in JSON)

**Temporal Context:** This is an implicit decision present in all documentation since initial planning phase.

## Evidence Found in Codebase

### Key Files
- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 108
  - "Leitura de `project.config.json`" in Config Layer responsibilities

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 304-309
  - Full JSON schema example for ProjectConfig

- [`/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`](/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) - Line 351
  - "Config store: arquivos JSON versionados no repositório"

### Code Evidence
```json
// Schema example from HLD Section 5.1:
{
  "projectPath": "/Users/edney/projects/coreto/projectX/frontend",
  "seed": 12345,
  "trechos": [
    {
      "id": "ato1-nivel1-10",
      "name": "Prólogo e Mundo Comum",
      "anchorLevelRange": { "min": 1, "max": 10 },
      "ttkTarget": { "turns": 3, "actions": 4 },
      "tolerance": { "turns": 1, "actions": 1 },
      "troopIds": [1, 2, 3, 4, 5, 6, 7, 8],
      "party": {
        "members": [
          { "classId": 1, "level": 5 },
          { "classId": 2, "level": 5 }
        ]
      }
    }
    // Multiple trechos would follow...
  ]
}
```

### Impact Analysis
- Introduced: Not yet implemented (present in all documentation)
- Affects: 2 files initially (project.config.json), potentially more for multi-config setups
- Related: RPG Maker MZ uses JSON for all data files (Classes.json, Enemies.json, Troops.json, Skills.json)
- CLI Integration: Must parse JSON from `--config` argument path

### Alternatives (if observable)

**YAML:**
- Pros: Comments support, more human-readable, less punctuation
- Cons: Indentation-sensitive, requires yaml parsing library, inconsistent with MZ

**TOML:**
- Pros: Designed for config files, comments, less verbose than JSON
- Cons: Less common in Node.js ecosystem, learning curve

**TypeScript/JavaScript Config Files:**
- Pros: Type safety, code completion, validation at authoring time
- Cons: Requires compilation/execution, security concerns, more complex

**Hybrid (JSON + .env for overrides):**
- Pros: Base config in JSON, runtime overrides via environment variables
- Cons: Split configuration source, more complex loading logic

**Context from Documentation:**
- RPG Maker MZ ecosystem is JSON-based
- CLI tool targets game designers (not necessarily programmers)
- MVP has no UI - manual file editing required
- Git-versioned configurations expected

## Questions to Address in ADR (if created)

- Why JSON over YAML/TOML for human editability?
- How are designers expected to edit configurations without UI?
- Is comment support needed for documenting trecho definitions?
- What tooling will help with JSON validation during editing (IDE plugins, schema files)?
- Will there be multiple config files or a single monolithic config?
- How does JSON choice align with future Electron UI plans?
- What's the migration path from JSON to another format if needed?

## Related Potential ADRs
- Schema Validation Library (Zod vs Joi) - must-document/ folder
- CLI Configuration Override Strategy (--seed, --trecho flags)
- Electron UI for Config Management (post-MVP)

## Additional Notes

**Scoring Breakdown:**
- **Step 0**: Does not apply (not infrastructure/framework/ORM/API)
- **Scope + Impact**: 15 (affects CONFIG and CLI modules, user-facing)
- **Cost to Change**: 20 (requires parser rewrite, schema migration, doc updates)
- **Team Knowledge**: 50 (game designers must understand format, affects UX)
- **Total**: 85/150

**Special Considerations:**
- **Implicit Decision**: Never explicitly discussed in docs, assumed throughout
- **Ecosystem Alignment**: Matches RPG Maker MZ's JSON-everywhere approach
- **UX Concern**: Manual JSON editing is error-prone without tooling
- **Future Mitigation**: Electron UI (Section 8.5.4 in HLD) planned to abstract JSON editing

**Why "Consider" Priority:**
While important for UX, this decision:
- Is somewhat conventional (JSON is standard for Node.js config)
- Has lower technical risk (well-understood format)
- Can be augmented with tooling (JSON Schema for IDE validation)
- Aligns naturally with existing RPG Maker MZ ecosystem
