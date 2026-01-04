# Potential ADR: Commander.js vs Yargs for CLI Argument Parsing

**Module**: CLI
**Category**: Technology/Architecture
**Priority**: Must Document (Score: 120/150)
**Date Identified**: 2026-01-04

---

## What Was Identified

The project documentation mentions two CLI framework options without making a final decision: **Commander.js** or **Yargs**. This is a foundational architectural decision that will structure how the entire command-line interface is built, including argument parsing, command orchestration, help text generation, and error handling.

The CLI layer is the primary entry point for all user interactions with the validation tool, exposing two main commands:
- `run-ttk` - Execute TTK validation with configurable options
- `export-context` - Split large JSON files for AI consumption

Both commands require robust argument parsing with support for:
- Required arguments (`--config`)
- Optional flags (`--seed`, `--trecho`, `--verbose`, `--diagnostic`, `--filter-trechos`)
- Type validation (paths, numbers, strings)
- Help text generation
- Error messaging

This decision was introduced during the planning/architecture phase (documented in HLD section 3.1 and mapping.md), as the project has no implementation code yet.

## Why This Might Deserve an ADR

- **Impact**: Affects the entire CLI layer interface and user experience. Every command, flag, and option will be implemented using this framework. The choice influences developer experience, error handling patterns, and extensibility for future commands (e.g., planned Electron UI integration).

- **Trade-offs**:
  - **Commander.js**: More opinionated, simpler API, widely adopted (5M+ weekly downloads), explicit command definitions
  - **Yargs**: More flexible, powerful middleware system, extensive validation options, slightly steeper learning curve

- **Complexity**: While both are mature libraries, the choice impacts:
  - Command definition patterns throughout the codebase
  - Validation strategy (built-in vs custom)
  - Help text customization approach
  - Testing patterns for CLI commands

- **Team Knowledge**: Critical foundational choice. All developers working on CLI features must understand the chosen framework's patterns. This decision affects:
  - How new commands are added
  - How arguments are validated
  - How errors are handled and displayed
  - Documentation patterns for CLI usage

- **Future Implications**:
  - The CLI core will be reused as backend when Electron UI is added (ADR-006 reference)
  - Framework choice affects migration effort if switching becomes necessary
  - Influences patterns for future commands beyond MVP scope

**Temporal Context**: Decision pending during greenfield planning phase. No implementation exists, making this the ideal time to formalize the choice before code is written.

## Evidence Found in Codebase

### Key Files
- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 91-101
  - Documents CLI Layer responsibilities and mentions "Commander.js ou Yargs"
- [`/Users/edney/projects/coreto/game-engine/docs/adrs/mapping.md`](/Users/edney/projects/coreto/game-engine/docs/adrs/mapping.md) - Lines 136-163
  - CLI module specification with "Proposed: Commander.js or Yargs"

### Code Evidence
No implementation code exists yet. Evidence comes from architecture documentation:

```markdown
# From HLD Section 3.1 CLI Layer:
**Responsabilidades:**
- Parser de argumentos CLI (`--config`, `--seed`, `--trecho`, `--verbose`, `--diagnostic`)
- Orquestração do pipeline de execução
- Exibição de progresso no terminal
- Gerenciamento de exit codes (0 sucesso, 1 erro)

**Tecnologias:** Node.js, Commander.js ou Yargs
```

```markdown
# From mapping.md CLI Module:
**Technologies:**
- Proposed: Commander.js or Yargs
- Node.js

**Patterns:**
- Command pattern for CLI commands
- Facade pattern for simplifying subsystem access
```

### Impact Analysis
- **Introduced**: Planning phase (2026-01-04 based on HLD/mapping dates)
- **Modified**: Not yet implemented
- **Last change**: N/A - greenfield project
- **Affects**:
  - Estimated 3-5 files when implemented (CLI module scope: Small)
  - All future CLI commands and argument handling
  - Developer workflow for testing CLI features
  - User experience for error messages and help text
- **Recent themes**: Architecture planning, technology selection

### Alternatives (observable from documentation)

**Explicitly mentioned:**
1. **Commander.js** - Opinionated, simpler API, explicit commands
2. **Yargs** - Flexible, powerful middleware, extensive validation

**Not mentioned but worth considering:**
- oclif (if complex plugin system needed in future)
- minimist/meow (if ultra-minimal needed - unlikely given requirements)
- Native Node.js argument parsing (insufficient for complex commands)

## Questions to Address in ADR (if created)

1. **What problem was being solved?**
   - Need for robust CLI argument parsing with type validation, help generation, and error handling
   - Support for multiple commands (run-ttk, export-context) with different option sets
   - User-friendly error messages for non-technical designers (future users)

2. **Why was this approach chosen?**
   - Which framework (Commander.js or Yargs) better fits the project's needs?
   - How does the choice align with team experience/preferences?
   - What specific features of the chosen framework are critical?

3. **What alternatives were considered?**
   - Why were Commander.js and Yargs shortlisted?
   - Why were other frameworks (oclif, minimist, etc.) rejected?
   - Was native Node.js argument parsing considered and rejected?

4. **What are long-term consequences?**
   - How does this choice affect the planned Electron UI integration (where CLI becomes backend)?
   - What's the migration cost if framework needs to change?
   - How extensible is the chosen framework for future commands (e.g., validation modes, reporting formats)?
   - What testing patterns does the framework enable?

5. **Performance and bundle size considerations?**
   - Dependency weight and installation time
   - Startup performance for CLI execution
   - Tree-shaking capabilities

6. **Developer experience factors?**
   - Documentation quality and community support
   - Learning curve for team members
   - IDE support and TypeScript definitions (if using TypeScript)

## Related Potential ADRs
- ADR-006: Sem UI e Sem CI no MVP v1 (existing) - Establishes CLI as primary interface for MVP
- [Future] Validation Library Choice (Zod vs Joi) - Config Layer dependency
- [Future] Command Pattern Implementation - CLI command orchestration strategy

## Additional Notes

**Greenfield Advantage**: This is the perfect time to formalize this decision. No implementation exists, so there's no refactoring cost. The choice can be made purely on technical merits and future requirements.

**Relationship to Existing ADRs**:
- **ADR-006** establishes that CLI is the MVP v1 interface (no UI), making this framework choice even more critical as it's the sole user-facing layer initially
- The CLI will later become the backend for Electron UI, so the framework must support programmatic invocation, not just terminal interaction

**Scoring Justification**:
- **Step 0 Category 2**: Primary Framework for CLI application ✅
- **Base Score**: 75/150 (guaranteed for framework decisions)
- **Scope + Impact**: 15/25 (affects entire CLI module + future Electron backend)
- **Cost to Change**: 15/25 (migration would require refactoring all commands and tests, ~2-3 weeks)
- **Team Knowledge**: 15/25 (critical for anyone implementing CLI features or future commands)
- **Total**: **120/150** → **must-document/**

**Recommendation**: Create formal ADR before implementation begins to document the choice rationale, making it easier for future team members to understand the framework selection and maintain consistency across CLI features.
