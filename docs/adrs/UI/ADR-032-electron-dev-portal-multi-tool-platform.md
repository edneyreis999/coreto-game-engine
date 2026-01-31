# ADR-032: Electron Dev Portal for Multi-Tool Platform

**Status:** Accepted
**Date:** 2026-01-15
**Supersedes:** ADR-006 (partially - removes "Sem UI no MVP v1" constraint)
**Related ADRs:** ADR-028, ADR-029

## Context and Problem Statement

The Coreto Game Engine started as a CLI-only TTK validation tool (ADR-006), but the project vision evolved to become a comprehensive developer tooling hub for RPG Maker MZ game development. The expanded scope includes TTK validation, NSD Scene Generator, and future tools like database editors and formula calculators.

ADR-006 established a "Sem UI no MVP v1" constraint to accelerate initial delivery. However, with the core TTK validation logic proven functional, the system now needs a user-friendly interface for non-technical game designers who require visual feedback, progress indicators, and file dialogs rather than CLI commands and JSON output.

The architectural challenge: how to provide a desktop application experience while maintaining the existing CLI interface for automation, reusing the shared `@coreto/core` business logic, and supporting offline-first operation with Node.js integration for RPG Maker MZ parsing?

## Decision Drivers

- User accessibility for non-technical game designers without CLI knowledge
- Code reuse between CLI and GUI interfaces via shared `@coreto/core` package
- Node.js integration required for RPG Maker MZ parsing and JSDOM headless runtime
- Multi-tool platform supporting TTK validation plus future developer tools
- Team expertise in TypeScript/React stack for rapid development velocity
- Offline-first operation with no cloud dependencies
- Native desktop integration for file dialogs, notifications, and system menus

## Considered Options

1. Electron-based Dev Portal with React 18 + Tailwind + Radix UI
2. Tauri with Rust backend and web frontend
3. CLI + Next.js local server with web dashboard

## Decision Outcome

Chosen option: **Electron Dev Portal**, because it maximizes code reuse with the existing TypeScript stack (ADR-028), enables seamless Node.js integration for RPG Maker MZ tooling, and leverages team expertise in React for fast development. The Electron architecture supports offline-first operation and native desktop features while maintaining the CLI interface for automation use cases.

The implementation uses electron-vite for fast HMR, Radix UI for accessible components, and better-sqlite3 for local storage, creating a professional desktop application experience with signed installers for macOS/Windows distribution.

## Pros and Cons of the Options

### Electron Dev Portal

**Pros:**

- Shared TypeScript/React codebase reduces learning curve and accelerates development
- Node.js integration essential for JSDOM headless runtime and RPG Maker MZ parsing
- Reuses `@coreto/core` business logic between CLI and GUI interfaces
- Native desktop features including file dialogs, system notifications, and menu bar
- Mature ecosystem with extensive plugins and large community support
- Offline-first architecture with no cloud dependencies
- Professional distribution via signed installers for macOS/Windows

**Cons:**

- Larger bundle size compared to alternatives
- Requires platform-specific builds and code signing certificates
- Increased complexity with three packages to maintain versus single CLI
- Security surface requires careful renderer/main process isolation

### Tauri with Rust Backend

**Pros:**

- Smaller bundle size and better performance than Electron
- Modern web stack for frontend development

**Cons:**

- Rust backend incompatible with Node.js-based RPG Maker MZ tooling
- Team would need to learn Rust for custom integrations
- Less mature ecosystem and smaller community than Electron

### CLI + Next.js Local Server

**Pros:**

- Familiar web stack with modern React patterns

**Cons:**

- Complex architecture with port management and local server lifecycle
- Browser security restrictions limit native desktop integration
- Less polished desktop application experience

## Consequences

**Architectural Impact:**

The monorepo structure expands from two packages (`@coreto/cli`, `@coreto/core`) to three with the addition of `@coreto/electron`. The shared core logic remains reusable across both CLI and Electron interfaces, preserving the original architectural investment while enabling GUI-based workflows.

**User Impact:**

Game designers can now use visual tools without CLI knowledge, accessing TTK validation through project selection panels, configuration forms, progress indicators, and color-coded result cards. Developers retain CLI access for automation and CI integration scenarios.

**Distribution Impact:**

Professional distribution requires code signing certificates for macOS and Windows, adding operational complexity. The application ships as signed .dmg files for macOS with notarization, with future Windows .exe and Linux AppImage support planned.

**Security Model:**

Context isolation is enabled with preload scripts providing safe IPC via contextBridge. Node integration is disabled in renderer processes, and CSP headers restrict inline scripts. The main process handles file system access, SQLite database operations, and RPG Maker MZ parsing.

## References

- packages/electron/package.json
- packages/electron/electron.config.js
- docs/adrs/FOUNDATION/ADR-006-sem-ui-sem-ci-mvp.md
- docs/adrs/CONFIG/ADR-028-typescript-as-implementation-language.md
- docs/adrs/FOUNDATION/ADR-029-tsyringe-di-container.md
