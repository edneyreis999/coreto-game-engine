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

**Purpose**: Pure business entities representing core concepts (Trecho, PartyConfig, BattleResult, Warning, Enemy, Skill).

**Rules**:

- No external dependencies (Node.js, libraries, frameworks)
- Only plain TypeScript classes and types
- No I/O operations (no fs, no network, no database)
- Immutable by default (use `readonly` properties)
- Self-validating entities (validate in constructor, throw ValidationError for invalid state)
- Value objects implement value equality (equals method)

**Domain Entities**:

| Entity | Purpose | Key Methods |
|--------|---------|-------------|
| `Trecho` | Story segment with TTK validation | `isWithinTolerance()` |
| `PartyConfig` | Party composition for battle | - |
| `BattleResult` | Battle execution outcome | - |
| `Report` | Aggregated battle results | - |
| `Enemy` | Enemy with stats and skills | `canUseSkill()`, `getAvailableSkillIds()`, `getDropChance()` |
| `Skill` | Skill/ability with damage formula | `isDamageSkill()`, `hasCost()`, `targetsEnemies()`, `isAoe()` |

**Value Objects**:

| Value Object | Purpose | Key Methods |
|--------------|---------|-------------|
| `AnchorLevelRange` | Level range for party members | `contains()`, `equals()`, `midpoint` |
| `TtkTarget` | TTK target with tolerance | `isWithinTolerance()`, `calculateDeviation()`, `equals()` |
| `TtkMetrics` | Measured TTK from battle | `isWithinToleranceOf()`, `deviationFrom()`, `equals()` |
| `Warning` | Typed warning with severity | `isCritical()`, `isType()`, `equals()` |

**Domain Services**:

| Service | Purpose |
|---------|---------|
| `WarningCollector` | Collect and filter warnings during simulation |

**Example - Entity with validation**:

```typescript
export class Trecho {
  readonly id: string;
  readonly anchorLevelMin: number;
  readonly anchorLevelMax: number;

  constructor(data: TrechoData) {
    if (data.anchorLevelMin < 1 || data.anchorLevelMax > 99) {
      throw new ValidationError('Anchor level must be 1-99');
    }
    if (data.anchorLevelMin > data.anchorLevelMax) {
      throw new ValidationError('Anchor level min must be <= max');
    }
    // Assign and freeze
    this.id = data.id;
    this.anchorLevelMin = data.anchorLevelMin;
    this.anchorLevelMax = data.anchorLevelMax;
    Object.freeze(this);
  }

  isWithinTolerance(measuredTurns: number, measuredActions: number): boolean {
    const turnsDev = Math.abs(measuredTurns - this.targetTtkTurns) / this.targetTtkTurns;
    const actionsDev = Math.abs(measuredActions - this.targetTtkActions) / this.targetTtkActions;
    const toleranceFraction = this.tolerancePercent / 100;
    return turnsDev <= toleranceFraction && actionsDev <= toleranceFraction;
  }
}
```

**Example - Enemy entity**:

```typescript
const enemy = new Enemy({
  id: 1,
  name: 'Goblin',
  params: [50, 0, 10, 5, 3, 3, 4, 4], // MaxHP, MaxMP, ATK, DEF, MAT, MDF, AGI, LUK
  actions: [{ skillId: 1, rating: 5, conditionType: 0 }],
  dropItems: [{ kind: 0, dataId: 1, denominator: 2 }],
  exp: 10,
  gold: 5
});

enemy.canUseSkill(1); // true
enemy.maxHp; // 50
enemy.attack; // 10
enemy.getDropChance(0); // 0.5 (50%)
```

**Example - Skill entity**:

```typescript
const skill = new Skill({
  id: 1,
  name: 'Fireball',
  description: 'Deals fire damage to one enemy',
  damage: {
    type: 'hp_damage',
    elementId: 2,
    formula: 'a.mat * 4 - b.mdf * 2',
    variance: 20,
    critical: true
  },
  hitType: 'magical',
  scope: 'one_enemy',
  mpCost: 5,
  tpCost: 0,
  successRate: 100,
  repeats: 1,
  speed: 0
});

skill.isDamageSkill(); // true
skill.hasCost(); // true
skill.targetsEnemies(); // true
skill.isAoe(); // false
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
