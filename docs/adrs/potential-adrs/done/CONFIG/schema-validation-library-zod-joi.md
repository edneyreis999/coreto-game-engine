# Potential ADR: Schema Validation Library for Configuration (Zod vs Joi)

**Module**: CONFIG
**Category**: Technology
**Priority**: Must Document (Score: 145)
**Date Identified**: 2026-01-04

---

## What Was Identified

The CONFIG module requires a runtime schema validation library to enforce type safety and data integrity for the `project.config.json` file. Documentation explicitly mentions two candidates: **Zod** and **Joi**, without making a final selection.

This decision is foundational because the Config Layer is the base layer with no internal dependencies—every other module depends on it. The validation library choice affects:

- Type inference capabilities (TypeScript integration)
- Error message quality for end users
- Runtime performance (validation happens at startup)
- Developer experience (schema definition syntax)
- Bundle size and dependency footprint

**Current State:** Documentation mentions both options as "proposed" but no implementation exists yet (greenfield project).

## Why This Might Deserve an ADR

- **Impact**: Affects the entire application - every module depends on CONFIG for validated configuration
- **Trade-offs**:
  - **Zod**: TypeScript-first with excellent type inference, smaller bundle, better DX for TS projects
  - **Joi**: More mature, JavaScript-first, richer validation features, larger ecosystem
- **Complexity**: Schema definitions will be extensive (nested objects: Trecho → PartyConfig → members array → TrechoConfig)
- **Team Knowledge**: Team must understand chosen library's syntax for maintaining/extending schemas
- **Future Implications**:
  - Difficult to swap once schemas are defined (migration cost)
  - Affects testing strategy (mocking, fixtures)
  - Impacts CLI error messages quality

**Temporal Context:** This is a planned decision for Phase 1 (Foundation, 4-6 weeks) of the implementation roadmap.

## Evidence Found in Codebase

### Key Files
- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 116
  - Mentions "Zod ou Joi para validação de schema" in Config Layer responsibilities

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 902
  - Security section specifies "Validar schema JSON (usando biblioteca como Joi ou Zod)"

- [`/Users/edney/projects/coreto/game-engine/docs/adrs/mapping.md`](/Users/edney/projects/coreto/game-engine/docs/adrs/mapping.md) - Lines 180
  - Lists "Proposed: Zod or Joi for schema validation" in CONFIG module

### Code Evidence
```typescript
// Expected schema structure (from HLD Section 5.1):
// ProjectConfig
{
  "projectPath": "/path/to/rpg-maker-mz/project",  // string, absolute path
  "seed": 12345,                                    // number > 0
  "trechos": [                                      // array, min 1 element
    {
      "id": "ato1-nivel1-10",                      // string, unique
      "name": "Prólogo e Mundo Comum",             // string
      "anchorLevelRange": { "min": 1, "max": 10 }, // nested object, 1 ≤ min < max ≤ 99
      "ttkTarget": { "turns": 3, "actions": 4 },   // nested object, positive integers
      "tolerance": { "turns": 1, "actions": 1 },   // nested object, positive integers
      "troopIds": [1, 2, 3],                       // number[], positive integers
      "party": {                                    // nested object
        "members": [                                // array, min 1
          { "classId": 1, "level": 5 }             // classId > 0, 1 ≤ level ≤ 99
        ]
      }
    }
  ]
}
```

### Impact Analysis
- Introduced: Not yet implemented (greenfield project)
- Affects: All 7 modules (CLI, CONFIG, LOADER, RUNTIME, SIMULATION, REPORTER, EXPORTER)
- Validation Requirements (from HLD 8.2):
  - Validate ranges numéricos (seed > 0, levels entre 1-99, troopIds > 0)
  - Validar tipos de dados (strings, numbers, arrays)
  - Rejeitar configurações com campos desconhecidos (strict mode)
  - Validar estrutura de troops e parties

### Alternatives (if observable)

Documentation explicitly lists two alternatives:

**Zod:**
- TypeScript-first approach
- Excellent type inference (inferred TypeScript types from schemas)
- Smaller bundle size (~8KB minified)
- Modern, growing adoption in TS ecosystem
- Better developer experience for TypeScript projects

**Joi:**
- More mature and battle-tested (created 2012 vs Zod 2018)
- Richer validation features out-of-box
- Better documentation and larger community
- JavaScript-first (requires manual TypeScript type definitions)
- Larger bundle size (~145KB minified with dependencies)

**Context from Documentation:**
- Project uses TypeScript as planned language
- Jest for testing (both libraries have Jest integration)
- CLI tool (bundle size less critical than web apps)
- Complex nested schemas required

## Questions to Address in ADR (if created)

- Why was Zod or Joi chosen over the other?
- What specific validation features are required (ranges, nested objects, arrays, strict mode)?
- How does TypeScript integration influence the choice?
- What is the migration path if requirements change?
- How will validation errors be surfaced to CLI users?
- Are there performance benchmarks for validation of complex configs?
- How will schema definitions be organized (single file vs modular)?

## Related Potential ADRs
- JSON Configuration File Format (consider/ folder)
- CLI Framework Choice (Commander.js vs Yargs) - future analysis

## Additional Notes

**Scoring Breakdown:**
- **Step 0 Base Score**: 75 (Category 3: Primary validation library for base layer)
- **Scope + Impact**: 25 (affects all modules, base layer dependency)
- **Cost to Change**: 25 (requires schema rewrite, affects all validation logic)
- **Team Knowledge**: 20 (critical for maintaining/extending config schemas)
- **Total**: 145/150

**Special Considerations:**
- This is a **greenfield project** - no legacy code constraints
- TypeScript is the planned language - may favor Zod
- Phase 1 (Foundation) priority - decision needed early
- Config Layer is base layer (no dependencies) - cascading impact on all modules
