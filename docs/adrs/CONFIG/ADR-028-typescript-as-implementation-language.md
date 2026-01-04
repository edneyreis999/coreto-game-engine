# ADR-028: TypeScript as Primary Implementation Language

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-007 (Oclif CLI Framework), ADR-008 (Zod Schema Validation), ADR-021 (JSON Configuration)

## Context and Problem Statement

The coreto game engine requires a language choice for implementing the Node.js-based CLI tool that orchestrates headless RPG Maker MZ battle simulations. This decision affects the entire codebase architecture, developer experience, type safety, tooling ecosystem, and long-term maintainability.

The core tension: Should the project use TypeScript for compile-time type safety and enhanced tooling, or JavaScript for simplicity and zero build overhead? This decision must align with the project's technical requirements for complex domain modeling (RPG Maker MZ data structures), schema validation, and plugin integration reliability.

## Decision Drivers

- **Complex Domain Models**: RPG Maker MZ data structures (Classes, Skills, Enemies, Troops) contain nested arrays and deeply typed objects requiring precise modeling
- **Alignment with Ecosystem**: Chosen frameworks (Oclif, Zod) are TypeScript-first with superior TypeScript integration
- **Type Safety for Formula Evaluation**: Skill damage formulas use JavaScript eval; typed wrappers reduce runtime errors
- **Refactoring Confidence**: Headless runtime mocking layer will evolve; type-checked refactoring prevents breakage
- **Developer Productivity**: Autocomplete and IntelliSense for large RPG Maker MZ API surface area
- **Long-term Maintenance**: Project will evolve beyond MVP with additional VisuStella plugins and features

## Considered Options

1. **TypeScript with strict mode** (chosen)
2. JavaScript with JSDoc type annotations
3. JavaScript without type annotations

## Decision Outcome

Chosen option: **TypeScript with strict mode compilation**, because it provides the strongest guarantees for modeling complex RPG Maker MZ data structures while integrating seamlessly with the chosen technology stack (Oclif, Zod). TypeScript's compile-time type checking reduces the risk of runtime errors in the critical headless simulation path.

The decision is reinforced by framework choices already made: Oclif is TypeScript-first (ADR-007) and Zod provides automatic type inference from schemas (ADR-008), making TypeScript the natural choice for maximizing these tools' benefits.

## Pros and Cons of the Options

### TypeScript with Strict Mode

**Pros:**

- **Type-safe domain modeling**: Classes, Skills, Enemies, Troops modeled with interfaces matching RPG Maker MZ JSON schemas exactly
- **Framework alignment**: Oclif generates type-safe CLI commands; Zod infers TypeScript types from validation schemas automatically
- **Refactoring safety**: Renaming properties or changing signatures caught at compile-time across entire codebase
- **IDE support**: Full autocomplete for RPG Maker MZ API (BattleManager, Game_Battler, etc.) through type definitions
- **Documentation as code**: Interfaces serve as living documentation of data structures
- **Catch errors early**: Null/undefined handling enforced by strict mode prevents common runtime crashes

**Cons:**

- **Build step overhead**: Requires `tsc` compilation before execution (adds seconds to development loop)
- **Learning curve**: Team members unfamiliar with TypeScript face initial productivity decrease
- **Type definition maintenance**: Custom type definitions for RPG Maker MZ and VisuStella plugins require manual maintenance
- **Configuration complexity**: tsconfig.json, source maps, and module resolution add setup complexity
- **Longer initial setup**: Project scaffolding requires TypeScript toolchain configuration

### JavaScript with JSDoc Type Annotations

**Pros:**

- **No build step**: Direct Node.js execution without compilation
- **Gradual typing**: Types can be added incrementally where most valuable
- **Simpler tooling**: No tsconfig.json or TypeScript compiler configuration
- **VSCode support**: Modern editors provide autocomplete from JSDoc comments

**Cons:**

