# ADR-033: Clean Architecture Implementation for Electron Package

**Status:** Accepted
**Date:** 2026-02-06
**Context:** UI Module (Electron Package)
**Related:** [ADR-032](../FOUNDATION/ADR-032-ports-and-adapters-layer-contracts.md), [ADR-029](../FOUNDATION/ADR-029-tsyringe-di-container.md)

## Context and Problem Statement

The initial implementation of the `@coreto/electron` package placed business logic directly in IPC handlers and infrastructure services, violating Clean Architecture principles. This created several issues:

1. **Business Logic in Handlers**: Simulation orchestration logic (130+ lines) was embedded in `handleSimulationRun` in `src/main/ipc/handlers.ts`
2. **Transformation Logic in Infrastructure**: Config transformation (UI format → Core format) was in `config-handlers.ts`
3. **Direct Filesystem Access**: Handlers bypassed abstraction layers with direct `fs.mkdir`/`fs.writeFile` calls
4. **Service Duplication**: `ConfigService` duplicated domain logic already in use cases

These violations made the codebase harder to test, maintain, and extend. The code health analysis revealed:
- Overall Clean Architecture score: 8.5/10 (Good, but improvable)
- 2 high-severity issues (business logic in infrastructure)
- 4 medium-severity issues (domain duplication, direct fs access)

## Decision Drivers

- **Testability**: Business logic in handlers is difficult to test in isolation
- **Maintainability**: Mixed concerns make code harder to understand and modify
- **Consistency**: Core package already follows Clean Architecture (ADR-032)
- **Team Standards**: Project has established Hexagonal Architecture patterns
- **Code Reusability**: Domain logic should be reusable across CLI and GUI interfaces

## Considered Options

1. **Minimal Refactoring**: Keep existing structure, add comments documenting issues
2. **Partial Refactoring**: Extract only critical logic (simulation handler)
3. **Full Clean Architecture Refactoring**: Extract all business logic to domain use cases, create thin adapters

## Decision Outcome

Chosen option: **Full Clean Architecture Refactoring**

The refactoring establishes proper layer separation in the Electron package:

### Domain Layer (`src/domain/`)

Pure business logic with no framework dependencies:

**New Use Cases Created:**
- `run-simulation.ts` - Battle simulation orchestration (extracted from handlers)
- `save-project-config-as-core-format.ts` - Config transformation and saving

**Existing Use Cases Preserved:**
- `load-project-config.ts` - Config loading with schema migration
- `save-project-config.ts` - Config saving for UI format
- `validate-trecho.ts` - Trecho validation logic
- `load-game-data.ts` - Game data loading
- `validate-project.ts` - Project validation

**Ports:**
- `IConfigStorage.ts` - Storage abstraction
- `IGameDataLoader.ts` - Data loader abstraction
- `IProjectValidator.ts` - Validator abstraction
- `IRecentProjectsRepository.ts` - Repository interface

### Infrastructure Layer (`src/main/`)

Thin adapters that delegate to domain use cases:

**Before Refactoring:**
```typescript
// handlers.ts - 256-392 lines of business logic
async function handleSimulationRun(...) {
  // 130+ lines: load database, initialize simulator,
  // run battles, check tolerance, etc.
}
```

**After Refactoring:**
```typescript
// handlers.ts - thin adapter
async function handleSimulationRun(...) {
  const { result } = await runSimulation(
    { projectPath, configPath, trechoId, troopId, seed, maxTurns },
    { dataLoader, simulator, configLoader, logger },
    { onProgress, onStart, onEnd }
  );
  return result;
}
```

**Benefits:**
- Handler reduced from 136 lines to ~25 lines
- Business logic testable in isolation
- Clear separation of concerns
- Progress callbacks injected as dependencies

### Deprecated Patterns

**ConfigService** (kept for backward compatibility):

```typescript
/**
 * @deprecated Use `loadProjectConfig` from `@coreto/electron/domain/use-cases`
 */
async loadConfig(projectPath: string): Promise<UIProjectConfig>
```

Migration path provided with examples pointing to new use cases.

## Architectural Rules

### 1. Import Convention (CLAUDE-ARCH-CONVENTION)

**Cross-Layer Imports (Domain):**
```typescript
// ✅ CORRECT
import { runSimulation } from '@coreto/electron/domain/use-cases';
import type { IConfigStorage } from '@coreto/electron/domain/ports';

// ❌ WRONG
import { runSimulation } from '../../../domain/use-cases';
import type { IConfigStorage } from '../../domain/ports/IConfigStorage';
```

**Intra-Layer Imports (Infrastructure):**
```typescript
// ✅ CORRECT (within main/)
import type { IPCResult } from '../ipc/types.js';
import { wrapHandler } from './ipc-response.js';

// ❌ WRONG
import type { IPCResult } from '@coreto/electron/main/ipc/types';
```

**Rationale:** Domain layer is shared across main/preload/renderer. Module aliases provide process-agnostic imports.

### 2. Handler Thin Adapter Rule

IPC handlers MUST delegate to domain use cases:

```typescript
// ✅ CORRECT: Thin adapter
async function handleX(event, payload) {
  return wrapHandler(async () => {
    const deps = { /* inject dependencies */ };
    return await useCaseX(payload, deps);
  });
}

// ❌ WRONG: Business logic in handler
async function handleX(event, payload) {
  return wrapHandler(async () => {
    // 50+ lines of business logic
    const db = await loadDatabase();
    const result = await process(db);
    return transform(result);
  });
}
```

### 3. Dependency Injection Rule

Use cases receive dependencies via parameters:

```typescript
// ✅ CORRECT: Injected dependencies
export async function runSimulation(
  input: RunSimulationInput,
  deps: RunSimulationDeps // All dependencies injected
): Promise<RunSimulationOutput>

// ❌ WRONG: Direct dependencies
import { simulator } from './simulator'; // Tightly coupled
```

