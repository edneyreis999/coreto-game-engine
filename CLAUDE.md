# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Type:** RPG Maker MZ developer tooling hub (read-only wrapper)

**Architecture:** pnpm monorepo

- `@coreto/core` - shared business logic (headless runtime, validation)
- `@coreto/electron` - Electron 33 Dev Portal for RPG Maker MZ game developers (TTK validation, NSD generator, DB editors)
  - Stack Principal:
    - Electron 33.0.0
    - Node.js
    - Vite 5.0
    - electron-vite 2.0
    - electron-builder 25.1.8
    - React 18.2
    - TypeScript 5.9.3
    - Tailwind CSS 3.3.6
    - tailwindcss-animate 1.0.7
    - shadcn/ui
    - @radix-ui/react-slot 1.0.2

**User Roles:**

- **Game Developers** → Use `@coreto/electron` GUI to build RPG Maker MZ games (TTK validation, scene generation)

**Tools:**

1. **TTK Validation** - Headless battle simulation (JSDOM + PIXI mocks), deterministic RNG (LCG), dual-metric TTK measurement
2. **NSD Scene Generator** (planned) - Parses NSD docs, compares with RPG Maker maps, generates LLM-powered implementation prompts

## Documentation

**All documentation lives in `docs/`.** Start at `docs/CLAUDE.md` for navigation guide, then `docs/adrs/INDEX.md` for architectural decisions.

## ADR Creation Process

**DO NOT manually create ADR files.** Use the agent-based workflow:

1. Create potential ADR: `docs/adrs/potential-adrs/must-document/{MODULE}/{name}.md`
2. Run skill: `/adr-generate {MODULE}`
3. Agent generates: `docs/adrs/generated/{MODULE}/ADR-XXX-{name}.md` (auto-archives source to `done/`)
4. Renumber XXX to next sequential ID, move to `docs/adrs/{MODULE}/ADR-{N}-{name}.md`
5. Update `docs/adrs/INDEX.md`

**Skill invocation:** `Skill tool` with `skill: "adrs-management:adr-generate"` and `args: "{MODULE}"`

## Electron Package Architecture

**Build System:** electron-vite compiles TypeScript sources from `src/` to `out/` (not `dist/`). The `dist/` folder contains packaged apps from electron-builder.

**Process Architecture:**

- **Main Process** (`src/main/`) - Node.js backend with better-sqlite3 database and IPC handlers
- **Preload Script** (`src/preload/`) - Security bridge exposing safe APIs to renderer via context bridge
- **Renderer Process** (`src/renderer/`) - React 18 + shadcn/ui + Tailwind UI running in Chromium

**Key Modules:**

- `src/main/database/` - SQLite schema, migrations, queries (recent-projects, simulation-history, user-preferences)
- `src/main/ipc/` - IPC request handlers and type contracts
- `src/renderer/src/components/` - React components (ConfigurationPanel, ResultsPanel, ExecutionPanel, ProjectSelectionPanel)
- `src/renderer/src/hooks/` - Custom React hooks (useConfig, useProject, useIpc)

## Electron Dev Portal Execution

**IMPORTANT:** Run from monorepo root.

**Development mode:**

```bash
# Foreground (blocks terminal)
pnpm --filter @coreto/electron dev

# Background (recommended for AI execution)
pnpm --filter @coreto/electron dev &
```

**Build for production:**

```bash
pnpm --filter @coreto/electron build
pnpm --filter @coreto/electron pack:mac
```

## Essential Commands

```bash
pnpm lint              # Run ESLint
pnpm type-check        # TypeScript check all packages
pnpm test              # Run all tests
pnpm --filter @coreto/electron test  # Electron tests only
pnpm --filter @coreto/core test      # Core tests only
pnpm build             # Build core + electron
pnpm --filter @coreto/electron build  # Build electron
```

## TTK Execution Flow

The TTK (Time-to-Kill) validation feature follows a complete end-to-end flow from project selection to history persistence. This section documents the full execution path, critical wiring points, and data transformations.

### User Flow Overview

1. **Project Selection** → User selects RPG Maker MZ project directory
2. **Configuration** → User defines trechos with TTK targets and troop assignments
3. **Execution** → User clicks "Run Validation" to simulate battles
4. **Results** → System displays detailed battle results with pass/fail status
5. **History** → Results are persisted for later review and export

## Troubleshooting

### Monorepo Import Rules

**Never** use subpath imports (`@coreto/core/infrastructure/X`) — they fail in `tsc` even if Jest resolves them. Always import from `@coreto/core` directly. New modules must be barrel-exported in `packages/core/src/index.ts`.

**Naming:** Domain = no suffix (`Warning`), Zod types = `*DTO` (`WarningDTO`), Schemas = `*Schema`.

### Core Package Requires Rebuild After Changes

**Symptom:** `SyntaxError: The requested module '@coreto/core' does not provide an export named 'X'`

**Cause:** electron-vite bundles `@coreto/core` into `out/main/`. Source changes to core aren't reflected until rebuild.

**Fix:** Rebuild core after modifying its public API:

```bash
pnpm --filter @coreto/core build
```

### Module Aliases Require Multi-Config Setup

**Symptom:** TypeScript compiles but `electron-vite dev` fails with "failed to resolve import @coreto/electron/domain/*"

**Cause:** Vite/Rollup has its own module resolution. Each build environment needs explicit alias config.

**Fix:** When adding new module aliases, update ALL configs:

1. `tsconfig.json` → `compilerOptions.paths`
2. `jest.config.js` → `moduleNameMapper` (for ALL projects: main, renderer, integration)
3. `electron.vite.config.ts` → `resolve.alias` (for BOTH main AND renderer sections)

**Note:** electron-vite builds 3 separate processes. Each needs its own alias configuration.

### React Hook Infinite Loop Prevention

**CRITICAL:** Never add unstable functions (inline arrows, mock functions) to `useCallback`/`useEffect` deps. This causes infinite re-render loops.

**Anti-pattern:**
```typescript
// ❌ CAUSES INFINITE LOOP
const invoke = useCallback(async () => {
  await someFunction();
}, [someFunction]); // someFunction changes every render
```

**Correct pattern:**
```typescript
// ✅ STABLE REFERENCE
const fnRef = useRef(someFunction);
useEffect(() => { fnRef.current = someFunction; }, [someFunction]);

const invoke = useCallback(async () => {
  await fnRef.current(); // No re-creation
}, []); // Empty deps
```

**Also:** Never use `jest.useFakeTimers()` with `waitFor()` — conflicts cause hangs. Remove fake timers if tests use async assertions.

### useState Initial Value Bug

**Symptom:** Hook receives prop updates but state stays stale.

**Cause:** `useState(initialValue)` only uses `initialValue` on first render. Subsequent prop changes are ignored.

**Fix:** Sync state with `useEffect`:

```typescript
const [state, setState] = useState(initialValue);

useEffect(() => {
  setState(initialValue);
}, [initialValue]);
```

## Agent Army

Use these specialized agents as a coordinated "army" to solve complex problems faster.

### Roster
- **bibliotecario** — Navigate docs via `index.md` and answer questions with minimal reading
- **catalogador** — Create/refresh lightweight `index.md` files so LLMs can choose what to read
- **fdd-interviewer** — Run structured interview and generate Feature Design Doc
- **implementation-analyzer** — Review React+Electron code against best practices; produce quality score
- **test-analyzer** — Evaluate tests against DDD/Clean Architecture; produce gaps + score
- **test-orchestrator** — Detect DDD layers and coordinate test strategy

### Parallel-First Default
When a task has multiple unknowns, **run agents in parallel** to reduce iteration time.
