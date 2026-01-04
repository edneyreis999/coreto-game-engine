# Core Layer

This layer contains the **business logic** and is the **heart of the application**. It must remain **framework-agnostic** and **independent** of infrastructure concerns.

## Structure

```
core/
├── domain/          # Entities, Value Objects, Aggregates
├── use-cases/       # Application business rules (orchestration)
├── errors/          # Custom domain errors
└── ports/           # Interfaces for infrastructure dependencies
```

## Rules

### Domain (`domain/`)

**Purpose**: Pure business entities representing core concepts (Trecho, PartyConfig, BattleResult, Warning).

**Rules**:

- No external dependencies (Node.js, libraries, frameworks)
- Only plain TypeScript classes and types
- No I/O operations (no fs, no network, no database)
- Immutable by default (use `readonly` properties)
- Self-validating entities (validate in constructor)

**Example**:

```typescript
export class Trecho {
  constructor(
    public readonly id: string,
    public readonly anchorLevelRange: { min: number; max: number },
    public readonly ttkTarget: { turns: number; actions: number }
  ) {
    if (anchorLevelRange.min > anchorLevelRange.max) {
      throw new ValidationError('Invalid level range');
    }
  }
}
```

### Use Cases (`use-cases/`)

**Purpose**: Application-specific business rules. Orchestrate domain entities and coordinate infrastructure through ports.

**Rules**:

- Depend on **domain entities** and **ports** (interfaces), NOT concrete implementations
- One use case = one business operation (e.g., `ExecuteBattleSimulation`)
- Return domain objects or throw domain errors
- No framework-specific code (no Express, no Oclif, no JSDOM)
- Accept dependencies via constructor (Dependency Injection)

**Example**:

```typescript
export class ExecuteBattleSimulation {
  constructor(
    private readonly dataLoader: IDataLoader,
    private readonly battleSimulator: IBattleSimulator
  ) {}

  async execute(troopId: number, party: PartyConfig, seed: number): Promise<BattleResult> {
    const troop = await this.dataLoader.loadTroop(troopId);
    return this.battleSimulator.simulate(troop, party, seed);
  }
}
```

### Errors (`errors/`)

**Purpose**: Domain-specific errors with rich context.

**Rules**:

- Extend `Error` class
- Include typed context for debugging
- No HTTP status codes or framework-specific details

**Example**:

```typescript
export class BattleExecutionError extends Error {
  constructor(
    message: string,
    public readonly context: { troopId: number; turn: number }
  ) {
    super(message);
    this.name = 'BattleExecutionError';
  }
}
```

### Ports (`ports/`)

**Purpose**: Interfaces (contracts) for infrastructure adapters.

**Rules**:

- Define **what** the core needs, not **how** it's implemented
- Use domain types in signatures
- No implementation details (no Zod, no fs, no JSDOM)

**Example**:

```typescript
export interface IDataLoader {
  loadTroop(troopId: number): Promise<Troop>;
  loadEnemy(enemyId: number): Promise<Enemy>;
  loadSkill(skillId: number): Promise<Skill>;
}

export interface IBattleSimulator {
  simulate(troop: Troop, party: PartyConfig, seed: number): Promise<BattleResult>;
}
```

## Dependency Direction

```
CLI Layer → Infrastructure Layer → Core Layer
                                      ↑
                              (Ports define contracts)
```

**Critical Rule**: Core layer NEVER imports from infrastructure or CLI layers. Dependencies point **inward**.

## Testing

- Unit tests for domain entities: Test business rules in isolation
- Unit tests for use cases: Mock ports, verify orchestration logic
- No integration tests in core layer (integration tests belong to infrastructure)

## References

- [ADR-028: TypeScript as Primary Language](../../docs/adrs/ADR-028-typescript-primary-language.md)
- [HLD Section 4.1: Domain Layer](../../docs/hld-coreto-game-engine.md)