### 4. Storage Abstraction Rule

Filesystem operations go through ports:

```typescript
// ✅ CORRECT: Through IConfigStorage
await storage.write(projectPath, json);

// ❌ WRONG: Direct filesystem access
await fs.mkdir(tempDir, { recursive: true });
await fs.writeFile(configPath, json, 'utf-8');
```

## Implementation Changes

### Files Created

1. `packages/electron/src/domain/use-cases/run-simulation.ts` - Simulation use case
2. `packages/electron/src/domain/use-cases/save-project-config-as-core-format.ts` - Config transformation use case

### Files Modified

1. `packages/electron/src/main/ipc/handlers.ts` - Simulation handler now thin adapter
2. `packages/electron/src/main/ipc/config-handlers.ts` - Config save handler now thin adapter
3. `packages/electron/src/main/services/config-service.ts` - Deprecated with migration guide
4. `packages/electron/src/main/adapters/file-config-storage-adapter.ts` - Updated to module alias imports
5. `packages/electron/src/main/ipc/types.ts` - Updated to module alias imports
6. `packages/electron/src/preload/index.ts` - Updated to module alias imports
7. `packages/electron/src/main/database/repositories/sqlite-recent-projects-repository.ts` - Updated to module alias imports
8. `packages/electron/src/main/services/schemas.ts` - Updated to module alias imports

## Consequences

### Positive

1. **Improved Testability**: Use cases can be tested with mock dependencies
2. **Better Separation**: Handlers are thin adapters, business logic in domain
3. **Code Reusability**: Domain logic can be reused across CLI and GUI
4. **Consistency**: Electron package now follows same patterns as core package
5. **Maintainability**: Clear responsibilities make code easier to modify

### Negative

1. **Boilerplate**: Each use case requires input/output/deps interfaces
2. **Learning Curve**: Developers must understand Clean Architecture
3. **Migration Effort**: Existing code required significant refactoring

### Mitigations

1. **Template Patterns**: Use existing use cases as templates for new ones
2. **Documentation**: CLAUDE.md provides clear examples of import conventions
3. **Deprecation Path**: Old patterns marked `@deprecated` with migration examples
4. **Automated Tests**: Architecture tests planned to enforce rules

## Implementation Status

| Task | Status | Notes |
|------|--------|-------|
| Extract simulation use case | ✅ Complete | `run-simulation.ts` created |
| Extract config transformation | ✅ Complete | `save-project-config-as-core-format.ts` created |
| Update handlers to thin adapters | ✅ Complete | Handlers delegate to use cases |
| Deprecate ConfigService | ✅ Complete | Marked with `@deprecated` |
| Standardize import conventions | ✅ Complete | All files use module aliases |
| Create ADR documentation | ✅ Complete | This document |
| Add architecture tests | ⏳ Pending | Task #6 in progress |

**Code Health Impact:**
- Before: 8.5/10 (Good)
- After: 9.5/10 (Excellent) - Estimated
- Issues Resolved: 2 high-severity, 4 medium-severity

## Examples

### Before Refactoring

```typescript
// handlers.ts - 136 lines
async function handleSimulationRun(...) {
  const logger = resolve<ILogger>(ILoggerToken);
  const configLoader = resolve<IConfigLoader>(IConfigLoaderToken);
  const dataLoader = resolve<IDataLoader>(IDataLoaderToken);
  const simulator = resolve<IBattleSimulator>(IBattleSimulatorToken);

  updateProgress({ isRunning: true, current: 0, total: 1 });

  try {
    const database = await dataLoader.loadDatabase(projectPath);
    await simulator.initialize(database, projectPath);
    logger.info('[IPC] Simulator initialized successfully');

    let configTrechos: Trecho[] = [];
    if (configPath) {
      const config = await configLoader.loadConfig(configPath);
      configTrechos = await configLoader.loadTrechos(config);
    }

    // ... 100+ more lines of business logic

    return { /* result */ };
  } finally {
    resetProgress();
  }
}
```

### After Refactoring

```typescript
// Domain use case - pure business logic
export async function runSimulation(
  input: RunSimulationInput,
  deps: RunSimulationDeps,
  callbacks?: SimulationProgressCallbacks
): Promise<RunSimulationOutput> {
  const { dataLoader, simulator, configLoader, logger } = deps;

  callbacks?.onStart?.();
  const database = await dataLoader.loadDatabase(projectPath);
  await simulator.initialize(database, projectPath);

  // ... business logic

  callbacks?.onEnd?.();
  return { result };
}

// Handler - thin adapter
async function handleSimulationRun(...) {
  return wrapHandler(async () => {
    validatePayload('simulation:run', payload, SimulationRunPayloadSchema);

    const logger = resolve<ILogger>(ILoggerToken);
    const configLoader = resolve<IConfigLoader>(IConfigLoaderToken);
    const dataLoader = resolve<IDataLoader>(IDataLoaderToken);
    const simulator = resolve<IBattleSimulator>(IBattleSimulatorToken);

    const { result } = await runSimulation(
      { projectPath, configPath, trechoId, troopId, seed, maxTurns },
      { dataLoader, simulator, configLoader, logger },
      { onStart, onProgress, onEnd }
    );

    return result;
  });
}
```

## References

- [ADR-032: Ports and Adapters Layer Contracts](../FOUNDATION/ADR-032-ports-and-adapters-layer-contracts.md)
- [ADR-029: TSyringe DI Container](../FOUNDATION/ADR-029-tsyringe-di-container.md)
- [Clean Code Blog - Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- `packages/electron/CLAUDE.md` - Import conventions documentation
