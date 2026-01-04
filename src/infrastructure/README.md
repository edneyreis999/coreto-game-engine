# Infrastructure Layer

This layer contains **adapters** that implement the **ports** (interfaces) defined by the core layer. It handles all **external dependencies** and **technical concerns**.

## Structure

```
infrastructure/
├── adapters/
│   ├── config/       # Configuration loading (Zod, JSON)
│   ├── data/         # RPG Maker MZ data loading (fs)
│   ├── simulation/   # Headless battle execution (JSDOM)
│   ├── reporter/     # Report generation (JSON output)
│   └── logger/       # Logging utilities (console, file)
└── di/               # Dependency Injection container
```

## Rules

### Adapters (`adapters/`)

**Purpose**: Implement core layer ports using concrete technologies.

**Rules**:
- Implement **one port interface** per adapter
- Depend on **ports** (interfaces), not other adapters directly
- Isolate external libraries (Zod, JSDOM, fs) within adapters
- Convert external data to domain entities
- Handle infrastructure errors and convert to domain errors

**Example**:
```typescript
import { IDataLoader } from '@/core/ports';
import { Troop, Enemy } from '@/core/domain';
import * as fs from 'fs';
import * as path from 'path';

export class RPGMakerDataLoader implements IDataLoader {
  constructor(private readonly projectPath: string) {}

  async loadTroop(troopId: number): Promise<Troop> {
    const data = JSON.parse(
      fs.readFileSync(path.join(this.projectPath, 'data/Troops.json'), 'utf-8')
    );
    const troopData = data[troopId];

    if (!troopData) {
      throw new DataLoadError(`Troop ${troopId} not found`);
    }

    // Convert raw data to domain entity
    return new Troop(troopData.id, troopData.name, troopData.members);
  }
}
```

### Dependency Injection (`di/`)

**Purpose**: Wire adapters to ports and provide instances to use cases.

**Rules**:
- Use constructor injection (no service locator pattern)
- Register adapters once at application startup
- Resolve dependencies for use cases and CLI commands

**Example**:
```typescript
import { IDataLoader, IBattleSimulator } from '@/core/ports';
import { RPGMakerDataLoader, HeadlessBattleSimulator } from '@/infrastructure/adapters';

export class Container {
  private instances = new Map<string, any>();

  register<T>(key: string, instance: T): void {
    this.instances.set(key, instance);
  }

  resolve<T>(key: string): T {
    const instance = this.instances.get(key);
    if (!instance) {
      throw new Error(`No instance registered for ${key}`);
    }
    return instance as T;
  }
}

// Register adapters
export function registerAdapters(container: Container, projectPath: string): void {
  container.register<IDataLoader>('IDataLoader', new RPGMakerDataLoader(projectPath));
  container.register<IBattleSimulator>('IBattleSimulator', new HeadlessBattleSimulator());
}
```

## Adapter Guidelines by Type

### Config Adapters (`config/`)

- Implement Zod schemas for validation (ADR-008)
- Load JSON configuration files (ADR-021)
- Convert validated data to domain entities
- Throw `ConfigLoadError` on validation failure

### Data Adapters (`data/`)

- Load RPG Maker MZ `data/*.json` files (ADR-016)
- **Read-only** access (ADR-001) - NEVER write to project directory
- Override `DataManager._loadDataFile` for sync loading
- Cache loaded data to avoid repeated disk I/O

### Simulation Adapters (`simulation/`)

- Execute real RPG Maker MZ battles in headless mode (ADR-003, ADR-014)
- Mock graphics APIs (PIXI, Effekseer, Canvas) (ADR-015, ADR-026)
- Implement skill selection strategy (ADR-019)
- Measure TTK in turns and actions (ADR-020)
- Use deterministic RNG seed (ADR-018)

### Reporter Adapters (`reporter/`)

- Generate JSON reports (ADR-011)
- Aggregate TTK metrics (ADR-012)
- Collect typed warnings (ADR-013)
- Export AI-friendly context splits (ADR-024)

### Logger Adapters (`logger/`)

- Console output with severity levels
- Verbose mode support (ADR-025)
- Diagnostic mode support (ADR-025)
- No logging to RPG Maker MZ project directory

## Testing

- **Unit tests**: Mock external dependencies (fs, JSDOM), test adapter logic
- **Integration tests**: Test adapters with real dependencies (actual JSON files, headless runtime)
- Use `tests/fixtures/sample-data/` for integration tests

## Dependency Direction

```
Infrastructure Layer → Core Layer
         ↓
   (implements ports)
```

**Critical Rule**: Infrastructure implements core ports. Core never imports infrastructure.

## References

- [ADR-001: Read-Only Constraint](../../docs/adrs/ADR-001-read-only-access-to-rmmz-project.md)
- [ADR-008: Zod Validation](../../docs/adrs/ADR-008-zod-config-validation.md)
- [ADR-014: JSDOM for Headless Runtime](../../docs/adrs/ADR-014-jsdom-headless-runtime.md)
- [HLD Section 4.2: Infrastructure Layer](../../docs/hld-coreto-game-engine.md)
