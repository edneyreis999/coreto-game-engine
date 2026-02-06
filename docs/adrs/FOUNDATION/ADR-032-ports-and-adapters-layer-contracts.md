# ADR-032: Ports and Adapters Layer Contracts

**Status:** Accepted
**Date:** 2026-01-21
**Context:** FOUNDATION Module
**Related:** [ADR-001](../FOUNDATION/ADR-001-wrapper-read-only.md), [ADR-029](../FOUNDATION/ADR-029-tsyringe-di-container.md), [ADR-008](../CONFIG/ADR-008-schema-validation-library-zod.md), [ADR-014](../RUNTIME/ADR-014-jsdom-browser-emulation-headless-runtime.md)

## Context

The Coreto Game Engine follows Hexagonal Architecture (Ports and Adapters pattern) to maintain clean separation between the core domain logic and external infrastructure. This requires well-defined port interfaces that establish clear contracts between layers.

As of the initial implementation, we have 7 port interfaces defined in `packages/core/src/core/ports/` with corresponding adapter implementations in `packages/core/src/infrastructure/adapters/`. This ADR documents the complete mapping and architectural rules.

## Decision

### Port Interface Definitions

All port interfaces are located in `packages/core/src/core/ports/` and define contracts using domain types only. Ports are exported as type-only imports to enforce compile-time-only dependencies.

#### 1. ILogger (Logger Port)

**Interface:** `ILogger`
**Adapter:** `ConsoleLogger`
**Location:** `adapters/logger/ConsoleLogger.ts`

**Purpose:** Provides logging abstraction for the application.

**Methods:**
- `info(message: string, meta?: Record<string, unknown>): void`
- `warn(message: string, meta?: Record<string, unknown>): void`
- `error(message: string, meta?: Record<string, unknown>): void`
- `debug(message: string, meta?: Record<string, unknown>): void`

**Implementation Notes:**
- Current adapter uses `console.log` with colored output
- Future adapters could use Winston, Pino, or remote logging services
- No Zod or fs dependencies in port interface

---

#### 2. IFileSystem (FileSystem Port)

**Interface:** `IFileSystem`
**Adapter:** `NodeFileSystem`
**Location:** `adapters/filesystem/NodeFileSystem.ts`

**Purpose:** Provides abstraction for file system operations with read-only constraint for RPG Maker MZ project directory (ADR-001).

**Methods:**
- `exists(filePath: string): boolean`
- `readFileSync(filePath: string): string`
- `writeFileSync(filePath: string, content: string): void`
- `validateProjectPath(projectPath: string): void`

**Critical Constraint:**
- `writeFileSync` MUST NOT be used on `projectPath` (read-only enforcement)
- Adapter implementation validates paths and prevents writes to project directory

---

#### 3. IConfigLoader (Configuration Port)

**Interface:** `IConfigLoader`
**Adapter:** `ZodConfigLoader`
**Location:** `config/ZodConfigLoader.ts`

**Purpose:** Configuration loading and validation (ADR-008, ADR-021).

**Methods:**
- `loadConfig(configPath: string): Promise<ProjectConfig>`
- `loadTrechos(config: ProjectConfig): Promise<Trecho[]>`
- `validate(config: unknown): ProjectConfig`

**Related ADRs:**
- ADR-008: Zod schema validation
- ADR-021: JSON-based configuration format

---

#### 4. IDataLoader (Data Loader Port)

**Interface:** `IDataLoader`
**Adapter:** `RmmzDataLoader`
**Location:** `adapters/data/RmmzDataLoader.ts`

**Purpose:** RPG Maker MZ data access with synchronous loading override (ADR-016).

**Methods:**
- `validateProjectStructure(projectPath: string): Promise<boolean>`
- `loadDatabase(projectPath: string): Promise<RmmzDatabase>`
- `validateReferences(database: RmmzDatabase): Promise<Warning[]>`
- `loadDataFile<T>(projectPath: string, fileName: string): Promise<T>`

**Related ADRs:**
- ADR-016: Synchronous database loading override
- ADR-013: Warning-based validation approach

**Supporting Classes:**
- `RmmzProjectValidator`: Helper for project structure validation
- `IntegrityValidator`: Helper for cross-reference validation

---

#### 5. IBattleSimulator (Battle Simulator Port)

**Interface:** `IBattleSimulator`
**Adapter:** `HeadlessBattleSimulator`
**Location:** `simulation/BattleSimulator.ts`

**Purpose:** Executes real battles using RPG Maker MZ BattleManager in headless mode (ADR-003) with deterministic RNG (ADR-018).

**Methods:**
- `initialize(database: RmmzDatabase, projectPath: string): Promise<void>`
- `executeBattle(setup: BattleSetup): Promise<BattleResult>`
- `getLastMetrics(): TtkMetrics`
- `cleanup(): Promise<void>`

**Related ADRs:**
- ADR-003: Real battle engine in headless mode
- ADR-018: Seed-controlled determinism for RNG
- ADR-020: Dual-metric TTK measurement
- ADR-017: Battle termination conditions

---

#### 6. IReporter (Reporter Port)

**Interface:** `IReporter`
**Adapter:** `JsonReporter`
**Location:** `adapters/reporter/JsonReporter.ts`

**Purpose:** Generates reports from simulation results (ADR-011, ADR-012, ADR-013).

**Methods:**
- `addWarning(warning: Warning): void`
- `addBattleResult(trechoId: string, result: BattleResult): void`
- `generateReport(metadata: ReportMetadata): Report`
- `writeReport(report: Report, outputPath: string): Promise<void>`
- `exportContext(report: Report, outputDir: string): Promise<void>`