- **Weaker type checking**: JSDoc types are opt-in and not enforced at runtime or compile-time
- **Verbose syntax**: JSDoc comments are more verbose than TypeScript syntax for complex types
- **No framework integration**: Oclif and Zod TypeScript benefits (automatic type inference) unavailable
- **Limited refactoring**: Automated refactoring tools less effective without compiler-enforced types
- **Inconsistent adoption**: Without enforcement, type annotations become incomplete over time

### JavaScript Without Type Annotations

**Pros:**

- **Simplest setup**: Zero configuration beyond Node.js and npm
- **Fastest development**: No compilation or type checking delays
- **Maximum flexibility**: Dynamic typing allows quick prototyping

**Cons:**

- **High runtime error risk**: Complex RPG Maker MZ structures (nested `params` arrays, skill formulas) prone to typos
- **Poor IDE support**: No autocomplete for domain objects or RPG Maker MZ API
- **Refactoring danger**: Breaking changes only discovered at runtime during battle simulations
- **Framework mismatch**: Oclif and Zod TypeScript features completely unavailable
- **Maintenance burden**: Large codebase becomes difficult to understand without type documentation

## Consequences

**Positive:**

- **Type-safe RPG Maker MZ integration**: Compiler prevents invalid data structure access (e.g., `enemy.params[8]` rejected; only indices 0-7 valid)
- **Automatic type inference from Zod schemas**: Configuration validation schemas generate TypeScript types automatically, eliminating duplication
- **Refactoring confidence for mocking layer**: RUNTIME module's graphics mocks can evolve safely as VisuStella plugins change
- **Superior developer experience**: IntelliSense for 50+ RPG Maker MZ global objects (DataManager, BattleManager, etc.)
- **Compile-time formula validation**: Skill damage formula wrappers type-checked before eval execution

**Negative:**

- **Build step adds latency**: Development cycle requires `tsc` watch mode or `ts-node` for immediate execution
- **Type definition maintenance required**: RPG Maker MZ core and VisuStella plugins lack official TypeScript definitions; custom `.d.ts` files must be maintained
- **Initial team onboarding cost**: Developers unfamiliar with TypeScript face learning curve
- **Strict mode may require workarounds**: External libraries without type definitions require `@ts-ignore` or ambient declarations

**Neutral:**

- **Tooling standardization**: Project adopts standard TypeScript ecosystem (tsc, ts-node, @types packages)
- **Configuration baseline**: Requires tsconfig.json with strict mode enabled (noImplicitAny, strictNullChecks, strictFunctionTypes)
- **Source directory structure**: Conventional `src/` for TypeScript source, `dist/` or `build/` for compiled JavaScript

## Implementation Notes

**Required Configuration:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Type Definition Strategy:**

1. **RPG Maker MZ Core**: Create `src/@types/rmmz.d.ts` with interfaces for global objects (BattleManager, Game_Battler, DataManager, etc.)
2. **VisuStella Plugins**: Extend core definitions in `src/@types/visuStella.d.ts` as plugin methods are discovered
3. **Third-party Libraries**: Prefer `@types/*` packages from DefinitelyTyped; create ambient declarations only when unavailable

**Development Workflow:**

- Use `ts-node` for immediate execution during development (no manual compilation)
- Use `tsc --watch` for continuous compilation when debugging compiled output
- CI pipeline runs `tsc --noEmit` for type checking without emitting files (tests run via ts-node)

## References

- /Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md:41-76 (multiple TypeScript code examples)
- /Users/edney/projects/coreto/game-engine/docs/pesquisas/Arquitetura CLI Node.js RPG Maker MZ.md:40-48 (Oclif TypeScript-first justification)
- /Users/edney/projects/coreto/game-engine/docs/adrs/generated/CLI/ADR-007-oclif-cli-framework.md:36 (TypeScript-first design)
- /Users/edney/projects/coreto/game-engine/docs/adrs/generated/CONFIG/ADR-008-schema-validation-library-zod.md:38 (TypeScript-native schema definition)
