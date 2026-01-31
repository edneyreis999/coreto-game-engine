# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Type:** RPG Maker MZ developer tooling hub (read-only wrapper)

**Architecture:** pnpm monorepo

- `@coreto/core` - shared business logic (headless runtime, validation)
- `@coreto/cli` - Oclif-based CLI for Coreto Engine developers (deploy scripts, test runners, dev tooling)
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
- **Engine Developers** → Use `@coreto/cli` to maintain Coreto Engine (deploy, test, build automation)

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

## TTK Validation Execution

**Script:** `packages/cli/src/cli/commands/run-ttk.ts`

**IMPORTANT:** All commands must be executed from the **monorepo root**

**Build:**

```bash
# Build both core and cli packages
pnpm build

# Or build individually
pnpm --filter @coreto/core build
pnpm --filter @coreto/cli build
```

**Run:**

```bash
# From monorepo root
pnpm ttk
```

**Flags:**

- `--config` / `-c` - Config path (required)
- `--verbose` / `-v` - Progress bar + detailed output
- `--diagnostic` / `-d` - Performance profiling
- `--seed` / `-s` - RNG seed override
- `--trecho` / `-t` - Run single trecho only

**Dependencies:**

- Requires `stub-index.html` in monorepo root (used by JSDOM for headless runtime)
- Requires `temp/project.config.json` with trecho configurations

## CLI Package Architecture

**Framework:** Oclif-based CLI with TypeScript

**Key Patterns:**

- Commands follow Oclif convention in `dist/cli/commands/` after build
- Entry point: `bin/run.js` → `dist/cli/index.js`
- Source files in `src/cli/` compile to `dist/cli/`
- UI components (progress bars, formatters) in `src/cli/ui/`

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