**Related ADRs:**
- ADR-011: JSON file-based report output format
- ADR-012: Statistical aggregation metrics
- ADR-013: Typed warning system
- ADR-024: Synchronous file write strategy

---

#### 7. IHeadlessRuntime (Headless Runtime Port)

**Interface:** `IHeadlessRuntime`
**Adapter:** *To be implemented*
**Location:** *Not yet available*

**Purpose:** Manages JSDOM environment and RPG Maker MZ core script loading (ADR-014, ADR-015).

**Methods:**
- `initialize(): Promise<void>`
- `loadCoreScripts(projectPath: string): Promise<void>`
- `setupMocks(): void`
- `cleanup(): Promise<void>`

**Related ADRs:**
- ADR-014: JSDOM browser emulation
- ADR-015: Graphics mocking strategy
- ADR-026: jest-canvas-mock for Canvas API

**Status:** Port interface defined, adapter implementation pending

---

### Dependency Injection Configuration

All adapters are registered as singletons in the DI container (ADR-029):

```typescript
// container.ts
registerSingleton<ILogger>(ILoggerToken, ConsoleLogger);
registerSingleton<IFileSystem>(IFileSystemToken, NodeFileSystem);
registerSingleton<IConfigLoader>(IConfigLoaderToken, ZodConfigLoader);
registerSingleton<IDataLoader>(IDataLoaderToken, RmmzDataLoader);
registerSingleton<IBattleSimulator>(IBattleSimulatorToken, HeadlessBattleSimulator);
registerSingleton<IReporter>(IReporterToken, JsonReporter);
```

### Port Import Rules

**Critical:** All port imports MUST use type-only import:

```typescript
// ✅ CORRECT: Type-only import
import type { ILogger } from './ports/index.js';

// ❌ INCORRECT: Value import
import { ILogger } from './ports/index.js';
```

This enforces compile-time-only dependency and prevents runtime coupling to interface definitions.

## Architectural Rules

### 1. Dependency Rule (Domain → Outer)

The domain layer MUST NOT import from application, infrastructure, or CLI layers:

```
domain → ❌ infrastructure
domain → ❌ application (use-cases)
domain → ❌ cli
```

Domain entities and value objects depend only on:
- Other domain types
- Port interfaces (type-only)

### 2. Port Purity Rule

Port interfaces MUST NOT contain implementation details:

- ❌ No Zod schemas in port interfaces
- ❌ No fs/path references in port interfaces
- ❌ No JSDOM types in port interfaces
- ❌ No external library types in port interfaces

Port signatures use ONLY domain types:
- ✅ Domain entities (`Trecho`, `Enemy`, `Skill`)
- ✅ Domain value objects (`AnchorLevelRange`, `TtkMetrics`, `Warning`)
- ✅ Simple primitives (`string`, `number`, `boolean`, arrays)

### 3. Dependency Inversion Rule

Infrastructure adapters MUST implement corresponding port interfaces:

```typescript
@injectable()
export class NodeFileSystem implements IFileSystem {
  constructor(@inject(ILoggerToken) private logger: ILogger) {
    // Implementation
  }
}
```

### 4. Type-Only Import Rule

All port imports MUST use the `type` keyword:

```typescript
// In use cases
import type { IDataLoader, IConfigLoader } from '@/ports/index.js';

// In adapters
import type { ILogger } from '@/ports/index.js';
```

## Architecture Validation

An automated validation script enforces these architectural rules:

```bash
npm run validate:architecture
```

The validator checks for:
1. Domain layer importing from outer layers
2. Ports containing implementation details
3. Infrastructure classes not implementing ports
4. Port imports not using type-only keyword

Exit codes:
- `0`: All architecture rules satisfied
- `1`: Architectural violations detected

## Consequences

### Positive

- **Clear Separation:** Core domain logic completely isolated from infrastructure
- **Testability:** Use cases can be tested with mock port implementations
- **Flexibility:** Adapters can be swapped without touching core logic
- **Type Safety:** TypeScript + DI provides compile-time dependency verification

### Negative

- **Boilerplate:** Each port requires interface + adapter + DI registration
- **Learning Curve:** Developers must understand Hexagonal Architecture
- **Validation Overhead:** Architecture validation adds to CI/CD time

### Mitigations

- Barrel exports (`index.ts`) reduce import verbosity
- Clear documentation in each port interface
- Automated validation catches violations early
- Code generators could be added for repetitive adapter patterns

## Implementation Status

| Port | Interface | Adapter | DI Token | Tests | Status |
|------|-----------|---------|----------|-------|--------|
| ILogger | ✅ | ✅ | ✅ | ✅ | Complete |
| IFileSystem | ✅ | ✅ | ✅ | ✅ | Complete |
| IConfigLoader | ✅ | ✅ | ✅ | ✅ | Complete |
| IDataLoader | ✅ | ✅ | ✅ | ✅ | Complete |
| IBattleSimulator | ✅ | ✅ | ✅ | ✅ | Complete |
| IReporter | ✅ | ✅ | ✅ | ✅ | Complete |
| IHeadlessRuntime | ✅ | ⏳ | ✅ | ⏳ | Pending |

**Legend:**
- ✅ Complete
- ⏳ Pending
- ❌ Not Started

## References

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/) by Alistair Cockburn
- [Ports and Adapters Pattern](https://herbertograca.com/2017/09/14/ports-adapters-architecture/) by Herberto Graça
- ADR-001: Wrapper Read-Only
- ADR-008: Schema Validation Library - Zod
- ADR-014: JSDOM Browser Emulation
- ADR-016: Synchronous Database Loading Override
- ADR-029: TSyringe DI Container
