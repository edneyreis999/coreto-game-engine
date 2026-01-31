# Potential ADR: Electron Dev Portal for Developer Tooling

**Module:** UI
**Priority:** must-document
**Status:** Draft
**Date:** 2026-01-31

## Context

The Coreto Game Engine started as a **CLI-only TTK validation tool** (ADR-006), but the project vision evolved to become a **comprehensive developer tooling hub** for RPG Maker MZ game development at Coreto Studio.

### Expanded Vision

The engine is not just for TTK validation, but will include multiple developer tools:
- **TTK Validation** (implemented): Deterministic combat balance testing
- **NSD Scene Generator** (planned): Convert Narrative Structure Documents into implementable scenes
- **Additional tools** (future): Database editors, formula calculators, quest validators

### Current State

- ADR-006 established "Sem UI no MVP v1" constraint
- TTK validation implemented as CLI-only (`@coreto/cli`)
- Monorepo structure with `@coreto/core` (shared logic) and `@coreto/cli`
- Electron package (`@coreto/electron`) has been implemented with full Dev Portal UI

### Key Questions

1. Should we maintain CLI-only approach for all tools?
2. How do we provide a user-friendly interface for non-technical designers?
3. How do we structure a multi-tool platform?
4. What desktop framework should we use?

## Decision Needed

Choose desktop UI framework and architecture for the Coreto Game Engine developer tooling hub.

## Options Considered

### Option 1: Electron-based Dev Portal (RECOMMENDED)

**Architecture:**
```
Monorepo Structure (pnpm workspace):
├── @coreto/core        # Shared business logic
├── @coreto/cli         # Oclif-based CLI interface
└── @coreto/electron    # Electron Dev Portal (GUI)
    ├── Main Process    # Node.js backend (IPC, file system, SQLite)
    ├── Preload         # Secure bridge
    └── Renderer        # React 18 + Tailwind + Radix UI
```

**Technology Stack:**
- Desktop Framework: Electron 33
- Build Tool: electron-vite (fast HMR)
- Frontend: React 18 + TypeScript
- UI Library: Radix UI + Tailwind + shadcn/ui
- Icons: Lucide React
- Database: better-sqlite3 (local storage)
- Packaging: electron-builder (native installers)

**Pros:**
- ✅ Multi-tool platform: Single entry point for all developer tools
- ✅ User-friendly UX: Designers can use tools without CLI knowledge
- ✅ Visual feedback: Graphs, color-coded results, progress indicators
- ✅ Native integration: File dialogs, system notifications, menu bar
- ✅ Code reuse: `@coreto/core` shared between CLI and Electron
- ✅ Node.js integration: Critical for RPG Maker MZ parsing, JSDOM headless runtime
- ✅ Mature ecosystem: Large community, extensive plugins
- ✅ Team expertise: TypeScript/JavaScript stack
- ✅ Professional distribution: Signed installers for macOS/Windows
- ✅ Offline-first: No cloud dependency

**Cons:**
- ❌ Increased complexity: Three packages to maintain vs one CLI
- ❌ Larger bundle size: 80-150MB vs <10MB CLI
- ❌ Platform-specific builds: Separate for macOS, Windows, Linux
- ❌ Code signing required: Apple Developer certificate needed
- ❌ Security surface: Renderer/main isolation, IPC security

**Implementation Status:**
- ✅ Package structure created
- ✅ TTK Validation tool fully implemented in Electron UI
- ✅ macOS packaging configured (electron-builder)
- ✅ Components: ProjectSelection, Configuration, Execution, Results panels

### Option 2: Web-based SPA (React + Tauri)

**Pros:**
- Smaller bundle size than Electron
- Rust backend (better performance)
- Modern web stack

**Cons:**
- ❌ Less mature ecosystem than Electron
- ❌ Harder to integrate with Node.js-based RPG Maker MZ tooling
- ❌ Smaller community and plugins
- ❌ Team would need to learn Rust for custom integrations

### Option 3: Native Desktop (Qt, Avalonia, SwiftUI)

**Pros:**
- Better performance
- Smaller bundle size
- Native look and feel

**Cons:**
- ❌ Different language/stack (C++, C#, Swift)
- ❌ Team expertise is TypeScript/JavaScript
- ❌ Harder to share code with CLI and core logic
- ❌ Slower development velocity

### Option 4: CLI + Web Dashboard (Next.js + local server)

**Pros:**
- Familiar web stack
- Can run CLI backend as service

**Cons:**
- ❌ More complex architecture (local server + browser)
- ❌ Port conflicts, server management
- ❌ Less "desktop app" feel
- ❌ Browser security restrictions

## Recommendation

**Choose Option 1: Electron Dev Portal**

### Rationale

1. **Team Velocity**: TypeScript/React expertise enables fast development
2. **Code Reuse**: `@coreto/core` shared across CLI and Electron
3. **Node.js Integration**: Essential for RPG Maker MZ tooling (JSDOM, file parsing)
4. **User Experience**: Native desktop app with offline-first capabilities
5. **Already Implemented**: TTK tool proves the architecture works

### Implementation Approach

**Phase 1: TTK Tool** ✅ (Implemented)
- Project selection panel
- Configuration panel (trechos, troops, TTK targets)
- Execution panel with progress
- Results panel with color-coded cards

**Phase 2: NSD Scene Generator** (Planned)
- NSD document parser
- Map reader
- LLM integration
- Prompt generation interface

**Phase 3: Future Tools** (Roadmap)
- Database bulk editor
- Formula calculator
- Quest flow visualizer

## Technical Details

### Security Model
- Context Isolation: Enabled
- Preload Script: Safe IPC via contextBridge
- CSP Headers: Restrict inline scripts
- Node Integration: Disabled in renderer

### Distribution
- macOS: .dmg with code signing and notarization
- Windows: .exe with code signing (future)
- Linux: AppImage / deb (future)

### Package Dependencies
```json
{
  "dependencies": {
    "@coreto/core": "workspace:*",
    "@radix-ui/react-slot": "^1.0.2",
    "better-sqlite3": "^12.6.2",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-builder": "^25.1.8",
    "electron-vite": "^2.0.0",
    "react": "^18.2.0",
    "tailwindcss": "^3.3.6"
  }
}
```

## Impact

### On ADR-006

This decision **partially supersedes ADR-006**:
- ✅ Keeps: "Sem CI no MVP v1" (still valid)
- ❌ Removes: "Sem UI no MVP v1" (now has Electron UI)

### On Architecture

- Monorepo grows from 2 to 3 packages
- Core logic remains shared and reusable
- CLI remains available for automation/CI

### On Users

- Game designers: Can use GUI tools without CLI knowledge
- Developers: Can still use CLI for scripting/automation
- Technical artists: Visual tools for data editing

## References

- ADR-006: Sem UI e Sem CI no MVP v1 (partially superseded)
- ADR-028: TypeScript as Implementation Language
- ADR-029: TSyringe DI Container (used in @coreto/core)
- Package structure: `packages/electron/package.json`
- Electron Security: https://www.electronjs.org/docs/latest/tutorial/security
- electron-builder: https://www.electron.build/

## Open Questions

1. Should we support auto-updates via electron-updater?
2. How do we handle offline LLM for NSD Scene Generator?
3. Should we implement telemetry/analytics for feature usage?
4. Multi-window support needed for future tools?
